import { NextRequest, connection } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { requireAdmin } from "@/modules/auth/auth.service";
import { toShiftReportDTO } from "@/modules/shift-reports/shift-report.mapper";
import { generateShiftReportPdf } from "@/modules/shift-reports/shift-report-pdf.service";
import { shiftReportService } from "@/modules/shift-reports/shift-report.service";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/shift-reports/[id]/pdf">,
) {
  await connection();
  try {
    await requireAdmin();
    const { id } = await context.params;

    const report = await shiftReportService.getReportById(id);
    const dto = toShiftReportDTO(report);
    const pdfBuffer = await generateShiftReportPdf(dto);

    const safeChipper = dto.chipperType.replace(/[^A-Za-z0-9_-]/g, "");
    const safeShift = dto.shift.replace(/[^A-Za-z0-9_-]/g, "");
    const filename = `Shift-Report_${dto.reportDate}_${safeChipper}_Shift-${safeShift}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

