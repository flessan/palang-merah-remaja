export function json(data, status = 200, request) {
  const origin = request?.headers?.get("Origin") || "*";
  const url = request?.url || "";
  const isAdmin = url.includes("/admin") || request?.method !== "GET" || status !== 200;
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": isAdmin ? "no-store, no-cache, must-revalidate" : "public, max-age=60, s-maxage=300",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Pin",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      Vary: "Origin",
    },
  });
}

export function error(message, status = 400, request) {
  return json({ error: message, ok: false }, status, request);
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function clean(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

