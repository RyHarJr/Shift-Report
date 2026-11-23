import "server-only";
import ExcelJS from "exceljs";
import { formatDateDisplay } from "@/lib/utils";
import {
  CHIP_QUALITY_METRICS,
  CHIPPER_LABEL_MAP,
  CHIPPER_PARTS,
  PART_CONDITION_OPTIONS,
  type PartConditionValue,
} from "./shift-report.constants";
import type { ShiftReportDTO } from "./shift-report.types";

const COLOR_PRIMARY = "FF005A9C";
const COLOR_WHITE = "FFFFFFFF";
const COLOR_DARK = "FF0F172A";
const COLOR_MUTED = "FF475569";
const COLOR_BORDER = "FFCBD5E1";
const COLOR_BORDER_STRONG = "FF64748B";
const COLOR_ZEBRA = "FFF8FAFC";
const COLOR_SURFACE_MUTED = "FFECEFF3";

const COLOR_SUCCESS_BG = "FFDCFCE7";
const COLOR_SUCCESS_FG = "FF15803D";
const COLOR_WARNING_BG = "FFFEF3C7";
const COLOR_WARNING_FG = "FFB45309";
const COLOR_DANGER_BG = "FFFEE2E2";
const COLOR_DANGER_FG = "FFB91C1C";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLOR_BORDER } },
  left: { style: "thin", color: { argb: COLOR_BORDER } },
  bottom: { style: "thin", color: { argb: COLOR_BORDER } },
  right: { style: "thin", color: { argb: COLOR_BORDER } },
};

const MEDIUM_BOTTOM_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLOR_BORDER } },
  left: { style: "thin", color: { argb: COLOR_BORDER } },
  bottom: { style: "medium", color: { argb: COLOR_BORDER_STRONG } },
  right: { style: "thin", color: { argb: COLOR_BORDER } },
};

const PART_LABEL_MAP: Record<PartConditionValue, string> = Object.fromEntries(
  PART_CONDITION_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<PartConditionValue, string>;

function toExcelColName(colNumber: number): string {
  let n = colNumber;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function formatChipperLabel(chipperType: ShiftReportDTO["chipperType"]): string {
  return CHIPPER_LABEL_MAP[chipperType] ?? chipperType;
}

function formatLayerLabel(
  layer: ShiftReportDTO["layerObservation"],
): string {
  if (layer === "SINGLE_LAYER") return "Single Layer";
  if (layer === "MULTI_LAYER") return "Multi Layer";
  return "";
}

function formatPartConditionLabel(
  condition: PartConditionValue | null,
): string {
  if (!condition) return "";
  return PART_LABEL_MAP[condition] ?? condition;
}

function formatYesNo(val: boolean | null | undefined): string {
  if (val === true) return "Yes";
  if (val === false) return "No";
  return "";
}

function formatDateIndo(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  return formatDateDisplay(isoDate);
}

function formatDateTimeJakarta(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function countOperationalPhotos(report: ShiftReportDTO): number {
  return [
    report.operationalPhotoUrl,
    report.operationalPhotoUrl2,
    report.operationalPhotoUrl3,
    report.operationalPhotoUrl4,
  ].filter(Boolean).length;
}

function countRemarksPhotos(report: ShiftReportDTO): number {
  return [
    report.chipQualityRemarksPhotoUrl,
    report.geometryRemarksPhotoUrl,
    report.partRemarksPhotoUrl,
    report.partRemarks2PhotoUrl,
    report.rawMaterialRemarksPhotoUrl,
  ].filter(Boolean).length;
}

interface TabularColumnDef {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
  numFmt?: string;
  wrapText?: boolean;
  value: (report: ShiftReportDTO, rowIndex: number) => string | number | null;
  styleCell?: (cell: ExcelJS.Cell, report: ShiftReportDTO) => void;
}

interface TabularGroupDef {
  label: string;
  fillArgb: string;
  columns: TabularColumnDef[];
}

function applyPartStyle(
  cell: ExcelJS.Cell,
  condition: PartConditionValue | null,
): void {
  if (condition === "WORN_OUT") {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR_WARNING_BG },
    };
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLOR_WARNING_FG } };
  } else if (condition === "BROKEN") {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR_DANGER_BG },
    };
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLOR_DANGER_FG } };
  }
}

