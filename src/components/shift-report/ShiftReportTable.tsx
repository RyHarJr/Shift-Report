"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Eye,
  FileDown,
  FileSpreadsheet,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDateDisplay, formatNumber } from "@/lib/utils";
import { CHIPPER_LABEL_MAP } from "@/modules/shift-reports/shift-report.constants";
import type { ShiftReportListDTO } from "@/modules/shift-reports/shift-report.types";

interface ShiftReportTableProps {
  items: ShiftReportListDTO[];
  loading?: boolean;
  hasActiveFilter?: boolean;
  onResetFilter?: () => void;
  onDeleteRequest: (item: ShiftReportListDTO) => void;
}

interface MenuPosition {
  left: number;
  top?: number;
  bottom?: number;
}

const MENU_WIDTH_PX = 192;
const MENU_ESTIMATED_HEIGHT_PX = 230;
const VIEWPORT_PADDING_PX = 8;

function RowActionMenu({
  item,
  onDeleteRequest,
  mobile = false,
}: {
  item: ShiftReportListDTO;
  onDeleteRequest: (item: ShiftReportListDTO) => void;
  mobile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleViewportChange() {
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [open]);

  function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const left = Math.max(
      VIEWPORT_PADDING_PX,
      Math.min(
        rect.right - MENU_WIDTH_PX,
        window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX,
      ),
    );
    const openUpward =
      window.innerHeight - rect.bottom < MENU_ESTIMATED_HEIGHT_PX &&
      rect.top > MENU_ESTIMATED_HEIGHT_PX;

    setPosition(
      openUpward
        ? { left, bottom: window.innerHeight - rect.top + 6 }
        : { left, top: rect.bottom + 6 },
    );
    setOpen(true);
  }

  const menuItemClass =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:bg-surface-muted";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Aksi laporan ${formatDateDisplay(item.reportDate)} Shift ${item.shift}`}
        title="Aksi"
        className={cn(
          "inline-flex items-center justify-center rounded border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          open && "bg-surface-muted border-border-strong/50",
          mobile ? "size-10" : "size-8",
        )}
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </button>

      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={`Menu aksi laporan ${formatDateDisplay(item.reportDate)} Shift ${item.shift}`}
              style={{
                position: "fixed",
                left: `${position.left}px`,
                top: position.top !== undefined ? `${position.top}px` : undefined,
                bottom:
                  position.bottom !== undefined
                    ? `${position.bottom}px`
                    : undefined,
                width: `${MENU_WIDTH_PX}px`,
              }}
              className="z-50 rounded-md border border-border bg-surface py-1 shadow-lg animate-fade-in"
            >
              <Link
                href={`/admin/reports/${item.id}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  menuItemClass,
                  "text-foreground hover:bg-surface-muted",
                )}
              >
                <Eye
                  className="size-3.5 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span>Lihat Detail</span>
              </Link>
              <a
                href={`/api/shift-reports/${item.id}/pdf`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  menuItemClass,
                  "text-foreground hover:bg-surface-muted",
                )}
              >
                <FileDown
                  className="size-3.5 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span>Export PDF</span>
              </a>
              <a
                href={`/api/shift-reports/${item.id}/excel`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  menuItemClass,
                  "text-foreground hover:bg-surface-muted",
                )}
              >
                <FileSpreadsheet
                  className="size-3.5 text-success shrink-0"
                  aria-hidden="true"
                />
                <span>Export Excel</span>
              </a>
              <Link
                href={`/admin/reports/${item.id}/edit`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  menuItemClass,
                  "text-primary hover:bg-primary/5",
                )}
              >
                <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Edit Laporan</span>
              </Link>
              <div role="separator" className="my-1 border-t border-border" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onDeleteRequest(item);
                }}
                className={cn(
                  menuItemClass,
                  "text-danger hover:bg-danger-bg cursor-pointer",
                )}
              >
                <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Hapus Laporan</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function ShiftReportTable({
  items,
  loading = false,
  hasActiveFilter = false,
  onResetFilter,
  onDeleteRequest,
}: ShiftReportTableProps) {
  if (loading) {
    return (
      <div className="p-6 space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 rounded bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title={
            hasActiveFilter
              ? "Tidak ada laporan yang cocok dengan filter"
              : "Belum ada data Shift Report"
          }
          description={
            hasActiveFilter
              ? "Coba ubah rentang tanggal, tipe chipper, shift, atau kata kunci pencarian Anda."
              : "Mulai catat inspeksi kualitas chip melalui formulir input Shift Report."
          }
          action={
            hasActiveFilter && onResetFilter ? (
              <Button variant="outline" size="sm" onClick={onResetFilter}>
                Reset Filter
              </Button>
            ) : (
              <Link href="/">
                <Button size="sm">
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Input Shift Report</span>
                </Button>
              </Link>
            )
          }
        />
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View (< md) */}
      <div className="md:hidden divide-y divide-border bg-surface">
        {items.map((item) => (
          <article key={item.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                    {formatDateDisplay(item.reportDate)}
                  </span>
                  <Badge variant="neutral">Shift {item.shift}</Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground truncate">
                  {CHIPPER_LABEL_MAP[item.chipperType]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.typeOfKnifeSystem} &middot;{" "}
                  <span className="font-mono tabular-nums">
                    {formatNumber(item.chipLengthSetUp, 1)} mm
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-2 shrink-0">
                <div className="rounded border border-success/30 bg-success-bg/60 px-2.5 py-1.5 text-right">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Total Accept
                  </div>
                  <div className="font-mono text-sm font-bold text-success tabular-nums">
                    {formatNumber(item.totalAccept, 2)}%
                  </div>
                </div>
                <RowActionMenu
                  item={item}
                  onDeleteRequest={onDeleteRequest}
                  mobile
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Inspektor:{" "}
                <strong className="font-medium text-foreground">
                  {item.inspectionBy}
                </strong>
              </span>
              <span className="font-mono tabular-nums">
                Sampling: {item.samplingTime}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 rounded bg-surface-muted/60 px-2 py-2 text-center">
              <div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  1.1 OS
                </div>
                <div className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {formatNumber(item.oversize, 2)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  1.2 OT
                </div>
                <div className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {formatNumber(item.overthick, 2)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  P+F
                </div>
                <div className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {formatNumber(item.pinPlusFines, 2)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  1.8 Moist.
                </div>
                <div className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {formatNumber(item.moisture, 2)}%
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Desktop Table View (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/70 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Tanggal / Shift
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Chipper &amp; Knife
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Inspektor / Jam
              </th>
              <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                1.1 OS
              </th>
              <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                1.2 OT
              </th>
              <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                Total Accept
              </th>
              <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                P+F
              </th>
              <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                1.8 Moist.
              </th>
              <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-surface-muted/40 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-mono text-xs font-semibold text-foreground tabular-nums">
                    {formatDateDisplay(item.reportDate)}
                  </div>
                  <div className="mt-1">
                    <Badge variant="neutral">Shift {item.shift}</Badge>
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium text-foreground">
                    {CHIPPER_LABEL_MAP[item.chipperType]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.typeOfKnifeSystem} &middot;{" "}
                    <span className="font-mono tabular-nums">
                      {formatNumber(item.chipLengthSetUp, 1)} mm
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium text-foreground">
                    {item.inspectionBy}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground tabular-nums">
                    Sampling: {item.samplingTime}
                  </div>
                </td>

                <td className="px-4 py-3 text-right font-mono text-xs text-foreground tabular-nums whitespace-nowrap">
                  {formatNumber(item.oversize, 2)}%
                </td>

                <td className="px-4 py-3 text-right font-mono text-xs text-foreground tabular-nums whitespace-nowrap">
                  {formatNumber(item.overthick, 2)}%
                </td>

                <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-success tabular-nums whitespace-nowrap">
                  {formatNumber(item.totalAccept, 2)}%
                </td>

                <td className="px-4 py-3 text-right font-mono text-xs text-foreground tabular-nums whitespace-nowrap">
                  {formatNumber(item.pinPlusFines, 2)}%
                </td>

                <td className="px-4 py-3 text-right font-mono text-xs text-foreground tabular-nums whitespace-nowrap">
                  {formatNumber(item.moisture, 2)}%
                </td>

                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <RowActionMenu
                    item={item}
                    onDeleteRequest={onDeleteRequest}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
