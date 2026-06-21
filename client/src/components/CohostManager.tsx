import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

export function CohostManager({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data: cohosts } = trpc.event.listCohosts.useQuery({ eventId });
  const add = trpc.event.addCohost.useMutation({
    onSuccess: () => {
      utils.event.listCohosts.invalidate({ eventId });
      setEmail("");
    },
  });

  const [email, setEmail] = useState("");

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-1">{t("eventEdit.cohosts")}</h2>
      <p className="text-xs text-slate-500 mb-3">{t("eventEdit.cohostHint")}</p>
      <ul className="space-y-1 mb-3 text-sm">
        {(cohosts ?? []).map((c) => (
          <li key={String(c._id)}>
            {c.invitedEmail ?? String(c.userId)} · {c.status} · {c.role}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[180px]"
        />
        <button
          type="button"
          disabled={!email || add.isPending}
          onClick={() => add.mutate({ eventId, invitedEmail: email, role: "editor" })}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white"
        >
          {t("eventEdit.inviteCohost")}
        </button>
      </div>
      {add.error && <p className="text-xs text-red-600 mt-2">{add.error.message}</p>}
    </section>
  );
}
