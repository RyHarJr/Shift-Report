import { NextRequest, connection } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { requireAdmin } from "@/modules/auth/auth.service";
import { CHIPPER_LABEL_MAP, type ChipperTypeValue } from "@/modules/shift-reports/shift-report.constants";
import { toShiftReportDTO } from "@/modules/shift-reports/shift-report.mapper";
import { shiftReportService } from "@/modules/shift-reports/shift-report.service";
import { generateShiftReportsBulkExcel } from "@/modules/shift-reports/shift-report-excel.service";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function buildFilterSummary(params: Record<string, string>): string {
  const parts: string[] = [];
  if (params.chipperType && params.chipperType !== "ALL") {
    const label =
      CHIPPER_LABEL_MAP[params.chipperType as ChipperTypeValue] ??
      params.chipperType;
    parts.push(`Chipper ${label}`);
  }
  if (params.shift && params.shift !== "ALL") {
    parts.push(`Shift ${params.shift}`);
  }
  if (params.dateFrom || params.dateTo) {
    parts.push(`Tanggal ${params.dateFrom || "..."} s.d. ${params.dateTo || "..."}`);
  }
  if (params.search?.trim()) {
    parts.push(`Pencarian "${params.search.trim()}"`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Semua Data";
}

function buildBulkFilename(params: Record<string, string>): string {
  const todayJakarta = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const segments = ["Shift-Report_Rekap", todayJakarta];
  if (params.chipperType && params.chipperType !== "ALL") {
    segments.push(params.chipperType.replace(/[^A-Za-z0-9_-]/g, ""));
  }
  if (params.shift && params.shift !== "ALL") {
    segments.push(`Shift-${params.shift.replace(/[^A-Za-z0-9_-]/g, "")}`);
  }
  return `${segments.join("_")}.xlsx`;
}

export async function GET(request: NextRequest) {
  await connection();
  try {
    await requireAdmin();
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );

    const reports = await shiftReportService.getExportReports(searchParams);
    const dtos = reports.map(toShiftReportDTO);
    const excelBuffer = await generateShiftReportsBulkExcel(
      dtos,
      buildFilterSummary(searchParams),
    );
    const filename = buildBulkFilename(searchParams);

    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": XLSX_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

