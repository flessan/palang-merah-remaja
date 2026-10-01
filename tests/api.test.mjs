// Tests for the PMR Pages Function adapter (the Telegraph Cloud BFF).
// Run: node tests/api.test.mjs
//
// Covers: health, public reads, fallback mode, admin auth, announcement/event/
// gallery CRUD, asset upload adapter, invalid upstream responses and upstream
// failure behaviour — all against an in-memory Telegraph Cloud stand-in.

import { createReporter, createMockTelegraph, jsonResponse } from "./harness.mjs";
import { fallbackDocuments } from "../shared/fallback.js";
import { onRequest } from "../functions/api/[[path]].js";

const { check, equal, summary } = createReporter("tests/api");

const ENV = {
  TELEGRAPH_URL: "https://telegraph.test",
  TELEGRAPH_API_KEY: "tg_live_test_key_never_printed",
  TELEGRAPH_PROJECT_ID: "prj_pmr_test",
  TELEGRAPH_BUCKET: "pmr-assets",
  ADMIN_PIN: "2026",
};

const realFetch = globalThis.fetch;

function installMock({ failMode = null, seed = true } = {}) {
  const mock = createMockTelegraph({ failMode });
  if (seed) {
    mock.seed("announcements", fallbackDocuments.announcements);
    mock.seed("events", fallbackDocuments.events);
    mock.seed("gallery", fallbackDocuments.gallery);
    mock.seed("guides", fallbackDocuments.guides);
    mock.seed("organization", fallbackDocuments.organization);
    mock.seed("roster", fallbackDocuments.roster);
    mock.seed("uks", fallbackDocuments.uks);
    mock.seed("site_settings", fallbackDocuments.site_settings);
  }
  globalThis.fetch = mock.fetchImpl;
  return mock;
}

function context(url, { method = "GET", headers = {}, body, env = ENV, formData } = {}) {
  const init = { method, headers };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    init.headers = { "Content-Type": "application/json", ...headers };
  }
  if (formData) init.body = formData;
  return { request: new Request(url, init), env, waitUntil() {} };
}

async function login() {
  const response = await onRequest(context("https://pmr.test/api/admin/login", { method: "POST", body: { pin: "2026" } }));
  const payload = await response.json();
  return { status: response.status, token: payload.token, payload };
}

/* ------------------------------------------------------------------ */
console.log("\n== 1. Health & konfigurasi ==");
{
  installMock();
  const response = await onRequest(context("https://pmr.test/api/health"));
  const payload = await response.json();
  equal("GET /api/health → 200", response.status, 200);
  equal("backend dilaporkan", payload.backend, "telegraph-cloud");
  equal("configured true saat env lengkap", payload.configured, true);
  check("health tidak membocorkan kunci API", !JSON.stringify(payload).includes("tg_live"));

  const unconfigured = await onRequest(context("https://pmr.test/api/health", { env: {} }));
  const payloadUn = await unconfigured.json();
  equal("tanpa env → configured false", payloadUn.configured, false);
  check("issues mencatat variabel yang hilang", payloadUn.issues.length >= 3);
  check("tidak ada nilai rahasia di issues", !payloadUn.issues.join(" ").includes("tg_live"));
}

console.log("\n== 2. Baca publik ==");
{
  installMock();
  const response = await onRequest(context("https://pmr.test/api/content"));
  const payload = await response.json();
  equal("GET /api/content → 200", response.status, 200);
  equal("sumber telegraph", payload.source, "telegraph");
  check("kabar terbaca dari koleksi", payload.announcements.length === fallbackDocuments.announcements.length);
  check("galeri terbaca", payload.gallery.length === fallbackDocuments.gallery.length);
  check("panduan P3K terbaca", payload.guides.length === 4);
  check("inventaris UKS terbaca", payload.uks.inventory.length >= 10);
  check("respons publik tanpa kunci/kredensial", !JSON.stringify(payload).includes("tg_live"));
  check("cache publik diatur", (response.headers.get("Cache-Control") || "").includes("max-age"));

  const gallery = await onRequest(context("https://pmr.test/api/gallery"));
  const galleryPayload = await gallery.json();
  check("GET /api/gallery mengembalikan array album", Array.isArray(galleryPayload) && galleryPayload.length > 0);

  const events = await onRequest(context("https://pmr.test/api/events"));
  const eventsPayload = await events.json();
  check("GET /api/events mengembalikan array agenda", Array.isArray(eventsPayload) && eventsPayload.length > 0);

  const missing = await onRequest(context("https://pmr.test/api/tidak-ada"));
  equal("endpoint tidak dikenal → 404", missing.status, 404);

  const write = await onRequest(context("https://pmr.test/api/content", { method: "POST", body: {} }));
  equal("POST ke endpoint publik → 405", write.status, 405);
}

