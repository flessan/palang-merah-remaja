// PMR Wira BFF (backend-for-frontend) on Cloudflare Pages Functions.
//
//   Browser → /api/* → this adapter → Telegraph Cloud → JSON / public object URL
//
// Public surface:
//   GET  /api/health
//   GET  /api/content
//   GET  /api/gallery
//   GET  /api/events
//   GET  /api/media/<key>          (credential-free proxy for private objects)
// Admin surface: see functions/_lib/admin.js
//
// Secrets (TELEGRAPH_API_KEY, ADMIN_PIN, …) only ever exist inside this
// server-side context. They are never serialised into a response and never
// reach the Vite bundle.

import { handleAdmin } from "../_lib/admin.js";
import { loadCollection, loadContent } from "../_lib/content.js";
import { apiSegments, error, json, preflight } from "../_lib/response.js";
import { createTelegraph, telegraphConfig, telegraphConfigIssues } from "../_lib/telegraph.js";

const PUBLIC_CACHE = "public, max-age=30, s-maxage=60, stale-while-revalidate=300";

function cacheSeconds(env) {
  const parsed = Number(env?.PMR_CONTENT_CACHE_TTL);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(Math.round(parsed), 3600) : 60;
}

function publicCache(env) {
  const seconds = cacheSeconds(env);
  return seconds === 0 ? "no-store" : `public, max-age=${seconds}, s-maxage=${seconds * 5}, stale-while-revalidate=300`;
}

async function handleMedia(request, env, segments) {
  const telegraph = createTelegraph(env);
  if (!telegraph.config.configured) return error("Object storage belum dikonfigurasi.", 503, request);

  const key = segments.slice(1).join("/");
  if (!key || key.includes("..") || key.startsWith("/")) return error("Objek tidak ditemukan.", 404, request);

  try {
    const upstream = await telegraph.readObject(key);
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "X-Content-Type-Options": "nosniff",
        ETag: upstream.headers.get("ETag") || "",
      },
    });
  } catch (cause) {
    if (cause?.status === 404) return error("Objek tidak ditemukan.", 404, request);
    return error("Gagal memuat objek dari Telegraph Cloud.", 502, request);
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return preflight(request);

  const segments = apiSegments(request);
  const route = segments[0] || "content";

  if (route === "admin") return handleAdmin(context, segments.slice(1));

  if (request.method !== "GET" && request.method !== "HEAD") {
    return error("Metode tidak didukung untuk endpoint publik.", 405, request, { allow: "GET, OPTIONS" });
  }

  const config = telegraphConfig(env);

  if (route === "health") {
    const issues = telegraphConfigIssues(env);
    return json(
      {
        ok: true,
        service: "pmr-wira-api",
        backend: "telegraph-cloud",
        configured: config.configured,
        project: config.projectId ? "tersambung" : "belum diatur",
        bucket: config.bucket,
        issues,
        timestamp: new Date().toISOString(),
      },
      200,
      request,
    );
  }

  if (route === "media") return handleMedia(request, env, segments);

  if (!["content", "gallery", "events"].includes(route)) {
    return error("Endpoint tidak ditemukan.", 404, request);
  }

  if (route === "content") {
    const { content, degraded } = await loadContent(env);
    // Fallback content is still a valid 200 response: the site must never break.
    return json(content, 200, request, { cache: degraded ? "no-store" : publicCache(env) });
  }

  const result = await loadCollection(env, route);
  if (result.error) return error("Endpoint tidak ditemukan.", result.status || 404, request);
  return json(result.documents, 200, request, { cache: result.degraded ? "no-store" : publicCache(env) });
}
