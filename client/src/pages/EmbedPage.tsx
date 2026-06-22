import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/eventText";
import { NumberInput } from "@/components/NumberInput";

type EmbedData = {
  event: {
    id: string;
    title: string;
    slug: string;
    venue: string;
    eventDate: string;
    enableEmbedWidget: boolean;
  };
  ticketTypes: { id: string; name: string; price: number; available: number }[];
};

export function EmbedPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [data, setData] = useState<EmbedData | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/embed/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("404"));
  }, [slug]);

  if (error) return <p className="p-4 text-center text-slate-500">—</p>;
  if (!data) return <p className="p-4">{t("common.loading")}</p>;
  if (!data.event.enableEmbedWidget) {
    return <p className="p-4 text-center text-slate-500">{t("embed.disabled")}</p>;
  }

  const cart = data.ticketTypes
    .filter((tt) => (qty[tt.id] ?? 0) > 0)
    .map((tt) => ({ ticketTypeId: tt.id, quantity: qty[tt.id] }));

  const checkoutUrl =
    cart.length > 0
      ? `${window.location.origin}/checkout/${data.event.slug}?cart=${encodeURIComponent(JSON.stringify(cart))}`
      : "#";

  return (
    <div className="min-h-screen bg-white p-4 font-sans text-sm max-w-md mx-auto">
      <h1 className="text-lg font-bold mb-1">{data.event.title}</h1>
      <p className="text-slate-500 mb-4">
        {new Date(data.event.eventDate).toLocaleString()} · {data.event.venue}
      </p>
      <ul className="space-y-2 mb-4">
        {data.ticketTypes.map((tt) => (
          <li key={tt.id} className="flex items-center justify-between border rounded-lg p-3">
            <span>
              {tt.name} · {formatMoney(tt.price, "HKD", "zh-TW")}
            </span>
            {tt.available > 0 ? (
              <NumberInput
                min={0}
                max={tt.available}
                value={qty[tt.id] ?? 0}
                onChange={(n) => setQty((q) => ({ ...q, [tt.id]: n }))}
                className="w-14 rounded border px-1 py-0.5 text-right"
              />
            ) : (
              <span className="text-xs text-slate-400">{t("event.soldOut")}</span>
            )}
          </li>
        ))}
      </ul>
      <a
        href={checkoutUrl}
        className={`block text-center rounded-lg py-2.5 text-white ${cart.length ? "bg-wonder-primary" : "bg-slate-300 pointer-events-none"}`}
      >
        {t("event.buy")}
      </a>
      <p className="mt-3 text-center text-xs text-slate-400">{t("embed.poweredBy")}</p>
    </div>
  );
}
