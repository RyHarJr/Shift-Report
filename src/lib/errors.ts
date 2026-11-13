export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode = 400,
    code = "BAD_REQUEST",
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sesi admin tidak valid atau sudah kedaluwarsa.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Data shift report tidak ditemukan.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Data yang dikirim tidak valid. Periksa kembali field yang ditandai.",
    details?: Record<string, string[]>,
  ) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Terlalu banyak percobaan. Silakan tunggu sebentar.") {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

