"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Check, Info, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDateDisplay, formatNumber } from "@/lib/utils";
import {
  ALL_SUMMARY_SIX_CHARTS,
  CHART_DEFINITIONS,
  CHIPPER_LABEL_MAP,
  DEFAULT_SELECTED_CHARTS,
  MAX_ACTIVE_CHARTS,
  type ChartId,
} from "@/modules/shift-reports/shift-report.constants";
import type { ShiftReportChartDTO } from "@/modules/shift-reports/shift-report.types";

interface ChipQualityChartsProps {
  data: ShiftReportChartDTO[];
  selectedCharts: ChartId[];
  onChangeSelectedCharts: (next: ChartId[]) => void;
  loading?: boolean;
}

interface ChartPointRow extends ShiftReportChartDTO {
  axisLabel: string;
}

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  payload?: ChartPointRow;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

function formatAxisLabel(reportDate: string, shift: string): string {
  const parts = reportDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]} S${shift}`;
  }
  return `${reportDate} S${shift}`;
}

function ChartTooltipContent({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="min-w-52 rounded border border-border bg-surface p-3 text-xs shadow-md">
      <div className="mb-2 border-b border-border pb-1.5">
        <p className="font-semibold text-foreground">
          {formatDateDisplay(point.reportDate)} &middot; Shift {point.shift}
        </p>
        <p className="text-muted-foreground">
          {CHIPPER_LABEL_MAP[point.chipperType]} &middot; {point.inspectionBy}
        </p>
      </div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey ?? entry.name)}
            className="flex items-center justify-between gap-4"
          >
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block size-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || "#005A9C" }}
              />
              <span>{entry.name}</span>
            </span>
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {typeof entry.value === "number"
                ? `${formatNumber(entry.value, 2)}%`
                : `${entry.value ?? "—"}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeAverage(rows: ChartPointRow[], key: ChartId): number | null {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);
  return total / rows.length;
}

