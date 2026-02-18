import axios from "axios";
import type { CsrfPayload } from "@/types";
import type { AxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;
const DEFAULT_CSRF_HEADER = "x-csrf-token";
const CSRF_HEADER_FALLBACK =
  import.meta.env.VITE_CSRF_HEADER_NAME ?? DEFAULT_CSRF_HEADER;
const CSRF_COOKIE_FALLBACK =
  import.meta.env.VITE_CSRF_COOKIE_NAME ?? "csrf";
const MUTABLE_METHODS = new Set(["post", "put", "patch", "delete"]);
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/renew", "/auth/logout"];

const csrfState = {
  headerName: CSRF_HEADER_FALLBACK,
  token: "",
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
};

export const clearCsrfState = (): void => {
  csrfState.token = "";
  csrfState.headerName = CSRF_HEADER_FALLBACK;
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
    const status = error?.response?.status;
    const request = error?.config as RetriableRequestConfig | undefined;
    const requestUrl = request?.url;
    const isAuthRequest = isAuthRoute(requestUrl);

    if (status === 401 && request && !request._retry && !isAuthRequest) {
      request._retry = true;

      try {
        if (!renewInFlight) {
          renewInFlight = renewSession().finally(() => {
            renewInFlight = null;
          });
        }

        await renewInFlight;
        return fovaeCoreApi(request);
      } catch (renewError: any) {
        clearCsrfState();
        dispatchUnauthorized(renewError?.response?.data?.error ?? null);
        return Promise.reject(renewError);
      }
    }

    if (status === 401 || status === 403) {
      clearCsrfState();
      dispatchUnauthorized(error?.response?.data?.error ?? null);
    }

    return Promise.reject(error);
  }
);
