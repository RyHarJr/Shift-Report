import { AppHeader } from "@/components/shared/AppHeader";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeRoute="form" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-72 rounded bg-surface-muted" />
            <div className="h-4 w-96 max-w-full rounded bg-surface-muted" />
          </div>
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
        </div>
      </main>
    </div>
  );
}

