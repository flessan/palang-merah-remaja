export function json(data, status = 200, request) {
  const origin = request?.headers.get("Origin") || "*";
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? "public, max-age=60, s-maxage=300" : "no-store",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      Vary: "Origin",
    },
  });
}

export function error(message, status = 400, request) {
  return json({ error: message }, status, request);
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
