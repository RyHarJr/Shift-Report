import { AppHeader } from "@/components/shared/AppHeader";

export default function AdminLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeRoute="admin" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-44 rounded-lg border border-border bg-surface p-5" />
          <div className="h-96 rounded-lg border border-border bg-surface p-5" />
          <div className="h-80 rounded-lg border border-border bg-surface p-5" />
        </div>
      </main>
    </div>
  );
}