console.log("\n== 3. Mode fallback (Telegraph tidak tersedia) ==");
{
  installMock({ failMode: "all" });
  const response = await onRequest(context("https://pmr.test/api/content"));
  const payload = await response.json();
  equal("kegagalan upstream tetap 200", response.status, 200);
  check("konten fallback dikirim", payload.announcements.length > 0 && payload.guides.length === 4);
  equal("sumber fallback dilaporkan", payload.source, "fallback");
  equal("header cache dimatikan saat fallback", response.headers.get("Cache-Control"), "no-store");

  installMock({ failMode: "all", seed: false });
  const emptyEnv = await onRequest(context("https://pmr.test/api/content", { env: {} }));
  const emptyPayload = await emptyEnv.json();
  equal("tanpa konfigurasi → fallback", emptyPayload.source, "fallback");
  check("halaman tidak pernah kosong", emptyPayload.gallery.length > 0 && emptyPayload.org.leaders.length > 0);

  // Individual collection degradation
  installMock({ failMode: "storage" });
  const stillOk = await onRequest(context("https://pmr.test/api/events"));
  check("kegagalan bukan-DB tidak merusak rute lain", stillOk.status === 200);
}

console.log("\n== 4. Autentikasi admin (server-side) ==");
{
  installMock();
  const unauthenticated = await onRequest(context("https://pmr.test/api/admin/data"));
  equal("GET /api/admin/data tanpa sesi → 401", unauthenticated.status, 401);

  const badPin = await onRequest(context("https://pmr.test/api/admin/login", { method: "POST", body: { pin: "0000" } }));
  equal("PIN salah → 401", badPin.status, 401);
  const badPayload = await badPin.json();
  check("pesan galat tanpa membocorkan PIN", !/"2026"/.test(JSON.stringify(badPayload)));

  const directPin = await onRequest(context("https://pmr.test/api/admin/data", { headers: { "X-Admin-Pin": "2026" } }));
  equal("akses langsung dengan PIN di header → 200", directPin.status, 200);

  const { status, token } = await login();
  equal("login PIN benar → 200", status, 200);
  check("token sesi dikembalikan", typeof token === "string" && token.includes("."));
  check("token bukan PIN mentah", token !== "2026");

  const withToken = await onRequest(context("https://pmr.test/api/admin/data", { headers: { Authorization: `Bearer ${token}` } }));
  equal("Bearer token diterima", withToken.status, 200);

  const tampered = `${token.split(".")[0]}.${"a".repeat(43)}`;
  const tamperedResponse = await onRequest(context("https://pmr.test/api/admin/data", { headers: { Authorization: `Bearer ${tampered}` } }));
  equal("token dirusak ditolak", tamperedResponse.status, 401);

  const dataPayload = await (await onRequest(context("https://pmr.test/api/admin/data", { headers: { Authorization: `Bearer ${token}` } }))).json();
  check("admin menerima koleksi mentah", Object.keys(dataPayload.data.collections).length === 8);
  check("admin payload tanpa kunci Telegraph", !JSON.stringify(dataPayload).includes("tg_live"));
  // PIN from a different configuration must invalidate the token.
  const otherPinEnv = { ...ENV, ADMIN_PIN: "9999" };
  const rotated = await onRequest(context("https://pmr.test/api/admin/data", { headers: { Authorization: `Bearer ${token}` }, env: otherPinEnv }));
  equal("token gugur saat PIN dirotasi", rotated.status, 401);
}

