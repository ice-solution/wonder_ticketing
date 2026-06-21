import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

const DEFAULT_TEMPLATE = `您好 {{buyerName}}，

提醒您即將參加「{{eventTitle}}」。
活動時間：{{eventDate}}
地點：{{venue}}

活動詳情：{{eventUrl}}
我的票券：{{ticketsUrl}}

期待與您相見！`;

export function EventReminderManager({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data: reminders } = trpc.notification.listReminders.useQuery({ eventId });
  const { data: quota } = trpc.notification.quota.useQuery();

  const schedule = trpc.notification.scheduleReminder.useMutation({
    onSuccess: () => {
      utils.notification.listReminders.invalidate({ eventId });
      setTemplate(DEFAULT_TEMPLATE);
    },
  });
  const remove = trpc.notification.deleteReminder.useMutation({
    onSuccess: () => utils.notification.listReminders.invalidate({ eventId }),
  });

  const [hours, setHours] = useState(24);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);

  const statusLabel = (s: string) => {
    if (s === "pending") return t("reminder.statusPending");
    if (s === "sent") return t("reminder.statusSent");
    return t("reminder.statusFailed");
  };

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-1">{t("reminder.title")}</h2>
      <p className="text-sm text-slate-500 mb-3">{t("reminder.description")}</p>
      {quota && (
        <p className="text-xs text-slate-500 mb-3">
          {t("subscription.quota")}: {quota.remaining} / {quota.limit}
        </p>
      )}

      <ul className="text-sm space-y-2 mb-4">
        {(reminders ?? []).length === 0 && (
          <li className="text-slate-400">{t("reminder.empty")}</li>
        )}
        {(reminders ?? []).map((r) => (
          <li
            key={String(r._id)}
            className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2"
          >
            <span>
              {t("reminder.beforeHours", { hours: r.triggerBefore })} ·{" "}
              {r.type === "email" ? "Email" : t("reminder.channelOther")} ·{" "}
              <span
                className={
                  r.status === "sent"
                    ? "text-green-700"
                    : r.status === "failed"
                      ? "text-red-600"
                      : "text-amber-700"
                }
              >
                {statusLabel(r.status)}
              </span>
              {r.sentAt && (
                <span className="text-slate-400 ml-1">
                  ({new Date(r.sentAt).toLocaleString()})
                </span>
              )}
            </span>
            {r.status === "pending" && (
              <button
                type="button"
                onClick={() => remove.mutate({ id: String(r._id) })}
                disabled={remove.isPending}
                className="text-xs text-red-600 underline"
              >
                {t("common.delete")}
              </button>
            )}
          </li>
        ))}
      </ul>

      <form
        className="space-y-3 border-t pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          schedule.mutate({
            eventId,
            type: "email",
            triggerBeforeHours: hours,
            templateContent: template,
          });
        }}
      >
        <label className="block text-sm">
          {t("reminder.hoursBefore")}
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-1 w-full rounded border px-2 py-1.5"
          >
            <option value={1}>1 {t("reminder.hour")}</option>
            <option value={6}>6 {t("reminder.hours")}</option>
            <option value={24}>24 {t("reminder.hours")}</option>
            <option value={48}>48 {t("reminder.hours")}</option>
            <option value={72}>72 {t("reminder.hours")}</option>
          </select>
        </label>
        <label className="block text-sm">
          {t("reminder.template")}
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs"
          />
          <span className="text-xs text-slate-400">{t("reminder.placeholders")}</span>
        </label>
        <button
          type="submit"
          disabled={schedule.isPending || !template.trim()}
          className="text-sm rounded-lg bg-wonder-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {schedule.isPending ? t("common.loading") : t("reminder.schedule")}
        </button>
        {schedule.error && (
          <p className="text-sm text-red-600">{schedule.error.message}</p>
        )}
        {schedule.isSuccess && (
          <p className="text-sm text-green-700">{t("reminder.scheduled")}</p>
        )}
      </form>
    </section>
  );
}
