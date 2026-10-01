// Browser API client for the PMR BFF (`/api/*`).
//
// The browser never learns about Telegraph Cloud: no project id, no API key, no
// database endpoint. Requests are same-origin and always relative.
//
// The admin session token is held in a module variable (React state) so it is
// never written to localStorage, never placed in a URL, and never logged.

const REQUEST_TIMEOUT_MS = 15_000;

/** In-memory only. Reloading the page intentionally ends the admin session. */
let adminToken = null;

export function setAdminToken(token) {
  adminToken = token || null;
}

export function clearAdminToken() {
  adminToken = null;
}

export function getAdminToken() {
  return adminToken;
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = "api_error", details = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function timeoutSignal() {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  }
  return undefined;
}

async function parse(response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("Respons server tidak dapat dibaca.", { status: response.status, code: "invalid_response" });
  }
}

async function request(path, { method = "GET", body, admin = false, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (admin && adminToken) headers.Authorization = `Bearer ${adminToken}`;

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal || timeoutSignal(),
    });
  } catch (cause) {
    throw new ApiError("Tidak dapat terhubung ke server PMR.", { code: "network_error", details: String(cause?.message || cause) });
  }

  const payload = await parse(response).catch((cause) => {
    if (cause instanceof ApiError) throw cause;
    throw new ApiError("Respons server tidak valid.", { status: response.status, code: "invalid_response" });
  });

  if (!response.ok) {
    if (response.status === 401 && admin) clearAdminToken();
    throw new ApiError(payload?.error || `Permintaan gagal (${response.status}).`, {
      status: response.status,
      code: payload?.code || "http_error",
      details: payload?.details || null,
    });
  }

  return payload;
}

/* ----------------------------- public ------------------------------ */

export async function fetchContent() {
  const payload = await request("/api/content");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError("Format konten tidak dikenali.", { code: "invalid_content" });
  }
  return payload;
}

export const fetchGallery = () => request("/api/gallery");
export const fetchEvents = () => request("/api/events");
export const fetchHealth = () => request("/api/health");

/* ------------------------------ admin ------------------------------ */

export async function adminLogin(pin) {
  const payload = await request("/api/admin/login", { method: "POST", body: { pin } });
  if (!payload?.token) throw new ApiError("Server tidak mengirim sesi admin.", { code: "invalid_session" });
  setAdminToken(payload.token);
  return payload;
}

export const adminData = () => request("/api/admin/data", { admin: true });

export const adminSaveItem = (collection, item) =>
  request(`/api/admin/${collection}`, { method: "POST", body: item, admin: true });

export const adminDeleteItem = (collection, id) =>
  request(`/api/admin/${collection}?id=${encodeURIComponent(id)}`, { method: "DELETE", admin: true });

export const adminSaveSingleton = (collection, value) =>
  request("/api/admin/content", { method: "POST", body: { collection, value }, admin: true });

export const adminBackup = () => request("/api/admin/backup", { admin: true });

export const adminRestore = (content) => request("/api/admin/restore", { method: "POST", body: { content }, admin: true });

/* ------------------------------ assets ----------------------------- */

export const adminListAssets = ({ folder = "gallery", q = "" } = {}) =>
  request(`/api/admin/assets?folder=${encodeURIComponent(folder)}&q=${encodeURIComponent(q)}`, { admin: true });

export async function adminUploadAsset(file, { folder = "gallery" } = {}) {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  form.append("name", file.name || "pmr-asset");

  let response;
  try {
    response = await fetch("/api/admin/assets", {
      method: "POST",
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      body: form,
      signal: timeoutSignal(),
    });
  } catch (cause) {
    throw new ApiError("Unggahan gagal terkirim.", { code: "network_error", details: String(cause?.message || cause) });
  }

  const payload = await parse(response);
  if (!response.ok) {
    if (response.status === 401) clearAdminToken();
    throw new ApiError(payload?.error || "Unggahan ditolak server.", { status: response.status, code: payload?.code || "upload_failed" });
  }
  return payload;
}

export const adminDeleteAsset = (key) =>
  request(`/api/admin/assets?key=${encodeURIComponent(key)}`, { method: "DELETE", admin: true });

export const ASSET_FOLDERS = [
  { id: "gallery", label: "Galeri" },
  { id: "branding", label: "Branding" },
  { id: "organization", label: "Organisasi" },
  { id: "documents", label: "Dokumen" },
];