const TABULAR_GROUPS: TabularGroupDef[] = [
  {
    label: "HEADER & METADATA",
    fillArgb: "FF005A9C",
    columns: [
      {
        header: "No",
        width: 6,
        align: "center",
        numFmt: "0",
        value: (_r, idx) => idx + 1,
      },
      {
        header: "ID Laporan",
        width: 26,
        align: "left",
        value: (r) => r.id,
      },
      {
        header: "Tanggal",
        width: 13,
        align: "center",
        value: (r) => formatDateIndo(r.reportDate),
      },
      {
        header: "Shift",
        width: 8,
        align: "center",
        value: (r) => r.shift,
      },
      {
        header: "Customer",
        width: 24,
        align: "left",
        value: (r) => r.customer,
      },
      {
        header: "Inspektor",
        width: 20,
        align: "left",
        value: (r) => r.inspectionBy,
      },
      {
        header: "Chipper Type",
        width: 13,
        align: "center",
        value: (r) => formatChipperLabel(r.chipperType),
      },
      {
        header: "Type of Knife System",
        width: 24,
        align: "left",
        value: (r) => r.typeOfKnifeSystem,
      },
      {
        header: "Chip Length Set Up (mm)",
        width: 18,
        align: "right",
        numFmt: "0.00",
        value: (r) => r.chipLengthSetUp,
      },
      {
        header: "Type of Inspection",
        width: 18,
        align: "left",
        value: (r) => r.typeOfInspection,
      },
      {
        header: "Adjust From (mm)",
        width: 15,
        align: "right",
        numFmt: "0.00",
        value: (r) => r.adjustChipLengthFrom,
      },
      {
        header: "Adjust To (mm)",
        width: 15,
        align: "right",
        numFmt: "0.00",
        value: (r) => r.adjustChipLengthTo,
      },
      {
        header: "Start Chipper",
        width: 13,
        align: "center",
        value: (r) => r.startChipperTime,
      },
      {
        header: "Stop Chipper",
        width: 13,
        align: "center",
        value: (r) => r.stopChipperTime,
      },
      {
        header: "Sampling Time",
        width: 14,
        align: "center",
        value: (r) => r.samplingTime,
      },
    ],
  },
  {
    label: "1. CHIP QUALITY",
    fillArgb: "FF0369A1",
    columns: [
      ...CHIP_QUALITY_METRICS.map(
        (m): TabularColumnDef => ({
          header: `${m.code} ${m.label} (%)`,
          width: 15,
          align: "right",
          numFmt: "0.00",
          value: (r) => r[m.key],
        }),
      ),
      {
        header: "Total Accept (%)",
        width: 16,
        align: "right",
        numFmt: "0.00",
        value: (r) => r.totalAccept,
        styleCell: (cell) => {
          cell.font = {
            name: "Calibri",
            size: 10,
            bold: true,
            color: { argb: COLOR_SUCCESS_FG },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: COLOR_SUCCESS_BG },
          };
        },
      },
      {
        header: "P+F (%)",
        width: 12,
        align: "right",
        numFmt: "0.00",
        value: (r) => r.pinPlusFines,
        styleCell: (cell) => {
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLOR_DARK } };
        },
      },
      {
        header: "Data Source: Chip Classifier",
        width: 20,
        align: "center",
        value: (r) => formatYesNo(r.dataSourceChipClassifier),
      },
      {
        header: "Sampling by Costumer",
        width: 19,
        align: "center",
        value: (r) => formatYesNo(r.samplingDoneByCostumer),
      },
      {
        header: "Remarks Chip Quality",
        width: 34,
        align: "left",
        wrapText: true,
        value: (r) => r.chipQualityRemarks ?? "",
      },
    ],
  },
  {
    label: "2. OPERATIONAL CONDITION",
    fillArgb: "FF334155",
    columns: [
      {
        header: "2.1 Layer",
        width: 14,
        align: "center",
        value: (r) => formatLayerLabel(r.layerObservation),
      },
      {
        header: "2.2.1 Dry",
        width: 11,
        align: "center",
        value: (r) => formatYesNo(r.logConditionDry),
      },
      {
        header: "2.2.2 Fresh",
        width: 11,
        align: "center",
        value: (r) => formatYesNo(r.logConditionFresh),
      },
      {
        header: "2.2.3 Lots Of Bark",
        width: 15,
        align: "center",
        value: (r) => formatYesNo(r.lotsOfBark),
      },
      {
        header: "2.2.4 Lots Of Sand",
        width: 15,
        align: "center",
        value: (r) => formatYesNo(r.lotsOfSand),
      },
      {
        header: "2.2.5 There is a Stone",
        width: 17,
        align: "center",
        value: (r) => formatYesNo(r.thereIsAStone),
      },
      {
        header: "Caption Foto 1",
        width: 24,
        align: "left",
        wrapText: true,
        value: (r) => r.operationalPhotoCaption ?? "",
      },
      {
        header: "Caption Foto 2",
        width: 24,
        align: "left",
        wrapText: true,
        value: (r) => r.operationalPhotoCaption2 ?? "",
      },
      {
        header: "Caption Foto 3",
        width: 24,
        align: "left",
        wrapText: true,
        value: (r) => r.operationalPhotoCaption3 ?? "",
      },
      {
        header: "Caption Foto 4",
        width: 24,
        align: "left",
        wrapText: true,
        value: (r) => r.operationalPhotoCaption4 ?? "",
      },
      {
        header: "Jumlah Foto Operasional",
        width: 16,
        align: "center",
        numFmt: "0",
        value: (r) => countOperationalPhotos(r),
      },
    ],
  },
  {
    label: "3.1 CHIPPER GEOMETRY",
    fillArgb: "FF1E40AF",
    columns: [
      {
        header: "3.1.1 T Dimension (mm)",
        width: 17,
        align: "right",
        numFmt: "0.00",
        value: (r) => r.tDimensionMm,
      },
      {
        header: "T Dimension Last Setting Date",
        width: 19,
        align: "center",
        value: (r) => formatDateIndo(r.tDimensionLastSettingDate),
      },
      {
        header: "3.2.2 Clearance Anvil (mm)",
        width: 19,
        align: "right",
        numFmt: "0.00",
        value: (r) => r.clearanceAnvilMm,
      },
      {
        header: "Clearance Anvil Last Setting Date",
        width: 21,
        align: "center",
        value: (r) => formatDateIndo(r.clearanceAnvilLastSettingDate),
      },
      {
        header: "Remarks Geometry",
        width: 32,
        align: "left",
        wrapText: true,
        value: (r) => r.geometryRemarks ?? "",
      },
    ],
  },
  {
    label: "3.2 CHIPPER PART CONDITION",
    fillArgb: "FF92400E",
    columns: [
      ...CHIPPER_PARTS.map(
        (part): TabularColumnDef => ({
          header: `${part.code} ${part.label}`,
          width: 17,
          align: "center",
          value: (r) => formatPartConditionLabel(r[part.key]),
          styleCell: (cell, r) => applyPartStyle(cell, r[part.key]),
        }),
      ),
      {
        header: "Remarks Part 1",
        width: 32,
        align: "left",
        wrapText: true,
        value: (r) => r.partRemarks ?? "",
      },
      {
        header: "Remarks Part 2",
        width: 32,
        align: "left",
        wrapText: true,
        value: (r) => r.partRemarks2 ?? "",
      },
    ],
  },
  {
    label: "4. RAW MATERIAL",
    fillArgb: "FF166534",
    columns: [
      {
        header: "4.1 Log Yard Number",
        width: 17,
        align: "center",
        value: (r) => r.logYardNumber ?? "",
      },
      {
        header: "4.2 Log Age (Years)",
        width: 16,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.logAgeYears,
      },
      {
        header: "4.3 Log Aging In Storage (Months)",
        width: 21,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.logAgingMonths,
      },
      {
        header: "4.4 Avg. Log Diameter (cm)",
        width: 19,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.avgLogDiameterCm,
      },
      {
        header: "4.5 Log Moisture (%)",
        width: 16,
        align: "right",
        numFmt: "0.00",
        value: (r) => r.logMoisturePct,
      },
      {
        header: "4.6 Pair 1 (%)",
        width: 14,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.diameterPct1,
      },
      {
        header: "4.6 Pair 1 (cm)",
        width: 14,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.diameterMm1,
      },
      {
        header: "4.6 Pair 2 (%)",
        width: 14,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.diameterPct2,
      },
      {
        header: "4.6 Pair 2 (cm)",
        width: 14,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.diameterMm2,
      },
      {
        header: "4.6 Pair 3 (%)",
        width: 14,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.diameterPct3,
      },
      {
        header: "4.6 Pair 3 (cm)",
        width: 14,
        align: "right",
        numFmt: "0.0",
        value: (r) => r.diameterMm3,
      },
      {
        header: "Remarks Raw Material",
        width: 32,
        align: "left",
        wrapText: true,
        value: (r) => r.rawMaterialRemarks ?? "",
      },
    ],
  },
  {
    label: "INFO TAMBAHAN",
    fillArgb: "FF475569",
    columns: [
      {
        header: "Jumlah Foto Remarks",
        width: 15,
        align: "center",
        numFmt: "0",
        value: (r) => countRemarksPhotos(r),
      },
      {
        header: "Dibuat Pada (WIB)",
        width: 20,
        align: "center",
        value: (r) => formatDateTimeJakarta(r.createdAt),
      },
    ],
  },
];

