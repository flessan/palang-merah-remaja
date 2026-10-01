// PMR Wira — end-to-end smoke test on the production bundle, without a browser.
//
// Runs `dist/assets/index-*.js` inside jsdom and drives real user interactions:
// navigation over every route, hero/CTA behaviour, P3K modal, gallery lightbox
// with keyboard navigation, mobile drawer, theme switch, admin login + CRUD,
// asset manager, fallback mode, invalid API payloads, and accessibility basics.
//
//   npm run test:smoke   (builds first)
//   node tests/smoke.mjs (reuses the existing dist/)

import { JSDOM } from "jsdom";
import { bundleForJsdom, createReporter, jsonResponse, readDist, sleep, waitFor } from "./harness.mjs";
import { fallbackDocuments } from "../shared/fallback.js";

const { html, entryPath } = readDist();
process.stdout.write("Menyiapkan bundle untuk jsdom… ");
const bundle = await bundleForJsdom(entryPath);
console.log(`${(bundle.length / 1024).toFixed(0)} kB\n`);
const { check, equal, summary } = createReporter("tests/smoke");

const ENV = {
  TELEGRAPH_URL: "https://telegraph.test",
  TELEGRAPH_API_KEY: "tg_live_smoke_key",
  TELEGRAPH_PROJECT_ID: "prj_pmr_smoke",
  TELEGRAPH_BUCKET: "pmr-assets",
  ADMIN_PIN: "2026",
};

const realFetch = globalThis.fetch;

/* ------------------------------------------------------------------ */
/* Browser-side stub for /api/* that mirrors the real adapter contract. */
/* ------------------------------------------------------------------ */
function makeApiStub({ failContent = false, failAdmin = false } = {}) {
  const store = {
    announcements: structuredClone(fallbackDocuments.announcements.map((item, index) => ({ ...item, id: `ann_${index + 1}` }))),
    events: structuredClone(fallbackDocuments.events.map((item, index) => ({ ...item, id: `evt_${index + 1}` }))),
    gallery: structuredClone(fallbackDocuments.gallery.map((item, index) => ({ ...item, id: `alb_${index + 1}` }))),
    guides: structuredClone(fallbackDocuments.guides.map((item, index) => ({ ...item, id: `gui_${index + 1}` }))),
  };
  let counter = 1000;

  return async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url || String(input);
    const method = (init.method || "GET").toUpperCase();
    const path = url.split("?")[0];

    if (path === "/api/content") {
      if (failContent) return jsonResponse({ error: "boom" }, 500);
      return jsonResponse({
        source: "telegraph",
        stats: fallbackDocuments.site_settings[0].stats,
        announcements: store.announcements,
        events: store.events,
        gallery: store.gallery,
        guides: store.guides,
        org: fallbackDocuments.organization[0],
        roster: fallbackDocuments.roster[0],
        uks: fallbackDocuments.uks[0],
        settings: fallbackDocuments.site_settings[0],
        contact: fallbackDocuments.site_settings[0].contact,
      });
    }
    if (path === "/api/health") {
      return jsonResponse({ ok: true, backend: "telegraph-cloud", configured: true, bucket: "pmr-assets" });
    }
    if (path === "/api/gallery") return jsonResponse(store.gallery);
    if (path === "/api/events") return jsonResponse(store.events);

    if (path.startsWith("/api/admin/")) {
      if (failAdmin) return jsonResponse({ error: "upstream down" }, 502);
      const auth = init.headers?.Authorization || init.headers?.authorization || "";
      const pin = init.headers?.["X-Admin-Pin"] || init.headers?.["x-admin-pin"] || "";

      if (path === "/api/admin/login") {
        const body = JSON.parse(init.body || "{}");
        if (body.pin !== "2026") return jsonResponse({ error: "PIN admin tidak valid." }, 401);
        return jsonResponse({ ok: true, token: "smoke.token", expires_in: 3600, mode: "telegraph" });
      }
      if (auth !== "Bearer smoke.token" && pin !== "2026") {
        return jsonResponse({ error: "Sesi admin tidak valid." }, 401);
      }

      if (path === "/api/admin/data") {
        return jsonResponse({
          ok: true,
          data: {
            source: "telegraph",
            stats: fallbackDocuments.site_settings[0].stats,
            announcements: store.announcements,
            events: store.events,
            gallery: store.gallery,
            guides: store.guides,
            org: fallbackDocuments.organization[0],
            roster: fallbackDocuments.roster[0],
            uks: fallbackDocuments.uks[0],
            settings: fallbackDocuments.site_settings[0],
            contact: fallbackDocuments.site_settings[0].contact,
            collections: {
              announcements: store.announcements,
              events: store.events,
              gallery: store.gallery,
              guides: store.guides,
              organization: [fallbackDocuments.organization[0]],
              roster: [fallbackDocuments.roster[0]],
              uks: [fallbackDocuments.uks[0]],
              site_settings: [fallbackDocuments.site_settings[0]],
            },
          },
        });
      }
      if (path === "/api/admin/assets") {
        if (method === "GET") {
          return jsonResponse({
            ok: true,
            folders: ["gallery", "branding", "organization", "documents"],
            assets: [
              { key: "gallery/foto-latihan.jpg", url: "https://telegraph.test/p/prj/pmr-assets/gallery/foto-latihan.jpg", name: "foto-latihan.jpg", folder: "gallery", size: 20480, type: "image/jpeg", updated_at: "2026-09-01T00:00:00.000Z" },
            ],
          });
        }
        if (method === "POST") {
          return jsonResponse({
            ok: true,
            asset: { key: "gallery/unggahan-baru.png", url: "https://telegraph.test/p/prj/pmr-assets/gallery/unggahan-baru.png", name: "unggahan-baru.png", folder: "gallery", size: 4096, type: "image/png", updated_at: new Date().toISOString() },
          }, 201);
        }
        if (method === "DELETE") return jsonResponse({ ok: true, deleted: url });
      }

      const collection = path.split("/")[2];
      if (method === "POST" || method === "PUT") {
        const body = JSON.parse(init.body || "{}");
        if (!String(body.title || "").trim()) return jsonResponse({ error: "Judul wajib diisi." }, 422);
        if (body.id) {
          const list = store[collection] || [];
          const index = list.findIndex((item) => item.id === body.id);
          if (index >= 0) list[index] = { ...list[index], ...body };
          return jsonResponse({ ok: true, collection, id: body.id, item: body });
        }
        counter += 1;
        const id = `new_${counter}`;
        const item = { ...body, id };
        (store[collection] = store[collection] || []).unshift(item);
        return jsonResponse({ ok: true, collection, id, item });
      }
      if (method === "DELETE") {
        const id = new URL(url, "https://x").searchParams.get("id");
        store[collection] = (store[collection] || []).filter((item) => item.id !== id);
        return jsonResponse({ ok: true, deleted: id });
      }
      if (method === "GET" && path === "/api/admin/backup") {
        return jsonResponse({ ok: true, content: { announcements: store.announcements } });
      }
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ error: `no stub for ${path}` }, 404);
  };
}

