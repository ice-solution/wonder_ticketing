import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { NumberInput } from "@/components/NumberInput";

export function DiscountManager({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data } = trpc.discount.list.useQuery({ eventId });
  const create = trpc.discount.create.useMutation({ onSuccess: () => utils.discount.list.invalidate({ eventId }) });
  const [code, setCode] = useState("");
  const [value, setValue] = useState(10);

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-3">{t("eventEdit.discounts")}</h2>
      <ul className="text-sm space-y-1 mb-3">
        {(data ?? []).map((d) => (
          <li key={String(d._id)}>
            <span className="font-mono">{d.code}</span> — {d.type === "percentage" ? `${d.value}%` : `HK$${d.value}`}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE"
          className="border rounded px-2 py-1.5 text-sm font-mono flex-1"
        />
        <NumberInput
          min={1}
          max={100}
          value={value}
          onChange={setValue}
          emptyFallback={10}
          className="border rounded px-2 py-1.5 text-sm w-20"
        />
        <button
          type="button"
          disabled={!code || create.isPending}
          onClick={() => {
            create.mutate({ eventId, code, type: "percentage", value });
            setCode("");
          }}
          className="text-sm text-wonder-primary"
        >
          +
        </button>
      </div>
    </section>
  );
}
