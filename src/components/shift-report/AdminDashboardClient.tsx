"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Filter,
  Plus,
  RotateCcw,
  Search,
  TableProperties,
} from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatDateDisplay, formatNumber } from "@/lib/utils";
import {
  CHART_DEFINITIONS,
  CHIPPER_LABEL_MAP,
  CHIPPER_OPTIONS,
  DEFAULT_SELECTED_CHARTS,
  MAX_ACTIVE_CHARTS,
  SHIFT_OPTIONS,
  type ChartId,
} from "@/modules/shift-reports/shift-report.constants";
import type {
  ShiftReportChartDTO,
  ShiftReportListDTO,
} from "@/modules/shift-reports/shift-report.types";
import { ShiftReportTable } from "./ShiftReportTable";

const LazyChipQualityCharts = dynamic(
  () =>
    import("./ChipQualityCharts").then((mod) => ({
      default: mod.ChipQualityCharts,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-96 rounded-lg border border-border bg-surface p-5 animate-pulse"
        aria-busy="true"
        aria-label="Memuat modul grafik"
      />
    ),
  },
);

const CHART_PREFERENCE_STORAGE_KEY = "tel_shift_report_selected_lines_v2";
const CHART_PREFS_CHANGE_EVENT = "tel_shift_report_chart_prefs_change";
const VALID_CHART_IDS = new Set<string>(CHART_DEFINITIONS.map((d) => d.id));

let cachedChartPrefsRaw: string | null = null;
let cachedChartPrefsValue: ChartId[] = DEFAULT_SELECTED_CHARTS;

function subscribeChartPrefs(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHART_PREFS_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHART_PREFS_CHANGE_EVENT, onStoreChange);
  };
}

function getChartPrefsSnapshot(): ChartId[] {
  try {
    const raw = window.localStorage.getItem(CHART_PREFERENCE_STORAGE_KEY);
    if (raw === null) return DEFAULT_SELECTED_CHARTS;
    if (raw === cachedChartPrefsRaw) return cachedChartPrefsValue;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed
        .filter(
          (item): item is ChartId =>
            typeof item === "string" && VALID_CHART_IDS.has(item),
        )
        .slice(0, MAX_ACTIVE_CHARTS);
      cachedChartPrefsRaw = raw;
      cachedChartPrefsValue = valid;
      return valid;
    }
  } catch {
    // Ignore storage read errors cleanly
  }
  return DEFAULT_SELECTED_CHARTS;
}

function getServerChartPrefsSnapshot(): ChartId[] {
  return DEFAULT_SELECTED_CHARTS;
}

interface FilterState {
  chipperType: string;
  shift: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminDashboardClientProps {
  initialItems: ShiftReportListDTO[];
  initialMeta: PaginationMeta;
  initialChartPoints: ShiftReportChartDTO[];
}

const EMPTY_FILTERS: FilterState = {
  chipperType: "ALL",
  shift: "ALL",
  dateFrom: "",
  dateTo: "",
  search: "",
};

function buildQueryParams(filters: FilterState, page?: number): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.chipperType && filters.chipperType !== "ALL") {
    params.set("chipperType", filters.chipperType);
  }
  if (filters.shift && filters.shift !== "ALL") {
    params.set("shift", filters.shift);
  }
  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }
  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (page !== undefined) {
    params.set("page", String(page));
    params.set("limit", "10");
  }
  return params;
}

/**
 * Parses an HTTP response body as JSON only when content exists (returns null for 204/empty bodies).
 */