function populateTabularSheet(
  sheet: ExcelJS.Worksheet,
  reports: ShiftReportDTO[],
  subtitle: string,
): void {
  const flatColumns: TabularColumnDef[] = TABULAR_GROUPS.flatMap(
    (group) => group.columns,
  );
  const totalCols = flatColumns.length;
  const lastColName = toExcelColName(totalCols);

  flatColumns.forEach((col, idx) => {
    sheet.getColumn(idx + 1).width = col.width;
  });

  // Row 1: Title Banner
  sheet.mergeCells(`A1:${lastColName}1`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "SHIFT REPORT QC — PT TANJUNG ENIM LESTARI";
  titleCell.font = {
    name: "Calibri",
    size: 13,
    bold: true,
    color: { argb: COLOR_WHITE },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR_PRIMARY },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(1).height = 28;

  // Row 2: Subtitle
  sheet.mergeCells(`A2:${lastColName}2`);
  const subCell = sheet.getCell("A2");
  subCell.value = subtitle;
  subCell.font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: COLOR_MUTED },
  };
  subCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR_ZEBRA },
  };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(2).height = 20;

  // Row 3: Spacer
  sheet.getRow(3).height = 8;

  // Row 4: Section Group Headers & Row 5: Column Headers
  const groupRow = sheet.getRow(4);
  groupRow.height = 22;
  const headerRow = sheet.getRow(5);
  headerRow.height = 28;

  let colCursor = 1;
  for (const group of TABULAR_GROUPS) {
    const startCol = colCursor;
    const endCol = colCursor + group.columns.length - 1;
    if (endCol > startCol) {
      sheet.mergeCells(4, startCol, 4, endCol);
    }

    const gCell = groupRow.getCell(startCol);
    gCell.value = group.label;
    gCell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: COLOR_WHITE },
    };
    gCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: group.fillArgb },
    };
    gCell.alignment = { vertical: "middle", horizontal: "center" };

    for (let c = startCol; c <= endCol; c++) {
      groupRow.getCell(c).border = THIN_BORDER;
    }

    for (const colDef of group.columns) {
      const hCell = headerRow.getCell(colCursor);
      hCell.value = colDef.header;
      hCell.font = {
        name: "Calibri",
        size: 10,
        bold: true,
        color: { argb: COLOR_DARK },
      };
      hCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLOR_SURFACE_MUTED },
      };
      hCell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      hCell.border = MEDIUM_BOTTOM_BORDER;
      colCursor += 1;
    }
  }

  // Data rows (Row 6+)
  reports.forEach((report, reportIdx) => {
    const row = sheet.getRow(6 + reportIdx);
    const isEven = reportIdx % 2 === 1;
    let hasWrappedContent = false;

    flatColumns.forEach((colDef, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      const rawVal = colDef.value(report, reportIdx);
      cell.value = rawVal === null || rawVal === undefined ? "" : rawVal;
      cell.font = {
        name: "Calibri",
        size: 10,
        color: { argb: COLOR_DARK },
      };
      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLOR_ZEBRA },
        };
      }
      cell.alignment = {
        vertical: "middle",
        horizontal: colDef.align ?? "left",
        wrapText: Boolean(colDef.wrapText),
      };
      if (typeof rawVal === "number" && colDef.numFmt) {
        cell.numFmt = colDef.numFmt;
      }
      if (colDef.wrapText && typeof rawVal === "string" && rawVal.length > 36) {
        hasWrappedContent = true;
      }
      cell.border = THIN_BORDER;
      colDef.styleCell?.(cell, report);
    });

    row.height = hasWrappedContent ? 34 : 21;
  });

  sheet.views = [{ state: "frozen", xSplit: 4, ySplit: 5 }];
  sheet.autoFilter = `A5:${lastColName}5`;
}

