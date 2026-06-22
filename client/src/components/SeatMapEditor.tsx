import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import {
  countLayoutSeats,
  createEmptyLayout,
  resizeLayout,
  type SeatCellType,
  type SeatMapLayout,
} from "../../../shared/schemas/seatMap";
import "@/styles/seat-map-editor.css";
import { NumberInput } from "@/components/NumberInput";

const CELL_CYCLE: SeatCellType[] = ["seat", "blocked", "aisle"];

function nextCellType(current: SeatCellType): SeatCellType {
  const i = CELL_CYCLE.indexOf(current);
  return CELL_CYCLE[(i + 1) % CELL_CYCLE.length];
}

export function SeatMapEditor({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const sub = trpc.subscription.status.useQuery();
  const isPro = sub.data?.isPro ?? false;

  const layoutQuery = trpc.seat.getLayout.useQuery({ eventId }, { enabled: isPro && !!eventId });
  const save = trpc.seat.saveLayout.useMutation({
    onSuccess: () => layoutQuery.refetch(),
  });
  const clear = trpc.seat.clearLayout.useMutation({
    onSuccess: () => {
      setLayout(createEmptyLayout(8, 12));
      void layoutQuery.refetch();
    },
  });

  const [layout, setLayout] = useState<SeatMapLayout>(() => createEmptyLayout(8, 12));
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (layoutQuery.data?.layout) {
      setLayout(layoutQuery.data.layout);
      setDirty(false);
    } else if (layoutQuery.isSuccess && !layoutQuery.data?.layout) {
      setLayout(createEmptyLayout(8, 12));
      setDirty(false);
    }
  }, [layoutQuery.data, layoutQuery.isSuccess]);

  const stats = useMemo(() => countLayoutSeats(layout), [layout]);

  const setRows = (rows: number) => {
    const next = resizeLayout(layout, rows, layout.cols);
    setLayout(next);
    setDirty(true);
  };

  const setCols = (cols: number) => {
    const next = resizeLayout(layout, layout.rows, cols);
    setLayout(next);
    setDirty(true);
  };

  const toggleCell = (r: number, c: number) => {
    setLayout((prev) => {
      const cells = prev.cells.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? nextCellType(cell) : cell))
      );
      return { ...prev, cells };
    });
    setDirty(true);
  };

  const fillAllSeats = () => {
    setLayout((prev) => ({
      ...prev,
      cells: prev.cells.map((row) => row.map(() => "seat" as const)),
    }));
    setDirty(true);
  };

  const handleSave = () => {
    setMsg("");
    save.mutate(
      { eventId, layout },
      {
        onSuccess: (res) => {
          setDirty(false);
          setMsg(
            t("seatEditor.saved", {
              seats: res.seats,
              blocked: res.blocked,
              preserved: res.preserved,
            })
          );
        },
        onError: (err) => setMsg(err.message),
      }
    );
  };

  if (!isPro) {
    return (
      <p className="text-sm text-amber-700 rounded-lg bg-amber-50 p-4">{t("seatEditor.proOnly")}</p>
    );
  }

  if (layoutQuery.isLoading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  return (
    <div className="seat-map-editor rounded-xl border bg-white p-4 mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold">{t("seatEditor.title")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("seatEditor.hint")}</p>
        </div>
        <p className="text-xs text-slate-500 font-mono">
          {stats.seats} {t("seatEditor.seats")} · {stats.blocked} {t("seatEditor.blocked")}
        </p>
      </div>

      <div className="editor-toolbar">
        <label>
          {t("seatEditor.rows")}
          <NumberInput
            min={1}
            max={40}
            value={layout.rows}
            onChange={setRows}
            emptyFallback={1}
          />
        </label>
        <label>
          {t("seatEditor.cols")}
          <NumberInput
            min={1}
            max={40}
            value={layout.cols}
            onChange={setCols}
            emptyFallback={1}
          />
        </label>
        <label>
          {t("seatEditor.category")}
          <input
            value={layout.category}
            maxLength={8}
            onChange={(e) => {
              setLayout((prev) => ({ ...prev, category: e.target.value.toUpperCase() }));
              setDirty(true);
            }}
            className="font-mono uppercase"
          />
        </label>
        <label>
          {t("seatEditor.stage")}
          <input
            value={layout.stageLabel ?? ""}
            onChange={(e) => {
              setLayout((prev) => ({ ...prev, stageLabel: e.target.value }));
              setDirty(true);
            }}
          />
        </label>
        <button type="button" onClick={fillAllSeats} className="text-sm text-wonder-accent underline">
          {t("seatEditor.fillAll")}
        </button>
      </div>

      <div className="editor-canvas">
        <div className="editor-stage-row">
          <span className="row-label row-label--spacer" aria-hidden="true" />
          <div className="editor-stage">{layout.stageLabel || t("seatEditor.stageDefault")}</div>
        </div>

        <div className="editor-grid-wrap">
          <div className="editor-grid">
          {layout.cells.map((row, ri) => (
            <div key={ri} className="editor-row">
              <span className="row-label">{ri + 1}</span>
              {row.map((cell, ci) => (
                <button
                  key={`${ri}-${ci}`}
                  type="button"
                  className={`editor-cell editor-cell--${cell}`}
                  onClick={() => toggleCell(ri, ci)}
                  title={t(`seatEditor.cell.${cell}`)}
                  aria-label={`${ri + 1}-${ci + 1} ${cell}`}
                >
                  {cell === "seat" ? ci + 1 : cell === "blocked" ? "×" : ""}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      </div>

      <div className="editor-legend">
        <span>
          <span className="legend-dot legend-dot--seat" />
          {t("seatEditor.legendSeat")} — {t("seatEditor.clickCycle")}
        </span>
        <span>
          <span className="legend-dot legend-dot--blocked" />
          {t("seatEditor.legendBlocked")}
        </span>
        <span>
          <span className="legend-dot legend-dot--aisle" />
          {t("seatEditor.legendAisle")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!dirty || save.isPending}
          onClick={handleSave}
          className="rounded-lg bg-wonder-primary px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {save.isPending ? t("common.loading") : t("seatEditor.save")}
        </button>
        <button
          type="button"
          disabled={clear.isPending}
          onClick={() => {
            if (window.confirm(t("seatEditor.clearConfirm"))) {
              clear.mutate({ eventId });
            }
          }}
          className="rounded-lg border px-4 py-2 text-sm text-red-600"
        >
          {t("seatEditor.clear")}
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
      {save.error && <p className="mt-2 text-sm text-red-600">{save.error.message}</p>}
      {clear.error && <p className="mt-2 text-sm text-red-600">{clear.error.message}</p>}
    </div>
  );
}
