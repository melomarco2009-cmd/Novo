export const APP_NAME = "MyFuckingLife";
export const APP_DESCRIPTION = "Sistema de gestão de vida pessoal e profissional";
export const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// Upload
export const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10);
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

// Auth
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
export const PASSWORD_RESET_EXPIRY_HOURS = 2;
export const EMAIL_VERIFY_EXPIRY_HOURS = 24;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Dates
export const DATE_FORMAT = "dd/MM/yyyy";
export const DATETIME_FORMAT = "dd/MM/yyyy HH:mm";
export const MONTH_FORMAT = "MMMM yyyy";

// Currency
export const CURRENCY_LOCALE = "pt-BR";
export const CURRENCY_CODE = "BRL";
