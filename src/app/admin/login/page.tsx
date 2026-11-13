import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { getCurrentAdmin } from "@/modules/auth/auth.service";

function sanitizeNextPath(rawNext: unknown): string {
  if (
    typeof rawNext === "string" &&
    rawNext.startsWith("/admin") &&
    !rawNext.startsWith("//") &&
    !rawNext.startsWith("/admin/login")
  ) {
    return rawNext;
  }
  return "/admin";
}

function LoginSkeleton() {
  return (
    <div
      className="w-full max-w-md rounded-lg border border-border bg-surface p-6 sm:p-8 shadow-sm animate-pulse"
      aria-busy="true"
    >
      <div className="h-12 w-3/4 rounded bg-surface-muted mb-6" />
      <div className="space-y-4">
        <div className="h-10 rounded bg-surface-muted" />
        <div className="h-10 rounded bg-surface-muted" />
        <div className="h-11 rounded bg-surface-muted" />
      </div>
    </div>
  );
}

async function AdminLoginContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin");
  }

  const resolvedParams = await searchParams;
  const nextPath = sanitizeNextPath(resolvedParams.next);

  return <AdminLoginForm nextPath={nextPath} />;
}

export default function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Suspense fallback={<LoginSkeleton />}>
        <AdminLoginContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

