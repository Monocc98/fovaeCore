import axios from "axios";
import type { CsrfPayload } from "@/types";
import type { AxiosRequestConfig } from "axios";
import { isAppError, parseAxiosError } from "@/helpers";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://fovaecoreapi-production.up.railway.app/api";
console.log("DEBUG API BASE URL:", BASE_URL);
const DEFAULT_CSRF_HEADER = "x-csrf-token";
const CSRF_HEADER_FALLBACK =
  import.meta.env.VITE_CSRF_HEADER_NAME ?? DEFAULT_CSRF_HEADER;
const CSRF_COOKIE_FALLBACK =
  import.meta.env.VITE_CSRF_COOKIE_NAME ?? "csrf";
const MUTABLE_METHODS = new Set(["post", "put", "patch", "delete"]);
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/renew", "/auth/logout"];
const CSRF_STORAGE_KEY = "fovae:csrf";

const csrfState = {
  headerName: CSRF_HEADER_FALLBACK,
  token: "",
};

const readPersistedCsrf = (): Partial<CsrfPayload> | null => {
  try {
    const raw = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CsrfPayload>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const persistCsrf = (headerName: string, token: string): void => {
  try {
    sessionStorage.setItem(CSRF_STORAGE_KEY, JSON.stringify({ headerName, token }));
  } catch {
    // ignore storage failures (private mode/quota)
  }
};

const clearPersistedCsrf = (): void => {
  try {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
};

type RetriableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

const readCookie = (cookieName: string): string => {
  const cookieMatch = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${cookieName}=`));

  return cookieMatch ? decodeURIComponent(cookieMatch.split("=")[1]) : "";
};

const resolveCsrfToken = (): string => {
  if (csrfState.token) return csrfState.token;

  const persisted = readPersistedCsrf();
  if (persisted?.token) {
    csrfState.token = persisted.token;
    csrfState.headerName = persisted.headerName || csrfState.headerName;
    return csrfState.token;
  }

  const configuredToken = readCookie(CSRF_COOKIE_FALLBACK);
  if (configuredToken) return configuredToken;

  const commonCookieNames = ["csrf", "csrfToken", "XSRF-TOKEN", "_csrf"];
  for (const cookieName of commonCookieNames) {
    const token = readCookie(cookieName);
    if (token) return token;
  }

  return "";
};

export const applyCsrfFromAuth = (csrf?: CsrfPayload): void => {
  if (!csrf) return;
  csrfState.headerName = csrf.headerName || CSRF_HEADER_FALLBACK;
  csrfState.token = csrf.token || "";
  if (csrfState.token) persistCsrf(csrfState.headerName, csrfState.token);
};

export const clearCsrfState = (): void => {
  csrfState.token = "";
  csrfState.headerName = CSRF_HEADER_FALLBACK;
  clearPersistedCsrf();
};

const addCsrfHeader = <T extends AxiosRequestConfig>(config: T): T => {
  const csrfToken = resolveCsrfToken();
  if (!csrfToken) return config;

  const headers = (config.headers ?? {}) as Record<string, string>;
  headers[csrfState.headerName] = csrfToken;
  config.headers = headers;
  return config;
};

const isAuthRoute = (url?: string): boolean => {
  if (!url) return false;
  return AUTH_ROUTES.some((route) => url.includes(route));
};

const dispatchUnauthorized = (payload: unknown): void => {
  window.dispatchEvent(
    new CustomEvent("fovae:auth-unauthorized", {
      detail: payload ?? null,
    })
  );
};

export const fovaeCoreApi = axios.create({
  baseURL: `${BASE_URL}`,
  withCredentials: true,
});

let renewInFlight: Promise<void> | null = null;

const renewSession = async (): Promise<void> => {
  const config = addCsrfHeader({
    withCredentials: true,
  });

  const { data } = await axios.post(`${BASE_URL}/auth/renew`, undefined, config);
  applyCsrfFromAuth(data?.csrf);
};

fovaeCoreApi.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  if (!method || !MUTABLE_METHODS.has(method)) return config;

  return addCsrfHeader(config);
});

fovaeCoreApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const appError = parseAxiosError(error);
    const status = appError.status;
    const request = error?.config as RetriableRequestConfig | undefined;
    const requestUrl = request?.url;
    const isAuthRequest = isAuthRoute(requestUrl);

    if (
      status === 401 &&
      request &&
      !request._retry &&
      !isAuthRequest &&
      (appError.code === "UNAUTHORIZED" || appError.code === "SESSION_EXPIRED")
    ) {
      request._retry = true;

      try {
        if (!renewInFlight) {
          renewInFlight = renewSession().finally(() => {
            renewInFlight = null;
          });
        }

        await renewInFlight;
        return fovaeCoreApi(request);
      } catch (renewError) {
        const normalizedRenewError = parseAxiosError(renewError);
        clearCsrfState();
        dispatchUnauthorized(normalizedRenewError);
        return Promise.reject(normalizedRenewError);
      }
    }

    if (status === 401) {
      clearCsrfState();
      dispatchUnauthorized(appError);
    }

    return Promise.reject(isAppError(error) ? error : appError);
  }
);
