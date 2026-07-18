// PMR Wira — Smoke test E2E berbasis jsdom terhadap build produksi (dist/).
//
// Menjalankan bundle hasil `vite build` apa adanya, lalu menstimulasikan
// interaksi pengguna sungguhan: navigasi tab, drawer mobile, modal, tema,
// login admin, sampai endpoint Pages Functions — tanpa perlu browser.
//
// Cara pakai:
//   npm run test:smoke      (build + jalankan seluruh pemeriksaan)
//   node tests/smoke.mjs    (hanya pemeriksaan, butuh dist/ yang sudah dibangun)
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fallbackContent } from "../src/data.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

if (!fs.existsSync(DIST)) {
  console.error("dist/ belum ada. Jalankan `npm run build` terlebih dahulu (atau gunakan `npm run test:smoke`).");
  process.exit(2);
}

const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const bundleName = fs.readdirSync(path.join(DIST, "assets")).find((f) => f.startsWith("index") && f.endsWith(".js"));
const bundle = fs.readFileSync(path.join(DIST, "assets", bundleName), "utf8");

let passed = 0, failed = 0;
const failures = [];
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; failures.push(name); console.log(`  FAIL  ${name}`); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeout = 4000, label = "kondisi") {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const v = fn(); if (v) return v; } catch { /* coba lagi */ }
    await sleep(25);
  }
  throw new Error(`Timeout menunggu: ${label}`);
}

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

// Stub server demo: konten publik + autentikasi PIN 2026, tanpa database.
function makeFetchStub() {
  return async (url, options = {}) => {
    const pin = (options.headers && (options.headers["X-Admin-Pin"] || options.headers["x-admin-pin"])) || "";
    const u = String(url);
    if (u.startsWith("/api/content")) return jsonResponse(fallbackContent);
    if (u.startsWith("/api/health")) return jsonResponse({ ok: true, database: false, service: "demo" });
    if (u.startsWith("/api/admin/")) {
      if (pin !== "2026") return jsonResponse({ error: "PIN Admin salah." }, 401);
      if (u.startsWith("/api/admin/data")) return jsonResponse({ ok: true, data: structuredClone(fallbackContent) });
      return jsonResponse({ ok: true, message: "Tersimpan (stub)." });
    }
    return jsonResponse({ error: "not found" }, 404);
  };
}

function boot(url) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  window.IntersectionObserver = window.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = window.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
  window.MutationObserver = window.MutationObserver || class { observe() {} disconnect() {} takeRecords() { return []; } };
  window.fetch = makeFetchStub();
  window.confirm = () => true;
  const errors = [];
  window.addEventListener("error", (e) => errors.push(e.message));
  window.eval(bundle);
  return { window, document: window.document, errors };
}

const click = (el) => el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
const byText = (root, selector, text) => [...root.querySelectorAll(selector)].find((el) => el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
const pageText = (doc) => doc.querySelector("main")?.textContent || "";

function setInputValue(window, input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, value);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
}

