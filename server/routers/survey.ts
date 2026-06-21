import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { SurveyQuestion, SurveyResponse } from "../models/Survey.js";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import { userCanManageEvent } from "../services/cohost.js";

export const surveyRouter = router({
  listQuestions: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return SurveyQuestion.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean();
    }),

  createQuestion: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        question: z.string(),
        questionEn: z.string().optional(),
        type: z.enum(["text", "rating", "select"]).default("text"),
        options: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const doc = await SurveyQuestion.create(input);
      return { id: String(doc._id) };
    }),

  submit: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            answer: z.string(),
          })
        ),
        respondentEmail: z.string().email().optional(),
        ticketId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await SurveyResponse.insertMany(
        input.answers.map((a) => ({
          eventId: input.eventId,
          questionId: a.questionId,
          answer: a.answer,
          respondentEmail: input.respondentEmail,
          ticketId: input.ticketId,
        }))
      );
      return { success: true };
    }),

  listResponses: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const [questions, responses] = await Promise.all([
        SurveyQuestion.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean(),
        SurveyResponse.find({ eventId: input.eventId }).sort({ createdAt: -1 }).lean(),
      ]);
      const qMap = new Map(questions.map((q) => [String(q._id), q.question]));
      const batches = new Map<
        string,
        {
          respondentEmail?: string;
          ticketId?: string;
          submittedAt: Date;
          answers: { question: string; answer: string }[];
        }
      >();
      for (const r of responses) {
        const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        const key = `${r.respondentEmail ?? "anon"}_${r.ticketId ?? "none"}_${Math.floor(ts / 1000)}`;
        const batch = batches.get(key) ?? {
          respondentEmail: r.respondentEmail ?? undefined,
          ticketId: r.ticketId ? String(r.ticketId) : undefined,
          submittedAt: r.createdAt ?? new Date(),
          answers: [],
        };
        batch.answers.push({
          question: qMap.get(String(r.questionId)) ?? "—",
          answer: r.answer,
        });
        batches.set(key, batch);
      }
      return [...batches.values()].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    }),

  exportCSV: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ok = await userCanManageEvent(ctx.user._id, input.eventId);
      if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
      const [questions, responses] = await Promise.all([
        SurveyQuestion.find({ eventId: input.eventId }).sort({ sortOrder: 1 }).lean(),
        SurveyResponse.find({ eventId: input.eventId }).sort({ createdAt: 1 }).lean(),
      ]);
      const qHeaders = questions.map((q) => escapeCsv(q.question));
      const header = `respondentEmail,submittedAt${qHeaders.length ? "," + qHeaders.join(",") : ""}\n`;
      const batches = new Map<string, { email: string; at: string; answers: Map<string, string> }>();
      for (const r of responses) {
        const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        const key = `${r.respondentEmail ?? "anon"}_${Math.floor(ts / 1000)}`;
        const batch = batches.get(key) ?? {
          email: r.respondentEmail ?? "",
          at: r.createdAt?.toISOString() ?? "",
          answers: new Map<string, string>(),
        };
        batch.answers.set(String(r.questionId), r.answer);
        batches.set(key, batch);
      }
      const rows = [...batches.values()]
        .map((b) => {
          const cols = questions.map((q) => escapeCsv(b.answers.get(String(q._id)) ?? ""));
          return `${b.email},${b.at}${cols.length ? "," + cols.join(",") : ""}`;
        })
        .join("\n");
      return { csv: header + rows };
    }),
});

function escapeCsv(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}
