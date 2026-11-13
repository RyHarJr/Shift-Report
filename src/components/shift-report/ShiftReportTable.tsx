"use client";

import Link from "next/link";
import { Eye, FileDown, Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateDisplay, formatNumber } from "@/lib/utils";
import { CHIPPER_LABEL_MAP } from "@/modules/shift-reports/shift-report.constants";
import type { ShiftReportListDTO } from "@/modules/shift-reports/shift-report.types";

interface ShiftReportTableProps {
  items: ShiftReportListDTO[];
  loading?: boolean;
  hasActiveFilter?: boolean;
  onResetFilter?: () => void;
  onDeleteRequest: (item: ShiftReportListDTO) => void;
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
    <div className="overflow-x-auto">
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
                <div className="inline-flex items-center justify-end gap-1.5">
                  <Link
                    href={`/admin/reports/${item.id}`}
                    className="inline-flex h-8 items-center gap-1 rounded border border-border bg-surface px-2.5 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors"
                    title="Lihat Detail & Cetak"
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    <span>Lihat</span>
                  </Link>
                  <a
                    href={`/api/shift-reports/${item.id}/pdf`}
                    className="inline-flex h-8 items-center gap-1 rounded border border-border bg-surface px-2.5 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors"
                    title="Export ke PDF"
                  >
                    <FileDown className="size-3.5" aria-hidden="true" />
                    <span>PDF</span>
                  </a>
                  <Link
                    href={`/admin/reports/${item.id}/edit`}
                    className="inline-flex h-8 items-center gap-1 rounded border border-border bg-surface px-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                    title="Edit Laporan"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    <span>Edit</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(item)}
                    aria-label={`Hapus laporan ${formatDateDisplay(item.reportDate)} Shift ${item.shift}`}
                    title="Hapus Laporan"
                    className="inline-flex h-8 items-center gap-1 rounded border border-danger/30 bg-surface px-2.5 text-xs font-medium text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

