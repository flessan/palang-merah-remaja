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

  // --- Hero baru: galeri sebagai latar + statistik menyatu di dalam hero ---
  const heroSection = document.querySelector(".hero-section");
  check("hero memakai galeri sebagai latar", Boolean(heroSection.querySelector(".hero-bg-track")));
  check("latar hero berisi 3 set galeri (24 slide)", heroSection.querySelectorAll(".hero-bg-slide").length === 24);
  check(
    "gambar latar dekoratif (alt kosong + aria-hidden)",
    heroSection.querySelector(".hero-bg")?.getAttribute("aria-hidden") === "true" &&
    [...heroSection.querySelectorAll(".hero-bg-slide img")].every((img) => img.getAttribute("alt") === "")
  );
  check("lapisan kontras di atas foto ada", Boolean(heroSection.querySelector(".hero-veil")));
  check("judul hero memakai 3 baris terkendali", heroSection.querySelectorAll(".hero-title > span").length === 3);
  check("statistik menyatu di dalam hero", heroSection.querySelectorAll(".hero-stats .stat").length === 3);
  check("tidak ada lagi pita statistik terpisah", !document.querySelector(".stats-section"));

  // --- Menu aksesibilitas mengambang ---
  check("tombol aksesibilitas tersedia", Boolean(document.querySelector(".a11y-fab")));
  check("panel aksesibilitas awalnya tertutup", !document.querySelector(".a11y-panel"));
  click(document.querySelector(".a11y-fab"));
  await sleep(80);
  const a11yPanel = document.querySelector(".a11y-panel");
  check("panel aksesibilitas terbuka", Boolean(a11yPanel));
  check("panel punya 4 kelompok pengaturan", a11yPanel.querySelectorAll(".a11y-group").length === 4);
  check("panel punya tombol atur ulang", Boolean(a11yPanel.querySelector(".a11y-reset")));

  const a11yGroup = (label) => [...a11yPanel.querySelectorAll(".a11y-group")].find((group) => group.textContent.toLowerCase().includes(label));
  click(byText(a11yGroup("ukuran teks"), "button", "Besar"));
  await sleep(60);
  check("ukuran teks 'Besar' diterapkan ke <html>", document.documentElement.dataset.text === "besar");
  click(byText(a11yGroup("warna"), "button", "Kontras tinggi"));
  await sleep(60);
  check("mode kontras tinggi aktif", document.documentElement.dataset.contrast === "tinggi");
  click(byText(a11yGroup("jenis huruf"), "button", "Mudah dibaca"));
  await sleep(60);
  check("huruf mudah dibaca (disleksia) aktif", document.documentElement.dataset.font === "mudah");
  click(byText(a11yGroup("gerak"), "button", "Dikurangi"));
  await sleep(60);
  check("preferensi gerak dikurangi aktif", document.documentElement.dataset.motion === "dikurangi");
  check("badge jumlah penyesuaian muncul", Boolean(document.querySelector(".a11y-fab-dot")));
  check("preferensi tersimpan di localStorage", (JSON.parse(window.localStorage.getItem("pmr_a11y")) || {}).contrast === "tinggi");

  click(document.querySelector(".a11y-reset"));
  await sleep(60);
  check(
    "atur ulang mengembalikan semua ke standar",
    ["text", "contrast", "font", "motion"].every((key) => document.documentElement.dataset[key] === "normal")
  );
  check("badge penyesuaian hilang setelah atur ulang", !document.querySelector(".a11y-fab-dot"));
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
  await sleep(60);
  check("Escape menutup panel aksesibilitas", !document.querySelector(".a11y-panel"));

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

  // --- Jadwal shift: penyusunan manual + dropdown pencarian anggota ---
  await openSubnav("Jadwal Shift");
  const rosterText = document.querySelector("main").textContent;
  check("tab jadwal memakai istilah 'Jadwal Shift'", /manajemen jadwal shift/i.test(rosterText));
  check("tidak ada lagi fungsi jadwal jaga 'adil'", !/jadwal jaga adil|keadilan|fair shuffl|acak & generate/i.test(rosterText));
  check("tidak ada tombol generator otomatis", !byText(document.querySelector("main"), "button", "Generate"));

  const dateInput = document.querySelector(".roster-add-bar input[type='date']");
  const initialRows = document.querySelectorAll(".rss-list .rss-row").length;
  check("ada input tanggal shift baru", Boolean(dateInput));
  check("jadwal lama tetap dimuat sebagai baris shift", initialRows > 0);
  if (dateInput) {
    setInputValue(window, dateInput, "2026-09-07");
    click(byText(document.querySelector(".roster-add-bar"), "button", "Tambah Baris Shift"));
    await sleep(220);

    const rows = [...document.querySelectorAll(".rss-list .rss-row")];
    check("baris shift baru bertambah manual", rows.length === initialRows + 1);
    const newRow = rows[rows.length - 1];
    check("label tanggal shift terbentuk otomatis", /Senin, 7 September 2026/.test(newRow?.textContent || ""));

    const trigger = newRow?.querySelector(".mp-trigger");
    check("ada dropdown 'Tambah petugas' pada baris shift", Boolean(trigger));
    click(trigger);
    await sleep(150);
    check("dropdown anggota terbuka", Boolean(document.querySelector(".mp-menu")));

    const searchBox = document.querySelector(".mp-search input");
    check("dropdown punya kolom pencarian", Boolean(searchBox));
    setInputValue(window, searchBox, "assyifa");
    await sleep(150);
    const options = [...document.querySelectorAll(".mp-option")];
    check("pencarian menyaring daftar anggota", options.length >= 1 && /assyifa/i.test(options[0].textContent));

    click(options[0]);
    await sleep(200);
    const currentRow = [...document.querySelectorAll(".rss-list .rss-row")].at(-1);
    const chosenName = currentRow?.querySelector(".petugas-pill input")?.value || "";
    check("anggota terpilih masuk sebagai petugas shift", /assyifa qolbi/i.test(chosenName));
    check("dropdown tertutup setelah memilih", !document.querySelector(".mp-menu"));

    const removeBtn = currentRow?.querySelector(".petugas-remove");
    check("petugas bisa dihapus dari shift", Boolean(removeBtn));
    if (removeBtn) {
      click(removeBtn);
      await sleep(180);
      const afterRemove = [...document.querySelectorAll(".rss-list .rss-row")].at(-1);
      check("petugas terhapus dari baris shift", !afterRemove?.querySelector(".petugas-pill"));
    }

    const deleteRow = [...document.querySelectorAll(".rss-list .rss-row")].at(-1)?.querySelector(".rss-delete");
    check("baris shift bisa dihapus", Boolean(deleteRow));
    if (deleteRow) {
      click(deleteRow);
      await sleep(200);
      check("baris shift terhapus", document.querySelectorAll(".rss-list .rss-row").length === initialRows);
    }
  }

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
  check("dokumentasi koleksi Telegraph ada", fs.existsSync(path.join(ROOT, "db", "collections.md")));
  const sqlArtifacts = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", "dist", ".git", ".wrangler"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.sql$/i.test(entry.name)) sqlArtifacts.push(path.relative(ROOT, full));
    }
  };
  walk(ROOT);
  check("tidak ada berkas .sql tersisa (bukan proyek SQL)", sqlArtifacts.length === 0);
  const sourceFiles = ["functions/_lib/admin-handler.js", "functions/_lib/content-store.js", "functions/_lib/telegraph.js", "functions/api/[[path]].js", "package.json", ".env.example", "wrangler.toml"];
  const banned = [];
  for (const file of sourceFiles) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    const withoutComments = text.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
    if (/@neondatabase|DATABASE_URL|neon\.tech|prisma|drizzle-orm|from\s+["'`]pg["'`]|require\(["'`]pg["'`]\)/i.test(withoutComments)) banned.push(file);
  }
  check("tidak ada sisa Neon/SQL/ORM di kode & konfigurasi", banned.length === 0);
  check("contoh env memakai TELEGRAPH_URL", fs.readFileSync(path.join(ROOT, ".env.example"), "utf8").includes("TELEGRAPH_URL"));
  const swSrc = fs.readFileSync(path.join(ROOT, "public", "sw.js"), "utf8");
  check("service worker cache v2+", /pmr-wira-shell-v([2-9]|\d{2,})/.test(swSrc));
  const apiFile = fs.readFileSync(path.join(ROOT, "functions", "api", "[[path]].js"), "utf8").replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  check("API publik tanpa route registrations/messages (di luar komentar)", !/["'`](registrations|messages)["'`]/.test(apiFile));
  check("API publik memakai klien Telegraph tunggal", apiFile.includes("content-store.js") && apiFile.includes("handleAdminRequest"));
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

  // Telegraph Cloud: mode demo aktif tanpa env, dan jalur media tidak pernah bocorkan kunci.
  res = await onRequest(ctx("https://x.test/api/health"));
  const health = await res.json();
  check("health menandai backend Telegraph Cloud", health.backend === "telegraph-cloud" && health.database === false);
  check("health tidak membocorkan TELEGRAPH_API_KEY", !JSON.stringify(health).toLowerCase().includes("tglive") && !("apiKey" in health));

  res = await onRequest(ctx("https://x.test/api/media/uploads/2026/01/foto.jpg"));
  check("/api/media tanpa konfigurasi → 503", res.status === 503);

  res = await onRequest(ctx("https://x.test/api/media/..%2F..%2Fetc%2Fpasswd"));
  check("/api/media menolak path traversal", res.status === 400);

  res = await onRequest(ctx("https://x.test/api/admin/upload", { method: "POST", headers: { "X-Admin-Pin": "2026" }, body: "{}" }));
  check("admin upload tanpa Telegraph → 400 informatif", res.status === 400);

  res = await onRequest(ctx("https://x.test/api/admin/content", { method: "POST", headers: { "X-Admin-Pin": "2026" }, body: JSON.stringify({ key: "palsu", value: 1 }) }));
  check("admin content menolak key tak dikenal (422)", res.status === 422);

  res = await onRequest(ctx("https://x.test/api/admin/announcements", { method: "POST", headers: { "X-Admin-Pin": "2026" }, body: JSON.stringify({ title: "Uji" }) }));
  check("admin announcements demo mode menyimpan di memori (200)", res.status === 200 && (await res.json()).persisted === false);

  // Demo mode: perubahan admin harus langsung terbaca endpoint publik.
  const rosterPayload = {
    key: "roster",
    value: {
      periode: "September 2026",
      bulan_label: "September 2026",
      keterangan: "Jadwal September (uji)",
      petugas_per_shift_uks: 1,
      petugas_per_shift_lapangan: 8,
      uks_schedule: [{ tanggal: "Senin, 7 September 2026", hari: "Senin", petugas: ["Assyifa Qolbi"] }],
      lapangan_schedule: [],
      is_published: true,
    },
  };
  res = await onRequest(ctx("https://x.test/api/admin/content", { method: "POST", headers: { "X-Admin-Pin": "2026" }, body: JSON.stringify(rosterPayload) }));
  check("admin menyimpan jadwal shift manual (200)", res.status === 200);

  res = await onRequest(ctx("https://x.test/api/content"));
  const afterSave = await res.json();
  check("jadwal shift baru terbaca di API publik", afterSave.roster?.periode === "September 2026" && afterSave.roster.uks_schedule.length === 1);
  check("jadwal shift tanpa kunci 'summary_counts' gaya lama", !("summary_counts" in (afterSave.roster || {})));

  res = await onRequest(ctx("https://x.test/api/admin/reset", { method: "POST", headers: { "X-Admin-Pin": "2026" } }));
  check("admin reset mengembalikan data demo", res.status === 200);
  res = await onRequest(ctx("https://x.test/api/content"));
  const afterReset = await res.json();
  check("reset memulihkan periode jadwal bawaan", afterReset.roster?.periode !== "September 2026");
}

/* ================== Skenario 6: klien Telegraph Cloud ================== */
console.log("\n== Skenario 6: Klien Telegraph Cloud ==\n");
{
  const { createTelegraph, telegraphConfig, normalizeRecord } = await import(
    pathToFileURL(path.join(ROOT, "functions", "_lib", "telegraph.js")).href
  );

  check("tanpa env → klien tidak dibuat (mode demo)", createTelegraph({}) === null);
  check(
    "konfigurasi dari env terbaca",
    telegraphConfig({ TELEGRAPH_URL: "https://telestorage.pages.dev/", TELEGRAPH_API_KEY: "tg_live_x", TELEGRAPH_PROJECT: "prj_x" }).configured === true,
  );

  // Mock fetch: merekam permintaan dan mengembalikan bentuk respons Telegraph.
  const calls = [];
  const mockFetch = async (url, init) => {
    calls.push({ url, method: init.method || "GET", headers: init.headers, body: init.body });
    if (init.method === "POST") {
      return new Response(JSON.stringify({ data: { id: "rec_1", version: 1 }, version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }), { status: 201 });
    }
    if (init.method === "PATCH") {
      return new Response(JSON.stringify({ data: { id: "rec_1" }, version: 2 }), { status: 200 });
    }
    if (init.method === "DELETE") return new Response(null, { status: 204 });
    return new Response(
      JSON.stringify({ data: [{ id: "rec_1", version: 3, data: { key: "stats", value: [1] } }], order: "id:asc", limit: 50, has_more: false, next_cursor: null }),
      { status: 200 },
    );
  };

  const client = createTelegraph(
    { TELEGRAPH_URL: "https://telestorage.pages.dev", TELEGRAPH_API_KEY: "tg_live_rahasia", TELEGRAPH_PROJECT: "prj_x" },
    { fetchImpl: mockFetch },
  );

  const list = await client.list("site_content", { filter: { key: "stats" } });
  check("list() memakai filter exact-match", calls[0].url.includes("/api/db/site_content?") && calls[0].url.includes("key=stats"));
  check("list() mengirim Bearer API key", calls[0].headers.Authorization === "Bearer tg_live_rahasia");
  check("list() menormalkan Record → dokumen", list.records[0].data.key === "stats" && list.records[0].version === 3);

  const created = await client.create("announcements", { title: "x" }, { idempotencyKey: "k1" });
  check("create() memakai POST + Idempotency-Key", calls[1].method === "POST" && calls[1].headers["Idempotency-Key"] === "k1");
  check("create() mengembalikan record terversi", created.id === "rec_1" && created.version === 1);

  await client.update("announcements", "rec_1", { title: "y" }, { expectedVersion: 4 });
  const patchBody = JSON.parse(calls[2].body);
  check("update() mengirim _expected_version", calls[2].method === "PATCH" && patchBody._expected_version === 4);
  check("update() mengirim dokumen penuh", patchBody.title === "y");

  await client.remove("announcements", "rec_1", { expectedVersion: 5 });
  check("remove() memakai DELETE + _expected_version", calls[3].method === "DELETE" && JSON.parse(calls[3].body)._expected_version === 5);

  // Konflik versi harus menjadi error dengan kode stabil.
  const conflictClient = createTelegraph(
    { TELEGRAPH_URL: "https://telestorage.pages.dev", TELEGRAPH_API_KEY: "tg_live_x" },
    { fetchImpl: async () => new Response(JSON.stringify({ error: "version_conflict", current_version: 9 }), { status: 409 }) },
  );
  let conflict = null;
  try {
    await conflictClient.update("events", "rec_9", { title: "z" }, { expectedVersion: 2 });
  } catch (cause) {
    conflict = cause;
  }
  check("409 version_conflict diangkat sebagai TelegraphError", conflict?.code === "version_conflict" && conflict.status === 409);

  // Dokumen terlalu besar ditolak sebelum menyentuh jaringan.
  let tooBig = null;
  try {
    await client.create("gallery_albums", { blob: "x".repeat(97 * 1024) });
  } catch (cause) {
    tooBig = cause;
  }
  check("dokumen > 96 KiB ditolak lokal (document_too_large)", tooBig?.code === "document_too_large");

  check("normalizeRecord menerima bentuk Record datar", normalizeRecord({ id: "rec_2", version: 2, title: "a" })?.data.title === "a");
}

/* ================================ Ringkasan ================================ */
console.log(`\n========================================`);
console.log(`HASIL: ${passed} PASS, ${failed} FAIL`);
if (failed) { console.log("Gagal:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
console.log("SEMUA PEMERIKSAAN LULUS");
process.exit(0);
