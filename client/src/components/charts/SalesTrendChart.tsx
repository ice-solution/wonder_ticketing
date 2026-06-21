import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SalesTrendChart({
  data,
}: {
  data: { date: string; amount: number; count: number }[];
}) {
  if (!data.length) {
    return <p className="text-sm text-slate-500 py-8 text-center">No sales in period</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === "amount" ? [`HK$${value.toFixed(0)}`, "Revenue"] : [value, "Orders"]
          }
        />
        <Line type="monotone" dataKey="amount" stroke="#1565C0" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="count" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