console.log("\n== 5. CRUD kabar, agenda, galeri ==");
{
  const mock = installMock();
  const { token } = await login();
  const auth = { Authorization: `Bearer ${token}` };

  // --- announcements ---
  const created = await onRequest(context("https://pmr.test/api/admin/announcements", {
    method: "POST",
    headers: auth,
    body: { title: "Juara lomba P3K", category: "Prestasi", excerpt: "Tim PMR Wira juara.", date: "1 Maret 2026", image: "/gudang/gallery/juara.avif", published: true },
  }));
  const createdPayload = await created.json();
  equal("POST kabar → 200", created.status, 200);
  check("id dokumen dikembalikan", Boolean(createdPayload.id));
  check("dokumen tersimpan di koleksi", mock.records("announcements").size === fallbackDocuments.announcements.length + 1);

  const invalid = await onRequest(context("https://pmr.test/api/admin/announcements", { method: "POST", headers: auth, body: { title: "   " } }));
  equal("judul kosong → 422", invalid.status, 422);
  const invalidPayload = await invalid.json();
  check("galat validasi menjelaskan field", /judul/i.test(invalidPayload.error));

  const updated = await onRequest(context("https://pmr.test/api/admin/announcements", {
    method: "POST",
    headers: auth,
    body: { id: createdPayload.id, title: "Juara lomba P3K (revisi)", published: true },
  }));
  const updatedPayload = await updated.json();
  equal("POST dengan id → update", updated.status, 200);
  equal("judul terbaru tersimpan", (await (await onRequest(context("https://pmr.test/api/content"))).json()).announcements.find((item) => item.id === createdPayload.id)?.title, "Juara lomba P3K (revisi)");

  const deleted = await onRequest(context(`https://pmr.test/api/admin/announcements?id=${encodeURIComponent(createdPayload.id)}`, { method: "DELETE", headers: auth }));
  equal("DELETE kabar → 200", deleted.status, 200);
  check("dokumen dihapus dari koleksi", mock.records("announcements").size === fallbackDocuments.announcements.length);

  const deleteMissing = await onRequest(context("https://pmr.test/api/admin/announcements?id=rec_tidak_ada", { method: "DELETE", headers: auth }));
  equal("DELETE id tidak ada → 404", deleteMissing.status, 404);

  // --- events ---
  const event = await onRequest(context("https://pmr.test/api/admin/events", {
    method: "POST",
    headers: auth,
    body: { title: "Latihan gabungan Februari", date: "5 Februari 2026", time: "15.00 WITA", location: "Aula", description: "Latihan bersama.", status: "Terbuka" },
  }));
  const eventPayload = await event.json();
  equal("POST agenda → 200", event.status, 200);
  check("agenda muncul di API publik", (await (await onRequest(context("https://pmr.test/api/events"))).json()).some((item) => item.id === eventPayload.id));

  const eventDelete = await onRequest(context(`https://pmr.test/api/admin/events?id=${encodeURIComponent(eventPayload.id)}`, { method: "DELETE", headers: auth }));
  equal("DELETE agenda → 200", eventDelete.status, 200);

  // --- gallery ---
  const album = await onRequest(context("https://pmr.test/api/admin/gallery", {
    method: "POST",
    headers: auth,
    body: {
      title: "Album bakti sosial",
      category: "Aksi sosial",
      date: "10 Maret 2026",
      description: "Dokumentasi bakti sosial.",
      cover: "/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif",
      images: ["/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif", "/gudang/gallery/IMG-20260129-WA0035_fwkslt_jjng7f.avif"],
    },
  }));
  const albumPayload = await album.json();
  equal("POST album → 200", album.status, 200);
  const publicGallery = await (await onRequest(context("https://pmr.test/api/gallery"))).json();
  const storedAlbum = publicGallery.find((item) => item.id === albumPayload.id);
  check("album publik menyimpan dua foto", storedAlbum?.images.length === 2);

  const emptyAlbum = await onRequest(context("https://pmr.test/api/admin/gallery", {
    method: "POST",
    headers: auth,
    body: { title: "Album tanpa foto", images: [], cover: "" },
  }));
  equal("album tanpa foto ditolak → 422", emptyAlbum.status, 422);

  await onRequest(context(`https://pmr.test/api/admin/gallery?id=${encodeURIComponent(albumPayload.id)}`, { method: "DELETE", headers: auth }));

  // --- guides & singletons ---
  const guide = await onRequest(context("https://pmr.test/api/admin/guides", {
    method: "POST",
    headers: auth,
    body: { title: "Keram perut", tag: "Tindakan cepat", tone: "mint", icon: "thermometer", summary: "Pertolongan awal kram perut.", steps: ["Baringkan korban", "Beri minum hangat", "Hubungi petugas UKS"] },
  }));
  equal("POST panduan → 200", guide.status, 200);

  const settings = await onRequest(context("https://pmr.test/api/admin/content", {
    method: "POST",
    headers: auth,
    body: { collection: "site_settings", value: { ...fallbackDocuments.site_settings[0], emergency: { ...fallbackDocuments.site_settings[0].emergency, number: "119" } } },
  }));
  equal("POST site_settings → 200", settings.status, 200);

  const roster = await onRequest(context("https://pmr.test/api/admin/roster", {
    method: "POST",
    headers: auth,
    body: { period: "Agustus 2026", month_label: "Agustus 2026", description: "Jadwal baru", uks_schedule: [{ date: "Senin, 3 Agustus 2026", day: "Senin", officers: ["Anggota A"] }], field_schedule: [] },
  }));
  const rosterPayload = await roster.json();
  equal("POST roster (singleton) → 200", roster.status, 200);
  check("roster menggantikan dokumen lama, bukan menduplikasi", mock.records("roster").size === 1);
  check("roster tersimpan", rosterPayload.item.uks_schedule[0].officers[0] === "Anggota A");

  const org = await onRequest(context("https://pmr.test/api/admin/organization", {
    method: "POST",
    headers: auth,
    body: { period: "2027/2028", leaders: [{ name: "Ketua Baru", role: "Ketua" }], divisions: [], mission: ["Misi baru"] },
  }));
  equal("POST organization → 200", org.status, 200);
  check("organization tetap satu dokumen", mock.records("organization").size === 1);

  const uks = await onRequest(context("https://pmr.test/api/admin/uks", {
    method: "POST",
    headers: auth,
    body: { welcome_banner: { title: "UKS siap" }, inventory: [{ name: "Kasa steril", category: "Perban & P3K", purpose: "Menutup luka" }], procedure: [{ step: "Lapor", description: "Lapor petugas" }], rules: ["Jaga kebersihan"] },
  }));
  equal("POST uks → 200", uks.status, 200);

  const unknown = await onRequest(context("https://pmr.test/api/admin/tidak-ada", { method: "POST", headers: auth, body: {} }));
  equal("koleksi tidak dikenal → 404", unknown.status, 404);
}

