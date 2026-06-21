import { router } from "../_core/trpc.js";
import { eventRouter } from "./event.js";
import { ticketTypeRouter } from "./ticketType.js";
import { orderRouter } from "./order.js";
import { ticketRouter } from "./ticket.js";
import { discountRouter } from "./discount.js";
import { waitlistRouter } from "./waitlist.js";
import { questionRouter } from "./question.js";
import { donationRouter } from "./donation.js";
import { seatRouter } from "./seat.js";
import { referralRouter } from "./referral.js";
import { crmRouter } from "./crm.js";
import { analyticsRouter } from "./analytics.js";
import { surveyRouter } from "./survey.js";
import { chatRouter } from "./chat.js";
import { subscriptionRouter } from "./subscription.js";
import { integrationRouter } from "./integration.js";
import { aiRouter } from "./ai.js";
import { notificationRouter } from "./notification.js";
import { paymentRouter } from "./payment.js";
import { adminRouter } from "./admin.js";

import { authRouter } from "./auth.js";

export const appRouter = router({
  auth: authRouter,
  event: eventRouter,
  ticketType: ticketTypeRouter,
  order: orderRouter,
  ticket: ticketRouter,
  discount: discountRouter,
  waitlist: waitlistRouter,
  question: questionRouter,
  donation: donationRouter,
  seat: seatRouter,
  referral: referralRouter,
  crm: crmRouter,
  analytics: analyticsRouter,
  survey: surveyRouter,
  chat: chatRouter,
  subscription: subscriptionRouter,
  integration: integrationRouter,
  ai: aiRouter,
  notification: notificationRouter,
  payment: paymentRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
