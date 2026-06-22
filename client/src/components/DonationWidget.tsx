import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { NumberInput } from "@/components/NumberInput";

export function DonationWidget({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(50);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const donate = trpc.donation.donate.useMutation({
    onSuccess: (res) => {
      window.location.href = res.paymentUrl;
    },
  });

  return (
    <div className="rounded-xl border bg-white p-4 mt-6">
      <h3 className="font-semibold">{t("donation.title")}</h3>
      <p className="text-sm text-slate-500 mb-3">{eventTitle}</p>
      <div className="space-y-2">
        <NumberInput
          min={10}
          value={amount}
          onChange={setAmount}
          emptyFallback={50}
          className="w-full border rounded px-3 py-2"
        />
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
          disabled={donate.isPending || amount < 10}
          onClick={() =>
            donate.mutate({
              eventId,
              amount,
              name: name || undefined,
              email: email || undefined,
              origin: window.location.origin,
            })
          }
          className="w-full rounded-lg bg-wonder-primary py-2 text-white text-sm"
        >
          {t("donation.submit")}
        </button>
      </div>
    </div>
  );
}
