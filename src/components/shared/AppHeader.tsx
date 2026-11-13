import Image from "next/image";
import Link from "next/link";
import { ClipboardList, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";

interface AppHeaderProps {
  activeRoute: "form" | "admin";
  adminName?: string;
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/Andritz-Symbol.png"
      alt="Logo Andritz"
      width={64}
      height={36}
      unoptimized
      priority
      className={cn("h-9 w-auto shrink-0 object-contain", className)}
    />
  );
}

export function AppHeader({ activeRoute, adminName }: AppHeaderProps) {
  return (
    <header className="no-print border-b border-border bg-surface sticky top-0 z-30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <BrandMark />
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-foreground truncate">
              Shift Report QC
            </p>
            <p className="text-xs text-muted-foreground truncate">
              PT Tanjung Enim Lestari
            </p>
          </div>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="flex items-center gap-1.5 sm:gap-2"
        >
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-10 ${
              activeRoute === "form"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-surface-muted"
            }`}
          >
            <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
            <span>Input Laporan</span>
          </Link>

          <Link
            href="/admin"
            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-10 ${
              activeRoute === "admin"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-surface-muted"
            }`}
          >
            <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
            <span>Admin &amp; Grafik</span>
          </Link>

          {adminName ? <LogoutButton adminName={adminName} /> : null}
        </nav>
      </div>
    </header>
  );
}
