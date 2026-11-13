import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/shared/AppHeader";
import { ShiftReportPrintView } from "@/components/shift-report/ShiftReportPrintView";
import { NotFoundError } from "@/lib/errors";
import { getCurrentAdmin } from "@/modules/auth/auth.service";
import { toShiftReportDTO } from "@/modules/shift-reports/shift-report.mapper";
import { shiftReportService } from "@/modules/shift-reports/shift-report.service";

function DetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeRoute="admin" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 animate-pulse" aria-busy="true">
          <div className="h-14 rounded-lg border border-border bg-surface" />
          <div className="h-[520px] rounded-lg border border-border bg-surface" />
        </div>
      </main>
    </div>
  );
}

async function ReportDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const { id } = await params;

  let reportDto;
  try {
    const report = await shiftReportService.getReportById(id);
    reportDto = toShiftReportDTO(report);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeRoute="admin" adminName={admin.name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <ShiftReportPrintView report={reportDto} />
      </main>
    </div>
  );
}

export default function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ReportDetailContent params={params} />
    </Suspense>
  );
}