console.log("\n== 6. Adapter unggah aset ==");
{
  const mock = installMock();
  const { token } = await login();
  const auth = { Authorization: `Bearer ${token}` };

  const form = new FormData();
  form.append("file", new File([new Uint8Array([1, 2, 3, 4])], "foto latihan.png", { type: "image/png" }));
  form.append("folder", "gallery");
  const upload = await onRequest(context("https://pmr.test/api/admin/assets", { method: "POST", headers: auth, formData: form }));
  const uploadPayload = await upload.json();
  equal("POST /api/admin/assets → 201", upload.status, 201);
  check("kunci objek memakai folder gallery", uploadPayload.asset.key.startsWith("gallery/"));
  check("nama berkas disanitasi", /^[a-z0-9-]+\.png$/.test(uploadPayload.asset.name));
  check("URL publik menunjuk /p/<project>/<bucket>/", uploadPayload.asset.url.includes("/p/prj_pmr_test/pmr-assets/gallery/"));
  check("metadata privat tidak dikirim", !JSON.stringify(uploadPayload).includes("file_id") && !JSON.stringify(uploadPayload).includes("message_id"));

  const list = await onRequest(context("https://pmr.test/api/admin/assets?folder=gallery", { headers: auth }));
  const listPayload = await list.json();
  check("GET /api/admin/assets menampilkan objek", listPayload.assets.some((asset) => asset.key === uploadPayload.asset.key));

  const search = await onRequest(context("https://pmr.test/api/admin/assets?folder=gallery&q=latihan", { headers: auth }));
  const searchPayload = await search.json();
  check("pencarian aset bekerja", searchPayload.assets.length >= 1);

  const badType = new FormData();
  badType.append("file", new File([new Uint8Array([1])], "script.sh", { type: "application/x-sh" }));
  badType.append("folder", "documents");
  const rejected = await onRequest(context("https://pmr.test/api/admin/assets", { method: "POST", headers: auth, formData: badType }));
  equal("jenis berkas tidak diizinkan → 415", rejected.status, 415);

  const outside = await onRequest(context("https://pmr.test/api/admin/assets?key=hacked/berkas.png", { method: "DELETE", headers: auth }));
  equal("hapus di luar folder PMR → 403", outside.status, 403);

  const removed = await onRequest(context(`https://pmr.test/api/admin/assets?key=${encodeURIComponent(uploadPayload.asset.key)}`, { method: "DELETE", headers: auth }));
  equal("hapus aset → 200", removed.status, 200);
  check("objek hilang dari bucket", mock.objects.size === 0);

  const unauthenticated = await onRequest(context("https://pmr.test/api/admin/assets"));
  equal("assets tanpa sesi → 401", unauthenticated.status, 401);
}

