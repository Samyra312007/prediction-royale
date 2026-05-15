"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetTimestamp: number;
  onExpire?: () => void;
}

export function CountdownTimer({ targetTimestamp, onExpire }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, targetTimestamp - now);
      setRemaining(diff);
      if (diff === 0 && onExpire) onExpire();
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const color = remaining > 30 ? "#10B981" : remaining > 10 ? "#F59E0B" : "#EF4444";

  return (
    <div className="text-center" style={{ color }}>
      <p className="text-4xl font-bold font-mono">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </p>
      <p className="text-sm mt-1" style={{ color }}>
        {remaining > 30 ? "Time remaining" : remaining > 10 ? "Hurry!" : "Almost over!"}
      </p>
    </div>
  );
}
