import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";

export function WaitlistManager({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data } = trpc.waitlist.list.useQuery({ eventId });
  const approve = trpc.waitlist.approve.useMutation({ onSuccess: () => utils.waitlist.list.invalidate({ eventId }) });
  const reject = trpc.waitlist.reject.useMutation({ onSuccess: () => utils.waitlist.list.invalidate({ eventId }) });

  if (!data?.length) return null;

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-3">{t("waitlist.manage")}</h2>
      <ul className="space-y-2 text-sm">
        {data.map((e) => (
          <li key={String(e._id)} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <span>
              {e.name} · {e.email} · {e.status}
            </span>
            {e.status === "waiting" && (
              <span className="flex gap-2">
                <button type="button" onClick={() => approve.mutate({ id: String(e._id) })} className="text-green-700 text-xs">
                  {t("waitlist.approve")}
                </button>
                <button type="button" onClick={() => reject.mutate({ id: String(e._id) })} className="text-red-600 text-xs">
                  {t("common.delete")}
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
