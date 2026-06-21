import type { APIRequestContext } from "@playwright/test";
import { ORGANIZER_EMAIL, V1_DEMO_SLUG } from "./auth.js";
import { trpcMutate, trpcQuery } from "./trpc.js";

type EventRow = {
  _id: string;
  title: string;
  slug: string;
};

type TicketTypeRow = {
  _id: string;
  name: string;
};

type OrderDetail = {
  order: { orderNumber: string; status: string };
  tickets: Array<{ ticketCode: string; status: string }>;
};

export async function waitForTickets(
  request: APIRequestContext,
  orderNumber: string
): Promise<OrderDetail> {
  for (let i = 0; i < 20; i++) {
    const detail = await trpcQuery<OrderDetail>(request, "order.getOrganizerDetail", {
      orderNumber,
    });
    if (detail?.tickets?.length > 0) return detail;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Tickets not issued for order ${orderNumber}`);
}

export type E2EFixture = {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  orderNumber: string;
  ticketCode: string;
  regQuestion: string;
  regAnswer: string;
  surveyQuestion: string;
  surveyAnswer: string;
  buyerEmail: string;
};

export async function getDemoEvent(request: APIRequestContext): Promise<EventRow> {
  const events = await trpcQuery<EventRow[]>(request, "event.listMine", null);
  const demo =
    events.find((e) => e.slug === V1_DEMO_SLUG) ??
    events.find((e) => e.visibility === "public" && e.slug.includes("wonder-demo")) ??
    events.find((e) => e.visibility === "public" && e.status === "published") ??
    events[0];
  if (!demo) throw new Error("No event found for organizer — run npm run db:bootstrap");

  await trpcMutate(request, "event.update", {
    id: demo._id,
    visibility: "public",
    status: "published",
  });

  return demo;
}

export async function createPaidOrder(
  request: APIRequestContext,
  opts: {
    eventId: string;
    regQuestion?: string;
    regAnswer?: string;
    buyerName?: string;
    buyerEmail?: string;
  }
): Promise<{ orderNumber: string; regQuestion: string; regAnswer: string; buyerEmail: string }> {
  const suffix = Date.now().toString(36);
  const regQuestion = opts.regQuestion ?? `E2E 公司 ${suffix}`;
  const regAnswer = opts.regAnswer ?? `Playwright Corp ${suffix}`;
  const buyerEmail = opts.buyerEmail ?? `e2e-${suffix}@test.local`;

  const { id: questionId } = await trpcMutate<{ id: string }>(request, "question.create", {
    eventId: opts.eventId,
    question: regQuestion,
    type: "text",
    isRequired: true,
  });

  const types = await trpcQuery<TicketTypeRow[]>(request, "event.getTicketTypes", {
    eventId: opts.eventId,
  });
  const ticketType = types[0];
  if (!ticketType) throw new Error("No ticket type on event");

  const checkout = await trpcMutate<{ orderNumber: string; paymentUrl: string }>(
    request,
    "order.checkout",
    {
      eventId: opts.eventId,
      buyerName: opts.buyerName ?? "E2E Buyer",
      buyerEmail,
      buyerPhone: "91234567",
      items: [{ ticketTypeId: ticketType._id, quantity: 1 }],
      paymentMethod: "card",
      origin: "http://localhost:5173",
      locale: "zh-TW",
      customAnswers: [{ questionId, answer: regAnswer }],
    }
  );

  const fulfill = await request.post("/api/dev/fulfill-order", {
    data: { orderNumber: checkout.orderNumber },
  });
  if (!fulfill.ok()) {
    const payUrl = new URL(checkout.paymentUrl, "http://localhost:5173");
    await request.get(`${payUrl.pathname}${payUrl.search}`);
  }

  return { orderNumber: checkout.orderNumber, regQuestion, regAnswer, buyerEmail };
}

export async function createE2EFixture(request: APIRequestContext): Promise<E2EFixture> {
  const suffix = Date.now().toString(36);
  const surveyQuestion = `E2E 滿意度 ${suffix}`;
  const surveyAnswer = `Very satisfied ${suffix}`;

  const demo = await getDemoEvent(request);
  const paid = await createPaidOrder(request, { eventId: demo._id });

  await trpcMutate(request, "survey.createQuestion", {
    eventId: demo._id,
    question: surveyQuestion,
    type: "text",
  });

  const surveyQuestions = await trpcQuery<Array<{ _id: string; question: string }>>(
    request,
    "survey.listQuestions",
    { eventId: demo._id }
  );
  const surveyQ = surveyQuestions.find((q) => q.question === surveyQuestion);
  if (!surveyQ) throw new Error("Survey question not created");

  await trpcMutate(request, "survey.submit", {
    eventId: demo._id,
    respondentEmail: paid.buyerEmail,
    answers: [{ questionId: surveyQ._id, answer: surveyAnswer }],
  });

  const detail = await waitForTickets(request, paid.orderNumber);
  const ticketCode = detail.tickets[0].ticketCode;

  return {
    eventId: demo._id,
    eventTitle: demo.title,
    eventSlug: demo.slug,
    orderNumber: paid.orderNumber,
    ticketCode,
    regQuestion: paid.regQuestion,
    regAnswer: paid.regAnswer,
    surveyQuestion,
    surveyAnswer,
    buyerEmail: paid.buyerEmail,
  };
}

export async function ensureProOrganizer(request: APIRequestContext) {
  await request.post("/api/dev/login", {
    data: { email: ORGANIZER_EMAIL, plan: "pro" },
  });
}

export async function registerWebhook(
  request: APIRequestContext,
  url: string,
  events: string[]
): Promise<string> {
  const res = await trpcMutate<{ id: string }>(request, "integration.createWebhook", {
    url,
    events,
  });
  return res.id;
}
