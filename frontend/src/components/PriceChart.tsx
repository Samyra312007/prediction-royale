"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

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
      <div className="flex h-48 items-center justify-center rounded-xl border border-surface-800 bg-surface-900">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-pulse rounded-full bg-surface-800" />
          <p className="text-sm text-surface-500">Loading price data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-surface-800 bg-surface-900 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-cyber-400" />
          <span className="text-xs font-medium text-surface-400">BTC/USD</span>
        </div>
        <span className="text-xs text-surface-500">Real-time</span>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="timestamp"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(11, 16)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(v: number) =>
                `$${(v / 1e8).toFixed(0)}`
              }
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value: any) => [
                `$${(Number(value) / 1e8).toFixed(2)}`,
                "BTC/USD",
              ]}
            />
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="price"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#06b6d4",
                stroke: "#0f172a",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
