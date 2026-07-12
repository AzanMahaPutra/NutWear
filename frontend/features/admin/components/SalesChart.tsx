"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatCurrency } from "@/utils/formatCurrency";

interface SalesChartProps {
  data: { bulan: string; total: number }[];
}

/**
 * Grafik penjualan bulanan di Dashboard Admin.
 */
export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5">
      <h3 className="mb-4 text-base font-bold text-neutral-900">Grafik Penjualan</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#a3a3a3"
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
          />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Line type="monotone" dataKey="total" stroke="#111111" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
