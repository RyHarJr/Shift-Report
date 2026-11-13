import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export interface ApiSuccessResponse<T, M = undefined> {
  success: true;
  data: T;
  meta?: M;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export function okResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    { success: true, data },
    { status },
  );
}

export function paginatedResponse<T, M>(data: T, meta: M, status = 200) {
  return NextResponse.json<ApiSuccessResponse<T, M>>(
    { success: true, data, meta },
    { status },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".") || "_root";
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input tidak valid. Periksa kembali field yang ditandai.",
          details: fieldErrors,
        },
      },
      { status: 422 },
    );
  }

  console.error("[API_ERROR]", error);
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Terjadi kesalahan pada server. Silakan coba lagi.",
      },
    },
    { status: 500 },
  );
}