console.log("\n== 7. Proxy media ==");
{
  const mock = installMock();
  mock.objects.set("gallery/contoh.jpg", { bytes: new Uint8Array([255, 216, 255]), contentType: "image/jpeg", version: 1, updatedAt: new Date().toISOString() });

  const ok = await onRequest(context("https://pmr.test/api/media/gallery/contoh.jpg"));
  equal("GET /api/media/<key> → 200", ok.status, 200);
  equal("content-type diteruskan", ok.headers.get("Content-Type"), "image/jpeg");
  check("cache objek panjang", (ok.headers.get("Cache-Control") || "").includes("86400"));

  const missing = await onRequest(context("https://pmr.test/api/media/gallery/tidak-ada.jpg"));
  equal("objek tidak ada → 404", missing.status, 404);

  const traversal = await onRequest(context("https://pmr.test/api/media/..%2Fetc%2Fpasswd"));
  check("path traversal ditolak", traversal.status === 404 || traversal.status === 400);
}

console.log("\n== 8. Respons upstream tidak valid ==");
{
  installMock();
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    if (url.pathname.startsWith("/api/db")) {
      return new Response("<html>bukan json</html>", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return jsonResponse({ error: "not_found" }, 404);
  };
  const response = await onRequest(context("https://pmr.test/api/content"));
  const payload = await response.json();
  check("respons upstream rusak tidak membuat crash", response.status === 200);
  equal("jatuh ke fallback", payload.source, "fallback");

  installMock();
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    if (url.pathname.startsWith("/api/db")) {
      return jsonResponse({ data: "bukan-array", has_more: false }, 200);
    }
    return jsonResponse({}, 500);
  };
  const weird = await onRequest(context("https://pmr.test/api/content"));
  const weirdPayload = await weird.json();
  check("payload berbentuk aneh tetap aman", weird.status === 200 && Array.isArray(weirdPayload.gallery));
}

console.log("\n== 9. Backup / restore / reset ==");
{
  installMock();
  const { token } = await login();
  const auth = { Authorization: `Bearer ${token}` };

  const backup = await onRequest(context("https://pmr.test/api/admin/backup", { headers: auth }));
  const backupPayload = await backup.json();
  equal("GET /api/admin/backup → 200", backup.status, 200);
  check("backup memuat konten lengkap", backupPayload.content.gallery.length > 0 && backupPayload.content.guides.length === 4);
  check("backup tanpa kredensial", !JSON.stringify(backupPayload).includes("tg_live"));

  const restore = await onRequest(context("https://pmr.test/api/admin/restore", {
    method: "POST",
    headers: auth,
    body: { content: { announcements: [{ title: "Pulih", excerpt: "dari backup" }] } },
  }));
  equal("POST /api/admin/restore → 200", restore.status, 200);

  const reset = await onRequest(context("https://pmr.test/api/admin/reset", { method: "POST", headers: auth, body: {} }));
  equal("reset massal ditolak (409/403)", [403, 409].includes(reset.status), true);
}

console.log("\n== 10. Praflight & CORS ==");
{
  installMock();
  const preflight = await onRequest(context("https://pmr.test/api/content", { method: "OPTIONS", headers: { Origin: "https://pmr.likesyou.org" } }));
  equal("OPTIONS → 204", preflight.status, 204);
  equal("origin diizinkan", preflight.headers.get("Access-Control-Allow-Origin"), "https://pmr.likesyou.org");
}

globalThis.fetch = realFetch;
summary();
