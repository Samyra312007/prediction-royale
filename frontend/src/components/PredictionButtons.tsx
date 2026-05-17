"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUpIcon, TrendingDownIcon } from "./Icons";

interface PredictionButtonsProps {
  onPredict: (direction: "yes" | "no") => Promise<void>;
  disabled?: boolean;
}

export function PredictionButtons({
  onPredict,
  disabled,
}: PredictionButtonsProps) {
  const [loading, setLoading] = useState<"yes" | "no" | null>(null);

  const handleClick = async (direction: "yes" | "no") => {
    if (disabled || loading) return;
    setLoading(direction);
    try {
      await onPredict(direction);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <motion.button
        whileHover={!disabled ? { scale: 1.03, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        onClick={() => handleClick("yes")}
        disabled={disabled || loading !== null}
        className="group relative flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-success/20 bg-gradient-to-b from-success/10 to-success/5 px-8 py-5 font-display text-lg font-bold text-success shadow-lg shadow-success/5 backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-success/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading === "yes" ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-5 w-5 rounded-full border-2 border-success/30 border-t-success"
          />
        ) : (
          <>
            <TrendingUpIcon className="h-5 w-5" />
            <span>YES ▲</span>
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-success/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </motion.button>

      <motion.button
        whileHover={!disabled ? { scale: 1.03, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        onClick={() => handleClick("no")}
        disabled={disabled || loading !== null}
        className="group relative flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-danger/20 bg-gradient-to-b from-danger/10 to-danger/5 px-8 py-5 font-display text-lg font-bold text-danger shadow-lg shadow-danger/5 backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading === "no" ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-5 w-5 rounded-full border-2 border-danger/30 border-t-danger"
          />
        ) : (
          <>
            <TrendingDownIcon className="h-5 w-5" />
            <span>NO ▼</span>
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-danger/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </motion.button>
    </div>
  );
}