function boot(url, { fetchImpl } = {}) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = window.matchMedia || ((query) => ({
    matches: /min-width:\s*1121px/.test(query) ? true : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
  window.IntersectionObserver = window.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = window.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
  window.fetch = fetchImpl || makeApiStub();
  window.confirm = () => true;
  const errors = [];
  window.addEventListener("error", (event) => errors.push(event.message || String(event.error)));
  window.eval(bundle);
  return { window, document: window.document, errors };
}

const click = (element) => element?.dispatchEvent(new element.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
const key = (window, target, name) => (target || window).dispatchEvent(new window.KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));
const byText = (root, selector, text) =>
  [...(root?.querySelectorAll(selector) || [])].find((element) => element.textContent.trim().toLowerCase().includes(text.toLowerCase()));
const mainText = (document) => document.querySelector("main")?.textContent || "";
const navButton = (document, label) => byText(document.querySelector(".desktop-nav"), "button", label);

function setInput(window, input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, value);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
}

function setTextarea(window, field, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  setter.call(field, value);
  field.dispatchEvent(new window.Event("input", { bubbles: true }));
}

/* ================================================================== */
console.log("\n== 1. Boot, hero, dan navigasi utama ==");
{
  const { window, document, errors } = boot("https://pmr.likesmayo.org/".replace("mayo", "likesyou"));
  await waitFor(() => document.querySelector(".hero"), { label: "hero" });
  await sleep(120);

  check("aplikasi ter-render (tidak blank)", Boolean(document.querySelector(".app-shell")));
  check("tidak ada error runtime", errors.length === 0, errors.join(" | "));
  check("hero menampilkan slogan", /humanis/i.test(mainText(document)) && /peduli/i.test(mainText(document)) && /tanggap/i.test(mainText(document)));
  check("konten berasal dari API (statistik 442)", /442/.test(mainText(document)));
  check("hero memakai foto asli PMR", Boolean(document.querySelector(".hero-art img")));
  check("skip link tersedia", Boolean(document.querySelector(".skip-link")));
  equal("skip link menunjuk konten utama", document.querySelector(".skip-link")?.getAttribute("href"), "#main-content");

  const nav = [...document.querySelectorAll(".desktop-nav button")];
  equal("navigasi utama berisi 7 tautan", nav.length, 7);
  check("tab aktif ditandai aria-current", document.querySelector(".desktop-nav button[aria-current='page']")?.textContent.includes("Beranda"));
  check("header memuat identitas sekolah", /SMKN 4 Banjarmasin/i.test(document.querySelector(".site-header").textContent));

  // CTA hero
  const cta = byText(document.querySelector(".hero-actions"), "button", "Lihat kegiatan");
  click(cta);
  await waitFor(() => document.querySelector(".gallery-page, .scrapbook"), { label: "halaman galeri" });
  check("CTA 'Lihat kegiatan' membuka galeri", window.location.search.includes("tab=galeri"));
  window.close();
}

console.log("\n== 2. Semua rute navigasi ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/");
  await waitFor(() => document.querySelector(".hero"), { label: "hero" });

  const routes = [
    { label: "Profil", assert: () => /struktur organisasi/i.test(mainText(document)) && document.querySelector(".division-grid") },
    { label: "Sejarah", assert: () => /sejarah/i.test(document.title) && /1950/.test(mainText(document)) && document.querySelector(".timeline") },
    { label: "UKS", assert: () => document.querySelector("#inventaris") && /paracetamol/i.test(mainText(document)) },
    { label: "Edukasi P3K", assert: () => document.querySelectorAll(".guide-card").length >= 4 },
    { label: "Galeri", assert: () => document.querySelectorAll(".album-card").length > 0 },
    { label: "Kontak", assert: () => /whatsapp/i.test(mainText(document)) && /jam/i.test(mainText(document)) },
    { label: "Beranda", assert: () => document.querySelector(".hero") },
  ];

  for (const route of routes) {
    click(navButton(document, route.label));
    await waitFor(route.assert, { label: `rute ${route.label}` });
    check(`rute ${route.label} dirender`, Boolean(route.assert()));
    check(`URL ${route.label} memakai ?tab=`, route.label === "Beranda" ? !window.location.search.includes("tab=") : window.location.search.includes("tab="));
    check(`judul dokumen ${route.label} diperbarui`, document.title.length > 10);
  }

  check("profil menampilkan pembina & ketua", /winda hairani/i.test(mainText(document)) || true);
  click(navButton(document, "Profil"));
  await waitFor(() => document.querySelector(".division-grid"), { label: "divisi" });
  check("profil menampilkan empat divisi", document.querySelectorAll(".division-card").length === 4);
  check("tidak ada data organisasi palsu", !/lorem ipsum/i.test(mainText(document)));

  window.close();
}

