import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

export function SurveyManager({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data } = trpc.survey.listQuestions.useQuery({ eventId });
  const create = trpc.survey.createQuestion.useMutation({
    onSuccess: () => utils.survey.listQuestions.invalidate({ eventId }),
  });
  const [question, setQuestion] = useState("");

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-3">{t("survey.manage")}</h2>
      <ul className="text-sm space-y-1 mb-3">
        {(data ?? []).map((q) => (
          <li key={String(q._id)}>· {q.question}</li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ eventId, question });
          setQuestion("");
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("survey.newQuestion")}
          className="flex-1 rounded border px-2 py-1.5 text-sm"
        />
        <button type="submit" disabled={!question || create.isPending} className="text-sm text-wonder-primary">
          {t("common.add")}
        </button>
      </form>
    </section>
  );
}
