"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Gagal Memuat Dashboard Admin
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pastikan koneksi database aktif dan coba muat ulang halaman.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            <span>Coba Lagi</span>
          </Button>
          <Link href="/">
            <Button variant="secondary">Ke Form Input</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