export function ChipQualityCharts({
  data,
  selectedCharts,
  onChangeSelectedCharts,
  loading = false,
}: ChipQualityChartsProps) {
  const chartRows = useMemo<ChartPointRow[]>(() => {
    return data.map((item) => ({
      ...item,
      axisLabel: formatAxisLabel(item.reportDate, item.shift),
    }));
  }, [data]);

  const activeDefinitions = useMemo(() => {
    return CHART_DEFINITIONS.filter((def) => selectedCharts.includes(def.id));
  }, [selectedCharts]);

  const limitReached = selectedCharts.length >= MAX_ACTIVE_CHARTS;

  const isAllSummarySixSelected = useMemo(() => {
    return (
      selectedCharts.length === ALL_SUMMARY_SIX_CHARTS.length &&
      ALL_SUMMARY_SIX_CHARTS.every((id) => selectedCharts.includes(id))
    );
  }, [selectedCharts]);

  function toggleLine(chartId: ChartId) {
    if (selectedCharts.includes(chartId)) {
      onChangeSelectedCharts(selectedCharts.filter((id) => id !== chartId));
      return;
    }
    if (selectedCharts.length >= MAX_ACTIVE_CHARTS) {
      return;
    }
    onChangeSelectedCharts([...selectedCharts, chartId]);
  }

  function handleToggleAllSummarySix() {
    if (isAllSummarySixSelected) {
      onChangeSelectedCharts([]);
      return;
    }
    onChangeSelectedCharts(ALL_SUMMARY_SIX_CHARTS);
  }

  return (
    <section
      aria-labelledby="charts-section-heading"
      className="rounded-lg border border-border bg-surface p-4 sm:p-5 shadow-xs"
    >
      <div className="mb-4 flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="charts-section-heading"
            className="text-base font-semibold text-foreground flex items-center gap-2"
          >
            <BarChart3 className="size-4 text-primary" aria-hidden="true" />
            <span>Grafik Tren Chip Quality (Multi-Garis)</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Menampilkan {chartRows.length} titik inspeksi dalam 1 grafik utama
            dengan maksimal {MAX_ACTIVE_CHARTS} garis metrik aktif secara
            bersamaan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={limitReached ? "warning" : "primary"}>
            <span className="tabular-nums">
              Garis Aktif: {selectedCharts.length} / {MAX_ACTIVE_CHARTS}
            </span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* Left: Single Large Combined Multi-Line Chart */}
        <div className="lg:col-span-8 xl:col-span-9 order-2 lg:order-1">
          {loading ? (
            <div className="h-[420px] rounded border border-border bg-surface-muted/40 p-4 animate-pulse" />
          ) : activeDefinitions.length === 0 ? (
            <div className="flex h-[380px] flex-col items-center justify-center rounded border border-dashed border-border bg-background/60 px-6 py-10 text-center">
              <BarChart3
                className="size-9 text-muted-foreground mb-3"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-foreground">
                Belum Ada Garis Metrik yang Dipilih
              </p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Centang hingga {MAX_ACTIVE_CHARTS} metrik (seperti 1.1 Oversize,
                1.2 Overthick, Total Accept, P+F, atau Semuanya 6 Garis) pada
                panel pilihan di samping kanan.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChangeSelectedCharts(DEFAULT_SELECTED_CHARTS)}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span>Muat 4 Default</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onChangeSelectedCharts(ALL_SUMMARY_SIX_CHARTS)}
                >
                  <span>Tampilkan 6 Garis Utama</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded border border-border bg-background/40 p-3 sm:p-4">
              {/* Compact Active Line Summary Chips */}
              <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-border pb-2.5 sm:pb-3">
                {activeDefinitions.map((line) => {
                  const latestRow =
                    chartRows.length > 0
                      ? chartRows[chartRows.length - 1]
                      : null;
                  const latestVal = latestRow
                    ? Number(latestRow[line.id] ?? 0)
                    : null;
                  const avgVal = computeAverage(chartRows, line.id);

                  return (
                    <div
                      key={line.id}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded border border-border bg-surface px-2 py-1 text-[11px] sm:px-2.5 sm:py-1.5 sm:text-xs"
                    >
                      <span
                        className="inline-block size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: line.color }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-foreground">
                        {line.shortLabel}
                      </span>
                      {latestVal !== null ? (
                        <span className="font-mono font-semibold text-foreground tabular-nums">
                          {formatNumber(latestVal, 2)}%
                        </span>
                      ) : null}
                      {avgVal !== null ? (
                        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                          (Avg {formatNumber(avgVal, 2)}%)
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggleLine(line.id)}
                        aria-label={`Hapus garis ${line.label}`}
                        title={`Hapus ${line.label}`}
                        className="rounded p-0.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {chartRows.length === 0 ? (
                <div className="flex h-80 items-center justify-center rounded border border-dashed border-border bg-surface/60 px-4 text-center text-xs text-muted-foreground">
                  Tidak ada data inspeksi untuk filter yang dipilih.
                </div>
              ) : (
                <div className="h-72 sm:h-[420px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartRows}
                      margin={{ top: 10, right: 12, left: -12, bottom: 8 }}
                    >
                      <CartesianGrid
                        stroke="#E2E8F0"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="axisLabel"
                        tick={{ fontSize: 11, fill: "#475569" }}
                        tickLine={false}
                        axisLine={{ stroke: "#CBD5E1" }}
                        minTickGap={16}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#475569" }}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                        width={44}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                        iconType="circle"
                        iconSize={8}
                      />

                      {activeDefinitions.map((line) => (
                        <Line
                          key={line.id}
                          type="monotone"
                          dataKey={line.id}
                          name={line.label}
                          stroke={line.color}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, strokeWidth: 1.5, fill: "#FFFFFF" }}
                          activeDot={{ r: 6 }}
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Line Selector Panel (Max 6 Lines) */}
        <aside
          aria-label="Pilihan Garis Grafik"
          className="lg:col-span-4 xl:col-span-3 order-1 lg:order-2 rounded border border-border bg-background/70 p-3.5"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Pilihan Garis Grafik
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Pilih hingga {MAX_ACTIVE_CHARTS} garis pada 1 grafik utama
              </p>
            </div>
            <span
              className={cn(
                "rounded border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
                limitReached
                  ? "border-warning/30 bg-warning-bg text-warning"
                  : "border-primary/20 bg-primary/10 text-primary",
              )}
            >
              {selectedCharts.length}/{MAX_ACTIVE_CHARTS}
            </span>
          </div>

          {limitReached ? (
            <div
              role="status"
              className="mb-3 flex items-start gap-2 rounded border border-warning/30 bg-warning-bg px-2.5 py-2 text-[11px] leading-snug text-warning"
            >
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Batas maksimal {MAX_ACTIVE_CHARTS} garis tercapai. Hapus salah
                satu centang untuk mengganti metrik.
              </span>
            </div>
          ) : null}

          {/* Quick Toggle: Semuanya (6 Garis Ringkasan 1.1-1.8) */}
          <label
            className={cn(
              "mb-2 flex items-center justify-between gap-2 rounded border px-2.5 py-2 text-xs font-semibold transition-colors min-h-9 focus-within:ring-2 focus-within:ring-primary cursor-pointer",
              isAllSummarySixSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-foreground hover:border-primary/50",
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <input
                type="checkbox"
                checked={isAllSummarySixSelected}
                onChange={handleToggleAllSummarySix}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                  isAllSummarySixSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-strong/50 bg-surface",
                )}
              >
                {isAllSummarySixSelected ? <Check className="size-3" /> : null}
              </span>
              <span className="truncate">Semuanya (6 Garis: 1.1–1.8)</span>
            </span>
          </label>

          <div
            role="group"
            aria-label="Daftar metrik garis grafik chip quality"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1 max-h-56 lg:max-h-96 overflow-y-auto pr-1.5 border-t border-border pt-2"
          >
            {CHART_DEFINITIONS.map((def) => {
              const checked = selectedCharts.includes(def.id);
              const disabled = !checked && limitReached;

              return (
                <label
                  key={def.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded border px-2.5 py-2 text-xs transition-colors min-h-9 focus-within:ring-2 focus-within:ring-primary",
                    checked
                      ? "border-primary/40 bg-primary/5 text-foreground font-medium cursor-pointer"
                      : disabled
                        ? "border-transparent bg-surface-muted/50 text-muted-foreground/60 cursor-not-allowed"
                        : "border-transparent bg-surface hover:border-border hover:bg-surface cursor-pointer",
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleLine(def.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border-strong/50 bg-surface",
                      )}
                    >
                      {checked ? <Check className="size-3" /> : null}
                    </span>
                    <span
                      className="inline-block size-2 rounded-full shrink-0"
                      style={{ backgroundColor: def.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{def.label}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onChangeSelectedCharts(DEFAULT_SELECTED_CHARTS)}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>Default (4)</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={selectedCharts.length === 0}
              onClick={() => onChangeSelectedCharts([])}
            >
              <span>Kosongkan</span>
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
