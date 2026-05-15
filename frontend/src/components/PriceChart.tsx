"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PricePoint {
  timestamp: string;
  price: number;
}

interface PriceChartProps {
  data: PricePoint[];
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 bg-[#12121A] rounded-xl border border-[#1E1E2E] flex items-center justify-center">
        <p className="text-[#94A3B8] text-sm">Loading price data...</p>
      </div>
    );
  }

  return (
    <div className="h-48 bg-[#12121A] rounded-xl border border-[#1E1E2E] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="timestamp" tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={(v: string) => v.slice(11, 16)} />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1e8).toFixed(0)}`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#12121A", border: "1px solid #1E1E2E", borderRadius: 8 }}
            labelStyle={{ color: "#94A3B8" }}
            formatter={(value: any) => [`$${(Number(value) / 1e8).toFixed(2)}`, "BTC/USD"]}
          />
          <Line type="monotone" dataKey="price" stroke="#06B6D4" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
