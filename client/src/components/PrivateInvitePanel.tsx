import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

type Props = {
  eventId: string;
  visibility: string;
  inviteUrl?: string | null;
};

export function PrivateInvitePanel({ eventId, visibility, inviteUrl }: Props) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [copied, setCopied] = useState(false);

  const regenerate = trpc.event.regenerateInvite.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
  });

  if (visibility !== "private") return null;

  if (!inviteUrl) {
    return (
      <section className="rounded-xl border border-violet-200 bg-violet-50 p-4 mt-6">
        <h2 className="font-semibold text-violet-900 mb-1">{t("invite.title")}</h2>
        <p className="text-sm text-violet-800">{t("invite.saveFirst")}</p>
      </section>
    );
  }

  const url = inviteUrl;

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50 p-4 mt-6">
      <h2 className="font-semibold text-violet-900 mb-1">{t("invite.title")}</h2>
      <p className="text-sm text-violet-800 mb-3">{t("invite.description")}</p>
      {url ? (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            readOnly
            value={url}
            className="flex-1 min-w-[200px] rounded border bg-white px-2 py-1.5 text-sm font-mono"
          />
          <button
            type="button"
            onClick={copy}
            className="text-sm rounded-lg bg-violet-600 px-3 py-1.5 text-white"
          >
            {copied ? t("invite.copied") : t("invite.copy")}
          </button>
          <button
            type="button"
            onClick={() => regenerate.mutate({ eventId })}
            disabled={regenerate.isPending}
            className="text-sm text-violet-700 underline"
          >
            {t("invite.regenerate")}
          </button>
        </div>
      ) : (
        <p className="text-sm text-violet-700">{t("common.loading")}</p>
      )}
      {regenerate.isSuccess && (
        <p className="mt-2 text-xs text-violet-700">{t("invite.regenerated")}</p>
      )}
    </section>
  );
}
