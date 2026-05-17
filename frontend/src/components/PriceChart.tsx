"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface PricePoint { timestamp: string; price: number; }
interface PriceChartProps { data: PricePoint[]; }

export function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-surface-800/60 bg-surface-900/30 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-surface-700 border-t-cyber-400" />
          <p className="text-sm text-surface-500">Loading price data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-surface-800/60 bg-surface-900/30 p-4 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-cyber-400"
          />
          <span className="text-xs font-medium text-surface-400">BTC/USD</span>
        </div>
        <span className="text-xs text-surface-600">Live</span>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="timestamp"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(11, 16)}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(v: number) => `$${(v).toFixed(0)}`}
              axisLine={false} tickLine={false} width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(30, 41, 59, 0.6)",
                borderRadius: 12,
                fontSize: 12,
                backdropFilter: "blur(12px)",
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "BTC/USD"]}
            />
            <defs>
              <linearGradient id="priceGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Line
              type="monotone" dataKey="price"
              stroke="#22d3ee" strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: "#22d3ee", stroke: "#0f172a", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