function styleInspectionBanner(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  label: string,
  fillArgb = COLOR_PRIMARY,
): void {
  sheet.mergeCells(`A${rowNum}:F${rowNum}`);
  const cell = sheet.getCell(`A${rowNum}`);
  cell.value = label;
  cell.font = {
    name: "Calibri",
    size: 10.5,
    bold: true,
    color: { argb: COLOR_WHITE },
  };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: fillArgb },
  };
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  for (let col = 1; col <= 6; col++) {
    sheet.getRow(rowNum).getCell(col).border = THIN_BORDER;
  }
  sheet.getRow(rowNum).height = 22;
}

function writeSplitMetadataRow(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  leftLabel: string,
  leftVal: string | number | null,
  rightLabel: string,
  rightVal: string | number | null,
  leftNumFmt?: string,
  rightNumFmt?: string,
): number {
  const row = sheet.getRow(rowNum);
  row.height = 20;

  sheet.mergeCells(`A${rowNum}:B${rowNum}`);
  sheet.mergeCells(`D${rowNum}:E${rowNum}`);

  const lLbl = row.getCell(1);
  lLbl.value = leftLabel;
  lLbl.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLOR_MUTED } };
  lLbl.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
  lLbl.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  const lVal = row.getCell(3);
  lVal.value = leftVal ?? "—";
  lVal.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLOR_DARK } };
  lVal.alignment = { vertical: "middle", horizontal: typeof leftVal === "number" ? "right" : "left" };
  if (typeof leftVal === "number" && leftNumFmt) lVal.numFmt = leftNumFmt;

  const rLbl = row.getCell(4);
  rLbl.value = rightLabel;
  rLbl.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLOR_MUTED } };
  rLbl.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
  rLbl.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  const rVal = row.getCell(6);
  rVal.value = rightVal ?? "—";
  rVal.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLOR_DARK } };
  rVal.alignment = { vertical: "middle", horizontal: typeof rightVal === "number" ? "right" : "left" };
  if (typeof rightVal === "number" && rightNumFmt) rVal.numFmt = rightNumFmt;

  for (let col = 1; col <= 6; col++) {
    row.getCell(col).border = THIN_BORDER;
  }
  return rowNum + 1;
}

