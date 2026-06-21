import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

export function EventResponsesPanel({ eventId }: { eventId: string }) {
  const { t, i18n } = useTranslation();
  const registration = trpc.question.listResponses.useQuery({ eventId });
  const survey = trpc.survey.listResponses.useQuery({ eventId });

  const regWithAnswers = (registration.data ?? []).filter((r) => r.answers.length > 0);
  const surveyBatches = survey.data ?? [];

  if (registration.isLoading || survey.isLoading) {
    return (
      <section className="rounded-xl border bg-white p-4 mt-6">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </section>
    );
  }

  if (regWithAnswers.length === 0 && surveyBatches.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-4">{t("responses.title")}</h2>

      <div className="space-y-6">
        {regWithAnswers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">{t("responses.registration")}</h3>
            <ul className="space-y-3">
              {regWithAnswers.map((row) => (
                <li key={row.orderId} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium">{row.buyerName}</p>
                      <p className="text-slate-500 text-xs">{row.buyerEmail}</p>
                    </div>
                    <Link
                      href={`/dashboard/orders/${row.orderNumber}`}
                      className="text-xs text-wonder-primary underline font-mono"
                    >
                      {row.orderNumber}
                    </Link>
                  </div>
                  <dl className="space-y-1">
                    {row.answers.map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">{a.question}:</dt>
                        <dd>{a.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        )}

        {surveyBatches.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">{t("responses.survey")}</h3>
            <ul className="space-y-3">
              {surveyBatches.map((batch, idx) => (
                <li key={idx} className="rounded-lg border p-3 text-sm">
                  <p className="text-xs text-slate-400 mb-2">
                    {batch.respondentEmail ?? t("responses.anonymous")}
                    {batch.submittedAt &&
                      ` · ${new Date(batch.submittedAt).toLocaleString(i18n.language)}`}
                  </p>
                  <dl className="space-y-1">
                    {batch.answers.map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">{a.question}:</dt>
                        <dd>{a.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
