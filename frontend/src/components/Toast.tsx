"use client";

import { useEffect, useState, useCallback } from "react";

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

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const colors: Record<ToastType, string> = {
    success: "bg-[#10B981]",
    error: "bg-[#EF4444]",
    pending: "bg-[#F59E0B]",
    info: "bg-[#7C3AED]",
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${colors[t.type]} text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-[slideIn_0.3s_ease-out]`}
        >
          {t.type === "pending" && <span className="mr-2">⏳</span>}
          {t.type === "success" && <span className="mr-2">✅</span>}
          {t.type === "error" && <span className="mr-2">❌</span>}
          {t.message}
        </div>
      ))}
    </div>
  );
}