function writeSectionTableRow(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  code: string,
  label: string,
  value: string | number | null,
  unit = "",
  numFmt?: string,
  highlight?: "success" | "warning" | "danger",
): number {
  const row = sheet.getRow(rowNum);
  row.height = 20;

  sheet.mergeCells(`B${rowNum}:C${rowNum}`);
  sheet.mergeCells(`D${rowNum}:E${rowNum}`);

  const codeCell = row.getCell(1);
  codeCell.value = code;
  codeCell.font = { name: "Calibri", size: 10, color: { argb: COLOR_MUTED } };
  codeCell.alignment = { vertical: "middle", horizontal: "center" };

  const lblCell = row.getCell(2);
  lblCell.value = label;
  lblCell.font = { name: "Calibri", size: 10, color: { argb: COLOR_DARK } };
  lblCell.alignment = { vertical: "middle", horizontal: "left" };

  const valCell = row.getCell(4);
  valCell.value = value ?? "—";
  valCell.font = {
    name: "Calibri",
    size: 10,
    bold: true,
    color: {
      argb:
        highlight === "success"
          ? COLOR_SUCCESS_FG
          : highlight === "warning"
            ? COLOR_WARNING_FG
            : highlight === "danger"
              ? COLOR_DANGER_FG
              : COLOR_DARK,
    },
  };
  valCell.alignment = {
    vertical: "middle",
    horizontal: typeof value === "number" ? "right" : "center",
  };
  if (typeof value === "number" && numFmt) {
    valCell.numFmt = numFmt;
  }
  if (highlight === "success") {
    valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_SUCCESS_BG } };
  } else if (highlight === "warning") {
    valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_WARNING_BG } };
  } else if (highlight === "danger") {
    valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DANGER_BG } };
  }

  const unitCell = row.getCell(6);
  unitCell.value = unit;
  unitCell.font = { name: "Calibri", size: 10, color: { argb: COLOR_MUTED } };
  unitCell.alignment = { vertical: "middle", horizontal: "left" };

  for (let col = 1; col <= 6; col++) {
    row.getCell(col).border = THIN_BORDER;
  }
  return rowNum + 1;
}

