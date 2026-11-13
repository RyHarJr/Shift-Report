"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastStatus = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  status: ToastStatus;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, status?: ToastStatus) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS: Record<ToastStatus, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6500,
};

const MAX_VISIBLE_TOASTS = 3;

const STATUS_STYLE: Record<
  ToastStatus,
  { container: string; iconColor: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    container: "bg-success-bg border-success/30 text-green-950",
    iconColor: "text-success",
    Icon: CheckCircle2,
  },
  error: {
    container: "bg-danger-bg border-danger/30 text-red-950",
    iconColor: "text-danger",
    Icon: XCircle,
  },
  warning: {
    container: "bg-warning-bg border-warning/30 text-amber-950",
    iconColor: "text-warning",
    Icon: AlertTriangle,
  },
  info: {
    container: "bg-info-bg border-info/30 text-sky-950",
    iconColor: "text-info",
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visibleToasts, setVisibleToasts] = useState<ToastItem[]>([]);
  const queueRef = useRef<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const dismissRef = useRef<(id: string) => void>(() => {});

  const dismiss = useCallback((id: string) => {
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }

    setVisibleToasts((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      if (remaining.length < MAX_VISIBLE_TOASTS && queueRef.current.length > 0) {
        const nextItem = queueRef.current.shift()!;
        const timer = setTimeout(() => {
          dismissRef.current(nextItem.id);
        }, AUTO_DISMISS_MS[nextItem.status]);
        timersRef.current.set(nextItem.id, timer);
        return [...remaining, nextItem];
      }
      return remaining;
    });
  }, []);

  useEffect(() => {
    dismissRef.current = dismiss;
  }, [dismiss]);

  const showToast = useCallback(
    (message: string, status: ToastStatus = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = { id, status, message };

      setVisibleToasts((prev) => {
        if (prev.length >= MAX_VISIBLE_TOASTS) {
          queueRef.current.push(item);
          return prev;
        }
        const timer = setTimeout(() => {
          dismiss(id);
        }, AUTO_DISMISS_MS[status]);
        timersRef.current.set(id, timer);
        return [...prev, item];
      });
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return (
    <ToastContext value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="no-print fixed bottom-4 inset-x-4 sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto z-50 flex flex-col gap-2 sm:w-96 pointer-events-none"
      >
        {visibleToasts.map((toast) => {
          const { container, iconColor, Icon } = STATUS_STYLE[toast.status];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md animate-toast-in",
                container,
              )}
            >
              <Icon
                className={cn("size-5 shrink-0 mt-0.5", iconColor)}
                aria-hidden="true"
              />
              <p className="text-sm font-medium flex-1 leading-snug">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="shrink-0 rounded p-1 hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast harus digunakan di dalam ToastProvider.");
  }
  return ctx;
}