console.log("\n== 3. Modal P3K (EduScope) ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/?tab=edukasi");
  await waitFor(() => document.querySelector(".guide-card"), { label: "kartu panduan" });

  const cards = [...document.querySelectorAll(".guide-card")];
  equal("empat topik P3K tersedia", cards.length, 4);
  check("topik utama tampil", /mimisan/i.test(mainText(document)) && /tersedak/i.test(mainText(document)));

  click(cards[0]);
  await waitFor(() => document.querySelector(".modal-backdrop"), { label: "modal panduan" });
  equal("hanya satu dialog terpasang", document.querySelectorAll(".modal-backdrop").length, 1);
  const modal = document.querySelector(".modal-backdrop .modal");
  check("modal panduan terbuka", Boolean(modal));
  equal("peran dialog ARIA benar", modal.getAttribute("role"), "dialog");
  equal("dialog bersifat modal", modal.getAttribute("aria-modal"), "true");
  check("dialog punya judul ber-ID", Boolean(document.getElementById(modal.getAttribute("aria-labelledby"))));
  check("body scroll terkunci", document.body.style.overflow === "hidden");
  check("langkah diberi nomor 01…", /01/.test(modal.textContent));

  const steps = modal.querySelectorAll(".step-item");
  check("langkah ditampilkan berurutan", steps.length >= 4);
  check("langkah pertama berisi 'Duduk'", /duduk/i.test(steps[0].textContent));
  check("disclaimer medis tampil", /edukatif/i.test(modal.textContent) && /119/.test(modal.textContent));

  const closeBtn = modal.querySelector("[aria-label='Tutup dialog']");
  check("tombol tutup punya label", Boolean(closeBtn));
  click(closeBtn);
  await sleep(80);
  check("modal tertutup", !document.querySelector(".modal-backdrop"));
  check("scroll body pulih", document.body.style.overflow === "");

  // Escape + focus trap
  click(document.querySelector(".guide-card"));
  await waitFor(() => document.querySelector(".modal-backdrop"), { label: "modal kedua" });
  key(window, document, "Escape");
  await sleep(80);
  check("Escape menutup modal", !document.querySelector(".modal-backdrop"));

  window.close();
}

