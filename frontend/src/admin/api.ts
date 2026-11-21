/**
 * Admin API client. Uses the httpOnly session cookies set by the backend and
 * transparently refreshes an expired access token once before giving up.
 */
import { API_URL } from "@/lib/config";
import type { AdminUser, InquiryRecord, InquiryStatus, MediaItem, Paginated, Stats } from "./types";

export class AdminApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Fired when the session can't be refreshed, so the app can send the user to the login page. */
export const SESSION_EXPIRED_EVENT = "pcc:session-expired";

let refreshing: Promise<boolean> | null = null;

function refreshSession() {
  refreshing ??= fetch(`${API_URL}/api/v1/auth/refresh`, { method: "POST", credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (refreshing = null), 0);
    });
  return refreshing;
}

async function call<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      method,
      credentials: "include",
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AdminApiError("Can't reach the server. Check your connection and that the API is running.", 0);
  }

  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    if (await refreshSession()) return call<T>(method, path, body, false);
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const fieldErrors: Record<string, string> = {};
    for (const e of (json?.errors ?? []) as { path: string; message: string }[]) {
      if (e.path && !fieldErrors[e.path]) fieldErrors[e.path] = e.message;
    }
    throw new AdminApiError(json?.message ?? `Request failed (${res.status})`, res.status, fieldErrors);
  }
  return json?.data as T;
}

export const adminApi = {
  get: <T>(path: string) => call<T>("GET", path),
  post: <T>(path: string, body?: unknown) => call<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => call<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => call<T>("PATCH", path, body),
  del: <T>(path: string) => call<T>("DELETE", path),
};

export const authApi = {
  me: () => adminApi.get<{ user: AdminUser }>("/auth/me").then((r) => r.user),
  login: (email: string, password: string) =>
    adminApi.post<{ user: AdminUser }>("/auth/login", { email, password }).then((r) => r.user),
  logout: () => adminApi.post("/auth/logout"),
  changePassword: (currentPassword: string, newPassword: string) =>
    adminApi.post("/auth/change-password", { currentPassword, newPassword }),
};

export const statsApi = { get: () => adminApi.get<Stats>("/admin/stats") };

export const contentAdminApi = {
  list: <T>(collection: string) => adminApi.get<T[]>(`/admin/content/${collection}`),
  get: <T>(collection: string, id: string) => adminApi.get<T>(`/admin/content/${collection}/${id}`),
  create: <T>(collection: string, data: unknown) => adminApi.post<T>(`/admin/content/${collection}`, data),
  update: <T>(collection: string, id: string, data: unknown) => adminApi.put<T>(`/admin/content/${collection}/${id}`, data),
  publish: (collection: string, id: string, published: boolean) =>
    adminApi.patch(`/admin/content/${collection}/${id}/publish`, { published }),
  remove: (collection: string, id: string) => adminApi.del(`/admin/content/${collection}/${id}`),
  reorder: (collection: string, ids: string[]) => adminApi.put(`/admin/content/${collection}/reorder`, { ids }),
  /** Testimonials sent from the website: approving publishes it, rejecting keeps it off the site. */
  review: (collection: string, id: string, decision: "approve" | "reject") =>
    adminApi.patch(`/admin/content/${collection}/${id}/review`, { decision }),
  getSingleton: <T>(key: string) => adminApi.get<T | null>(`/admin/content/${key}`),
  saveSingleton: <T>(key: string, data: unknown) => adminApi.put<T>(`/admin/content/${key}`, data),
};

export const mediaApi = {
  list: (folder?: string, page = 1) =>
    adminApi.get<Paginated<MediaItem>>(`/admin/media?page=${page}&limit=48${folder ? `&folder=${folder}` : ""}`),
  upload: (file: File, folder: string, alt: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    form.append("alt", alt);
    return adminApi.post<MediaItem>("/admin/media", form);
  },
  updateAlt: (id: string, alt: string) => adminApi.patch<MediaItem>(`/admin/media/${id}`, { alt }),
  remove: (id: string) => adminApi.del(`/admin/media/${id}`),
};

export const inquiryAdminApi = {
  list: (params: { status?: InquiryStatus; q?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    qs.set("page", String(params.page ?? 1));
    return adminApi.get<Paginated<InquiryRecord>>(`/admin/inquiries?${qs}`);
  },
  get: (id: string) => adminApi.get<InquiryRecord>(`/admin/inquiries/${id}`),
  update: (id: string, data: { status?: InquiryStatus; notes?: string }) =>
    adminApi.patch<InquiryRecord>(`/admin/inquiries/${id}`, data),
  remove: (id: string) => adminApi.del(`/admin/inquiries/${id}`),
};

export const usersApi = {
  list: () => adminApi.get<AdminUser[]>("/admin/users"),
  create: (data: { name: string; email: string; password: string; role: AdminUser["role"] }) =>
    adminApi.post<AdminUser>("/admin/users", data),
  update: (id: string, data: Partial<Pick<AdminUser, "name" | "role" | "active">> & { password?: string }) =>
    adminApi.patch<AdminUser>(`/admin/users/${id}`, data),
  remove: (id: string) => adminApi.del(`/admin/users/${id}`),
};