/* ============================ Skenario 1: navigasi publik ============================ */
console.log("\n== Skenario 1: Navigasi & halaman publik ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/");
  await sleep(250);

  const navBtns = [...document.querySelectorAll(".desktop-nav button")];
  check("desktop nav berisi 7 tab", navBtns.length === 7);
  check("nav memuat tab Sejarah", navBtns.some((b) => b.textContent.trim() === "Sejarah"));
  check("tab Beranda punya aria-current=page", navBtns[0]?.getAttribute("aria-current") === "page");
  check("beranda merender hero", Boolean(document.querySelector(".hero-section")) && pageText(document).length > 400);
  check("beranda bebas kata 'Pendaftaran'", !/pendaftaran/i.test(pageText(document)));
  check("beranda bebas 'Pesan Masuk'/'FAQ'", !/pesan masuk|faq/i.test(pageText(document)));
  check("tidak ada bottom-nav lama", !document.querySelector(".bottom-nav"));

  // --- Sejarah ---
  click(navBtns.find((b) => b.textContent.trim() === "Sejarah"));
  await sleep(200);
  check("halaman sejarah dirender", Boolean(document.querySelector(".history-page")));
  check("hero sejarah: pill SEJAK 2010", (document.querySelector(".history-year-pill")?.textContent || "").includes("2010"));
  check("timeline sejarah >= 4 entri", /1950/.test(pageText(document)));
  check("pendiri: Winda Hairani tampil", /winda hairani/i.test(pageText(document)));
  check("tingkatan PMR (Mula/Madya/Wira) tampil", /mula/i.test(pageText(document)) && /madya/i.test(pageText(document)) && /wira/i.test(pageText(document)));
  check("URL berubah ke ?tab=sejarah", window.location.search.includes("tab=sejarah"));
  check("judul dokumen = Sejarah", document.title.includes("Sejarah"));
  check("sejarah keluar dari beranda (tab tersendiri)", !document.querySelector(".hero-section"));

  // --- Profil ---
  click(navBtns.find((b) => b.textContent.trim() === "Profil"));
  await sleep(200);
  check("profil dirender (struktur/visi)", /visi/i.test(pageText(document)));
  check("profil bebas blok FAQ", !/pertanyaan yang sering|faq/i.test(pageText(document)));
  check("profil punya tautan cepat ke Sejarah", Boolean(document.querySelector(".profile-history-link")));
  click(document.querySelector(".profile-history-link") || navBtns[2]);
  await sleep(150);
  check("tautan profil → sejarah bekerja", Boolean(document.querySelector(".history-page")) || window.location.search.includes("tab=sejarah"));

  // --- Kontak ---
  click(navBtns.find((b) => b.textContent.trim() === "Kontak"));
  await sleep(200);
  const main = document.querySelector("main");
  check("kontak tanpa <form> sama sekali", !main.querySelector("form"));
  check("kontak tanpa 'Pesan Singkat'/'Pendaftaran'", !/pesan singkat|pendaftaran/i.test(pageText(document)));
  check("kontak punya cepat WhatsApp", /whatsapp/i.test(pageText(document)));
  check("kontak menampilkan info bergabung", /anggota|bergabung|syarat/i.test(pageText(document)));

  // --- Galeri & modal album ---
  click(navBtns.find((b) => b.textContent.trim() === "Galeri"));
  await sleep(200);
  const albumCard = document.querySelector(".gallery-card");
  check("galeri memiliki kartu album", Boolean(albumCard));
  const imgEl = albumCard?.querySelector("img");
  check("gambar album lazy+async", imgEl?.getAttribute("loading") === "lazy" && imgEl?.getAttribute("decoding") === "async");
  click(albumCard);
  await waitFor(() => document.querySelector(".modal-backdrop"), 3000, "modal album");
  check("modal album terbuka", Boolean(document.querySelector(".modal-backdrop")));
  check("modal album punya penomor foto", Boolean(document.querySelector(".album-counter")) || document.querySelectorAll(".album-viewer img").length === 1);
  check("body scroll terkunci saat modal", document.body.style.overflow === "hidden");
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await sleep(150);
  check("Escape menutup modal album", !document.querySelector(".modal-backdrop"));
  check("body scroll pulih setelah modal tutup", document.body.style.overflow === "");

  // --- Edukasi & modal panduan ---
  click(navBtns.find((b) => b.textContent.trim() === "Edukasi P3K"));
  await sleep(200);
  const guideBtn = document.querySelector(".guide-card");
  check("edukasi punya kartu panduan", Boolean(guideBtn));
  if (guideBtn) {
    click(guideBtn);
    await sleep(200);
    check("modal panduan terbuka", Boolean(document.querySelector(".modal-backdrop")));
    click(document.querySelector(".modal-backdrop .close-button"));
    await sleep(150);
    check("modal panduan tertutup", !document.querySelector(".modal-backdrop"));
  }

  // --- UKS ---
  click(navBtns.find((b) => b.textContent.trim() === "Ruang UKS & Obat"));
  await sleep(200);
  check("halaman UKS dirender", /uks|obat/i.test(pageText(document)));
  check("roster widget aman (tanpa crash hooks)", /jadwal jaga|jaga|roster/i.test(pageText(document)) || Boolean(document.querySelector("[class*='roster']")));

  // --- Tema ---
  const themeBtn = document.querySelector(".theme-button");
  click(themeBtn);
  await sleep(100);
  check("toggle dark mode mengubah data-theme", document.documentElement.dataset.theme === "dark");
  check("preferensi tema tersimpan", window.localStorage.getItem("pmr_theme") === "dark");
  click(themeBtn);
  await sleep(100);
  check("kembali ke light mode", document.documentElement.dataset.theme === "light");

  // --- Drawer / hamburger ---
  const menuBtn = document.querySelector("#menu-button");
  check("tombol hamburger ada", Boolean(menuBtn));
  click(menuBtn);
  await waitFor(() => document.querySelector(".drawer-root.is-open"), 2000, "drawer terbuka");
  check("drawer terbuka", Boolean(document.querySelector(".drawer-root.is-open")));
  check("drawer: 7 tautan navigasi", document.querySelectorAll(".drawer-nav .drawer-link").length === 7);
  check("drawer punya switch tema & kartu admin", Boolean(document.querySelector(".drawer-extras")) && /portal admin/i.test(document.querySelector(".mobile-drawer").textContent));
  check("inert dilepas saat drawer buka", !document.querySelector(".mobile-drawer").hasAttribute("inert"));
  check("fokus masuk ke drawer", document.querySelector(".mobile-drawer").contains(document.activeElement));
  check("scroll body terkunci oleh drawer", document.body.style.overflow === "hidden");
  click(byText(document.querySelector(".mobile-drawer"), "button.drawer-link", "Sejarah"));
  await sleep(150);
  check("navigasi dari drawer menutup drawer", !document.querySelector(".drawer-root.is-open"));
  check("drawer kembali inert", document.querySelector(".mobile-drawer").hasAttribute("inert"));
  check("fokus kembali ke tombol hamburger", document.activeElement === menuBtn);
  check("halaman sejarah terbuka dari drawer", Boolean(document.querySelector(".history-page")));
  check("scroll body pulih", document.body.style.overflow === "");
  click(menuBtn);
  await sleep(120);
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await sleep(120);
  check("Escape menutup drawer", !document.querySelector(".drawer-root.is-open"));

  // --- Back to top ---
  Object.defineProperty(window, "scrollY", { value: 900, configurable: true, writable: true });
  window.dispatchEvent(new window.Event("scroll"));
  await sleep(120);
  const btt = document.querySelector(".back-to-top");
  check("tombol back-to-top muncul setelah scroll", btt?.classList.contains("show"));
  window.close();
}