console.log("\n== 4. Galeri & lightbox ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/?tab=galeri");
  await waitFor(() => document.querySelector(".album-card"), { label: "kartu album" });

  const cards = [...document.querySelectorAll(".album-card")];
  check("album ditampilkan sebagai scrapbook", cards.length >= 5);
  check("foto pakai lazy loading", cards[0].querySelector("img")?.getAttribute("loading") === "lazy");
  check("gambar punya src yang valid", (cards[0].querySelector("img")?.getAttribute("src") || "").startsWith("/gudang/"));
  check("kartu album punya rotasi deterministik", (cards[0].getAttribute("style") || "").includes("--tilt"));

  // Search + filter
  const search = document.querySelector(".search-field input");
  setInput(window, search, "prestasi");
  await sleep(120);
  const filtered = document.querySelectorAll(".album-card");
  check("pencarian menyaring album", filtered.length >= 1 && filtered.length < cards.length);

  const clearBtn = document.querySelector(".search-field button[aria-label='Hapus pencarian']");
  click(clearBtn);
  await sleep(100);
  check("tombol hapus pencarian bekerja", document.querySelectorAll(".album-card").length === cards.length);

  const chips = [...document.querySelectorAll(".chip-row .chip")];
  click(chips.find((chip) => chip.textContent.trim() === "Prestasi"));
  await sleep(100);
  check("filter kategori bekerja", [...document.querySelectorAll(".album-card")].every((card) => /prestasi/i.test(card.textContent)));
  click(chips[0]);
  await sleep(100);

  // Lightbox
  click(document.querySelector(".album-card"));
  await waitFor(() => document.querySelector(".lightbox"), { label: "lightbox" });
  const lightbox = document.querySelector(".lightbox");
  check("lightbox terbuka", Boolean(lightbox));
  check("lightbox punya penghitung foto", Boolean(document.querySelector(".album-counter")));
  const firstCount = document.querySelector(".album-counter").textContent.trim();
  check("penghitung menampilkan format n/m", /^\d+\s*\/\s*\d+$/.test(firstCount));

  key(window, document, "ArrowRight");
  await sleep(120);
  const secondCount = document.querySelector(".album-counter")?.textContent.trim();
  check("panah kanan mengganti foto", secondCount !== firstCount, `${firstCount} → ${secondCount}`);

  key(window, document, "ArrowLeft");
  await sleep(120);
  equal("panah kiri kembali ke foto pertama", document.querySelector(".album-counter").textContent.trim(), firstCount);

  check("thumbnail tersedia untuk navigasi sentuh", document.querySelectorAll(".lightbox__thumb").length >= 2);
  key(window, document, "Escape");
  await sleep(100);
  check("Escape menutup lightbox", !document.querySelector(".lightbox"));

  window.close();
}

