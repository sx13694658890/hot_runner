/**
 * API 基址解析：
 * - 未配置 VITE_API_BASE_URL：使用相对路径 `/api/v1`，由 Vite dev server 代理到后端（避免打到前端自身 404）。
 * - 已配置：请求直连该源；若误写成 `.../api/v1`，会自动去掉重复后缀。
 */
function resolveApiEndpoints(): { origin: string; v1: string } {
  const raw = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (!raw) {
    return { origin: "", v1: "/api/v1" };
  }
  let base = raw.replace(/\/+$/, "");
  if (base.endsWith("/api/v1")) {
    base = base.slice(0, -"/api/v1".length).replace(/\/+$/, "");
  }
  return { origin: base, v1: `${base}/api/v1` };
}

const { origin: resolvedOrigin, v1: resolvedV1 } = resolveApiEndpoints();

export const API_ORIGIN = resolvedOrigin;
export const API_V1 = resolvedV1;

const TOKEN_KEY = "tech_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(`HTTP ${status}`);
    this.name = "ApiError";
  }
}

export function formatApiDetail(detail: unknown): string {
  if (detail == null) return "请求失败";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { msg?: string; loc?: unknown }) => d.msg ?? JSON.stringify(d))
      .join("；");
  }
  if (typeof detail === "object" && detail !== null && "message" in detail) {
    const m = (detail as { message: string; missing?: string[] }).message;
    const miss = (detail as { missing?: string[] }).missing;
    return miss?.length ? `${m}：${miss.join(", ")}` : m;
  }
  return JSON.stringify(detail);
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_V1}${path}`, {
    ...rest,
    headers,
    body:
      body === undefined
        ? undefined
        : isForm
          ? (body as FormData)
          : JSON.stringify(body),
  });

  if (res.status === 401) {
    setToken(null);
    const errBody = await safeJson(res);
    const detail =
      errBody && typeof errBody === "object" && "detail" in errBody
        ? (errBody as { detail: unknown }).detail
        : "未授权";
    if (!path.startsWith("/auth/login")) {
      window.location.assign("/login");
    }
    throw new ApiError(401, detail);
  }

  if (!res.ok) {
    const errBody = await safeJson(res);
    const detail =
      errBody && typeof errBody === "object" && "detail" in errBody
        ? (errBody as { detail: unknown }).detail
        : errBody;
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function fetchHealth(): Promise<import("./types").HealthResponse> {
  const url = API_ORIGIN ? `${API_ORIGIN}/health` : "/health";
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
