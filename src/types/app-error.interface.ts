export type AppErrorKind =
  | "auth"
  | "forbidden"
  | "validation"
  | "conflict"
  | "business"
  | "network"
  | "server"
  | "unknown";

export type AppFieldErrors = Record<string, string>;

export interface BackendErrorEnvelope {
  code?: string;
  message?: string;
  userMessage?: string;
  retryable?: boolean;
  fieldErrors?: Record<string, unknown>;
  details?: Record<string, unknown>;
  status?: number;
}

export interface AppError extends Error {
  name: "AppError";
  kind: AppErrorKind;
  code: string;
  status?: number;
  userMessage: string;
  fieldErrors: AppFieldErrors;
  retryable: boolean;
  requestId?: string;
  details: Record<string, unknown>;
  cause?: unknown;
}
