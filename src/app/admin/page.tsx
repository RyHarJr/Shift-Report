import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/shared/AppHeader";
import { AdminDashboardClient } from "@/components/shift-report/AdminDashboardClient";
import { getCurrentAdmin } from "@/modules/auth/auth.service";
import {
  toShiftReportChartDTO,
  toShiftReportListDTO,
} from "@/modules/shift-reports/shift-report.mapper";
import { shiftReportService } from "@/modules/shift-reports/shift-report.service";

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeRoute="admin" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 animate-pulse" aria-busy="true">
          <div className="h-44 rounded-lg border border-border bg-surface p-5" />
          <div className="h-96 rounded-lg border border-border bg-surface p-5" />
          <div className="h-80 rounded-lg border border-border bg-surface p-5" />
        </div>
      </main>
    </div>
  );
}

async function AdminDashboardContent() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const [listResult, chartSeries] = await Promise.all([
    shiftReportService.listReports({ page: 1, limit: 10 }),
    shiftReportService.getChartData({}),
  ]);

  const initialItems = listResult.items.map(toShiftReportListDTO);
  const initialChartPoints = chartSeries.map(toShiftReportChartDTO);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeRoute="admin" adminName={admin.name} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <AdminDashboardClient
          initialItems={initialItems}
          initialMeta={listResult.meta}
          initialChartPoints={initialChartPoints}
        />
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
