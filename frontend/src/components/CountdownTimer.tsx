"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  targetTimestamp: number;
  label?: string;
  onExpire?: () => void;
}

export function CountdownTimer({
  targetTimestamp,
  label = "Round ends in",
  onExpire,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, targetTimestamp - now);
      setRemaining(diff);
      if (diff === 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp, onExpire, hasExpired]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const isUrgent = remaining <= 10;
  const isWarning = remaining > 10 && remaining <= 60;

  const color = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#22d3ee";
  const bgColor = isUrgent ? "bg-danger/10" : isWarning ? "bg-warning/10" : "bg-cyber-500/10";
  const borderColor = isUrgent ? "border-danger/20" : isWarning ? "border-warning/20" : "border-cyber-500/20";

  const urgencyLabel = isUrgent ? "Almost over!" : isWarning ? "Hurry up!" : "Time remaining";

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
      className={`inline-flex items-center gap-4 rounded-2xl border ${borderColor} ${bgColor} px-6 py-4 backdrop-blur-sm`}
    >
      <div className="text-left">
        <p className="text-xs font-medium" style={{ color }}>{urgencyLabel}</p>
        <p className="text-[10px] text-surface-500">{label}</p>
      </div>
      <motion.span
        key={`${mins}-${secs}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-mono text-2xl font-bold tracking-tight"
        style={{ color }}
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </motion.span>
    </motion.div>
  );
}
