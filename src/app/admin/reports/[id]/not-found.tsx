import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/Button";

export default function ReportNotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeRoute="admin" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
            <FileSearch className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Laporan Tidak Ditemukan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Data Shift Report yang Anda cari mungkin sudah dihapus atau ID tidak
            valid.
          </p>
          <div className="mt-5 flex justify-center">
            <Link href="/admin">
              <Button>
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>Kembali ke Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

