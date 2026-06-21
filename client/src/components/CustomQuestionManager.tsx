import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

function questionLabel(
  q: { question: string; questionEn?: string | null },
  lng: string
) {
  if (lng.startsWith("en") && q.questionEn) return q.questionEn;
  return q.question;
}

export function CustomQuestionManager({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data } = trpc.question.list.useQuery({ eventId });
  const create = trpc.question.create.useMutation({
    onSuccess: () => utils.question.list.invalidate({ eventId }),
  });
  const remove = trpc.question.delete.useMutation({
    onSuccess: () => utils.question.list.invalidate({ eventId }),
  });

  const [question, setQuestion] = useState("");
  const [questionEn, setQuestionEn] = useState("");
  const [type, setType] = useState<"text" | "select" | "radio">("text");
  const [options, setOptions] = useState("");
  const [isRequired, setIsRequired] = useState(true);

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-1">{t("question.manage")}</h2>
      <p className="text-xs text-slate-500 mb-3">{t("question.manageHint")}</p>
      <ul className="text-sm space-y-2 mb-4">
        {(data ?? []).map((q) => (
          <li key={String(q._id)} className="flex justify-between gap-2 border-b pb-2">
            <span>
              {q.question}
              {q.isRequired && <span className="text-red-500 ml-1">*</span>}
              <span className="text-xs text-slate-400 ml-2">({q.type})</span>
            </span>
            <button
              type="button"
              onClick={() => remove.mutate({ id: String(q._id) })}
              className="text-red-600 text-xs shrink-0"
            >
              {t("common.delete")}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const opts = options
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          create.mutate({
            eventId,
            question,
            questionEn: questionEn || undefined,
            type,
            options: type === "text" ? undefined : opts,
            isRequired,
            sortOrder: (data?.length ?? 0) + 1,
          });
          setQuestion("");
          setQuestionEn("");
          setOptions("");
        }}
      >
        <input
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("question.labelZh")}
          className="w-full rounded border px-2 py-1.5 text-sm"
        />
        <input
          value={questionEn}
          onChange={(e) => setQuestionEn(e.target.value)}
          placeholder={t("question.labelEn")}
          className="w-full rounded border px-2 py-1.5 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full rounded border px-2 py-1.5 text-sm"
        >
          <option value="text">{t("question.typeText")}</option>
          <option value="select">{t("question.typeSelect")}</option>
          <option value="radio">{t("question.typeRadio")}</option>
        </select>
        {type !== "text" && (
          <textarea
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder={t("question.optionsHint")}
            rows={3}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
          {t("question.required")}
        </label>
        <button type="submit" disabled={!question || create.isPending} className="text-sm text-wonder-primary font-medium">
          + {t("question.add")}
        </button>
      </form>
    </section>
  );
}

export function CheckoutCustomQuestions({
  eventId,
  answers,
  onChange,
}: {
  eventId: string;
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
}) {
  const { t, i18n } = useTranslation();
  const { data: questions } = trpc.question.listForCheckout.useQuery({ eventId });

  if (!questions?.length) return null;

  return (
    <fieldset className="rounded border p-3 space-y-3">
      <legend className="px-1 text-sm font-medium">{t("question.checkoutTitle")}</legend>
      {questions.map((q) => {
        const label = questionLabel(q, i18n.language);
        const qid = String(q._id);
        const value = answers[qid] ?? "";

        if (q.type === "text") {
          return (
            <label key={qid} className="block text-sm">
              {label}
              {q.isRequired && <span className="text-red-500"> *</span>}
              <input
                required={!!q.isRequired}
                value={value}
                onChange={(e) => onChange({ ...answers, [qid]: e.target.value })}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
          );
        }

        const opts = q.options ?? [];
        if (q.type === "select") {
          return (
            <label key={qid} className="block text-sm">
              {label}
              {q.isRequired && <span className="text-red-500"> *</span>}
              <select
                required={!!q.isRequired}
                value={value}
                onChange={(e) => onChange({ ...answers, [qid]: e.target.value })}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                <option value="">—</option>
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        return (
          <fieldset key={qid} className="text-sm">
            <legend>
              {label}
              {q.isRequired && <span className="text-red-500"> *</span>}
            </legend>
            <div className="mt-1 space-y-1">
              {opts.map((o) => (
                <label key={o} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={qid}
                    required={!!q.isRequired && !value}
                    checked={value === o}
                    onChange={() => onChange({ ...answers, [qid]: o })}
                  />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </fieldset>
  );
}