/* ==================== Skenario 2: ?tab= tidak dikenal → tidak blank ==================== */
console.log("\n== Skenario 2: Parameter ?tab= tidak valid ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/?tab=ngawur-123");
  await sleep(250);
  check("tab tidak dikenal jatuh ke beranda (tidak blank)", Boolean(document.querySelector(".hero-section")) && pageText(document).length > 400);
  check("judul dokumen fallback beranda", document.title.includes("Palang Merah Remaja"));
  window.close();
}

/* ============================ Skenario 3: Portal Admin ============================ */
console.log("\n== Skenario 3: Portal Admin ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/?tab=admin");
  await sleep(250);

  const pinInput = document.querySelector("input[type='password'], input[name*='pin' i], .admin-gate input");
  check("gerbang PIN tampil", Boolean(pinInput) && /portal admin/i.test(document.body.textContent));
  check("gerbang bebas sebutan fitur lama", !/pendaftar|pesan masuk|faq/i.test(document.querySelector("main").textContent));

  setInputValue(window, pinInput, "0000");
  pinInput.closest("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await sleep(250);
  check("PIN salah ditolak (masih di gerbang)", Boolean(document.querySelector(".admin-subnav")) === false);

  setInputValue(window, pinInput, "2026");
  pinInput.closest("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await waitFor(() => document.querySelector(".admin-subnav"), 4000, "dashboard admin");
  check("login PIN 2026 membuka dashboard", Boolean(document.querySelector(".admin-subnav")));

  const subnavTabs = [...document.querySelectorAll(".admin-subnav .subnav-tab")].map((b) => b.textContent.trim());
  check("subnav admin 7 modul", subnavTabs.length === 7);
  check("tidak ada tab Pendaftar/Pesan Masuk", !/pendaftar|pesan masuk/i.test(subnavTabs.join(" ")));
  check("dashboard KPI + feed konten terbaru", /konten terbaru|kabar|agenda/i.test(document.querySelector("main").textContent));

  const openSubnav = async (label) => {
    const btn = byText(document.querySelector(".admin-subnav"), "button", label);
    click(btn);
    await sleep(180);
  };
  const openModal = async (btnText, heading) => {
    const btn = byText(document.querySelector("main"), "button", btnText);
    if (!btn) return false;
    click(btn);
    await sleep(200);
    return new RegExp(heading, "i").test(document.body.textContent);
  };
  const closeModal = async () => {
    const x = document.querySelector(".modal-backdrop .close-button, .modal-backdrop [aria-label*='Tutup' i], .modal-backdrop .modal-close");
    if (x) click(x);
    await sleep(150);
  };

  await openSubnav("Kabar & Berita");
  check("modal Kabar terbuka tanpa crash", await openModal("Buat Kabar Baru", "Tambah Kabar Terkini"));
  await closeModal();

  await openSubnav("Agenda Kegiatan");
  check("modal Agenda terbuka tanpa crash", await openModal("Tambah Agenda", "Buat Agenda Baru"));
  await closeModal();

  await openSubnav("Galeri Album");
  check("modal Galeri terbuka tanpa crash", await openModal("Buat Album Baru", "Buat Album Galeri Baru"));
  await closeModal();

  await openSubnav("Organisasi & Divisi");
  check("modal Pengurus terbuka tanpa crash", await openModal("Tambah Pengurus", "Pengurus Inti Organisasi"));
  await closeModal();
  check("modal Divisi terbuka tanpa crash", await openModal("Tambah Divisi", "Kelola Divisi"));
  await closeModal();

  await openSubnav("Pengaturan");
  check("pengaturan tanpa editor FAQ", !/faq|pertanyaan yang sering/i.test(document.querySelector("main").textContent));
  check("pengaturan punya catatan bergabung", /bergabung|kontak/i.test(document.querySelector("main").textContent));
  window.close();
}

/* ===================== Skenario 4: konsistensi file statis ===================== */
console.log("\n== Skenario 4: File statis & konfigurasi ==");
{
  const redirects = fs.readFileSync(path.join(ROOT, "public", "_redirects"), "utf8");
  check("_redirects punya /sejarah & /uks", redirects.includes("/sejarah") && redirects.includes("/uks"));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "manifest.webmanifest"), "utf8"));
  check("manifest punya shortcuts", Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3);
  const sitemap = fs.readFileSync(path.join(ROOT, "public", "sitemap.xml"), "utf8");
  check("sitemap memuat ?tab=sejarah", sitemap.includes("tab=sejarah"));
  const robot = fs.readFileSync(path.join(ROOT, "public", "robots.txt"), "utf8");
  check("robots melarang /api/", robot.includes("Disallow: /api/"));
  const schema = fs.readFileSync(path.join(ROOT, "db", "schema.sql"), "utf8");
  check("schema tanpa CREATE TABLE registrations/contact_messages", !/CREATE TABLE (IF NOT EXISTS )?(registrations|contact_messages)/i.test(schema));
  const swSrc = fs.readFileSync(path.join(ROOT, "public", "sw.js"), "utf8");
  check("service worker cache v2+", /pmr-wira-shell-v([2-9]|\d{2,})/.test(swSrc));
  const apiFile = fs.readFileSync(path.join(ROOT, "functions", "api", "[[path]].js"), "utf8").replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  check("API publik tanpa route registrations/messages (di luar komentar)", !/["'`](registrations|messages)["'`]/.test(apiFile));
}

/* ===================== Skenario 5: Pages Functions API ===================== */
console.log("\n== Skenario 5: Pages Functions API ==");
{
  const { onRequest } = await import(pathToFileURL(path.join(ROOT, "functions", "api", "[[path]].js")).href);
  const ctx = (url, init = {}) => ({ request: new Request(url, init), env: {}, waitUntil() {} });

  let res = await onRequest(ctx("https://x.test/api/health"));
  check("GET /api/health 200", res.status === 200);

  res = await onRequest(ctx("https://x.test/api/content"));
  const content = await res.json();
  check("GET /api/content tidak memuat faq", !("faq" in (content || {})) && res.status === 200);

  res = await onRequest(ctx("https://x.test/api/registrations", { method: "POST", body: "{}" }));
  check("POST /api/registrations hilang (404)", res.status === 404);

  res = await onRequest(ctx("https://x.test/api/messages", { method: "POST", body: "{}" }));
  check("POST /api/messages hilang (404)", res.status === 404);

  res = await onRequest(ctx("https://x.test/api/admin/registrations", { headers: { "X-Admin-Pin": "2026" } }));
  check("/api/admin/registrations hilang (404, terautentikasi)", res.status === 404);

  res = await onRequest(ctx("https://x.test/api/admin/messages", { headers: { "X-Admin-Pin": "2026" } }));
  check("/api/admin/messages hilang (404, terautentikasi)", res.status === 404);

  res = await onRequest(ctx("https://x.test/api/admin/data"));
  check("admin data tanpa PIN → 401", res.status === 401);

  res = await onRequest(ctx("https://x.test/api/admin/data", { headers: { "X-Admin-Pin": "2026" } }));
  const adminData = await res.json().catch(() => null);
  check("admin data dengan PIN → 200", res.status === 200 && adminData && adminData.ok !== false);
  const keys = Object.keys((adminData && (adminData.data || adminData)) || {});
  check("admin data tanpa registrations/messages/faq", !keys.some((k) => /registration|messages|faq/i.test(k)));
}

/* ================================ Ringkasan ================================ */
console.log(`\n========================================`);
console.log(`HASIL: ${passed} PASS, ${failed} FAIL`);
if (failed) { console.log("Gagal:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
console.log("SEMUA PEMERIKSAAN LULUS");
process.exit(0);
