"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, XIcon, FlameIcon, ShieldIcon } from "./Icons";

type ToastType = "success" | "error" | "pending" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: ToastType = "info") {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(toast));
}

const toastConfig: Record<
  ToastType,
  { icon: React.ReactNode; bar: string; border: string; bg: string; iconColor: string }
> = {
  success: {
    icon: <CheckIcon className="h-4 w-4" />,
    bar: "bg-success",
    border: "border-success/20",
    bg: "bg-success/5",
    iconColor: "text-success",
  },
  error: {
    icon: <XIcon className="h-4 w-4" />,
    bar: "bg-danger",
    border: "border-danger/20",
    bg: "bg-danger/5",
    iconColor: "text-danger",
  },
  pending: {
    icon: <FlameIcon className="h-4 w-4" />,
    bar: "bg-warning",
    border: "border-warning/20",
    bg: "bg-warning/5",
    iconColor: "text-warning",
  },
  info: {
    icon: <ShieldIcon className="h-4 w-4" />,
    bar: "bg-primary-500",
    border: "border-primary-500/20",
    bg: "bg-primary-500/5",
    iconColor: "text-primary-400",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const [progress, setProgress] = useState(100);
  const startTime = useRef(Date.now());
  const duration = 4000;

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const cfg = toastConfig[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
      className={`relative w-72 overflow-hidden rounded-2xl border ${cfg.border} ${cfg.bg} shadow-2xl shadow-black/30 backdrop-blur-xl`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <motion.span
          animate={toast.type === "pending" ? { rotate: 360 } : {}}
          transition={toast.type === "pending" ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
          className={cfg.iconColor}
        >
          {cfg.icon}
        </motion.span>
        <span className="flex-1 text-sm font-medium text-surface-200">
          {toast.message}
        </span>
        <button
          onClick={() => onRemove(toast.id)}
          className="rounded-full p-0.5 text-surface-500 transition-colors hover:text-surface-300"
        >
          <XIcon className="h-3 w-3" />
        </button>
      </div>
      <motion.div
        className={`h-0.5 ${cfg.bar}`}
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.05 }}
      />
    </motion.div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4200);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [isMounted]);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
