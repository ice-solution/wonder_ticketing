import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";

const WEBHOOK_EVENTS = ["order.paid", "order.refunded", "ticket.checked_in", "event.published"] as const;

const EVENT_LABEL_KEYS: Record<(typeof WEBHOOK_EVENTS)[number], string> = {
  "order.paid": "integration.eventOrderPaid",
  "order.refunded": "integration.eventOrderRefunded",
  "ticket.checked_in": "integration.eventTicketCheckedIn",
  "event.published": "integration.eventEventPublished",
};

export function DashboardIntegrations() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const status = trpc.subscription.status.useQuery();
  const keys = trpc.integration.listApiKeys.useQuery(undefined, { enabled: !!status.data?.isPro });
  const webhooks = trpc.integration.listWebhooks.useQuery(undefined, { enabled: !!status.data?.isPro });
  const createKey = trpc.integration.createApiKey.useMutation({
    onSuccess: () => utils.integration.listApiKeys.invalidate(),
  });
  const revokeKey = trpc.integration.revokeApiKey.useMutation({
    onSuccess: () => utils.integration.listApiKeys.invalidate(),
  });
  const createWebhook = trpc.integration.createWebhook.useMutation({
    onSuccess: () => utils.integration.listWebhooks.invalidate(),
  });
  const deleteWebhook = trpc.integration.deleteWebhook.useMutation({
    onSuccess: () => utils.integration.listWebhooks.invalidate(),
  });

  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["order.paid"]);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);

  if (!status.data?.isPro) {
    return (
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">{t("integration.title")}</h1>
        <p className="text-slate-600">{t("integration.proOnly")}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-2">{t("integration.title")}</h1>
      <p className="text-sm text-slate-600 mb-6 max-w-2xl">{t("integration.intro")}</p>

      <section className="rounded-xl border bg-white p-4 mb-6">
        <h2 className="font-semibold mb-3">{t("integration.apiKeys")}</h2>
        {newKey && (
          <div className="mb-3 rounded bg-amber-50 p-3 text-sm">
            <p className="font-medium text-amber-900">{t("integration.copyKey")}</p>
            <code className="break-all">{newKey}</code>
          </div>
        )}
        <ul className="text-sm space-y-2 mb-3">
          {(keys.data ?? []).map((k) => (
            <li key={String(k._id)} className="flex justify-between">
              <span>{k.name} · {k.keyPrefix}…</span>
              <button type="button" onClick={() => revokeKey.mutate({ id: String(k._id) })} className="text-red-600 text-xs">
                {t("integration.revoke")}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            createKey.mutate(
              { name: keyName },
              { onSuccess: (res) => { setNewKey(res.key); setKeyName(""); } }
            );
          }}
        >
          <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder={t("integration.keyName")} className="flex-1 rounded border px-2 py-1.5 text-sm" />
          <button type="submit" className="text-sm text-wonder-primary">{t("integration.createKey")}</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">{t("integration.apiHint")}</p>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">{t("integration.webhooks")}</h2>
        {newWebhookSecret && (
          <div className="mb-3 rounded bg-amber-50 p-3 text-sm">
            <p className="font-medium">{t("integration.webhookSecret")}</p>
            <code className="break-all">{newWebhookSecret}</code>
          </div>
        )}
        <ul className="text-sm space-y-2 mb-3">
          {(webhooks.data ?? []).map((w) => (
            <li key={String(w._id)} className="flex justify-between gap-2">
              <span className="truncate">{w.url}</span>
              <button type="button" onClick={() => deleteWebhook.mutate({ id: String(w._id) })} className="text-red-600 text-xs shrink-0">
                {t("common.delete")}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            createWebhook.mutate(
              { url: webhookUrl, events: webhookEvents as typeof WEBHOOK_EVENTS[number][] },
              { onSuccess: (res) => { setNewWebhookSecret(res.secret); setWebhookUrl(""); } }
            );
          }}
        >
          <input required type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." className="w-full rounded border px-2 py-1.5 text-sm" />
          <div className="flex flex-wrap gap-2 text-xs">
            {WEBHOOK_EVENTS.map((ev) => (
              <label key={ev} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={webhookEvents.includes(ev)}
                  onChange={(e) =>
                    setWebhookEvents((xs) =>
                      e.target.checked ? [...xs, ev] : xs.filter((x) => x !== ev)
                    )
                  }
                />
                {t(EVENT_LABEL_KEYS[ev])}
              </label>
            ))}
          </div>
          <button type="submit" className="text-sm text-wonder-primary">{t("integration.addWebhook")}</button>
        </form>
      </section>
    </DashboardLayout>
  );
}
