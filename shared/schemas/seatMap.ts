import { z } from "zod";

export const SeatCellTypeSchema = z.enum(["seat", "aisle", "blocked"]);
export type SeatCellType = z.infer<typeof SeatCellTypeSchema>;

export const SeatMapLayoutSchema = z.object({
  version: z.literal(1),
  category: z.string().min(1).max(8).default("A"),
  stageLabel: z.string().max(32).optional(),
  rows: z.number().int().min(1).max(40),
  cols: z.number().int().min(1).max(40),
  cells: z.array(z.array(SeatCellTypeSchema)),
});

export type SeatMapLayout = z.infer<typeof SeatMapLayoutSchema>;

export function createEmptyLayout(rows: number, cols: number, category = "A"): SeatMapLayout {
  return {
    version: 1,
    category,
    stageLabel: "STAGE",
    rows,
    cols,
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "seat" as const)),
  };
}

export function resizeLayout(layout: SeatMapLayout, rows: number, cols: number): SeatMapLayout {
  const cells: SeatCellType[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: SeatCellType[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(layout.cells[r]?.[c] ?? "seat");
    }
    cells.push(row);
  }
  return { ...layout, rows, cols, cells };
}

export function countLayoutSeats(layout: SeatMapLayout) {
  let seats = 0;
  let blocked = 0;
  let aisles = 0;
  for (const row of layout.cells) {
    for (const cell of row) {
      if (cell === "seat") seats++;
      else if (cell === "blocked") blocked++;
      else aisles++;
    }
  }
  return { seats, blocked, aisles };
}
