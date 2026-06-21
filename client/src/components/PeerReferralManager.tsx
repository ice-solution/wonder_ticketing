import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

type RewardType = "discount" | "free_ticket" | "cashback";

export function PeerReferralManager({
  eventId,
  eventSlug,
}: {
  eventId: string;
  eventSlug?: string;
}) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const sub = trpc.subscription.status.useQuery();
  const isPro = sub.data?.isPro ?? false;
  const { data: codes } = trpc.referral.listPeerForEvent.useQuery(
    { eventId },
    { enabled: isPro }
  );
  const create = trpc.referral.createPeerReferral.useMutation({
    onSuccess: () => utils.referral.listPeerForEvent.invalidate({ eventId }),
  });
  const deactivate = trpc.referral.deactivatePeerCode.useMutation({
    onSuccess: () => utils.referral.listPeerForEvent.invalidate({ eventId }),
  });

  const [rewardType, setRewardType] = useState<RewardType>("discount");
  const [rewardValue, setRewardValue] = useState(10);

  const shareBase = eventSlug
    ? `${window.location.origin}/event/${eventSlug}`
    : "";

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-1">{t("peerReferral.title")}</h2>
      <p className="text-sm text-slate-500 mb-4">{t("peerReferral.hint")}</p>

      {!isPro ? (
        <p className="text-sm text-amber-700">{t("peerReferral.proOnly")}</p>
      ) : (
        <>
          <ul className="text-sm space-y-3 mb-4">
            {(codes ?? []).map((c) => {
              const shareUrl = shareBase ? `${shareBase}?ref=${encodeURIComponent(c.code)}` : "";
              return (
                <li
                  key={c.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-wrap items-start justify-between gap-2"
                >
                  <div>
                    <p className="font-mono font-bold text-wonder-primary">{c.code}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t(`peerReferral.reward.${c.rewardType}`, { value: c.rewardValue })} ·{" "}
                      {t("peerReferral.used", { count: c.usedCount, max: c.maxUses })}
                      {c.status !== "active" && ` · ${c.status}`}
                    </p>
                    {shareUrl && (
                      <p className="text-xs text-slate-600 mt-2 break-all">
                        {t("peerReferral.shareLink")}: {shareUrl}
                      </p>
                    )}
                  </div>
                  {c.status === "active" && (
                    <button
                      type="button"
                      className="text-xs text-red-600 underline"
                      disabled={deactivate.isPending}
                      onClick={() => deactivate.mutate({ id: c.id })}
                    >
                      {t("peerReferral.deactivate")}
                    </button>
                  )}
                </li>
              );
            })}
            {codes?.length === 0 && (
              <li className="text-slate-500 text-sm">{t("peerReferral.empty")}</li>
            )}
          </ul>

          <div className="flex flex-wrap gap-2 items-end">
            <label className="text-sm">
              {t("peerReferral.rewardType")}
              <select
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value as RewardType)}
                className="mt-1 block rounded border px-2 py-1.5 text-sm"
              >
                <option value="discount">{t("peerReferral.typeDiscount")}</option>
                <option value="cashback">{t("peerReferral.typeCashback")}</option>
                <option value="free_ticket">{t("peerReferral.typeFreeTicket")}</option>
              </select>
            </label>
            <label className="text-sm">
              {rewardType === "discount" ? t("peerReferral.percent") : t("peerReferral.amountHkd")}
              <input
                type="number"
                min={1}
                value={rewardValue}
                onChange={(e) => setRewardValue(Number(e.target.value))}
                className="mt-1 block rounded border px-2 py-1.5 text-sm w-24"
              />
            </label>
            <button
              type="button"
              disabled={create.isPending || rewardValue <= 0}
              onClick={() =>
                create.mutate({ eventId, rewardType, rewardValue })
              }
              className="rounded-lg bg-wonder-primary px-3 py-2 text-sm text-white"
            >
              {t("peerReferral.create")}
            </button>
          </div>
          {create.error && (
            <p className="text-sm text-red-600 mt-2">{create.error.message}</p>
          )}
        </>
      )}
    </section>
  );
}
