import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

export function SurveyForm({ eventId, respondentEmail }: { eventId: string; respondentEmail?: string }) {
  const { t } = useTranslation();
  const { data: questions } = trpc.survey.listQuestions.useQuery({ eventId });
  const submit = trpc.survey.submit.useMutation();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!questions?.length) return null;
  if (submit.isSuccess) {
    return <p className="mt-4 text-sm text-green-700">{t("survey.thanks")}</p>;
  }

  return (
    <section className="mt-6 rounded-xl border bg-white p-4">
      <h2 className="font-semibold mb-3">{t("survey.title")}</h2>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate({
            eventId,
            respondentEmail,
            answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
          });
        }}
      >
        {questions.map((q) => (
          <label key={String(q._id)} className="block text-sm">
            {q.question}
            <input
              required
              value={answers[String(q._id)] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [String(q._id)]: e.target.value }))}
              className="mt-1 w-full rounded border px-2 py-1.5"
            />
          </label>
        ))}
        <button type="submit" disabled={submit.isPending} className="rounded-lg bg-wonder-primary px-4 py-2 text-white text-sm">
          {t("survey.submit")}
        </button>
      </form>
    </section>
  );
}