function writeRemarksBlock(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  label: string,
  text: string | null,
  hasPhoto: boolean,
): number {
  const row = sheet.getRow(rowNum);
  const content = text?.trim() || "—";
  const lines = Math.max(1, content.split(/\r?\n/).length, Math.ceil(content.length / 65));
  row.height = Math.max(22, Math.min(90, lines * 15 + 6));

  sheet.mergeCells(`A${rowNum}:B${rowNum}`);
  sheet.mergeCells(`C${rowNum}:E${rowNum}`);

  const lblCell = row.getCell(1);
  lblCell.value = label;
  lblCell.font = { name: "Calibri", size: 10, bold: true, italic: true, color: { argb: COLOR_PRIMARY } };
  lblCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
  lblCell.alignment = { vertical: "top", horizontal: "left", indent: 1 };

  const valCell = row.getCell(3);
  valCell.value = content;
  valCell.font = { name: "Calibri", size: 10, color: { argb: COLOR_DARK } };
  valCell.alignment = { vertical: "top", horizontal: "left", wrapText: true };

  const photoCell = row.getCell(6);
  photoCell.value = hasPhoto ? "Foto terlampir" : "Tanpa foto";
  photoCell.font = {
    name: "Calibri",
    size: 9.5,
    italic: true,
    color: { argb: hasPhoto ? COLOR_PRIMARY : COLOR_MUTED },
  };
  photoCell.alignment = { vertical: "top", horizontal: "center" };

  for (let col = 1; col <= 6; col++) {
    row.getCell(col).border = THIN_BORDER;
  }
  return rowNum + 1;
}