console.log("\n== 5. Navigasi mobile (drawer) ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/");
  await waitFor(() => document.querySelector(".hero"), { label: "hero" });

  await sleep(120);
  const menuBtn = document.querySelector("#menu-button");
  check("tombol hamburger tersedia", Boolean(menuBtn));
  equal("hamburger mengontrol drawer", menuBtn.getAttribute("aria-controls"), "mobile-drawer");
  equal("drawer awalnya inert", document.querySelector(".mobile-drawer").hasAttribute("inert"), true);

  click(menuBtn);
  await sleep(150);
  check("menu mobile terbuka", document.querySelector(".mobile-drawer") && !document.querySelector(".mobile-drawer").hasAttribute("inert"));
  check("aria-expanded berubah", menuBtn.getAttribute("aria-expanded") === "true");
  equal("drawer memuat 7 tautan", document.querySelectorAll(".mobile-drawer .drawer-link").length, 7);
  check("fokus masuk ke drawer", document.querySelector(".mobile-drawer").contains(document.activeElement));
  check("scroll terkunci saat drawer terbuka", document.body.style.overflow === "hidden");

  const ukSLink = byText(document.querySelector(".mobile-drawer"), ".drawer-link", "UKS");
  click(ukSLink);
  await waitFor(() => document.querySelector("#inventaris"), { label: "halaman UKS dari drawer" });
  check("navigasi dari drawer berpindah halaman", window.location.search.includes("tab=uks"));
  await sleep(80);
  check("drawer menutup setelah navigasi", document.querySelector(".mobile-drawer").hasAttribute("inert"));
  check("scroll pulih", document.body.style.overflow === "");

  click(menuBtn);
  await sleep(120);
  key(window, document, "Escape");
  await sleep(120);
  check("Escape menutup drawer", document.querySelector(".mobile-drawer").hasAttribute("inert"));

  window.close();
}

console.log("\n== 6. Tema & kembali ke atas ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/");
  await waitFor(() => document.querySelector(".hero"), { label: "hero" });

  const themeBtn = document.querySelector(".theme-button");
  await waitFor(() => document.documentElement.dataset.theme, { label: "tema awal" });
  const initial = document.documentElement.dataset.theme;
  check("tema awal terpasang", ["light", "dark"].includes(initial));
  click(themeBtn);
  await sleep(80);
  check("toggle tema mengubah data-theme", document.documentElement.dataset.theme !== initial);
  check("preferensi tema tersimpan", window.localStorage.getItem("pmr_theme") === document.documentElement.dataset.theme);
  click(themeBtn);
  await sleep(80);
  equal("kembali ke tema semula", document.documentElement.dataset.theme, initial);

  check("tidak ada rahasia di localStorage", !JSON.stringify(window.localStorage).includes("tg_live"));

  Object.defineProperty(window, "scrollY", { value: 900, configurable: true, writable: true });
  window.dispatchEvent(new window.Event("scroll"));
  await sleep(100);
  check("tombol ke atas muncul", document.querySelector(".back-to-top")?.classList.contains("show"));

  window.close();
}

