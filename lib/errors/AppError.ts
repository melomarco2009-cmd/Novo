export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  | "BAD_REQUEST"
  | "RATE_LIMIT"
  | "SERVICE_UNAVAILABLE";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = "INTERNAL_SERVER_ERROR",
    statusCode = 500,
    isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static unauthorized(message = "Não autorizado") {
    return new AppError(message, "UNAUTHORIZED", 401);
  }

  static forbidden(message = "Acesso negado") {
    return new AppError(message, "FORBIDDEN", 403);
  }

  static notFound(message = "Recurso não encontrado") {
    return new AppError(message, "NOT_FOUND", 404);
  }

  static badRequest(message: string) {
    return new AppError(message, "BAD_REQUEST", 400);
  }

  static conflict(message: string) {
    return new AppError(message, "CONFLICT", 409);
  }

  static validation(message: string) {
    return new AppError(message, "VALIDATION_ERROR", 422);
  }

  static internal(message = "Erro interno do servidor") {
    return new AppError(message, "INTERNAL_SERVER_ERROR", 500, false);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toHttpError(error: unknown): { message: string; code: string; statusCode: number } {
  if (isAppError(error)) {
    return { message: error.message, code: error.code, statusCode: error.statusCode };
  }
  return { message: "Erro interno do servidor", code: "INTERNAL_SERVER_ERROR", statusCode: 500 };
}
