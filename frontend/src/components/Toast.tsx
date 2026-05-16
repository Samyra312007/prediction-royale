"use client";

import { useEffect, useState, useCallback } from "react";
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
  { icon: React.ReactNode; bg: string; border: string }
> = {
  success: {
    icon: <CheckIcon className="h-4 w-4" />,
    bg: "bg-success/10",
    border: "border-success/30",
  },
  error: {
    icon: <XIcon className="h-4 w-4" />,
    bg: "bg-danger/10",
    border: "border-danger/30",
  },
  pending: {
    icon: <FlameIcon className="h-4 w-4 animate-pulse" />,
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
  info: {
    icon: <ShieldIcon className="h-4 w-4" />,
    bg: "bg-primary-700/10",
    border: "border-primary-700/30",
  },
};

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
      }, 4000);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [isMounted]);

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const cfg = toastConfig[t.type];
          const colors: Record<ToastType, string> = {
            success: "text-success",
            error: "text-danger",
            pending: "text-warning",
            info: "text-primary-400",
          };
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className={`flex items-center gap-2.5 rounded-xl border ${cfg.bg} ${cfg.border} px-4 py-3 shadow-lg backdrop-blur-sm`}
            >
              <span className={colors[t.type]}>{cfg.icon}</span>
              <span className="text-sm font-medium text-surface-200">
                {t.message}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