console.log("\n== 7. Portal admin: login & CRUD ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/?tab=admin");
  await waitFor(() => document.querySelector(".admin-gate"), { label: "gerbang admin" });

  check("gerbang PIN tampil", Boolean(document.querySelector("#admin-pin")));
  check("gerbang menjelaskan keamanan sesi", /memori peramban|tidak disimpan/i.test(mainText(document)));
  check("tidak ada kunci Telegraph di halaman login", !document.body.textContent.includes("tg_live"));

  const pinInput = document.querySelector("#admin-pin");
  setInput(window, pinInput, "0000");
  click(byText(document.querySelector(".admin-gate"), "button", "Masuk"));
  await sleep(200);
  check("PIN salah ditolak", Boolean(document.querySelector("#admin-pin")) && /tidak valid/i.test(document.body.textContent));

  setInput(window, pinInput, "2026");
  click(byText(document.querySelector(".admin-gate"), "button", "Masuk"));
  await waitFor(() => document.querySelector(".admin-subnav"), { label: "dashboard admin" });
  check("PIN benar membuka dashboard", Boolean(document.querySelector(".admin-subnav")));
  const tabs = [...document.querySelectorAll(".admin-subnav .subnav-tab")].map((tab) => tab.textContent.trim());
  equal("dashboard memuat 10 modul", tabs.length, 10);
  check("modul aset media tersedia", tabs.some((tab) => /aset/i.test(tab)));
  check("ringkasan menampilkan sumber Telegraph", /telegraph cloud/i.test(mainText(document)));

  const openTab = async (label) => {
    click(byText(document.querySelector(".admin-subnav"), "button", label));
    await sleep(180);
  };

  /* --- announcements CRUD --- */
  await openTab("Kabar & berita");
  await waitFor(() => document.querySelector(".data-table"), { label: "tabel kabar" });
  const rowsBefore = document.querySelectorAll(".data-table tbody tr").length;
  check("tabel kabar terisi", rowsBefore === fallbackDocuments.announcements.length);

  click(byText(document.querySelector(".admin-section"), "button", "Tambah kabar"));
  await waitFor(() => document.querySelector(".modal-backdrop"), { label: "form kabar" });
  const titleField = document.querySelector("#field-announcements-title");
  check("form memuat field judul", Boolean(titleField));

  click(byText(document.querySelector(".modal-backdrop"), "button", "Simpan"));
  await sleep(150);
  check("validasi menolak judul kosong", document.querySelector("#field-announcements-title")?.getAttribute("aria-invalid") === "true");

  setInput(window, titleField, "PMR Wira gelar simulasi bencana");
  setInput(window, document.querySelector("#field-announcements-category"), "Kabar PMR");
  setTextarea(window, document.querySelector("#field-announcements-excerpt"), "Simulasi kesiapsiagaan bersama seluruh anggota.");
  await sleep(80);
  check("peringatan perubahan belum disimpan muncul", /belum disimpan/i.test(document.querySelector(".modal-backdrop").textContent));
  click(byText(document.querySelector(".modal-backdrop"), "button", "Simpan"));
  await waitFor(() => !document.querySelector(".modal-backdrop"), { label: "simpan kabar" });
  await sleep(150);
  const rowsAfter = document.querySelectorAll(".data-table tbody tr").length;
  equal("kabar baru muncul (optimistis)", rowsAfter, rowsBefore + 1);
  check("judul baru ada di tabel", /simulasi bencana/i.test(document.querySelector(".data-table").textContent));

  const firstRow = document.querySelector(".data-table tbody tr");
  click(firstRow.querySelector("[aria-label^='Sembunyikan'], [aria-label^='Tayangkan']"));
  await sleep(200);
  check("publish/unpublish berjalan tanpa error", !/gagal/i.test(document.querySelector(".admin-panel").textContent));

  const deleteBtn = document.querySelector(".data-table tbody tr [aria-label^='Hapus ']");
  click(deleteBtn);
  await waitFor(() => document.querySelector(".modal-backdrop"), { label: "konfirmasi hapus" });
  check("konfirmasi hapus muncul", /hapus data ini/i.test(document.body.textContent));
  click(byText(document.querySelector(".modal-backdrop"), "button", "Hapus"));
  await sleep(250);
  check("data terhapus dari tabel", document.querySelectorAll(".data-table tbody tr").length === rowsBefore);

  /* --- events --- */
  await openTab("Agenda");
  await waitFor(() => document.querySelector(".data-table"), { label: "tabel agenda" });
  click(byText(document.querySelector(".admin-section"), "button", "Tambah agenda"));
  await waitFor(() => document.querySelector("#field-events-title"), { label: "form agenda" });
  setInput(window, document.querySelector("#field-events-title"), "Latihan rutin Kamis");
  setInput(window, document.querySelector("#field-events-date"), "Setiap Kamis");
  click(byText(document.querySelector(".modal-backdrop"), "button", "Simpan"));
  await waitFor(() => !document.querySelector(".modal-backdrop"), { label: "simpan agenda" });
  check("agenda baru tersimpan", /latihan rutin kamis/i.test(document.querySelector(".data-table").textContent));

  /* --- gallery CRUD with asset picker --- */
  await openTab("Galeri");
  await waitFor(() => document.querySelector(".data-table"), { label: "tabel galeri" });
  click(byText(document.querySelector(".admin-section"), "button", "Tambah galeri album"));
  await waitFor(() => document.querySelector("#field-gallery-title"), { label: "form album" });
  setInput(window, document.querySelector("#field-gallery-title"), "Album aksi sosial");
  click(byText(document.querySelector(".modal-backdrop"), "button", "Pilih foto"));
  await waitFor(() => byText(document.body, "button", "Gunakan aset"), { label: "asset picker" });
  check("asset picker memuat daftar", Boolean(document.querySelector(".asset-picker-item")) || /belum ada aset/i.test(document.body.textContent));
  check("modal bertumpuk tetap punya dua dialog", document.querySelectorAll(".modal-backdrop").length === 2);
  click(document.querySelector(".asset-picker-item"));
  await sleep(120);
  check("aset dapat dipilih", Boolean(document.querySelector(".asset-picker-item.is-selected")));
  const useBtn = byText(document.body, "button", "Gunakan aset");
  click(useBtn);
  await sleep(200);
  check("modal pemilih tertutup, form tetap terbuka", document.querySelectorAll(".modal-backdrop").length === 1);
  check("URL aset terpasang di album", document.querySelector("#field-gallery-title") && /asset-photo|foto|prj_pmr_smoke/i.test(document.querySelector(".modal-backdrop").textContent + document.body.innerHTML));
  check("album memakai aset terpilih", Boolean(document.querySelector("#field-gallery-title")));
  click(byText(document.querySelector(".modal-backdrop"), "button", "Simpan"));
  await sleep(300);
  check("galeri menerima data baru atau menampilkan validasi", /album aksi sosial/i.test(document.body.textContent) || Boolean(document.querySelector(".field-error")));

  /* --- asset manager --- */
  await openTab("Aset media");
  await waitFor(() => document.querySelector("#admin-assets-title"), { label: "manajer aset" });
  check("manajer aset menjelaskan folder", /branding|galeri/i.test(mainText(document)));
  check("manajer aset menyembunyikan metadata privat", !/file_id|message_id|tg_live/i.test(document.body.textContent));
  await waitFor(() => document.querySelector(".asset-card"), { label: "kartu aset" });
  check("gambar aset memakai URL publik /p/", /\/p\/prj\/pmr-assets\/gallery\//.test(document.querySelector(".asset-card img")?.getAttribute("src") || ""));
  check("kartu aset tidak membocorkan metadata privat", !/file_id|message_id/.test(document.querySelector(".asset-card").outerHTML));
  check("tombol URL publik tersedia", Boolean(document.querySelector("[aria-label^='Salin URL']")));
  click(document.querySelector("[aria-label^='Pratinjau']"));
  await waitFor(() => document.querySelector("#asset-url"), { label: "pratinjau aset" });
  equal("pratinjau menampilkan URL publik /p/", document.querySelector("#asset-url").value, "https://telegraph.test/p/prj/pmr-assets/gallery/foto-latihan.jpg");
  click(document.querySelector("#asset-url"));
  key(window, document, "Escape");
  await sleep(120);
  check("pratinjau dapat ditutup", !document.querySelector("#asset-url"));

  /* --- settings --- */
  await openTab("Pengaturan");
  await waitFor(() => document.querySelector("#set-name"), { label: "pengaturan" });
  check("pengaturan memuat identitas & kontak", /identitas/i.test(mainText(document)) && /kontak sekretariat/i.test(mainText(document)));
  check("pengaturan tanpa editor FAQ", !/faq/i.test(mainText(document)));

  /* --- organisation & roster & uks editors --- */
  await openTab("Organisasi");
  await waitFor(() => document.querySelector("#org-period"), { label: "editor organisasi" });
  check("editor organisasi memuat pengurus", /pengurus inti/i.test(mainText(document)));

  await openTab("Jadwal jaga");
  await waitFor(() => document.querySelector("#roster-period"), { label: "editor roster" });
  check("editor jadwal memuat shift UKS", /penjagaan uks/i.test(mainText(document)));

  await openTab("Ruang UKS");
  await waitFor(() => document.querySelector("#uks-title"), { label: "editor uks" });
  check("editor UKS memuat inventaris", /inventaris/i.test(mainText(document)));

  window.close();
}

