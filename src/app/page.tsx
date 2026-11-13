import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader } from "@/components/shared/AppHeader";
import { ShiftReportForm } from "@/components/shift-report/ShiftReportForm";

function FormSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Memuat formulir Shift Report"
    >
      <div className="h-[520px] rounded border border-border bg-surface p-6">
        <div className="h-6 w-48 rounded bg-surface-muted mb-6" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-10 rounded bg-surface-muted" />
          <div className="h-10 rounded bg-surface-muted" />
          <div className="h-10 rounded bg-surface-muted" />
          <div className="h-10 rounded bg-surface-muted" />
        </div>
        <div className="mt-6 h-64 rounded bg-surface-muted" />
      </div>
      <div className="h-[360px] rounded border border-border bg-surface p-6">
        <div className="h-6 w-56 rounded bg-surface-muted mb-4" />
        <div className="h-56 rounded bg-surface-muted" />
      </div>
    </div>
  );
}

async function ShiftReportFormContainer() {
  await connection();
  const todayJakarta = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  return <ShiftReportForm mode="create" defaultDate={todayJakarta} />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeRoute="form" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Input Shift Report Inspeksi Chip
            </h1>
            <p className="text-sm text-muted-foreground">
              Formulir digital 2 halaman sesuai lembar resmi PT Tanjung Enim
              Lestari.
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            Form 2020-06-01 / ML
          </p>
        </div>

        <Suspense fallback={<FormSkeleton />}>
          <ShiftReportFormContainer />
        </Suspense>
      </main>
    </div>
  );
}
