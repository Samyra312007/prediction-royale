"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  targetTimestamp: number;
  onExpire?: () => void;
}

export function CountdownTimer({
  targetTimestamp,
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
  const pct = Math.min(
    100,
    ((remaining > 0 ? remaining : 0) / 30) * 100
  );
  const isUrgent = remaining <= 10;
  const isWarning = remaining <= 30 && remaining > 10;

  const color = isUrgent
    ? "#ef4444"
    : isWarning
      ? "#f59e0b"
      : "#10b981";

  const label = isUrgent
    ? "Almost over!"
    : isWarning
      ? "Hurry!"
      : "Time remaining";

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-2">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
          <circle
            cx="36"
            cy="36"
            r="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-surface-800"
          />
          <motion.circle
            cx="36"
            cy="36"
            r="30"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 30}
            animate={{
              strokeDashoffset: 2 * Math.PI * 30 * (1 - pct / 100),
            }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={`${mins}-${secs}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-2xl font-bold tracking-tight"
            style={{ color }}
          >
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </motion.span>
        </div>
      </div>
      <motion.p
        animate={{ opacity: isUrgent ? [0.6, 1, 0.6] : 0.7 }}
        transition={{ duration: 1.5, repeat: isUrgent ? Infinity : 0 }}
        className="text-xs font-medium"
        style={{ color }}
      >
        {label}
      </motion.p>
    </div>
  );
}
