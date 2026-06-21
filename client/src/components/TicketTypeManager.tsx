import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { formatMoney } from "@/lib/eventText";

function TicketTypeRow({
  eventId,
  tt,
}: {
  eventId: string;
  tt: {
    _id: unknown;
    name: string;
    price: number;
    quantity: number;
    sold?: number | null;
  };
}) {
  const { t, i18n } = useTranslation();
  const utils = trpc.useUtils();
  const update = trpc.ticketType.update.useMutation({
    onSuccess: () => utils.ticketType.list.invalidate({ eventId }),
  });
  const remove = trpc.ticketType.delete.useMutation({
    onSuccess: () => utils.ticketType.list.invalidate({ eventId }),
  });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tt.name);
  const [price, setPrice] = useState(tt.price);
  const [quantity, setQuantity] = useState(tt.quantity);

  if (editing) {
    return (
      <li className="space-y-2 border-b pb-3 text-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border px-2 py-1.5"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-24 rounded border px-2 py-1.5"
          />
          <input
            type="number"
            min={tt.sold ?? 0}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-24 rounded border px-2 py-1.5"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={update.isPending}
            onClick={() => {
              update.mutate(
                { id: String(tt._id), name, price, quantity },
                { onSuccess: () => setEditing(false) }
              );
            }}
            className="text-wonder-primary text-xs"
          >
            {t("common.save")}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-slate-500 text-xs">
            {t("common.cancel")}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex justify-between items-center text-sm border-b pb-2 gap-2">
      <span>
        {tt.name} — {formatMoney(tt.price, "HKD", i18n.language)} · {tt.sold ?? 0}/{tt.quantity}
      </span>
      <div className="flex gap-2 shrink-0">
        <button type="button" onClick={() => setEditing(true)} className="text-wonder-primary text-xs">
          {t("common.edit")}
        </button>
        <button
          type="button"
          onClick={() => remove.mutate({ id: String(tt._id) })}
          className="text-red-600 text-xs"
        >
          {t("common.delete")}
        </button>
      </div>
    </li>
  );
}

export function TicketTypeManager({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data: types } = trpc.ticketType.list.useQuery({ eventId });
  const create = trpc.ticketType.create.useMutation({
    onSuccess: () => utils.ticketType.list.invalidate({ eventId }),
  });

  const [name, setName] = useState("");
  const [price, setPrice] = useState(100);
  const [quantity, setQuantity] = useState(50);

  return (
    <section className="rounded-xl border bg-white p-4 mt-6">
      <h2 className="font-semibold mb-3">{t("eventEdit.ticketTypes")}</h2>
      <ul className="space-y-2 mb-4">
        {(types ?? []).map((tt) => (
          <TicketTypeRow key={String(tt._id)} eventId={eventId} tt={tt} />
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-4">
        <input
          placeholder={t("eventEdit.ticketName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm sm:col-span-2"
        />
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="border rounded px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border rounded px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="button"
        disabled={!name || create.isPending}
        onClick={() => {
          create.mutate({ eventId, name, price, quantity });
          setName("");
        }}
        className="mt-2 text-sm text-wonder-primary font-medium"
      >
        + {t("eventEdit.addTicket")}
      </button>
    </section>
  );
}
