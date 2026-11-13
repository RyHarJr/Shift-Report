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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:h-16 sm:flex-nowrap sm:py-0 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="order-1 flex items-center gap-2.5 sm:gap-3 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <BrandMark className="h-8 sm:h-9" />
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-foreground truncate">
              Shift Report QC
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              PT Tanjung Enim Lestari
            </p>
          </div>
        </Link>

        {adminName ? (
          <div className="order-2 sm:order-3 shrink-0">
            <LogoutButton adminName={adminName} />
          </div>
        ) : null}

        <nav
          aria-label="Navigasi utama"
          className="order-3 sm:order-2 grid w-full grid-cols-2 gap-1.5 border-t border-border pt-2 sm:flex sm:w-auto sm:items-center sm:gap-2 sm:border-t-0 sm:pt-0 sm:ml-auto"
        >
          <Link
            href="/"
            className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-10 ${
              activeRoute === "form"
                ? "bg-primary text-primary-foreground"
                : "text-foreground bg-surface-muted/50 sm:bg-transparent hover:bg-surface-muted"
            }`}
          >
            <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
            <span>Input Laporan</span>
          </Link>

          <Link
            href="/admin"
            className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-10 ${
              activeRoute === "admin"
                ? "bg-primary text-primary-foreground"
                : "text-foreground bg-surface-muted/50 sm:bg-transparent hover:bg-surface-muted"
            }`}
          >
            <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
            <span>Admin &amp; Grafik</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
