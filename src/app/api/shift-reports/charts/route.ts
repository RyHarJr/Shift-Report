import { NextRequest, connection } from "next/server";
import { handleApiError, okResponse } from "@/lib/api-response";
import { requireAdmin } from "@/modules/auth/auth.service";
import { shiftReportService } from "@/modules/shift-reports/shift-report.service";

export async function GET(request: NextRequest) {
  await connection();
  try {
    await requireAdmin();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const points = await shiftReportService.getChartData(searchParams);
    return okResponse(points);
  } catch (error) {
    return handleApiError(error);
  }
}

