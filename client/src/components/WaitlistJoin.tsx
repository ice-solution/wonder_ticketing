import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

export function WaitlistJoin({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const join = trpc.waitlist.join.useMutation({
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <p className="rounded-lg bg-green-50 text-green-800 p-3 text-sm">
        {t("waitlist.joined", { position: join.data?.position })}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-900">{t("waitlist.title")}</h3>
      <p className="text-sm text-amber-800 mb-3">{t("waitlist.desc")}</p>
      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("checkout.name")}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("checkout.email")}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={!name || !email || join.isPending}
          onClick={() => join.mutate({ eventId, name, email })}
          className="w-full rounded-lg bg-amber-700 py-2 text-sm text-white"
        >
          {t("waitlist.join")}
        </button>
      </div>
    </div>
  );
}
