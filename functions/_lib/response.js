// Shared HTTP helpers for the PMR Pages Functions. No secret ever leaves here.

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export function json(data, status = 200, request, { cache = null, headers = {} } = {}) {
  return new Response(JSON.stringify(data ?? null), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...(cache ? { "Cache-Control": cache } : { "Cache-Control": "no-store" }),
      ...corsHeaders(request),
      ...headers,
    },
  });
}

export function error(message, status = 400, request, extra = {}) {
  return json({ ok: false, error: message, ...extra }, status, request);
}

export function corsHeaders(request) {
  const origin = request?.headers?.get?.("Origin") || "";
  const headers = { Vary: "Origin" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Pin";
    headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
    headers["Access-Control-Max-Age"] = "600";
  }
  return headers;
}

export function preflight(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Bounded, trimmed string sanitizer for user-supplied content. */
export function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export function cleanList(value, max = 500, limit = 200) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => clean(item, max)).filter(Boolean).slice(0, limit);
}

export function clampNumber(value, { min = 0, max = 100000 } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

/** Extracts a route path relative to /api, e.g. "admin/gallery". */
export function apiPath(request) {
  const pathname = new URL(request.url).pathname.replace(/^\/api\/?/, "");
  return pathname.replace(/\/+$/, "");
}

export function apiSegments(request) {
  return apiPath(request).split("/").filter(Boolean);
}