function populateSingleInspectionSheet(
  sheet: ExcelJS.Worksheet,
  report: ShiftReportDTO,
): void {
  sheet.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  [10, 26, 18, 18, 20, 24].forEach((width, idx) => {
    sheet.getColumn(idx + 1).width = width;
  });

  // Banner Header
  sheet.mergeCells("A1:F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `SHIFT REPORT — ${report.customer.toUpperCase()}`;
  titleCell.font = { name: "Calibri", size: 13, bold: true, color: { argb: COLOR_WHITE } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARY } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(1).height = 28;

  sheet.mergeCells("A2:F2");
  const subCell = sheet.getCell("A2");
  subCell.value = `Form 2020-06-01 / ML  |  Tanggal: ${formatDateIndo(report.reportDate)}  |  ${formatChipperLabel(report.chipperType)}  |  Shift ${report.shift}  |  ID: ${report.id}`;
  subCell.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: COLOR_MUTED } };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(2).height = 20;

  let r = 4;
  styleInspectionBanner(sheet, r++, "METADATA INSPEKSI", "FF334155");
  r = writeSplitMetadataRow(sheet, r, "Customer", report.customer, "Date", formatDateIndo(report.reportDate));
  r = writeSplitMetadataRow(sheet, r, "Inspection By", report.inspectionBy, "Shift", report.shift);
  r = writeSplitMetadataRow(sheet, r, "Chipper Type", formatChipperLabel(report.chipperType), "Sampling Time", report.samplingTime);
  r = writeSplitMetadataRow(sheet, r, "Type of Knife System", report.typeOfKnifeSystem, "Chip Length Set Up (mm)", report.chipLengthSetUp, undefined, "0.00");
  r = writeSplitMetadataRow(sheet, r, "Type of Inspection", report.typeOfInspection, "Adjust Chip Length From (mm)", report.adjustChipLengthFrom, undefined, "0.00");
  r = writeSplitMetadataRow(sheet, r, "Start Chipper", report.startChipperTime, "Adjust Chip Length To (mm)", report.adjustChipLengthTo, undefined, "0.00");
  r = writeSplitMetadataRow(sheet, r, "Stop Chipper", report.stopChipperTime, "Dibuat Pada (WIB)", formatDateTimeJakarta(report.createdAt));

  r += 1;
  styleInspectionBanner(sheet, r++, "1. CHIP QUALITY & DATA SOURCE / SAMPLING", "FF0369A1");
  for (const metric of CHIP_QUALITY_METRICS) {
    r = writeSectionTableRow(sheet, r, metric.code, metric.label, report[metric.key], "%", "0.00");
  }
  r = writeSectionTableRow(sheet, r, "—", "Total Accept", report.totalAccept, "%", "0.00", "success");
  r = writeSectionTableRow(sheet, r, "—", "P+F (1.5 + 1.6)", report.pinPlusFines, "%", "0.00");
  r = writeSectionTableRow(sheet, r, "2.1", "Data Source: Chip Classifier", formatYesNo(report.dataSourceChipClassifier) || "—");
  r = writeSectionTableRow(sheet, r, "3.1", "Sampling is Done by: Costumer", formatYesNo(report.samplingDoneByCostumer) || "—");
  r = writeRemarksBlock(sheet, r, "Remarks (Chip Quality)", report.chipQualityRemarks, Boolean(report.chipQualityRemarksPhotoUrl));

  r += 1;
  styleInspectionBanner(sheet, r++, "2. OPERATIONAL CONDITION", "FF334155");
  r = writeSectionTableRow(sheet, r, "2.1", "Layer (Visual Observation)", formatLayerLabel(report.layerObservation) || "—");
  r = writeSectionTableRow(sheet, r, "2.2.1", "Log Condition: Dry", formatYesNo(report.logConditionDry));
  r = writeSectionTableRow(sheet, r, "2.2.2", "Log Condition: Fresh", formatYesNo(report.logConditionFresh));
  r = writeSectionTableRow(sheet, r, "2.2.3", "Lots Of Bark", formatYesNo(report.lotsOfBark) || "—");
  r = writeSectionTableRow(sheet, r, "2.2.4", "Lots Of Sand", formatYesNo(report.lotsOfSand) || "—");
  r = writeSectionTableRow(sheet, r, "2.2.5", "There is a Stone", formatYesNo(report.thereIsAStone) || "—");

  const opPhotos = [
    { label: "Foto Operasional 1", url: report.operationalPhotoUrl, caption: report.operationalPhotoCaption },
    { label: "Foto Operasional 2", url: report.operationalPhotoUrl2, caption: report.operationalPhotoCaption2 },
    { label: "Foto Operasional 3", url: report.operationalPhotoUrl3, caption: report.operationalPhotoCaption3 },
    { label: "Foto Operasional 4", url: report.operationalPhotoUrl4, caption: report.operationalPhotoCaption4 },
  ];
  opPhotos.forEach((slot, idx) => {
    r = writeSectionTableRow(
      sheet,
      r,
      `Foto ${idx + 1}`,
      slot.label,
      slot.url ? "Terlampir" : "Tidak ada",
      slot.caption?.trim() || "",
    );
  });

  r += 1;
  styleInspectionBanner(sheet, r++, "3.1 CHIPPER GEOMETRY", "FF1E40AF");
  r = writeSectionTableRow(
    sheet,
    r,
    "3.1.1",
    "T Dimension",
    report.tDimensionMm,
    report.tDimensionLastSettingDate
      ? `mm  (Last Setting: ${formatDateIndo(report.tDimensionLastSettingDate)})`
      : "mm",
    "0.00",
  );
  r = writeSectionTableRow(
    sheet,
    r,
    "3.2.2",
    "Clearance Anvil",
    report.clearanceAnvilMm,
    report.clearanceAnvilLastSettingDate
      ? `mm  (Last Setting: ${formatDateIndo(report.clearanceAnvilLastSettingDate)})`
      : "mm",
    "0.00",
  );
  r = writeRemarksBlock(sheet, r, "Remarks (Geometry)", report.geometryRemarks, Boolean(report.geometryRemarksPhotoUrl));

  r += 1;
  styleInspectionBanner(sheet, r++, "3.2 CHIPPER PART CONDITION", "FF92400E");
  for (const part of CHIPPER_PARTS) {
    const cond = report[part.key];
    const highlight =
      cond === "WORN_OUT"
        ? "warning"
        : cond === "BROKEN"
          ? "danger"
          : undefined;
    r = writeSectionTableRow(
      sheet,
      r,
      part.code,
      part.label,
      formatPartConditionLabel(cond) || "—",
      "",
      undefined,
      highlight,
    );
  }
  r = writeRemarksBlock(sheet, r, "Remarks Part 1", report.partRemarks, Boolean(report.partRemarksPhotoUrl));
  r = writeRemarksBlock(sheet, r, "Remarks Part 2", report.partRemarks2, Boolean(report.partRemarks2PhotoUrl));

  r += 1;
  styleInspectionBanner(sheet, r++, "4. RAW MATERIAL CONDITION", "FF166534");
  r = writeSectionTableRow(sheet, r, "4.1", "Log Yard Number", report.logYardNumber ?? "—");
  r = writeSectionTableRow(sheet, r, "4.2", "Log Age", report.logAgeYears, "Years", "0.0");
  r = writeSectionTableRow(sheet, r, "4.3", "Log Aging In Storage", report.logAgingMonths, "Months", "0.0");
  r = writeSectionTableRow(sheet, r, "4.4", "Avg. Log Diameter", report.avgLogDiameterCm, "cm", "0.0");
  r = writeSectionTableRow(sheet, r, "4.5", "Log Moisture", report.logMoisturePct, "%", "0.00");

  const diameterPairs = [
    { idx: 1, pct: report.diameterPct1, cm: report.diameterMm1 },
    { idx: 2, pct: report.diameterPct2, cm: report.diameterMm2 },
    { idx: 3, pct: report.diameterPct3, cm: report.diameterMm3 },
  ];
  for (const pair of diameterPairs) {
    r = writeSectionTableRow(
      sheet,
      r,
      `4.6.${pair.idx}`,
      `Percentage Log Diameter (Pair ${pair.idx})`,
      pair.pct,
      pair.cm !== null ? `%  /  ${pair.cm} cm` : "%",
      "0.0",
    );
  }
  writeRemarksBlock(sheet, r, "Remarks (Raw Material)", report.rawMaterialRemarks, Boolean(report.rawMaterialRemarksPhotoUrl));
}

function createBaseWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Shift Report QC — PT Tanjung Enim Lestari";
  workbook.created = new Date();
  return workbook;
}

function formatExportTimestampJakarta(): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

/** Generates a multi-row `.xlsx` recap workbook for filtered Shift Reports. */
export async function generateShiftReportsBulkExcel(
  reports: ShiftReportDTO[],
  filterDescription?: string,
): Promise<Buffer> {
  const workbook = createBaseWorkbook();
  const sheet = workbook.addWorksheet("Rekap Shift Report");

  const filterText = filterDescription?.trim() || "Semua Data";
  const subtitle = `Filter: ${filterText}  |  Total Laporan: ${reports.length}  |  Diekspor: ${formatExportTimestampJakarta()} WIB`;
  populateTabularSheet(sheet, reports, subtitle);

  const rawBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(rawBuffer);
}

/** Generates a 2-sheet `.xlsx` workbook for one specific Shift Report (printable sheet + tabular row). */
export async function generateShiftReportSingleExcel(
  report: ShiftReportDTO,
): Promise<Buffer> {
  const workbook = createBaseWorkbook();

  const inspectionSheet = workbook.addWorksheet("Shift Report");
  populateSingleInspectionSheet(inspectionSheet, report);

  const tableSheet = workbook.addWorksheet("Data Tabel");
  const subtitle = `Laporan Tunggal: ${formatDateIndo(report.reportDate)} | ${formatChipperLabel(report.chipperType)} | Shift ${report.shift} | Diekspor: ${formatExportTimestampJakarta()} WIB`;
  populateTabularSheet(tableSheet, [report], subtitle);

  const rawBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(rawBuffer);
}

