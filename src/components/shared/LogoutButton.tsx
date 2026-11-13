"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 sm:border-l sm:border-border sm:pl-3 sm:ml-1">
      <span className="hidden md:inline text-xs font-medium text-muted-foreground max-w-28 truncate">
        {adminName}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        title="Keluar dari sesi admin"
        aria-label="Keluar dari sesi admin"
        className="inline-flex h-9 items-center gap-1.5 rounded border border-border px-2.5 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        <span>{loading ? "Keluar..." : "Keluar"}</span>
      </button>
    </div>
  );
}

