// Server-side administration auth for PMR Wira.
//
// Model: one shared PIN (`ADMIN_PIN`) plus a short-lived HMAC session token.
// The PIN never leaks beyond this file, is never echoed, and is never stored in
// localStorage — the browser keeps the session token in React memory only.
//
// The Telegraph Cloud developer key (`TELEGRAPH_API_KEY`) is independent of the
// admin PIN: rotating the PIN never changes backend credentials.

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const FALLBACK_PIN = "2026"; // demo/preview default, documented in README

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function encoder() {
  return new TextEncoder();
}

/** Constant-time comparison so a wrong PIN cannot be timing-probed. */
export function safeEqual(a, b) {
  const left = encoder().encode(String(a ?? ""));
  const right = encoder().encode(String(b ?? ""));
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left[index] ^ right[index];
  return diff === 0;
}

export function adminPin(env = {}) {
  return String(env.ADMIN_PIN || "").trim() || FALLBACK_PIN;
}

function tokenKey(env) {
  // Session tokens are scoped to the PIN and to the service label, so:
  //  * rotating ADMIN_PIN immediately invalidates every existing token;
  //  * a PMR session token can never be replayed against Telegraph Cloud.
  return `pmr-wira-admin:${adminPin(env)}`;
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", encoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder().encode(message));
  return new Uint8Array(signature);
}

export async function createSessionToken(env, { now = Date.now() } = {}) {
  const payload = { exp: now + TOKEN_TTL_MS, iat: now, nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(12))) };
  const encodedPayload = toBase64Url(encoder().encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmac(tokenKey(env), encodedPayload));
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(env, token, { now = Date.now() } = {}) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) return false;
  const expected = toBase64Url(await hmac(tokenKey(env), encodedPayload));
  if (!safeEqual(expected, signature)) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload)));
    return Number(payload?.exp || 0) > now;
  } catch {
    return false;
  }
}

/**
 * Reads the admin credential from the request. Accepts the PAT session token
 * (`Authorization: Bearer …`) or the raw PIN header for API clients/scripts.
 * Never accepts credentials from the query string or body.
 */
export function adminCredential(request) {
  const header = String(request?.headers?.get?.("Authorization") || "");
  const bearer = header.replace(/^Bearer\s+/i, "").trim();
  const pinHeader = String(request?.headers?.get?.("X-Admin-Pin") || "").trim();
  return { token: bearer, pin: pinHeader };
}

export async function isAdmin(request, env) {
  const { token, pin } = adminCredential(request);
  if (pin && safeEqual(pin, adminPin(env))) return true;
  if (token) return verifySessionToken(env, token);
  return false;
}

export const AUTH = Object.freeze({ TOKEN_TTL_MS, FALLBACK_PIN });
