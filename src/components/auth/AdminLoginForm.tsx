"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, LogIn } from "lucide-react";
import { BrandMark } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AdminLoginFormProps {
  nextPath: string;
}

interface LoginApiResponse {
  success: boolean;
  error?: {
    message?: string;
    details?: Record<string, string[]>;
  };
}

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      nextErrors.username = "Username wajib diisi.";
    }
    if (!password) {
      nextErrors.password = "Password wajib diisi.";
    }
    if (nextErrors.username || nextErrors.password) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const payload = (await response.json()) as LoginApiResponse;

      if (!response.ok || !payload.success) {
        const details = payload.error?.details;
        if (details) {
          setFieldErrors({
            username: details.username?.[0],
            password: details.password?.[0],
          });
        }
        setFormError(
          payload.error?.message || "Username atau password tidak sesuai.",
        );
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setFormError(
        "Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 sm:p-8 shadow-sm">
      <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
        <BrandMark />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            PT Tanjung Enim Lestari
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Login Admin Shift Report
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Akses manajemen laporan, cetak lembar QC, dan analitik chipper.
          </p>
        </div>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded border border-danger/30 bg-danger-bg px-3.5 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="admin-username"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Username
          </label>
          <Input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fieldErrors.username}
            disabled={submitting}
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="admin-password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Masukkan password admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              disabled={submitting}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
              className="absolute right-2.5 top-2.5 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          loading={submitting}
          size="lg"
          className="w-full mt-2"
        >
          <LogIn className="size-4" aria-hidden="true" />
          <span>Masuk ke Dashboard Admin</span>
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3.5" aria-hidden="true" />
          <span>Sesi terenkripsi HttpOnly</span>
        </span>
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Form Input</span>
        </Link>
      </div>
    </div>
  );
}