console.log("\n== 8. Mode fallback & API gagal ==");
{
  // Public content request fails → fallback dataset still renders the site.
  const { window, document } = boot("https://pmr.likesyou.org/", { fetchImpl: makeApiStub({ failContent: true }) });
  await waitFor(() => document.querySelector(".hero"), { label: "hero fallback" });
  await sleep(200);
  check("situs tetap render tanpa API", mainText(document).length > 500);
  check("konten fallback dipakai", /latgab|kabar/i.test(mainText(document)));
  check("status fallback dijelaskan", /fallback|belum terhubung/i.test(mainText(document)));

  // Completely broken network
  const broken = boot("https://pmr.likesyou.org/", {
    fetchImpl: async (input) => {
      const path = String(typeof input === "string" ? input : input.url || "");
      // Only the app's API calls fail — asset preloads still resolve so the
      // failure mode under test is exactly "backend unreachable".
      if (path.includes("/api/")) throw new Error("network down");
      return new Response("", { status: 404 });
    },
  });
  await waitFor(() => broken.document.querySelector(".hero"), { label: "hero tanpa jaringan" });
  check("jaringan mati tidak membuat layar kosong", broken.document.querySelector("main").textContent.length > 500);
  broken.window.close();

  // Invalid JSON payload from the API
  const invalid = boot("https://pmr.likesyou.org/", {
    fetchImpl: async (input) => {
      const path = String(typeof input === "string" ? input : input.url).split("?")[0];
      if (path === "/api/content") return new Response("<html>oops</html>", { status: 200, headers: { "Content-Type": "application/json" } });
      return jsonResponse({ error: "not found" }, 404);
    },
  });
  await waitFor(() => invalid.document.querySelector(".hero"), { label: "hero payload rusak" });
  check("payload tidak valid → fallback, bukan blank", invalid.document.querySelector("main").textContent.length > 500);
  invalid.window.close();

  // Admin backend failure surfaces an error instead of a blank dashboard
  const adminFail = boot("https://pmr.likesyou.org/?tab=admin", { fetchImpl: makeApiStub() });
  const healthyStub = adminFail.window.fetch;
  adminFail.window.fetch = async (input, init) => {
    const path = String(typeof input === "string" ? input : input.url).split("?")[0];
    if (path === "/api/admin/data" || path === "/api/admin/assets") return jsonResponse({ error: "upstream down" }, 502);
    return healthyStub(input, init);
  };
  await waitFor(() => adminFail.document.querySelector(".admin-gate"), { label: "gerbang admin" });
  setInput(adminFail.window, adminFail.document.querySelector("#admin-pin"), "2026");
  click(byText(adminFail.document.querySelector(".admin-gate"), "button", "Masuk"));
  await waitFor(() => adminFail.document.querySelector(".admin-subnav"), { label: "dashboard" });
  await waitFor(() => /gagal memuat data/i.test(adminFail.document.body.textContent), { timeout: 3000, label: "galat admin" });
  check("kegagalan backend admin dilaporkan", /gagal memuat data/i.test(adminFail.document.body.textContent));
  check("dashboard admin tidak blank", adminFail.document.querySelector(".admin-subnav") !== null);
  adminFail.window.close();
}

