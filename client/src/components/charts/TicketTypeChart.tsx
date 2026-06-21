import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TicketTypeChart({
  data,
}: {
  data: { name: string; quantity: number; revenue: number }[];
}) {
  if (!data.length) {
    return <p className="text-sm text-slate-500 py-8 text-center">No ticket data</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(value: number) => [`HK$${value.toFixed(0)}`, "Revenue"]} />
        <Bar dataKey="revenue" fill="#1565C0" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
