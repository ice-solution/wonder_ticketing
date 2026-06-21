import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

type SeatRow = {
  seatNumber: string;
  status: string;
  row?: string | null;
  col?: number | null;
  category?: string | null;
};

export function SeatMapPicker({
  eventId,
  requiredCount,
  onReserved,
}: {
  eventId: string;
  requiredCount: number;
  onReserved: (data: { reservationId: string; seatNumbers: string[]; expiresAt: Date }) => void;
}) {
  const { t } = useTranslation();
  const { data, refetch } = trpc.seat.getMap.useQuery(
    { eventId },
    { refetchInterval: 30_000 }
  );
  const reserve = trpc.seat.reserve.useMutation({
    onSuccess: (res) => {
      setReserved(true);
      onReserved({
        reservationId: res.reservationId,
        seatNumbers: selected,
        expiresAt: res.expiresAt instanceof Date ? res.expiresAt : new Date(Number(res.expiresAt) * 1000),
      });
      void refetch();
    },
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [reserved, setReserved] = useState(false);

  const seats: SeatRow[] = (data?.seats ?? []).map((s) => ({
    seatNumber: s.seatNumber,
    status: s.status,
    row: s.row,
    col: s.col,
    category: s.category,
  }));
  const rows = useMemo(() => {
    const map = new Map<string, SeatRow[]>();
    for (const s of seats) {
      const key = s.row ?? s.category ?? "default";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  const toggle = (seat: SeatRow) => {
    if (seat.status !== "available") return;
    setSelected((prev) => {
      if (prev.includes(seat.seatNumber)) {
        return prev.filter((n) => n !== seat.seatNumber);
      }
      if (prev.length >= requiredCount) return prev;
      return [...prev, seat.seatNumber];
    });
    setReserved(false);
  };

  const doReserve = () => {
    if (selected.length !== requiredCount) return;
    reserve.mutate({ eventId, seatNumbers: selected });
  };

  if (!seats.length) {
    return (
      <p className="text-sm text-amber-700 rounded-lg bg-amber-50 p-3">
        {t("seat.noMap")}
      </p>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{t("seat.title")}</h3>
        <span className="text-sm text-slate-500">
          {selected.length} / {requiredCount}
        </span>
      </div>
      <div className="mb-4 overflow-x-auto">
        <div className="inline-block min-w-full space-y-2">
          {rows.map(([rowKey, rowSeats]) => (
            <div key={rowKey} className="flex items-center gap-1">
              <span className="w-6 shrink-0 text-xs text-slate-400">{rowKey}</span>
              {rowSeats.map((s) => (
                <button
                  key={s.seatNumber}
                  type="button"
                  disabled={s.status !== "available" && !selected.includes(s.seatNumber)}
                  onClick={() => toggle(s)}
                  title={s.seatNumber}
                  className={`h-8 w-8 rounded text-xs font-medium transition ${seatClass(s.status, selected.includes(s.seatNumber))}`}
                >
                  {s.col ?? ""}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-green-100 border border-green-300" /> {t("seat.available")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-wonder-primary" /> {t("seat.selected")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-slate-200" /> {t("seat.unavailable")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-slate-200 line-through" /> {t("seat.blocked")}
        </span>
      </p>
      {reserve.error && (
        <p className="mb-2 text-sm text-red-600">{reserve.error.message}</p>
      )}
      {reserved && (
        <p className="mb-2 text-sm text-green-700">✓ {t("seat.reserved")}</p>
      )}
      <button
        type="button"
        disabled={selected.length !== requiredCount || reserve.isPending}
        onClick={doReserve}
        className="w-full rounded-lg border border-wonder-primary py-2 text-sm font-medium text-wonder-primary disabled:opacity-40"
      >
        {t("seat.reserve")}
      </button>
    </div>
  );
}

function seatClass(status: string, selected: boolean) {
  if (selected) return "bg-wonder-primary text-white";
  if (status === "available") return "bg-green-50 border border-green-200 text-green-800 hover:bg-green-100";
  if (status === "reserved") return "bg-amber-100 text-amber-800 cursor-not-allowed";
  if (status === "blocked") return "bg-slate-200 text-slate-500 cursor-not-allowed line-through";
  return "bg-slate-100 text-slate-400 cursor-not-allowed";
}