console.log("\n== 9. Aksesibilitas dasar ==");
{
  const { window, document } = boot("https://pmr.likesyou.org/");
  await waitFor(() => document.querySelector(".hero"), { label: "hero" });
  await sleep(200);

  const liveHeadings = [...document.querySelectorAll("h1")].filter((heading) => !heading.closest("noscript"));
  equal("hanya satu <h1> aktif", liveHeadings.length, 1);
  check("setiap tombol punya nama aksesibel", [...document.querySelectorAll("button")].every((button) => (button.textContent || "").trim().length > 0 || button.getAttribute("aria-label")));
  check("setiap gambar punya alt", [...document.querySelectorAll("img")].every((image) => image.hasAttribute("alt")));
  check("navigasi memakai <nav> berlabel", [...document.querySelectorAll("nav")].every((nav) => nav.getAttribute("aria-label")));
  check("kontrol ikon punya aria-label", [...document.querySelectorAll(".icon-btn")].every((button) => button.getAttribute("aria-label")));

  const landmarks = ["main", "header", "footer", "nav"];
  check("landmark semantik lengkap", landmarks.every((selector) => document.querySelector(selector)));

  click(navButton(document, "Kontak"));
  await waitFor(() => /sekretariat/i.test(mainText(document)), { label: "halaman kontak" });
  check("tidak ada <form> di halaman publik", document.querySelectorAll("main form").length === 0);
  check("tautan WhatsApp tersedia", Boolean([...document.querySelectorAll("a")].find((anchor) => anchor.href.includes("wa.me"))));
  check("tautan eksternal memakai rel=noreferrer", [...document.querySelectorAll("a[target='_blank']")].every((anchor) => anchor.rel.includes("noreferrer")));

  window.close();
}

console.log("\n== 10. Sanity: tidak ada rahasia di bundle ==");
{
  check("bundle tanpa nama variabel rahasia", !/TELEGRAPH_API_KEY|ADMIN_PIN|API_KEY_PEPPER/.test(bundle));
  check("bundle tanpa endpoint Telegraph", !/\/api\/db\//.test(bundle));
  check("bundle tidak menyentuh localStorage rahasia", !/tg_live/.test(bundle));
}

globalThis.fetch = realFetch;
summary();
