import { NextRequest, connection } from "next/server";
import { handleApiError, okResponse } from "@/lib/api-response";
import { requireAdmin } from "@/modules/auth/auth.service";
import { shiftReportService } from "@/modules/shift-reports/shift-report.service";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/shift-reports/[id]">,
) {
  await connection();
  try {
    await requireAdmin();
    const { id } = await context.params;
    const report = await shiftReportService.getReportById(id);
    return okResponse(report);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/shift-reports/[id]">,
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body: unknown = await request.json();
    const updated = await shiftReportService.updateReport(id, body);
    return okResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/shift-reports/[id]">,
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await shiftReportService.deleteReport(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

