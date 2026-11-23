"use client";

import Link from "next/link";
import { ArrowLeft, CheckSquare, FileDown, Pencil, Printer, Square } from "lucide-react";
import { BrandMark } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/Button";
import { formatDateDisplay, formatNumber } from "@/lib/utils";
import {
  CHIP_QUALITY_METRICS,
  CHIPPER_LABEL_MAP,
  CHIPPER_PARTS,
  PART_CONDITION_OPTIONS,
} from "@/modules/shift-reports/shift-report.constants";
import type { ShiftReportDTO } from "@/modules/shift-reports/shift-report.types";

interface ShiftReportPrintViewProps {
  report: ShiftReportDTO;
}

function BoolMark({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      {checked ? (
        <CheckSquare
          className="size-4 text-primary shrink-0"
          aria-hidden="true"
        />
      ) : (
        <Square
          className="size-4 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}

function YesNoLabel({ value }: { value: boolean | null }) {
  if (value === true) {
    return <span className="font-semibold text-foreground">Yes</span>;
  }
  if (value === false) {
    return <span className="font-semibold text-foreground">No</span>;
  }
  return <span className="text-muted-foreground">—</span>;
}

function PartConditionLabel({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const found = PART_CONDITION_OPTIONS.find((opt) => opt.value === value);
  return (
    <span className="font-medium text-foreground">
      {found ? found.label : value}
    </span>
  );
}

function RemarksPhotoFigure({
  url,
  label,
}: {
  url: string | null;
  label: string;
}) {
  if (!url) return null;
  return (
    <figure className="mt-2 overflow-hidden rounded border border-border bg-surface-muted">
      <div className="aspect-video w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="h-full w-full object-contain"
        />
      </div>
      <figcaption className="border-t border-border bg-surface px-2 py-1 text-[10px] font-medium text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}

export function ShiftReportPrintView({ report }: ShiftReportPrintViewProps) {
  return (
    <div className="space-y-6">
      {/* Screen-only Action Toolbar */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-surface px-4 py-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Kembali ke Dashboard</span>
            </Button>
          </Link>
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatDateDisplay(report.reportDate)}
            </span>{" "}
            &middot; {CHIPPER_LABEL_MAP[report.chipperType]} &middot; Shift{" "}
            {report.shift}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link href={`/admin/reports/${report.id}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Pencil className="size-4" aria-hidden="true" />
              <span>Edit Laporan</span>
            </Button>
          </Link>
          <a
            href={`/api/shift-reports/${report.id}/pdf`}
            className="inline-flex h-9 w-full sm:w-auto items-center justify-center gap-1.5 rounded border border-border-strong/50 bg-surface px-3 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <FileDown className="size-4" aria-hidden="true" />
            <span>Export PDF</span>
          </a>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="col-span-2 sm:col-span-1 w-full sm:w-auto"
          >
            <Printer className="size-4" aria-hidden="true" />
            <span>Cetak Browser</span>
          </Button>
        </div>
      </div>

      {/* PAGE 1 */}
      <article className="print-sheet rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b-2 border-border-strong bg-surface px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mill Operations Quality Control
              </p>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                SHIFT REPORT
              </h1>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">2020-06-01 / ML</p>
            <p>Sida: 1 (totalt 2)</p>
          </div>
        </div>

        {/* Header Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border-strong/60">
          <div className="md:col-span-7 divide-y divide-border md:border-r md:border-border-strong/60">
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-5 font-medium text-muted-foreground">
                Customer
              </span>
              <span className="col-span-7 font-semibold text-foreground">
                {report.customer}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-5 font-medium text-muted-foreground">
                Date
              </span>
              <span className="col-span-7 font-mono text-foreground tabular-nums">
                {formatDateDisplay(report.reportDate)}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-5 font-medium text-muted-foreground">
                Inspection By
              </span>
              <span className="col-span-7 font-medium text-foreground">
                {report.inspectionBy}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-5 font-medium text-muted-foreground">
                Chipper Type
              </span>
              <span className="col-span-7 font-semibold text-foreground">
                {CHIPPER_LABEL_MAP[report.chipperType]}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-5 font-medium text-muted-foreground">
                Chip Length Set Up
              </span>
              <span className="col-span-7 font-mono text-foreground tabular-nums">
                {formatNumber(report.chipLengthSetUp, 2)} MM
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-5 font-medium text-muted-foreground">
                Type of Knife System
              </span>
              <span className="col-span-7 font-medium text-foreground">
                {report.typeOfKnifeSystem}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-5 font-medium text-muted-foreground">
                Type of Inspection
              </span>
              <span className="col-span-7 text-foreground">
                {report.typeOfInspection}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-5 font-medium text-muted-foreground">
                Adjust Chip Length
              </span>
              <span className="col-span-7 font-mono text-foreground tabular-nums">
                {report.adjustChipLengthFrom !== null ||
                report.adjustChipLengthTo !== null
                  ? `From ${formatNumber(report.adjustChipLengthFrom, 2)} to ${formatNumber(report.adjustChipLengthTo, 2)} MM`
                  : "—"}
              </span>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col divide-y divide-border">
            <div className="px-4 py-3 flex-1 min-h-24 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Signature
              </span>
              <span className="text-sm text-muted-foreground italic">
                {report.signature || " "}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-7 font-medium text-muted-foreground">
                Start Chipper After Knife Change
              </span>
              <span className="col-span-5 font-mono text-right text-foreground tabular-nums">
                {report.startChipperTime}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-7 font-medium text-muted-foreground">
                Stop Chipper Before Knife Change
              </span>
              <span className="col-span-5 font-mono text-right text-foreground tabular-nums">
                {report.stopChipperTime}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-7 font-medium text-muted-foreground">
                Shift
              </span>
              <span className="col-span-5 font-mono text-right font-semibold text-foreground">
                {report.shift}
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-sm">
              <span className="col-span-7 font-medium text-muted-foreground">
                Sampling Time
              </span>
              <span className="col-span-5 font-mono text-right text-foreground tabular-nums">
                {report.samplingTime}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Chip Quality */}
        <div className="border-b border-border-strong/60">
          <div className="bg-surface-muted px-4 py-2 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              1. Chip Quality
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              Remarks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-8 md:border-r md:border-border flex flex-col divide-y divide-border">
              {CHIP_QUALITY_METRICS.map((metric) => {
                const value = report[metric.key];
                return (
                  <div
                    key={metric.key}
                    className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1"
                  >
                    <span className="col-span-2 font-mono text-xs text-muted-foreground">
                      {metric.code}
                    </span>
                    <span className="col-span-6 font-medium text-foreground">
                      {metric.label}
                    </span>
                    <span className="col-span-4 text-right font-mono font-semibold text-foreground tabular-nums">
                      {formatNumber(value, 2)} %
                    </span>
                  </div>
                );
              })}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-2.5 bg-background/40">
                <BoolMark
                  checked={report.dataSourceChipClassifier}
                  label="2. Data Source: Chip Classifier"
                />
                <BoolMark
                  checked={report.samplingDoneByCostumer}
                  label="3. Sampling is Done by: Costumer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x print:divide-y-0 print:divide-x divide-border bg-surface-muted/40">
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Total Accept (%)
                  </span>
                  <span className="font-mono text-sm font-bold text-success tabular-nums">
                    {formatNumber(report.totalAccept, 2)} %
                  </span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    P+F (1.5 + 1.6)%
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                    {formatNumber(report.pinPlusFines, 2)} %
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 p-4 flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Remarks (Chip Quality)
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {report.chipQualityRemarks || "—"}
              </p>
              <RemarksPhotoFigure
                url={report.chipQualityRemarksPhotoUrl}
                label="Foto Remarks (Chip Quality)"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Operational Condition */}
        <div>
          <div className="bg-surface-muted px-4 py-2 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">
              2. Operational Condition
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-7 md:border-r md:border-border flex flex-col divide-y divide-border">
              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between print:flex-row print:items-center print:justify-between gap-2 text-sm md:flex-1">
                <span className="font-medium text-foreground">2.1 Layer</span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <BoolMark
                    checked={report.layerObservation === "SINGLE_LAYER"}
                    label="2.1.1 Single Layer"
                  />
                  <BoolMark
                    checked={report.layerObservation === "MULTI_LAYER"}
                    label="2.1.2 Multi Layer"
                  />
                </div>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between print:flex-row print:items-center print:justify-between gap-2 text-sm md:flex-1">
                <span className="font-medium text-foreground">
                  2.2 Log Condition
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <BoolMark checked={report.logConditionDry} label="2.2.1 Dry" />
                  <BoolMark
                    checked={report.logConditionFresh}
                    label="2.2.2 Fresh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1">
                <span className="col-span-2 font-mono text-xs text-muted-foreground">
                  2.2.3
                </span>
                <span className="col-span-7 text-foreground">Lots Of Bark</span>
                <span className="col-span-3 text-right">
                  <YesNoLabel value={report.lotsOfBark} />
                </span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1">
                <span className="col-span-2 font-mono text-xs text-muted-foreground">
                  2.2.4
                </span>
                <span className="col-span-7 text-foreground">Lots Of Sand</span>
                <span className="col-span-3 text-right">
                  <YesNoLabel value={report.lotsOfSand} />
                </span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1">
                <span className="col-span-2 font-mono text-xs text-muted-foreground">
                  2.2.5
                </span>
                <span className="col-span-7 text-foreground">
                  There is a Stone
                </span>
                <span className="col-span-3 text-right">
                  <YesNoLabel value={report.thereIsAStone} />
                </span>
              </div>
            </div>

            <div className="md:col-span-5 p-4 flex flex-col">
              <p className="text-xs font-semibold italic text-primary mb-2">
                Photo
              </p>
              {(() => {
                const photos = [
                  {
                    url: report.operationalPhotoUrl,
                    label: "Foto 1",
                    caption: report.operationalPhotoCaption,
                  },
                  {
                    url: report.operationalPhotoUrl2,
                    label: "Foto 2",
                    caption: report.operationalPhotoCaption2,
                  },
                  {
                    url: report.operationalPhotoUrl3,
                    label: "Foto 3",
                    caption: report.operationalPhotoCaption3,
                  },
                  {
                    url: report.operationalPhotoUrl4,
                    label: "Foto 4",
                    caption: report.operationalPhotoCaption4,
                  },
                ].filter(
                  (
                    p,
                  ): p is { url: string; label: string; caption: string | null } =>
                    Boolean(p.url),
                );

                if (photos.length === 0) {
                  return (
                    <div className="flex flex-1 min-h-32 items-center justify-center rounded border border-dashed border-border bg-background/40 text-xs text-muted-foreground">
                      Tidak ada foto terlampir
                    </div>
                  );
                }

                return (
                  <div
                    className={
                      photos.length === 1
                        ? "grid grid-cols-1 gap-2"
                        : "grid grid-cols-2 gap-2"
                    }
                  >
                    {photos.map((photo) => (
                      <figure
                        key={photo.label}
                        className="overflow-hidden rounded border border-border bg-surface-muted"
                      >
                        <div className="aspect-video w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={
                              photo.caption ||
                              `Foto kondisi operasional chipper (${photo.label})`
                            }
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <figcaption className="border-t border-border bg-surface px-2 py-1.5 text-[10px]">
                          <span className="font-semibold text-muted-foreground">
                            {photo.label}
                          </span>
                          {photo.caption ? (
                            <span className="mt-0.5 block text-[11px] font-medium text-foreground leading-snug">
                              {photo.caption}
                            </span>
                          ) : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </article>

      {/* PAGE 2 */}
      <article className="print-sheet print-page-break rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b-2 border-border-strong bg-surface px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark />
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                SHIFT REPORT &mdash; {report.customer}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateDisplay(report.reportDate)} &middot;{" "}
                {CHIPPER_LABEL_MAP[report.chipperType]} &middot; Shift{" "}
                {report.shift}
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">2020-06-01 / ML</p>
            <p>Sida: 2 (totalt 2)</p>
          </div>
        </div>

        {/* Section 3: Chipper Condition */}
        <div className="border-b border-border-strong/60">
          <div className="bg-surface-muted px-4 py-2 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">
              3. Chipper Condition
            </h2>
          </div>

          {/* 3.1 Chipper Geometry */}
          <div className="border-b border-border grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-8 md:border-r md:border-border divide-y divide-border">
              <div className="bg-background/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                3.1 Chipper Geometry
              </div>
              <div className="flex flex-col gap-1 px-4 py-2.5 text-sm sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 print:grid print:grid-cols-12 print:items-center print:gap-2">
                <div className="flex items-center gap-2 sm:contents print:contents">
                  <span className="font-mono text-xs text-muted-foreground sm:col-span-2 print:col-span-2">
                    3.1.1
                  </span>
                  <span className="font-medium text-foreground sm:col-span-4 print:col-span-4">
                    T Dimension
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pl-9 sm:pl-0 sm:contents print:contents">
                  <span className="font-mono text-foreground tabular-nums sm:col-span-3 print:col-span-3">
                    {report.tDimensionMm !== null
                      ? `${formatNumber(report.tDimensionMm, 2)} MM`
                      : "—"}
                  </span>
                  <span className="text-right font-mono text-xs text-muted-foreground tabular-nums sm:col-span-3 print:col-span-3">
                    {report.tDimensionLastSettingDate
                      ? formatDateDisplay(report.tDimensionLastSettingDate)
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 px-4 py-2.5 text-sm sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 print:grid print:grid-cols-12 print:items-center print:gap-2">
                <div className="flex items-center gap-2 sm:contents print:contents">
                  <span className="font-mono text-xs text-muted-foreground sm:col-span-2 print:col-span-2">
                    3.2.2
                  </span>
                  <span className="font-medium text-foreground sm:col-span-4 print:col-span-4">
                    Clearance Anvil
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pl-9 sm:pl-0 sm:contents print:contents">
                  <span className="font-mono text-foreground tabular-nums sm:col-span-3 print:col-span-3">
                    {report.clearanceAnvilMm !== null
                      ? `${formatNumber(report.clearanceAnvilMm, 2)} MM`
                      : "—"}
                  </span>
                  <span className="text-right font-mono text-xs text-muted-foreground tabular-nums sm:col-span-3 print:col-span-3">
                    {report.clearanceAnvilLastSettingDate
                      ? formatDateDisplay(report.clearanceAnvilLastSettingDate)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Remarks (Geometry)
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {report.geometryRemarks || "—"}
              </p>
              <RemarksPhotoFigure
                url={report.geometryRemarksPhotoUrl}
                label="Foto Remarks (Geometry)"
              />
            </div>
          </div>

          {/* 3.2 Chipper Part Condition */}
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-8 md:border-r md:border-border flex flex-col divide-y divide-border">
              <div className="bg-background/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                3.2 Chipper Part Condition
              </div>
              {CHIPPER_PARTS.map((part) => (
                <div
                  key={part.key}
                  className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1"
                >
                  <span className="col-span-2 font-mono text-xs text-muted-foreground">
                    {part.code}
                  </span>
                  <span className="col-span-6 text-foreground">
                    {part.label}
                  </span>
                  <span className="col-span-4 text-right">
                    <PartConditionLabel value={report[part.key]} />
                  </span>
                </div>
              ))}
            </div>

            <div className="md:col-span-4 p-4 flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Remarks (Part Condition)
              </p>
              <div className="grid grid-cols-1 gap-2.5 flex-1">
                {[
                  {
                    label: "Remarks 1",
                    value: report.partRemarks,
                    photoUrl: report.partRemarksPhotoUrl,
                  },
                  {
                    label: "Remarks 2",
                    value: report.partRemarks2,
                    photoUrl: report.partRemarks2PhotoUrl,
                  },
                ].map((slot) => (
                  <div
                    key={slot.label}
                    className="rounded border border-border bg-background/40 p-2.5 flex flex-col"
                  >
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                      {slot.label}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {slot.value || "—"}
                    </p>
                    <RemarksPhotoFigure
                      url={slot.photoUrl}
                      label={`Foto Part ${slot.label}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Raw Material Condition */}
        <div>
          <div className="bg-surface-muted px-4 py-2 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">
              4. Raw Material Condition
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-8 md:border-r md:border-border flex flex-col divide-y divide-border">
              <div className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1">
                <span className="col-span-2 font-mono text-xs text-muted-foreground">
                  4.1
                </span>
                <span className="col-span-6 text-foreground">
                  Log Yard Number
                </span>
                <span className="col-span-4 text-right font-mono font-medium text-foreground">
                  {report.logYardNumber || "—"}
                </span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1">
                <span className="col-span-2 font-mono text-xs text-muted-foreground">
                  4.2
                </span>
                <span className="col-span-6 text-foreground">Log Age</span>
                <span className="col-span-4 text-right font-mono text-foreground tabular-nums">
                  {report.logAgeYears !== null
                    ? `${formatNumber(report.logAgeYears, 1)} Years`
                    : "—"}
                </span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1">
                <span className="col-span-2 font-mono text-xs text-muted-foreground">
                  4.3
                </span>
                <span className="col-span-6 text-foreground">
                  Log Aging Time
                </span>
                <span className="col-span-4 text-right font-mono text-foreground tabular-nums">
                  {report.logAgingMonths !== null
                    ? `${formatNumber(report.logAgingMonths, 1)} Month`
                    : "—"}
                </span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1">
                <span className="col-span-2 font-mono text-xs text-muted-foreground">
                  4.4
                </span>
                <span className="col-span-6 text-foreground">
                  Average Log Diameter
                </span>
                <span className="col-span-4 text-right font-mono text-foreground tabular-nums">
                  {report.avgLogDiameterCm !== null
                    ? `${formatNumber(report.avgLogDiameterCm, 1)} CM`
                    : "—"}
                </span>
              </div>
              <div className="grid grid-cols-12 px-4 py-2 text-sm items-center md:flex-1">
                <span className="col-span-2 font-mono text-xs text-muted-foreground">
                  4.5
                </span>
                <span className="col-span-6 text-foreground">Moisture</span>
                <span className="col-span-4 text-right font-mono text-foreground tabular-nums">
                  {report.logMoisturePct !== null
                    ? `${formatNumber(report.logMoisturePct, 2)} %`
                    : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 px-4 py-2.5 text-sm sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 md:flex-1 print:grid print:grid-cols-12 print:items-start print:gap-0">
                <div className="flex items-center gap-2 sm:contents print:contents">
                  <span className="font-mono text-xs text-muted-foreground sm:col-span-2 print:col-span-2">
                    4.6
                  </span>
                  <span className="text-foreground sm:col-span-5 print:col-span-5">
                    Percentage Log Diameter
                  </span>
                </div>
                <div className="pl-7 sm:pl-0 sm:col-span-5 sm:text-right print:pl-0 print:col-span-5 print:text-right font-mono text-xs space-y-1 tabular-nums text-foreground">
                  <p>
                    {report.diameterPct1 !== null || report.diameterMm1 !== null
                      ? `${formatNumber(report.diameterPct1, 1)} % / ${formatNumber(report.diameterMm1, 1)} CM`
                      : "—"}
                  </p>
                  <p>
                    {report.diameterPct2 !== null || report.diameterMm2 !== null
                      ? `${formatNumber(report.diameterPct2, 1)} % / ${formatNumber(report.diameterMm2, 1)} CM`
                      : "—"}
                  </p>
                  <p>
                    {report.diameterPct3 !== null || report.diameterMm3 !== null
                      ? `${formatNumber(report.diameterPct3, 1)} % / ${formatNumber(report.diameterMm3, 1)} CM`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 p-4 flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Remarks (Raw Material)
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {report.rawMaterialRemarks || "—"}
              </p>
              <RemarksPhotoFigure
                url={report.rawMaterialRemarksPhotoUrl}
                label="Foto Remarks (Raw Material)"
              />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

