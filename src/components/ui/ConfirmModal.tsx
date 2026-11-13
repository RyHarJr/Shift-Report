"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className="fixed inset-0 bg-slate-900/50 animate-fade-in"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl animate-modal-in">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-danger-bg text-danger">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-modal-title"
              className="text-base font-semibold text-foreground"
            >
              {title}
            </h2>
            <p
              id="confirm-modal-desc"
              className="mt-1.5 text-sm text-muted-foreground leading-relaxed"
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            aria-label="Tutup dialog"
            className="rounded p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

