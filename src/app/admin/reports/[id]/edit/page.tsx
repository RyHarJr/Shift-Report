import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/shared/AppHeader";
import { ShiftReportForm } from "@/components/shift-report/ShiftReportForm";
import { Button } from "@/components/ui/Button";
import { NotFoundError } from "@/lib/errors";
import { getCurrentAdmin } from "@/modules/auth/auth.service";
import { toShiftReportDTO } from "@/modules/shift-reports/shift-report.mapper";
import { shiftReportService } from "@/modules/shift-reports/shift-report.service";

function EditSkeleton() {
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

async function EditReportContent({
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Edit Shift Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Perbarui data inspeksi tanggal {reportDto.reportDate} &middot;
              Shift {reportDto.shift}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/reports/${reportDto.id}`}>
              <Button variant="outline" size="sm">
                Lihat / Cetak
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>

        <ShiftReportForm
          mode="edit"
          initialData={reportDto}
          defaultDate={reportDto.reportDate}
        />
      </main>
    </div>
  );
}

export default function AdminEditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditReportContent params={params} />
    </Suspense>
  );
}
