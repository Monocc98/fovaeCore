import { AxiosError } from "axios";
import type { AppError, AppErrorKind, AppFieldErrors, BackendErrorEnvelope } from "@/types";

const fallbackMessageByCode: Record<string, string> = {
  NETWORK_ERROR: "No se pudo conectar con el servidor.",
  INTERNAL_ERROR: "Ocurrio un error interno. Intenta de nuevo.",
  DEPENDENCY_UNAVAILABLE: "El servicio no esta disponible temporalmente.",
  TIMEOUT: "La solicitud tardo demasiado. Intenta de nuevo.",
  FORBIDDEN: "No tienes permisos para realizar esta accion.",
  UNAUTHORIZED: "Tu sesion ya no es valida.",
  SESSION_EXPIRED: "Tu sesion expiro. Vuelve a iniciar sesion.",
  VALIDATION_ERROR: "Revisa la informacion capturada.",
};

const normalizeFieldErrors = (fieldErrors: unknown): AppFieldErrors => {
  if (!fieldErrors || typeof fieldErrors !== "object") return {};

  return Object.entries(fieldErrors as Record<string, unknown>).reduce<AppFieldErrors>(
    (acc, [key, value]) => {
      if (typeof value === "string" && value.trim()) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );
};

const resolveKind = (code: string, status?: number): AppErrorKind => {
  if (status === 401 || code === "UNAUTHORIZED" || code === "SESSION_EXPIRED") return "auth";
  if (status === 403 || code === "FORBIDDEN") return "forbidden";
  if (status === 400 || code === "VALIDATION_ERROR") return "validation";
  if (status === 409 || code.includes("CONFLICT") || code.includes("DUPLICATE")) return "conflict";
  if (status === 502 || status === 503 || status === 504 || status === 500) return "server";
  if (status && status >= 400 && status < 500) return "business";
  return "unknown";
};

export const createAppError = (input: {
  code: string;
  kind: AppErrorKind;
  status?: number;
  userMessage?: string;
  fieldErrors?: AppFieldErrors;
  retryable?: boolean;
  requestId?: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}): AppError => {
  const message =
    input.userMessage?.trim() ||
    fallbackMessageByCode[input.code] ||
    "Ocurrio un error inesperado.";

  const error = new Error(message) as AppError;
  error.name = "AppError";
  error.kind = input.kind;
  error.code = input.code;
  error.status = input.status;
  error.userMessage = message;
  error.fieldErrors = input.fieldErrors ?? {};
  error.retryable = Boolean(input.retryable);
  error.requestId = input.requestId;
  error.details = input.details ?? {};
  error.cause = input.cause;
  return error;
};

export const parseAxiosError = (error: unknown): AppError => {
  if (isAppError(error)) return error;

  if (!(error instanceof AxiosError)) {
    return createAppError({
      code: "UNKNOWN_ERROR",
      kind: "unknown",
      userMessage: error instanceof Error ? error.message : "Ocurrio un error inesperado.",
      cause: error,
    });
  }

  if (!error.response) {
    return createAppError({
      code: "NETWORK_ERROR",
      kind: "network",
      retryable: true,
      cause: error,
    });
  }

  const status = error.response.status;
  const payload = error.response.data as
    | { error?: BackendErrorEnvelope; requestId?: string; message?: string }
    | undefined;
  const envelope = payload?.error;

  let code = envelope?.code?.trim() || "UNKNOWN_ERROR";
  if (status === 500) code = "INTERNAL_ERROR";
  if (status === 502 || status === 503) code = "DEPENDENCY_UNAVAILABLE";
  if (status === 504) code = "TIMEOUT";

  const userMessage =
    envelope?.userMessage?.trim() ||
    envelope?.message?.trim() ||
    payload?.message?.trim() ||
    error.message;

  return createAppError({
    code,
    kind: resolveKind(code, status),
    status: envelope?.status ?? status,
    userMessage,
    fieldErrors: normalizeFieldErrors(envelope?.fieldErrors),
    retryable:
      typeof envelope?.retryable === "boolean"
        ? envelope.retryable
        : status === 502 || status === 503 || status === 504,
    requestId: payload?.requestId,
    details:
      envelope?.details && typeof envelope.details === "object"
        ? (envelope.details as Record<string, unknown>)
        : {},
    cause: error,
  });
};

export const isAppError = (error: unknown): error is AppError =>
  Boolean(error) &&
  typeof error === "object" &&
  (error as AppError).name === "AppError" &&
  typeof (error as AppError).code === "string";

export const getErrorMessage = (error: unknown, fallback = "Ocurrio un error inesperado.") =>
  isAppError(error)
    ? error.userMessage || fallback
    : error instanceof Error && error.message
      ? error.message
      : fallback;

export const getFieldErrors = (error: unknown): AppFieldErrors =>
  isAppError(error) ? error.fieldErrors ?? {} : {};

export const isRetryableError = (error: unknown): boolean =>
  isAppError(error) ? Boolean(error.retryable) : false;

export const isAuthError = (error: unknown): boolean =>
  isAppError(error) && error.kind === "auth";

export const isForbiddenError = (error: unknown): boolean =>
  isAppError(error) && error.kind === "forbidden";

export const getRequestId = (error: unknown): string | undefined =>
  isAppError(error) ? error.requestId : undefined;
