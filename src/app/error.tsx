"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error("Root route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded border border-border bg-surface p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Terjadi Kesalahan Halaman
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aplikasi tidak dapat memuat halaman formulir saat ini. Silakan coba
          muat ulang.
        </p>
        <div className="mt-5 flex justify-center">
          <Button type="button" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
