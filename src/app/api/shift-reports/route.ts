import { NextRequest, connection } from "next/server";
import {
  handleApiError,
  okResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { requireAdmin } from "@/modules/auth/auth.service";
import { shiftReportService } from "@/modules/shift-reports/shift-report.service";

export async function GET(request: NextRequest) {
  await connection();
  try {
    await requireAdmin();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const result = await shiftReportService.listReports(searchParams);
    return paginatedResponse(result.items, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const created = await shiftReportService.createReport(body);
    return okResponse(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