async function readJsonSafely<T>(response: Response): Promise<T | null> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  const raw = await response.text();
  if (!raw.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function AdminDashboardClient({
  initialItems,
  initialMeta,
  initialChartPoints,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(EMPTY_FILTERS);

  const [items, setItems] = useState<ShiftReportListDTO[]>(initialItems);
  const [meta, setMeta] = useState<PaginationMeta>(initialMeta);
  const [chartPoints, setChartPoints] =
    useState<ShiftReportChartDTO[]>(initialChartPoints);

  const [tableLoading, setTableLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  const selectedCharts = useSyncExternalStore(
    subscribeChartPrefs,
    getChartPrefsSnapshot,
    getServerChartPrefsSnapshot,
  );

  const [deleteTarget, setDeleteTarget] = useState<ShiftReportListDTO | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  function handleChangeSelectedCharts(next: ChartId[]) {
    const sanitized = next.slice(0, MAX_ACTIVE_CHARTS);
    try {
      const serialized = JSON.stringify(sanitized);
      cachedChartPrefsRaw = serialized;
      cachedChartPrefsValue = sanitized;
      window.localStorage.setItem(CHART_PREFERENCE_STORAGE_KEY, serialized);
      window.dispatchEvent(new Event(CHART_PREFS_CHANGE_EVENT));
    } catch {
      // Ignore storage write errors cleanly
    }
  }

  const hasActiveFilter =
    appliedFilters.chipperType !== "ALL" ||
    appliedFilters.shift !== "ALL" ||
    Boolean(appliedFilters.dateFrom) ||
    Boolean(appliedFilters.dateTo) ||
    Boolean(appliedFilters.search.trim());

  const summaryStats = useMemo(() => {
    if (chartPoints.length === 0) {
      return {
        avgTotalAccept: null as number | null,
        avgPinPlusFines: null as number | null,
        avgMoisture: null as number | null,
      };
    }
    const count = chartPoints.length;
    const sumAccept = chartPoints.reduce((acc, p) => acc + p.totalAccept, 0);
    const sumPf = chartPoints.reduce((acc, p) => acc + p.pinPlusFines, 0);
    const sumMoisture = chartPoints.reduce((acc, p) => acc + p.moisture, 0);

    return {
      avgTotalAccept: sumAccept / count,
      avgPinPlusFines: sumPf / count,
      avgMoisture: sumMoisture / count,
    };
  }, [chartPoints]);

  async function fetchReportsOnly(filters: FilterState, page: number) {
    setTableLoading(true);
    try {
      const query = buildQueryParams(filters, page);
      const response = await fetch(`/api/shift-reports?${query.toString()}`, {
        cache: "no-store",
      });
      const payload = await readJsonSafely<{
        success: boolean;
        data?: ShiftReportListDTO[];
        meta?: PaginationMeta;
        error?: { message?: string };
      }>(response);
      if (!response.ok || !payload?.success || !payload.data || !payload.meta) {
        throw new Error(
          payload?.error?.message || "Gagal memuat daftar laporan.",
        );
      }
      setItems(payload.data);
      setMeta(payload.meta);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal memuat data tabel.",
        "error",
      );
    } finally {
      setTableLoading(false);
    }
  }

  async function fetchDashboardData(filters: FilterState, page: number) {
    setTableLoading(true);
    setChartLoading(true);
    try {
      const listQuery = buildQueryParams(filters, page);
      const chartQuery = buildQueryParams(filters);

      const [listRes, chartRes] = await Promise.all([
        fetch(`/api/shift-reports?${listQuery.toString()}`, {
          cache: "no-store",
        }),
        fetch(`/api/shift-reports/charts?${chartQuery.toString()}`, {
          cache: "no-store",
        }),
      ]);

      const [listJson, chartJson] = await Promise.all([
        readJsonSafely<{
          success: boolean;
          data?: ShiftReportListDTO[];
          meta?: PaginationMeta;
          error?: { message?: string };
        }>(listRes),
        readJsonSafely<{
          success: boolean;
          data?: ShiftReportChartDTO[];
          error?: { message?: string };
        }>(chartRes),
      ]);

      if (
        !listRes.ok ||
        !listJson?.success ||
        !listJson.data ||
        !listJson.meta
      ) {
        throw new Error(
          listJson?.error?.message || "Gagal memuat data laporan.",
        );
      }
      if (!chartRes.ok || !chartJson?.success || !chartJson.data) {
        throw new Error(
          chartJson?.error?.message || "Gagal memuat data grafik.",
        );
      }

      setItems(listJson.data);
      setMeta(listJson.meta);
      setChartPoints(chartJson.data);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal memperbarui dashboard.",
        "error",
      );
    } finally {
      setTableLoading(false);
      setChartLoading(false);
    }
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters(draftFilters);
    void fetchDashboardData(draftFilters, 1);
  }

  function handleResetFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    void fetchDashboardData(EMPTY_FILTERS, 1);
  }

  function handlePageChange(nextPage: number) {
    void fetchReportsOnly(appliedFilters, nextPage);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/shift-reports/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const payload = await readJsonSafely<{
        success?: boolean;
        error?: { message?: string };
      }>(response);
      if (!response.ok || (payload !== null && payload.success === false)) {
        throw new Error(payload?.error?.message || "Gagal menghapus laporan.");
      }

      showToast("Shift Report berhasil dihapus.", "success");
      setDeleteTarget(null);

      const nextPage =
        items.length === 1 && meta.page > 1 ? meta.page - 1 : meta.page;
      await fetchDashboardData(appliedFilters, nextPage);
      router.refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menghapus laporan.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Bar */}
      <section
        aria-label="Filter dan ringkasan dashboard"
        className="rounded-lg border border-border bg-surface p-4 sm:p-5 shadow-xs"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Dashboard Admin Shift Report
            </h1>
            <p className="text-xs text-muted-foreground">
              Pantau metrik kualitas chip, cetak laporan 2 halaman, dan kelola
              riwayat inspeksi PT Tanjung Enim Lestari.
            </p>
          </div>
          <Link href="/" className="w-full sm:w-auto shrink-0">
            <Button size="md" className="w-full sm:w-auto">
              <Plus className="size-4" aria-hidden="true" />
              <span>Input Laporan Baru</span>
            </Button>
          </Link>
        </div>

        {/* Summary KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <div className="rounded border border-border bg-background/60 px-3 py-2.5 sm:px-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Total Laporan
            </p>
            <p className="mt-1 font-mono text-lg sm:text-xl font-bold text-foreground tabular-nums">
              {meta.total}
            </p>
          </div>
          <div className="rounded border border-border bg-background/60 px-3 py-2.5 sm:px-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Rata-rata Total Accept
            </p>
            <p className="mt-1 font-mono text-lg sm:text-xl font-bold text-success tabular-nums">
              {summaryStats.avgTotalAccept !== null
                ? `${formatNumber(summaryStats.avgTotalAccept, 2)}%`
                : "—"}
            </p>
          </div>
          <div className="rounded border border-border bg-background/60 px-3 py-2.5 sm:px-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Rata-rata P+F
            </p>
            <p className="mt-1 font-mono text-lg sm:text-xl font-bold text-foreground tabular-nums">
              {summaryStats.avgPinPlusFines !== null
                ? `${formatNumber(summaryStats.avgPinPlusFines, 2)}%`
                : "—"}
            </p>
          </div>
          <div className="rounded border border-border bg-background/60 px-3 py-2.5 sm:px-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Rata-rata Moisture
            </p>
            <p className="mt-1 font-mono text-lg sm:text-xl font-bold text-foreground tabular-nums">
              {summaryStats.avgMoisture !== null
                ? `${formatNumber(summaryStats.avgMoisture, 2)}%`
                : "—"}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <form
          onSubmit={handleFilterSubmit}
          className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6 items-end"
        >
          <div>
            <label
              htmlFor="filter-chipper"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Chipper Type
            </label>
            <select
              id="filter-chipper"
              value={draftFilters.chipperType}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  chipperType: e.target.value,
                }))
              }
              className="flex h-10 w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="ALL">Semua Chipper</option>
              {CHIPPER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-shift"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Shift
            </label>
            <select
              id="filter-shift"
              value={draftFilters.shift}
              onChange={(e) =>
                setDraftFilters((prev) => ({ ...prev, shift: e.target.value }))
              }
              className="flex h-10 w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="ALL">Semua Shift</option>
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-date-from"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Dari Tanggal
            </label>
            <Input
              id="filter-date-from"
              type="date"
              value={draftFilters.dateFrom}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  dateFrom: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="filter-date-to"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Sampai Tanggal
            </label>
            <Input
              id="filter-date-to"
              type="date"
              value={draftFilters.dateTo}
              onChange={(e) =>
                setDraftFilters((prev) => ({ ...prev, dateTo: e.target.value }))
              }
            />
          </div>

          <div className="col-span-2 lg:col-span-1">
            <label
              htmlFor="filter-search"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Cari Inspektor / Log Yard
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="filter-search"
                type="search"
                placeholder="Nama / yard..."
                value={draftFilters.search}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                className="pl-9"
              />
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 flex items-center gap-2">
            <Button type="submit" className="flex-1">
              <Filter className="size-4" aria-hidden="true" />
              <span>Terapkan</span>
            </Button>
            {hasActiveFilter ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                title="Reset semua filter"
                aria-label="Reset semua filter"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      {/* Analytics Charts + Right Selector Panel */}
      <LazyChipQualityCharts
        data={chartPoints}
        selectedCharts={selectedCharts}
        onChangeSelectedCharts={handleChangeSelectedCharts}
        loading={chartLoading}
      />

      {/* CRUD Reports Table */}
      <section
        aria-labelledby="reports-table-heading"
        className="rounded-lg border border-border bg-surface shadow-xs overflow-hidden"
      >
        <div className="flex flex-col gap-1 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TableProperties
              className="size-4 text-primary"
              aria-hidden="true"
            />
            <h2
              id="reports-table-heading"
              className="text-base font-semibold text-foreground"
            >
              Daftar Shift Report
            </h2>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            Total {meta.total} laporan tercatat
          </p>
        </div>

        <ShiftReportTable
          items={items}
          loading={tableLoading}
          hasActiveFilter={hasActiveFilter}
          onResetFilter={handleResetFilters}
          onDeleteRequest={setDeleteTarget}
        />

        {meta.total > 0 ? (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={handlePageChange}
          />
        ) : null}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Shift Report?"
        description={
          deleteTarget
            ? `Laporan tanggal ${formatDateDisplay(deleteTarget.reportDate)} (${CHIPPER_LABEL_MAP[deleteTarget.chipperType]} · Shift ${deleteTarget.shift}) oleh ${deleteTarget.inspectionBy} akan dihapus permanen.`
            : ""
        }
        confirmLabel="Ya, Hapus Laporan"
        cancelLabel="Batal"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
