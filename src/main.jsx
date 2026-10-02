import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  Accessibility,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Copy,
  Crown,
  Droplets,
  Eye,
  Flag,
  Flame,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  History as HistoryIcon,
  Home as HomeIcon,
  Instagram,
  Landmark,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Megaphone,
  Moon,
  NotebookPen,
  Phone,
  Play,
  Quote,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  UserRoundCheck,
  Users,
  UsersRound,
  WalletCards,
  Wind,
  X,
  Youtube,
} from "lucide-react";
import { fallbackContent } from "./data.js";
import { AdminPanel } from "./Admin.jsx";
import "./styles.css";

const iconMap = {
  accessibility: Accessibility,
  award: Award,
  "book-open": BookOpen,
  calendar: CalendarDays,
  crown: Crown,
  droplets: Droplets,
  flag: Flag,
  flame: Flame,
  "graduation-cap": GraduationCap,
  "hand-heart": HandHeart,
  "heart-handshake": HeartHandshake,
  "heart-pulse": HeartPulse,
  history: HistoryIcon,
  home: HomeIcon,
  instagram: Instagram,
  landmark: Landmark,
  megaphone: Megaphone,
  "notebook-pen": NotebookPen,
  phone: Phone,
  "shield-check": ShieldCheck,
  "user-round": UserRound,
  "user-round-check": UserRoundCheck,
  users: Users,
  "users-round": UsersRound,
  "wallet-cards": WalletCards,
  wind: Wind,
};

function Icon({ name, size = 18, strokeWidth = 2.2, ...props }) {
  const LucideIcon = iconMap[name] || Sparkles;
  return <LucideIcon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />;
}

const NAV_ITEMS = [
  { id: "beranda", label: "Beranda", icon: "home", desc: "Kabar, agenda & jadwal jaga" },
  { id: "profil", label: "Profil", icon: "user-round", desc: "Visi, misi & struktur organisasi" },
  { id: "sejarah", label: "Sejarah", icon: "landmark", desc: "Riwayat & para pendiri PMR Wira" },
  { id: "uks", label: "Ruang UKS & Obat", icon: "heart-pulse", desc: "Layanan kesehatan gratis" },
  { id: "edukasi", label: "Edukasi P3K", icon: "shield-check", desc: "Panduan pertolongan pertama" },
  { id: "galeri", label: "Galeri", icon: "award", desc: "Dokumentasi kegiatan" },
  { id: "kontak", label: "Kontak", icon: "megaphone", desc: "Sekretariat & jam layanan" },
];

const PAGE_TITLES = {
  beranda: "PMR Wira — SMKN 4 Banjarmasin | Palang Merah Remaja",
  profil: "Profil & Struktur — PMR Wira SMKN 4 Banjarmasin",
  sejarah: "Sejarah & Pendiri — PMR Wira SMKN 4 Banjarmasin",
  uks: "Ruang UKS & Obat Gratis — PMR Wira SMKN 4 Banjarmasin",
  edukasi: "Edukasi P3K — PMR Wira SMKN 4 Banjarmasin",
  galeri: "Galeri Kegiatan — PMR Wira SMKN 4 Banjarmasin",
  kontak: "Kontak Sekretariat — PMR Wira SMKN 4 Banjarmasin",
  admin: "Portal Admin — PMR Wira SMKN 4 Banjarmasin",
};

// Validasi parameter ?tab= agar URL yang rusak/tidak dikenal tidak
// merender halaman kosong — selalu jatuh kembali ke "beranda".
const KNOWN_TABS = new Set(Object.keys(PAGE_TITLES));
function tabFromLocation() {
  const tab = new URLSearchParams(window.location.search).get("tab");
  return tab && KNOWN_TABS.has(tab) ? tab : "beranda";
}

function mergeContent(data) {
  if (!data || typeof data !== "object") return fallbackContent;
  return {
    ...fallbackContent,
    ...data,
    stats: data.stats?.length ? data.stats : fallbackContent.stats,
    announcements: data.announcements?.length ? data.announcements : fallbackContent.announcements,
    events: data.events?.length ? data.events : fallbackContent.events,
    gallery: data.gallery?.length ? data.gallery : fallbackContent.gallery,
    org: { ...fallbackContent.org, ...(data.org || {}) },
    contact: { ...fallbackContent.contact, ...(data.contact || {}) },
    guides: data.guides?.length ? data.guides : fallbackContent.guides,
    roster: data.roster || fallbackContent.roster,
  };
}

async function loadContent() {
  try {
    const response = await fetch("/api/content", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Konten API belum tersedia");
    return mergeContent(await response.json());
  } catch {
    return fallbackContent;
  }
}

/* =========================================================
   AKSESIBILITAS — menu mengambang (ukuran teks, warna, huruf, gerak)
========================================================= */
const A11Y_KEY = "pmr_a11y";
const A11Y_DEFAULTS = { text: "normal", contrast: "normal", font: "normal", motion: "normal" };
const A11Y_GROUPS = [
  {
    key: "text",
    label: "Ukuran teks",
    hint: "Perbesar seluruh isi halaman tanpa mengubah tata letaknya.",
    options: [
      { id: "normal", label: "Normal" },
      { id: "besar", label: "Besar" },
      { id: "ekstra", label: "Ekstra" },
    ],
  },
  {
    key: "contrast",
    label: "Warna & kontras",
    hint: "Kontras tinggi atau warna lembut yang nyaman untuk mata.",
    options: [
      { id: "normal", label: "Normal" },
      { id: "tinggi", label: "Kontras tinggi" },
      { id: "lembut", label: "Warna lembut" },
    ],
  },
  {
    key: "font",
    label: "Jenis huruf",
    hint: "Huruf \"Mudah dibaca\" lebih lega dan ramah disleksia.",
    options: [
      { id: "normal", label: "Normal" },
      { id: "mudah", label: "Mudah dibaca" },
    ],
  },
  {
    key: "motion",
    label: "Gerak & animasi",
    hint: "Hentikan latar berjalan dan animasi lainnya.",
    options: [
      { id: "normal", label: "Aktif" },
      { id: "dikurangi", label: "Dikurangi" },
    ],
  },
];

function AccessibilityMenu({ prefs, onChange, onReset }) {
  const [open, setOpen] = useState(false);
  const fabRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const activeCount = A11Y_GROUPS.filter((group) => prefs[group.key] !== A11Y_DEFAULTS[group.key]).length;

  return (
    <div className={`a11y-dock ${open ? "open" : ""}`}>
      {open && (
        <div className="a11y-panel" id="a11y-panel" role="dialog" aria-label="Menu aksesibilitas">
          <div className="a11y-panel-head">
            <span><Icon name="accessibility" size={17} /> Aksesibilitas</span>
            <button type="button" className="a11y-close" onClick={() => setOpen(false)} aria-label="Tutup menu aksesibilitas"><X size={16} /></button>
          </div>
          {A11Y_GROUPS.map((group) => (
            <div className="a11y-group" key={group.key} role="group" aria-label={group.label}>
              <span className="a11y-group-label">{group.label}</span>
              <div className="a11y-options">
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`a11y-option ${prefs[group.key] === option.id ? "active" : ""}`}
                    aria-pressed={prefs[group.key] === option.id}
                    onClick={() => onChange(group.key, option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="a11y-hint">{activeCount > 0 ? `${activeCount} penyesuaian aktif. ` : ""}Pengaturan tersimpan otomatis di peramban ini.</p>
          <button type="button" className="a11y-reset" onClick={onReset}><RotateCcw size={15} /> Atur ulang ke standar</button>
        </div>
      )}
      <button
        type="button"
        ref={fabRef}
        className="a11y-fab"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label={open ? "Tutup menu aksesibilitas" : "Buka menu aksesibilitas"}
        title="Menu aksesibilitas: ukuran teks, warna, huruf"
      >
        <Icon name="accessibility" size={22} />
        {activeCount > 0 && <span className="a11y-fab-dot" aria-hidden="true">{activeCount}</span>}
      </button>
    </div>
  );
}

function App() {
  const [content, setContent] = useState(fallbackContent);
  const [activeTab, setActiveTab] = useState(tabFromLocation);
  const [theme, setTheme] = useState(() => localStorage.getItem("pmr_theme") || "light");
  const [a11y, setA11y] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(A11Y_KEY) || "{}");
      return saved && typeof saved === "object" ? { ...A11Y_DEFAULTS, ...saved } : A11Y_DEFAULTS;
    } catch {
      return A11Y_DEFAULTS;
    }
  });
  const [toast, setToast] = useState(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryFilter, setGalleryFilter] = useState("Semua");
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [slide, setSlide] = useState(0);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => { }), { once: true });
    }
    loadContent().then((data) => {
      setContent(data);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pmr_theme", theme);
  }, [theme]);

  // Terapkan preferensi aksesibilitas ke <html> agar bisa diatur lewat CSS
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.text = a11y.text;
    root.dataset.contrast = a11y.contrast;
    root.dataset.font = a11y.font;
    root.dataset.motion = a11y.motion;
    try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11y)); } catch { /* mode privat: abaikan */ }
  }, [a11y]);

  useEffect(() => {
    document.title = PAGE_TITLES[activeTab] || PAGE_TITLES.beranda;
  }, [activeTab]);

  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Tampilkan tombol "kembali ke atas" setelah pengguna menggulir cukup jauh
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const modalOpen = Boolean(selectedAlbum || selectedGuide);

  useEffect(() => {
    document.body.style.overflow = modalOpen || mobileMenu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen, mobileMenu]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedAlbum(null);
        setSelectedGuide(null);
        setMobileMenu(false);
      }
      if (selectedAlbum && event.key === "ArrowRight") changeSlide(1);
      if (selectedAlbum && event.key === "ArrowLeft") changeSlide(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Tutup menu mobile otomatis ketika viewport melebar ke ukuran desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1100) setMobileMenu(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(window.__pmrToast);
    window.__pmrToast = window.setTimeout(() => setToast(null), 3800);
  };

  const goTo = (tab, anchor) => {
    setActiveTab(tab);
    setMobileMenu(false);
    const url = tab === "beranda" ? window.location.pathname : `${window.location.pathname}?tab=${tab}`;
    window.history.pushState({ tab }, "", url);
    if (tab !== "admin") {
      loadContent().then((data) => setContent(data));
    }
    window.setTimeout(() => {
      if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 20);
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const openAlbum = (album) => { setSelectedAlbum(album); setSlide(0); };
  const changeSlide = (direction) => {
    if (!selectedAlbum?.images?.length) return;
    setSlide((current) => (current + direction + selectedAlbum.images.length) % selectedAlbum.images.length);
  };

  const categories = useMemo(() => ["Semua", ...new Set(content.gallery.map((album) => album.category).filter(Boolean))], [content.gallery]);
  const filteredGallery = useMemo(() => {
    const query = gallerySearch.trim().toLowerCase();
    return content.gallery.filter((album) => {
      const matchesFilter = galleryFilter === "Semua" || album.category === galleryFilter;
      const matchesQuery = !query || `${album.title} ${album.description} ${album.category}`.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [content.gallery, galleryFilter, gallerySearch]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
      <div className="notice-bar" role="status">
        <div className="notice-track">
          <span><CircleAlert size={14} /> Untuk keadaan darurat, hubungi 119</span>
          <span><CalendarDays size={14} /> Latihan rutin setiap Kamis, 15.00–17.00 WITA</span>
          <span><HeartHandshake size={14} /> Humanis · Peduli · Tanggap</span>
          <span><CircleAlert size={14} /> Untuk keadaan darurat, hubungi 119</span>
          <span><CalendarDays size={14} /> Latihan rutin setiap Kamis, 15.00–17.00 WITA</span>
        </div>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => goTo("beranda")} aria-label="Kembali ke beranda">
            <img src="/gudang/logo/pmr-logo.webp" alt="Logo PMR Wira" />
            <span className="brand-copy"><strong>PMR WIRA</strong><small>SMKN 4 BANJARMASIN</small></span>
          </button>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => goTo(item.id)} aria-current={activeTab === item.id ? "page" : undefined}>{item.label}</button>
            ))}
          </nav>
          <div className="header-actions">
            <button className={`admin-badge-btn ${activeTab === "admin" ? "active" : ""}`} onClick={() => goTo("admin")} aria-label="Portal Admin" title="Portal Admin">
              <ShieldCheck size={17} />
              <span>Admin</span>
            </button>
            <button className="theme-button" onClick={toggleTheme} aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}>
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              id="menu-button"
              className={`menu-button ${mobileMenu ? "is-active" : ""}`}
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label={mobileMenu ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={mobileMenu}
              aria-controls="mobile-drawer"
            >
              <span className="menu-lines" aria-hidden="true"><i /><i /><i /></span>
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={mobileMenu}
        activeTab={activeTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={goTo}
        onClose={() => setMobileMenu(false)}
      />

      <main id="main-content">
        {activeTab === "beranda" && <Home content={content} goTo={goTo} onGuide={() => goTo("edukasi")} motionReduced={a11y.motion === "dikurangi"} />}
        {activeTab === "profil" && <Profile content={content} goTo={goTo} />}
        {activeTab === "sejarah" && <History content={content} goTo={goTo} />}
        {activeTab === "edukasi" && <Education content={content} onGuide={setSelectedGuide} />}
        {activeTab === "galeri" && <Gallery albums={filteredGallery} categories={categories} search={gallerySearch} filter={galleryFilter} setSearch={setGallerySearch} setFilter={setGalleryFilter} onOpen={openAlbum} />}
        {activeTab === "kontak" && <Contact content={content} goTo={goTo} />}
        {activeTab === "uks" && <UksServicePage content={content} goTo={goTo} />}
        {activeTab === "admin" && (
          <AdminPanel
            showToast={showToast}
            onRefreshPublic={(newData) => {
              setContent(mergeContent(newData));
            }}
          />
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/gudang/logo/icon.svg" alt="PMR Wira" />
            <div>
              <strong>PMR WIRA</strong>
              <p>Humanis. Peduli. Tanggap.</p>
              <small>SMKN 4 Banjarmasin • 2026/2027</small>
            </div>
          </div>

          {/* SITEMAP / NAVIGATION LINKS */}
          <div className="footer-sitemap">
            <div className="sitemap-col">
              <span className="sitemap-title">Jelajahi</span>
              <button onClick={() => goTo("beranda")}>Beranda</button>
              <button onClick={() => goTo("profil")}>Profil &amp; Struktur</button>
              <button onClick={() => goTo("sejarah")}>Sejarah &amp; Pendiri</button>
              <button onClick={() => goTo("uks")}>Ruang UKS &amp; Obat</button>
              <button onClick={() => goTo("edukasi")}>Edukasi P3K</button>
            </div>
            <div className="sitemap-col">
              <span className="sitemap-title">Konten</span>
              <button onClick={() => goTo("galeri")}>Galeri Kegiatan</button>
              <button onClick={() => goTo("kontak")}>Kontak Sekretariat</button>
              <button onClick={() => goTo("profil", "member")}>Struktur Organisasi</button>
              <button onClick={() => goTo("edukasi")}>Panduan Pertolongan</button>
            </div>
            <div className="sitemap-col">
              <span className="sitemap-title">Informasi</span>
              <a href="https://wa.me/6283191735329" target="_blank" rel="noreferrer">WhatsApp Sekretariat</a>
              <a href="https://www.instagram.com/pmrskenpatbjm" target="_blank" rel="noreferrer">Instagram @pmrskenpatbjm</a>
              <button onClick={() => goTo("kontak")}>Hubungi Sekretariat</button>
              <button onClick={() => goTo("admin")}>Portal Admin</button>
            </div>
            <div className="sitemap-col">
              <span className="sitemap-title">Legal &amp; Lainnya</span>
              <button onClick={() => goTo("profil")}>Tentang PMR Wira</button>
              <button onClick={() => goTo("edukasi")}>Disclaimer P3K</button>
              <a href="/sitemap.xml" target="_blank" rel="noreferrer">Sitemap XML</a>
              <a href="https://pmr.likesyou.org/" target="_blank" rel="noreferrer">Versi Desktop</a>
            </div>
          </div>

          <div className="footer-bottom">
            <small>© {new Date().getFullYear()} PMR Wira SMKN 4 Banjarmasin — Ekstrakurikuler Palang Merah Remaja</small>
            <div className="footer-credits">
              <span>Dibuat oleh tim PMR Wira • React + Vite + Telegraph Cloud</span>
            </div>
          </div>
        </div>
      </footer>

      {selectedAlbum && <AlbumModal album={selectedAlbum} slide={slide} onClose={() => setSelectedAlbum(null)} onPrev={() => changeSlide(-1)} onNext={() => changeSlide(1)} onSelect={setSlide} />}
      {selectedGuide && <GuideModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />}
      {toast && <div className={`toast toast-${toast.type}`} role="alert"><span>{toast.type === "success" ? <CircleCheck size={18} /> : <CircleAlert size={18} />}</span>{toast.message}</div>}

      <button
        className={`back-to-top ${showBackTop ? "show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Kembali ke atas halaman"
        title="Kembali ke atas"
        tabIndex={showBackTop ? 0 : -1}
      >
        <ArrowUp size={18} />
      </button>

      <AccessibilityMenu
        prefs={a11y}
        onChange={(key, value) => setA11y((current) => ({ ...current, [key]: value }))}
        onReset={() => setA11y(A11Y_DEFAULTS)}
      />
    </div>
  );
}

/* =========================================================
   MOBILE DRAWER / HAMBURGER MENU
========================================================= */
function MobileDrawer({ open, activeTab, theme, onToggleTheme, onNavigate, onClose }) {
  const closeRef = useRef(null);
  const wasOpenRef = useRef(false);

  // Pengelolaan fokus: saat drawer terbuka, pindahkan fokus ke tombol tutup;
  // saat tertutup, kembalikan fokus ke tombol hamburger agar navigasi keyboard tetap nyaman.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      closeRef.current?.focus({ preventScroll: true });
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      document.getElementById("menu-button")?.focus({ preventScroll: true });
    }
  }, [open]);

  return (
    <div className={`drawer-root ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="mobile-drawer" id="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu navigasi" inert={!open}>
        <div className="drawer-head">
          <div className="drawer-brand">
            <img src="/gudang/logo/pmr-logo.webp" alt="" />
            <span>
              <strong>PMR WIRA</strong>
              <small>SMKN 4 Banjarmasin</small>
            </span>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Tutup menu" ref={closeRef}>
            <X size={19} />
          </button>
        </div>

        <div className="drawer-scroll">
          <span className="drawer-section-label">Menu Utama</span>
          <nav className="drawer-nav" aria-label="Navigasi mobile">
            {NAV_ITEMS.map((item, index) => (
              <button
                key={item.id}
                className={`drawer-link ${activeTab === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
                style={{ transitionDelay: open ? `${40 + index * 30}ms` : "0ms" }}
                aria-current={activeTab === item.id ? "page" : undefined}
              >
                <span className="drawer-link-icon"><Icon name={item.icon} size={19} /></span>
                <span className="drawer-link-text">
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </span>
                <ChevronRight size={16} className="drawer-link-arrow" />
              </button>
            ))}
          </nav>

          <span className="drawer-section-label">Lainnya</span>
          <div className="drawer-extras">
            <button className={`drawer-extra-card ${activeTab === "admin" ? "active" : ""}`} onClick={() => onNavigate("admin")}>
              <span className="drawer-extra-icon extra-red"><ShieldCheck size={18} /></span>
              <span><strong>Portal Admin</strong><small>Kelola konten situs</small></span>
              <ChevronRight size={15} />
            </button>
            <button className="drawer-extra-card" onClick={onToggleTheme}>
              <span className="drawer-extra-icon extra-amber">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</span>
              <span><strong>{theme === "light" ? "Mode Gelap" : "Mode Terang"}</strong><small>Ganti tampilan situs</small></span>
              <span className={`drawer-switch ${theme === "dark" ? "on" : ""}`} aria-hidden="true"><i /></span>
            </button>
          </div>

          <div className="drawer-emergency">
            <CircleAlert size={17} />
            <div>
              <strong>Keadaan darurat?</strong>
              <span>Hubungi layanan medis <b>119</b>, lalu kabari petugas UKS sekolah.</span>
            </div>
          </div>
        </div>

        <div className="drawer-foot">
          <a href="https://wa.me/6283191735329" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>
          <a href="https://www.instagram.com/pmrskenpatbjm" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
          <a href="mailto:pmr@smkn4bjm.sch.id" aria-label="Email"><Mail size={18} /></a>
          <span className="drawer-foot-note">Humanis · Peduli · Tanggap</span>
        </div>
      </aside>
    </div>
  );
}

function formatRosterForWhatsApp(roster, viewType) {
  if (!roster) return "";
  const uksList = roster.uks_schedule || [];
  const lapList = roster.lapangan_schedule || [];
  const baseUrl = window.location.origin || "https://pmr-wira-smkn4.pages.dev";

  if (viewType === "uks") {
    let titleRange = "13-17 Juli 2026";
    if (uksList.length > 0) {
      const firstTgl = uksList[0].tanggal.replace(/^[A-Za-z]+,\s*/, "");
      const fifthTgl = uksList[Math.min(4, uksList.length - 1)].tanggal.replace(/^[A-Za-z]+,\s*/, "");
      const firstNum = firstTgl.split(" ")[0];
      titleRange = `${firstNum}-${fifthTgl}`;
    }

    let text = `*Jadwal Piket Jaga UKS Tanggal ${titleRange}*\n`;
    const slice5 = uksList.slice(0, 5);
    slice5.forEach((item) => {
      text += `\n${item.tanggal}\n\n`;
      (item.petugas || []).forEach((nama) => {
        text += `* ${nama}\n`;
      });
    });
    text += `\nCek jadwal lengkap dan live update di:\n${baseUrl}?tab=beranda`;
    return text;
  } else {
    const nextMonday = lapList[0] || { tanggal: "Senin, 13 Juli 2026", petugas: [] };
    let text = `*Jadwal Jaga Upacara ${nextMonday.tanggal}*\n\n`;
    (nextMonday.petugas || []).forEach((nama) => {
      text += `* ${nama}\n`;
    });
    text += `\nCek jadwal lengkap dan live update di:\n${baseUrl}?tab=beranda`;
    return text;
  }
}

function PublicRosterWidget({ roster }) {
  // Hooks harus selalu dipanggil (fix white/blank screen saat publish/unpublish jadwal)
  const [activeView, setActiveView] = useState("uks"); // 'uks' or 'lapangan'
  const [modalOpen, setModalOpen] = useState(false);

  if (!roster || roster.is_published === false) return null;

  const scheduleList = activeView === "uks" ? (roster.uks_schedule || []) : (roster.lapangan_schedule || []);

  const handleShareWA = () => {
    const text = formatRosterForWhatsApp(roster, activeView);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCopyText = () => {
    const text = formatRosterForWhatsApp(roster, activeView);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert("Teks jadwal tanpa emoji dan link website berhasil disalin! Siap ditempel ke WhatsApp.");
    } else {
      prompt("Salin teks jadwal berikut:", text);
    }
  };

  return (
    <div className="public-roster-section">
      <div className="roster-public-card">
        <div className="rpc-head">
          <div>
            <span className="eyebrow eyebrow-light"><Sparkles size={14} /> JADWAL TUGAS RESMI · {roster.periode || "2026/2027"}</span>
            <h3><HeartPulse size={24} /> Jadwal Jaga UKS & Piket Lapangan</h3>
            <p className="rpc-keterangan">{roster.keterangan}</p>
          </div>
          <div className="rpc-subtabs">
            <button className={`rpc-subtab ${activeView === "uks" ? "active" : ""}`} onClick={() => setActiveView("uks")}>
              📍 Ruang UKS ({roster.uks_schedule?.length || 0} Hari)
            </button>
            <button className={`rpc-subtab ${activeView === "lapangan" ? "active" : ""}`} onClick={() => setActiveView("lapangan")}>
              🚩 Lapangan Upacara ({roster.lapangan_schedule?.length || 0} Hari)
            </button>
          </div>
        </div>

        <div className="wa-share-bar">
          <div className="wa-share-info">
            <MessageCircle size={18} />
            <span>Bagikan jadwal {activeView === "uks" ? "Piket Jaga UKS" : "Jaga Upacara Senin"} ke WhatsApp (Format rapi tanpa emoji beserta tautan link):</span>
          </div>
          <div className="wa-share-btns">
            <button type="button" className="button button-wa button-sm" onClick={handleShareWA}>
              <Send size={14} /> Share ke WhatsApp
            </button>
            <button type="button" className="button button-ghost button-sm" onClick={handleCopyText}>
              <Copy size={14} /> Salin Teks & Link
            </button>
          </div>
        </div>

        <div className="rpc-body">
          {scheduleList.slice(0, 6).map((item, idx) => {
            const isToday = item.tanggal?.toLowerCase().includes(new Date().getDate() + " ");
            return (
              <div className={`rpc-day-card ${isToday ? "today-highlight" : ""}`} key={idx}>
                <div className="rpc-day-top">
                  <span>{item.tanggal}</span>
                  {isToday ? <span className="today-tag">HARI INI</span> : <span className="tag">{item.hari}</span>}
                </div>
                <div className="rpc-names">
                  {item.petugas?.map((nama, mi) => (
                    <div className="rpc-name" key={mi}>
                      <UserRound size={15} /> <span>{nama}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rpc-foot">
          <div>
            <strong>Menampilkan 6 shift terdekat di {roster.bulan_label}.</strong>
            <span> Seluruh anggota telah dibagi dengan rotasi frekuensi seimbang & adil.</span>
          </div>
          <button className="button button-yellow button-sm" onClick={() => setModalOpen(true)}>
            Lihat Semua Jadwal & Statistik Keadilan <ArrowRight size={14} />
          </button>
        </div>
      </div>
      {modalOpen && <PublicRosterModal roster={roster} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function PublicRosterModal({ roster, onClose }) {
  const [tab, setTab] = useState("uks");

  const handleModalWA = () => {
    const text = formatRosterForWhatsApp(roster, tab === "lapangan" ? "lapangan" : "uks");
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleModalCopy = () => {
    const text = formatRosterForWhatsApp(roster, tab === "lapangan" ? "lapangan" : "uks");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert("Teks jadwal tanpa emoji dan link website berhasil disalin! Siap ditempel ke WhatsApp.");
    } else {
      prompt("Salin teks jadwal berikut:", text);
    }
  };

  // Portal ke <body>: modal tetap di luar elemen yang di-zoom saat ukuran teks diperbesar
  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal modal-lg modal-card" role="dialog" aria-modal="true" aria-label="Jadwal lengkap jaga UKS dan piket lapangan">
        <div className="modal-head">
          <div>
            <span className="eyebrow">JADWAL SHIFT PMR WIRA · {roster.bulan_label}</span>
            <h2>Jadwal Shift Ruang UKS &amp; Piket Lapangan</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="modal-body-form">
          <p className="modal-muted">{roster.keterangan}</p>

          <div className="rss-tabs" style={{ marginBottom: 0 }}>
            <button className={`rss-tab ${tab === "uks" ? "active" : ""}`} onClick={() => setTab("uks")}>
              📍 Penjagaan Ruang UKS (Senin–Jumat)
            </button>
            <button className={`rss-tab ${tab === "lapangan" ? "active" : ""}`} onClick={() => setTab("lapangan")}>
              🚩 Piket Lapangan Upacara (Setiap Senin)
            </button>
          </div>

          <div className="wa-share-bar" style={{ margin: "6px 0" }}>
            <div className="wa-share-info">
              <MessageCircle size={18} />
              <span>Bagikan daftar {tab === "uks" ? "piket jaga UKS" : "jaga upacara"} ini ke WhatsApp:</span>
            </div>
            <div className="wa-share-btns">
              <button type="button" className="button button-wa button-sm" onClick={handleModalWA}>
                <Send size={14} /> Share ke WhatsApp
              </button>
              <button type="button" className="button button-sm" onClick={handleModalCopy}>
                <Copy size={14} /> Salin Teks & Link
              </button>
            </div>
          </div>

          <div className="modal-scroll-area">
            {(tab === "uks" ? roster.uks_schedule : roster.lapangan_schedule)?.map((shift, sIdx) => (
              <div className="rss-row" key={sIdx}>
                <div className="rss-date">
                  <strong>{shift.tanggal}</strong>
                  <span className="tag">{shift.hari}</span>
                </div>
                <div className="rss-petugas">
                  <span>Petugas bertugas ({shift.petugas?.length || 0} orang):</span>
                  <div className="petugas-pills">
                    {shift.petugas?.map((nama, mi) => (
                      <div className="petugas-pill" key={mi}>
                        <UserRound size={13} /> <span>{nama}</span>
                      </div>
                    ))}
                    {!shift.petugas?.length && <p className="empty-msg">Belum ada petugas untuk shift ini.</p>}
                  </div>
                </div>
              </div>
            ))}
            {!(tab === "uks" ? roster.uks_schedule : roster.lapangan_schedule)?.length && (
              <div className="empty-box"><p>Jadwal untuk bagian ini belum diterbitkan.</p></div>
            )}
          </div>

          <div className="modal-actions">
            <button className="button button-dark" onClick={onClose}>Tutup Jadwal <Check size={16} /></button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function UksHomepageBanner({ uksInfo, goTo }) {
  const info = uksInfo || fallbackContent.uks_info;
  return (
    <section className="container uks-home-banner-section">
      <div className="uks-home-banner">
        <div className="uhb-left">
          <span className="eyebrow eyebrow-light"><Sparkles size={14} /> LAYANAN KESEHATAN SEKOLAH · GRATIS</span>
          <h2>{info.welcome_banner?.title || "Ruang UKS Terbuka untuk Seluruh Siswa-Siswi."}</h2>
          <p>{info.welcome_banner?.subtitle || "Merasa kurang sehat atau butuh obat pusing/demam saat jam pelajaran? Datanglah ke Ruang UKS. Semua pemeriksaan & stok obat P3K disediakan secara gratis."}</p>
          <div className="uhb-tags">
            <span><Check size={14} /> Paracetamol & Antasida Gratis</span>
            <span><Check size={14} /> Minyak Kayu Putih & Betadine</span>
            <span><Check size={14} /> Cek Tinggi Berat Badan & Tensi Darah</span>
            <span><Check size={14} /> Ranjang Istirahat UKS</span>
          </div>
        </div>
        <div className="uhb-right">
          <div className="uhb-card">
            <HeartPulse size={36} />
            <strong>Obat & Pemeriksaan Gratis</strong>
            <small>{info.welcome_banner?.highlight || "Tidak dipungut biaya apapun bagi seluruh siswa SMKN 4 Banjarmasin."}</small>
            <button className="button button-yellow full" onClick={() => goTo("uks")}>
              Lihat Daftar Stok Obat & Prosedur <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function UksServicePage({ content, goTo }) {
  const info = content.uks_info || fallbackContent.uks_info;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");

  const categories = useMemo(() => ["Semua", ...new Set((info.stok_obat_dan_alat || []).map(i => i.kategori).filter(Boolean))], [info.stok_obat_dan_alat]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (info.stok_obat_dan_alat || []).filter(item => {
      const matchQ = !q || `${item.nama} ${item.kegunaan} ${item.kategori}`.toLowerCase().includes(q);
      const matchC = category === "Semua" || item.kategori === category;
      return matchQ && matchC;
    });
  }, [info.stok_obat_dan_alat, search, category]);

  return (
    <section className="page-section container uks-service-page">
      {/* Welcome Banner */}
      <div className="uks-hero-card">
        <div className="uhc-top">
          <span className="eyebrow"><HeartPulse size={16} /> RUANG UKS SMKN 4 BANJARMASIN</span>
          <span className="tag-green-pill"><Check size={14} /> OBAT & PERAWATAN 100% GRATIS</span>
        </div>
        <h1>{info.welcome_banner?.title}</h1>
        <p className="uhc-sub">{info.welcome_banner?.subtitle}</p>
        <div className="uhc-highlight-box">
          <Sparkles size={20} />
          <span><strong>Informasi Penting Siswa:</strong> {info.welcome_banner?.highlight}</span>
        </div>
        <div className="uhc-meta-row">
          <div><Clock3 size={17} /> <span><strong>Jam Layanan:</strong> {info.jam_layanan}</span></div>
          <div><MapPin size={17} /> <span><strong>Lokasi:</strong> {info.lokasi}</span></div>
        </div>
      </div>

      {/* Inventory & Free Medicines */}
      <div className="uks-inventory-section">
        <SectionHeading
          kicker="Stok Obat & Alat Medis"
          title="Daftar Obat & Fasilitas UKS"
          description="Berikut adalah stok obat minum ringan, obat luar, perban, alat pemeriksaan, dan fasilitas baring yang tersedia secara gratis untuk siswa-siswi yang sakit atau cedera."
        />
        <div className="gallery-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama obat (misal: paracetamol, maag, betadine)..." />
            {search && <button onClick={() => setSearch("")}><X size={16} /></button>}
          </label>
          <div className="filter-list">
            {categories.map((cat) => (
              <button key={cat} className={category === cat ? "active" : ""} onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="uks-inventory-grid">
          {filteredItems.map((item, idx) => (
            <div className="medicine-card" key={idx}>
              <div className="med-top">
                <span className="med-category">{item.kategori}</span>
                <span className="med-status"><Check size={12} /> {item.status || "Tersedia & Gratis"}</span>
              </div>
              <h3>{item.nama}</h3>
              <p>{item.kegunaan}</p>
            </div>
          ))}
          {!filteredItems.length && (
            <div className="empty-box" style={{ gridColumn: "1 / -1" }}>
              <p>Tidak menemukan obat atau alat dengan kata kunci pencarian tersebut.</p>
            </div>
          )}
        </div>
      </div>

      {/* Procedure for visiting UKS */}
      <div className="uks-procedure-section">
        <SectionHeading
          kicker="Alur Pelayanan"
          title="Prosedur Kunjungan ke Ruang UKS"
          description="Agar ketertiban belajar mengajar tetap terjaga, ikuti alur kunjungan berikut saat kamu merasa sakit di sekolah."
        />
        <div className="procedure-grid">
          {(info.prosedur_kunjungan || []).map((step, idx) => (
            <div className="procedure-step-card" key={idx}>
              <div className="step-badge"><span>0{idx + 1}</span></div>
              <h4>{step.step}</h4>
              <p>{step.deskripsi}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tata Tertib UKS */}
      <div className="uks-rules-box">
        <div className="urb-head">
          <ShieldCheck size={24} />
          <div>
            <h3>Tata Tertib & Etika Penggunaan Ruang UKS</h3>
            <small>Dipatuhi bersama oleh anggota PMR, petugas jaga, dan seluruh siswa-siswi.</small>
          </div>
        </div>
        <ul className="urb-list">
          {(info.tata_tertib || []).map((rule, idx) => (
            <li key={idx}>
              <Check size={16} />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom CTA */}
      <div className="inline-cta" style={{ marginTop: "60px" }}>
        <div>
          <strong>Butuh bantuan atau ada yang ingin ditanyakan?</strong>
          <span>Hubungi tim sekretariat PMR Wira & Pembina UKS SMKN 4 Banjarmasin.</span>
        </div>
        <button className="button button-primary" onClick={() => goTo("kontak")}>
          Hubungi Sekretariat <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function Home({ content, goTo, onGuide, motionReduced }) {
  const backdropRef = useRef(null);

  // Latar hero: galeri berjalan pelan sebagai dinding foto (dekoratif).
  // Berhenti otomatis saat preferensi gerak dikurangi, tab tidak aktif,
  // atau hero sedang tidak terlihat di layar.
  useEffect(() => {
    const track = backdropRef.current;
    if (!track || motionReduced) return undefined;

    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (media && media.matches) return undefined;

    let frame;
    let last = performance.now();
    let onScreen = true;
    const speed = 0.022; // px per milidetik — pelan supaya teks tetap nyaman dibaca

    const step = (now) => {
      const delta = Math.min(now - last, 64);
      last = now;
      if (onScreen && !document.hidden) {
        const setWidth = track.scrollWidth / 3;
        if (setWidth > 0) {
          track.scrollLeft += speed * delta;
          if (track.scrollLeft >= setWidth * 2) track.scrollLeft -= setWidth;
          else if (track.scrollLeft <= 0) track.scrollLeft += setWidth;
        }
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    const onVisibility = () => { last = performance.now(); };
    document.addEventListener("visibilitychange", onVisibility);

    let observer;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        onScreen = Boolean(entry && entry.isIntersecting);
      }, { threshold: [0, 0.2] });
      observer.observe(track);
    }

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, [motionReduced]);

  const heroImages = [
    '/gudang/gallery/1.jpg',
    '/gudang/gallery/2.jpg',
    '/gudang/gallery/3.jpg',
    '/gudang/gallery/4.jpg',
    '/gudang/gallery/5.jpg',
    '/gudang/gallery/6.jpg',
    '/gudang/gallery/7.jpg',
    '/gudang/gallery/8.jpg',
  ];

  // Digandakan 3x supaya gulirannya menyambung tanpa jeda
  const loopedImages = [...heroImages, ...heroImages, ...heroImages];
  const stats = content.stats || [];

  return <>
    <section className="hero-section page-section">
      {/* Galeri berjalan = latar hero (dekoratif, disembunyikan dari pembaca layar) */}
      <div className="hero-bg" ref={backdropRef} aria-hidden="true">
        <div className="hero-bg-track">
          {loopedImages.map((img, index) => (
            <figure className="hero-bg-slide" key={`${img}-${index}`}>
              <img src={img} alt="" draggable={false} loading={index < 6 ? "eager" : "lazy"} decoding="async" />
            </figure>
          ))}
        </div>
      </div>
      <span className="hero-veil" aria-hidden="true" />

      <div className="hero-grid container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> EKSTRAKURIKULER KEMANUSIAAN · 2026/2027</div>
          <h1 className="hero-title"><span>Siap.</span><span><em>Tanggap.</em></span><span>Selamatkan.</span></h1>
          <p className="hero-lede">Membentuk generasi <strong>humanis</strong> yang peduli, terampil, dan siap beraksi untuk kemanusiaan di sekolah maupun masyarakat.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => goTo("profil")}><Users size={18} /> Kenali PMR Wira <ArrowRight size={17} /></button>
            <button className="button button-ghost" onClick={onGuide}><Play size={16} fill="currentColor" /> Mulai belajar P3K</button>
          </div>
          <div className="hero-note"><span className="pulse-dot" /> Latihan rutin setiap Kamis, 15.00–17.00 WITA — terbuka untuk seluruh anggota</div>
        </div>
        <div className="hero-art" aria-label="Ilustrasi semangat kemanusiaan">
          <div className="art-circle art-circle-back" /><div className="art-circle art-circle-mid" /><div className="art-cross">+</div>
          <div className="art-card art-card-top"><span className="art-icon"><ShieldCheck size={19} /></span><span><b>SIAGA</b><small>Belajar pertolongan pertama</small></span></div>
          <div className="art-card art-card-bottom"><HeartPulse size={21} /><span><b>56</b><small>Aksi sosial terlaksana</small></span></div>
          <div className="art-badge"><img src="/gudang/logo/pmr-logo.webp" alt="" /><span><b>PMR</b><small>WIRA</small></span></div>
          <div className="art-label">BE<br />THE<br />HELP</div>
        </div>
      </div>

      {/* Statistik digabung ke dalam hero supaya tidak ada pita kosong terpisah */}
      {stats.length > 0 && (
        <div className="hero-stats container">
          {stats.map((stat) => <div className="stat" key={stat.label}><Icon name={stat.icon} size={20} /><strong>{stat.value}<small>+</small></strong><span>{stat.label}</span></div>)}
        </div>
      )}
    </section>

    <PublicRosterWidget roster={content.roster} />
    <UksHomepageBanner uksInfo={content.uks_info} goTo={goTo} />

    <section className="page-section container home-content">
      <SectionHeading kicker="Dari kegiatan kami" title="Kabar terkini" description="Cerita kecil, langkah nyata, dan semangat kebersamaan PMR Wira." action={<button className="text-button" onClick={() => goTo("galeri")}>Lihat semua <ArrowRight size={16} /></button>} />
      <div className="news-grid">{content.announcements.map((news, index) => <NewsCard key={news.id} news={news} featured={index === 0} />)}</div>

      <div className="split-heading"><SectionHeading kicker="Agenda" title="Waktu untuk bergerak" description="Simpan agenda berikut dan hadir bersama kami." /><button className="button button-dark" onClick={() => goTo("kontak")}>Tanya sekretariat <MessageCircle size={16} /></button></div>
      <div className="event-grid">{content.events.map((event) => <EventCard key={event.id} event={event} />)}</div>

      <div className="home-cta"><div><span className="eyebrow eyebrow-light"><Sparkles size={14} /> PANGGILAN KEMANUSIAAN</span><h2>Hal kecil yang kamu lakukan<br /><em>bisa berarti besar.</em></h2><p>Mulai dari belajar P3K, hadir di latihan, dan berani peduli pada sekitar.</p></div><button className="button button-yellow" onClick={() => goTo("sejarah")}>Kenali sejarah kami <ArrowRight size={17} /></button></div>
    </section>
  </>;
}

function Profile({ content, goTo }) {
  const { org } = content;
  return <section className="page-section container profile-page">
    <SectionHeading kicker="Tentang PMR Wira" title="Satu tim, satu kepedulian" description="PMR Wira SMKN 4 Banjarmasin adalah ruang belajar untuk menjadi pribadi yang berkarakter, sigap, dan bermanfaat." />

    {/* Tautan cepat ke halaman Sejarah & Pendiri */}
    <button className="profile-history-link" onClick={() => goTo("sejarah")}>
      <span className="phl-icon"><Landmark size={20} /></span>
      <span className="phl-text">
        <strong>Baru: Halaman Sejarah & Para Pendiri</strong>
        <small>Kenali perjalanan PMR Wira sejak 20-- dan orang-orang di balik berdirinya.</small>
      </span>
      <span className="phl-cta">Buka halaman <ChevronRight size={16} /></span>
    </button>

    <div className="about-grid"><div className="quote-panel"><Quote size={42} /><blockquote>“Kemanusiaan tidak mengenal batas. Di sini kita belajar menjadi pahlawan kecil bagi sesama.”</blockquote><span>— Nilai yang kami bawa</span></div><div className="vision-card"><div className="mini-label"><Eye size={16} /> VISI KAMI</div><h3>Berkarakter, peduli, terampil, dan siap berperan.</h3><p>Mewujudkan anggota Palang Merah Remaja yang aktif di lingkungan sekolah maupun masyarakat.</p></div></div>
    <div className="mission-grid"><div><SectionHeading kicker="Cara kami bertumbuh" title="Misi" /></div><ul className="mission-list">{["Menanamkan nilai kepedulian, kemanusiaan, dan solidaritas.", "Meningkatkan pengetahuan kepalangmerahan dan keterampilan P3K.", "Membentuk sikap disiplin, tanggung jawab, dan kerja sama.", "Mendukung sekolah yang sehat, aman, dan siaga.", "Berperan aktif dalam kegiatan sosial di masyarakat."].map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul></div>

    <div className="section-anchor" id="member"><SectionHeading kicker={`Periode ${org.periode || "2026/2027"}`} title="Struktur organisasi" description="Kenali orang-orang yang menggerakkan PMR Wira." /></div>
    <div className="advisory-grid">{(org.advisory || []).map((person) => <PersonCard key={person.nama} person={{ ...person, role: person.jabatan }} muted />)}</div>
    <div className="leaders-grid">{(org.leaders || []).map((person) => <PersonCard key={person.role} person={person} />)}</div>
    <h3 className="division-title">Koordinator divisi</h3><div className="division-grid">{(org.divisions || []).map((division) => <DivisionCard key={division.divisi} division={division} />)}</div>

    <div className="inline-cta"><div><strong>Ingin mengenal perjalanan kami lebih jauh?</strong><span>Baca kisah berdirinya PMR Wira dan para pendirinya di halaman khusus.</span></div><button className="button button-primary" onClick={() => goTo("sejarah")}>Buka Halaman Sejarah <ArrowRight size={16} /></button></div>
  </section>;
}

/* =========================================================
   HALAMAN SEJARAH & PARA PENDIRI (tab khusus, bukan di awal)
========================================================= */
const HISTORY_TIMELINE = [
  {
    year: "1950",
    icon: "landmark",
    title: "Akar gerakan: PMI & Palang Merah Remaja",
    text: "Palang Merah Remaja (PMR) lahir pada 1 Maret 1950 sebagai bagian dari Palang Merah Indonesia — menanamkan nilai kemanusiaan kepada generasi muda sejak dini.",
    tone: "red",
  },
  {
    year: "2010",
    icon: "flag",
    title: "PMR Wira SMKN 4 Banjarmasin resmi berdiri",
    text: "Diprakarsai guru pembina dan siswa yang peduli kesehatan sekolah serta kesiapsiagaan bencana, PMR Wira menjadi ekstrakurikuler kemanusiaan resmi sekolah.",
    tone: "yellow",
  },
  {
    year: "Tradisi",
    icon: "heart-pulse",
    title: "Latihan rutin, piket UKS & aksi sosial",
    text: "Latihan keterampilan setiap Kamis, penjagaan Ruang UKS Senin–Jumat, piket lapangan upacara, hingga bakti sosial tahunan menjadi tradisi yang dijaga lintas angkatan.",
    tone: "green",
  },
  {
    year: "2026",
    icon: "sparkles",
    title: "Memasuki era digital",
    text: "Website resmi, jadwal jaga digital, dan portal informasi dikembangkan oleh siswa kelas X RPL 1 (Muhammad Thio Saputra) tim inti PMR (Sekretaris 2) periode 2026/2027 agar informasi mudah diakses semua orang.",
    tone: "blue",
  },
];

const getHistoryFounders = (org) => [
  {
    icon: "graduation-cap",
    role: "Pendiri & Pembina Pertama",
    name: "Winda Hairani, S.Pd.",
    text: "Guru yang memprakarsai berdirinya PMR Wira SMKN 4 Banjarmasin dan terus membimbing generasi relawan hingga hari ini.",
    note: "Penanggung jawab kurikulum & pelatihan P3K sejak awal berdiri.",
  },
  {
    icon: "users",
    role: "Pendukung Pendirian",
    name: "Ibu Eka Lisdyawati, M.Pd. & Angkatan Perdana",
    text: "Wakasek Kesiswaan bersama siswa-siswi angkatan pertama yang meletakkan fondasi semangat “Humanis • Peduli • Tanggap”.",
    note: "Program kerja awal: pelatihan dasar P3K, piket UKS rutin, dan bakti sosial tahunan.",
  },
  {
    icon: "heart-handshake",
    role: "Penerus Lintas Angkatan",
    name: "Kepengurusan dari Masa ke Masa",
    text: "Setiap periode kepengurusan melanjutkan estafet kepemimpinan - menjaga latihan rutin, piket UKS, dan aksi sosial tetap hidup.",
    note: <>Periode aktif saat ini: <strong>{org?.periode}</strong> di bawah kepemimpinan <strong>{org?.leaders?.find((leader) => leader.role === "Ketua")?.nama}</strong></>,
  },
  {
    icon: "sparkles",
    role: "Pengembang Digital 2026",
    name: "Muhammad Thio Saputra",
    text: "Website resmi ini dirancang dan dibangun oleh siswa kelas X RPL 1 tim inti PMR Wira dibidang sekretaris (Muhammad Thio Saputra) periode 2026/2027.",
    note: "Tujuan: informasi publik yang modern, cepat, dan mudah diakses di semua perangkat.",
  },
];

function History({ content, goTo }) {
  const { org } = content;
  return (
    <section className="page-section container history-page">
      <SectionHeading
        kicker="Sejarah & Para Pendiri"
        title="Lahir dari kepedulian."
        description="Halaman khusus perjalanan PMR Wira SMKN 4 Banjarmasin - dari gagasan sederhana menjadi gerakan kemanusiaan yang hidup di sekolah."
      />

      {/* Hero sejarah */}
      <div className="history-hero">
        <div className="hh-copy">
          <span className="history-year-pill"><HistoryIcon size={15} /> SEJAK 2010</span>
          <h2>PMR Wira <em>SMKN 4 Banjarmasin</em></h2>
          <p>
            Palang Merah Remaja (PMR) tingkat Wira adalah wadah pembinaan remaja oleh PMI untuk siswa SMA/sederajat.
            Di SMKN 4 Banjarmasin, PMR Wira tumbuh menjadi rumah bagi siswa yang ingin belajar pertolongan pertama,
            hidup sehat, kesiapsiagaan, dan kepemimpinan yang berpihak pada kemanusiaan.
          </p>
          <div className="hh-actions">
            <button className="button button-yellow" onClick={() => goTo("profil", "member")}>
              Lihat Struktur Saat Ini <ArrowRight size={16} />
            </button>
            <button className="button button-ghost-dark" onClick={() => goTo("kontak")}>
              Hubungi Sekretariat
            </button>
          </div>
        </div>
        <div className="hh-art" aria-hidden="true">
          <div className="hh-ring hh-ring-1" />
          <div className="hh-ring hh-ring-2" />
          <img src="/gudang/logo/pmr-logo.webp" alt="" />
          <span className="hh-cross">+</span>
        </div>
      </div>

      {/* Tingkatan PMR */}
      <div className="history-levels">
        <div className="history-level-card">
          <span className="level-badge level-mula">MULA</span>
          <strong>PMR Mula</strong>
          <p>Tingkat sekolah dasar (SD) - pengenalan nilai kemanusiaan & kebersihan.</p>
        </div>
        <div className="history-level-card">
          <span className="level-badge level-madya">MADYA</span>
          <strong>PMR Madya</strong>
          <p>Tingkat sekolah menengah pertama (SMP) - keterampilan dasar pertolongan pertama.</p>
        </div>
        <div className="history-level-card history-level-active">
          <span className="level-badge level-wira">WIRA · KAMI</span>
          <strong>PMR Wira</strong>
          <p>Tingkat SMA/SMK sederajat - keterampilan lanjutan, kepemimpinan & aksi nyata.</p>
        </div>
      </div>

      {/* Lini masa */}
      <div className="section-anchor" id="linimasa">
        <SectionHeading kicker="Lini masa" title="Perjalanan kami" description="Tonggak-tonggak penting yang membentuk PMR Wira hingga hari ini." />
      </div>
      <ol className="timeline">
        {HISTORY_TIMELINE.map((item) => (
          <li className={`timeline-item tone-${item.tone}`} key={item.year}>
            <span className="timeline-year">{item.year}</span>
            <span className="timeline-icon"><Icon name={item.icon} size={18} /></span>
            <div className="timeline-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Para pendiri */}
      <div className="section-anchor" id="pendiri">
        <SectionHeading kicker="Orang-orang di baliknya" title="Pendiri & penerus perjuangan" description="PMR Wira berdiri karena keberanian mereka memulai — dan terus hidup karena kesetiaan para penerusnya." />
      </div>
      <div className="founders-grid">
        {getHistoryFounders(org).map((founder) => (
          <article className="founder-card" key={founder.name}>
            <div className="founder-head">
              <span className="founder-icon"><Icon name={founder.icon} size={21} /></span>
              <span className="founder-role">{founder.role}</span>
            </div>
            <h3>{founder.name}</h3>
            <p>{founder.text}</p>
            <small>{founder.note}</small>
          </article>
        ))}
      </div>

      {/* Penutup */}
      <div className="history-closing">
        <Quote size={34} />
        <blockquote>“Siamo tutti fratelli - kita semua bersaudara.”</blockquote>
        <span>Semboyan gerakan Palang Merah yang kami jaga di setiap kegiatan.</span>
        <div className="history-closing-actions">
          <button className="button button-primary" onClick={() => goTo("profil")}>
            Kenali Profil & Struktur <ArrowRight size={16} />
          </button>
          <button className="button button-ghost" onClick={() => goTo("galeri")}>
            Lihat Dokumentasi Kegiatan
          </button>
        </div>
      </div>
    </section>
  );
}

function Education({ content, onGuide }) {
  return <section className="page-section container education-page">
    <div className="education-intro"><div><SectionHeading kicker="EduScope" title="Bekal untuk tetap siaga" description="Panduan singkat pertolongan pertama untuk anggota PMR dan masyarakat umum." /></div><div className="emergency-call"><span><CircleAlert size={19} /> DARURAT</span><strong>119</strong><small>Hubungi bantuan medis</small></div></div>
    <div className="warning-banner"><CircleAlert size={21} /><p><strong>Penting untuk diingat.</strong> Materi ini bersifat edukatif dan tidak menggantikan tenaga medis profesional. Pastikan lokasi aman, lalu minta bantuan.</p></div>
    <div className="guide-grid">{content.guides.map((guide) => <button className={`guide-card tone-${guide.tone}`} key={guide.id} onClick={() => onGuide(guide)}><div className="guide-icon"><Icon name={guide.icon} size={24} /></div><span className="tag">{guide.tag}</span><h3>{guide.title}</h3><p>{guide.summary}</p><span className="learn-more">Buka panduan <ArrowRight size={15} /></span></button>)}</div>
    <div className="education-bottom"><div><span className="eyebrow">BELAJAR DASAR</span><h2>Tenang adalah<br /><em>keterampilan pertama.</em></h2></div><div className="principle-list">{[{ icon: "shield-check", title: "Pastikan aman", text: "Amankan diri, korban, dan sekitar." }, { icon: "user-round-check", title: "Periksa respons", text: "Cek kesadaran dan pernapasan." }, { icon: "phone", title: "Panggil bantuan", text: "Hubungi 119 atau minta bantuan." }].map((item) => <div key={item.title}><Icon name={item.icon} size={20} /><span><strong>{item.title}</strong><small>{item.text}</small></span></div>)}</div></div>
  </section>;
}

function Gallery({ albums, categories, search, filter, setSearch, setFilter, onOpen }) {
  return <section className="page-section container gallery-page"><SectionHeading kicker="Momen PMR Wira" title="Galeri kegiatan" description="Simpan cerita, rayakan proses, dan lihat aksi kami." />
    <div className="gallery-toolbar"><label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari album kegiatan..." aria-label="Cari album kegiatan" />{search && <button onClick={() => setSearch("")} aria-label="Hapus pencarian"><X size={16} /></button>}</label><div className="filter-list" role="tablist" aria-label="Filter galeri">{categories.map((category) => <button key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>{category}</button>)}</div></div>
    {albums.length ? <div className="gallery-grid">{albums.map((album, index) => <button className={`gallery-card gallery-card-${index % 4}`} key={album.id} onClick={() => onOpen(album)}><img src={album.cover} alt={album.title} loading="lazy" decoding="async" /><span className="gallery-shade" /><span className="gallery-info"><small>{album.category || "Kegiatan"} · {album.date}</small><strong>{album.title}</strong><span className="gallery-open">Lihat album <ArrowRight size={14} /></span></span></button>)}</div> : <div className="empty-state"><Search size={30} /><h3>Album tidak ditemukan</h3><p>Coba gunakan kata kunci atau filter lain.</p></div>}
  </section>;
}

function Contact({ content, goTo }) {
  const { sekretariat, bergabung } = content.contact || {};
  const waLink = sekretariat?.wa_link || "https://wa.me/6283191735329";

  return (
    <section className="page-section container contact-page">
      <SectionHeading kicker="Mari terhubung" title="Ada yang bisa kami bantu?" description="Datang, sapa, dan kenali kami lebih dekat — sekretariat PMR Wira terbuka untuk seluruh warga sekolah." />

      <div className="contact-grid">
        <div className="contact-info">
          <div className="contact-card contact-card-dark">
            <span className="card-kicker">SEKRETARIAT</span>
            <h3>Temui kami di sekolah.</h3>
            <ContactLine icon="map" text={sekretariat?.alamat} />
            <ContactLine icon="phone" text={sekretariat?.telepon} href={`tel:${(sekretariat?.telepon || "").replace(/\s/g, "")}`} />
            <ContactLine icon="mail" text={sekretariat?.email} href={`mailto:${sekretariat?.email}`} />
            <div className="social-row">
              <a href={`https://instagram.com/${sekretariat?.instagram || ""}`} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
              <a href={waLink} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={18} /></a>
            </div>
          </div>

          <div className="schedule-card">
            <div className="card-kicker"><Clock3 size={15} /> JAM SEKRETARIAT</div>
            {(sekretariat?.jadwal || []).map((row, i) => (
              <div className="schedule-row" key={i}><span>{row.hari}</span><strong>{row.waktu}</strong></div>
            ))}
          </div>
        </div>

        <div className="contact-side">
          {/* Informasi keanggotaan (tanpa formulir pendaftaran) */}
          <div className="contact-card join-info-card">
            <span className="card-kicker">INFORMASI KEANGGOTAAN</span>
            <h3>Tertarik menjadi bagian dari kami?</h3>
            <p>{bergabung?.deskripsi}</p>
            <ul className="join-requirements">
              {(bergabung?.persyaratan || []).map((item, idx) => (
                <li key={idx}><span className="jr-check"><Check size={13} /></span>{item}</li>
              ))}
            </ul>
            <div className="join-note">
              <CircleAlert size={16} />
              <span>{bergabung?.catatan}</span>
            </div>
            <a className="button button-wa full" href={bergabung?.link_wa || waLink} target="_blank" rel="noreferrer">
              Tanya info via WhatsApp <MessageCircle size={16} />
            </a>
          </div>

          <div className="contact-quick-grid">
            <a className="contact-quick-chip" href={waLink} target="_blank" rel="noreferrer">
              <span className="cqc-icon cqc-wa"><MessageCircle size={19} /></span>
              <strong>WhatsApp</strong>
              <small>Balasan tercepat</small>
            </a>
            <a className="contact-quick-chip" href={`mailto:${sekretariat?.email || "pmr@smkn4bjm.sch.id"}`}>
              <span className="cqc-icon cqc-mail"><Mail size={19} /></span>
              <strong>Email</strong>
              <small>Surat resmi</small>
            </a>
            <a className="contact-quick-chip" href={`https://instagram.com/${sekretariat?.instagram || "pmrskenpatbjm"}`} target="_blank" rel="noreferrer">
              <span className="cqc-icon cqc-ig"><Instagram size={19} /></span>
              <strong>Instagram</strong>
              <small>@{sekretariat?.instagram || "pmrskenpatbjm"}</small>
            </a>
            <button className="contact-quick-chip" onClick={() => goTo("sejarah")}>
              <span className="cqc-icon cqc-history"><Landmark size={19} /></span>
              <strong>Sejarah</strong>
              <small>Kenali pendiri kami</small>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ kicker, title, description, action }) { return <div className="section-heading"><div><span className="eyebrow">{kicker}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>; }
function NewsCard({ news, featured }) { return <article className={`news-card ${featured ? "featured" : ""}`}><div className="news-image"><img src={news.image} alt="" loading="lazy" decoding="async" /><span>{news.category}</span></div><div className="news-body"><small>{news.date}</small><h3>{news.title}</h3><p>{news.excerpt}</p><span className="read-more">Baca selengkapnya <ArrowRight size={15} /></span></div></article>; }
function EventCard({ event }) { return <article className="event-card"><div className="event-date"><CalendarDays size={18} /><strong>{event.date}</strong><span>{event.time}</span></div><div className="event-detail"><span className="tag">{event.status}</span><h3>{event.title}</h3><p>{event.description}</p><small><MapPin size={14} /> {event.location}</small></div></article>; }
function PersonCard({ person, muted }) { return <article className={`person-card ${muted ? "person-muted" : ""}`}>{person.foto ? <img src={person.foto} alt={person.nama} /> : <div className="person-avatar"><Icon name={person.icon} size={23} /></div>}<div className="person-content"><span>{person.role || person.jabatan}</span><h3>{person.nama || "Akan diumumkan"}</h3><p>{person.deskripsi}</p></div></article>; }
function DivisionCard({ division }) { const [open, setOpen] = useState(false); return <article className={`division-card ${open ? "open" : ""}`}><button onClick={() => setOpen(!open)} aria-expanded={open}><span className="division-icon">{division.foto ? <img src={division.foto} alt={division.divisi} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} /> : <Icon name={division.icon} size={20} />}</span><span><small>DIVISI</small><strong>{division.divisi}</strong></span><ChevronDown size={18} /></button><div className="member-list">{division.anggota?.map((member) => <span key={member}><UserRound size={13} />{member}</span>)}</div></article>; }
function ContactLine({ icon, text, href }) { const IconComponent = icon === "map" ? MapPin : icon === "phone" ? Phone : Mail; const content = <><IconComponent size={17} /><span>{text}</span></>; return href ? <a className="contact-line" href={href}>{content}</a> : <div className="contact-line">{content}</div>; }

/* =========================================================
   MODAL POP-UP (desain baru — fix blank screen & dark mode)
========================================================= */
function AlbumModal({ album, slide, onClose, onPrev, onNext, onSelect }) {
  const total = album.images?.length || 0;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="album-modal modal-card" role="dialog" aria-modal="true" aria-label={album.title}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">{album.category || "Kegiatan"} · {album.date}</span>
            <h2>{album.title}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Tutup"><X size={21} /></button>
        </div>
        <div className="album-viewer">
          <img src={album.images?.[slide] || album.cover} alt={`${album.title} ${slide + 1}`} onError={(e) => { e.currentTarget.src = album.cover; }} />
          {total > 1 && <>
            <button className="slider-button slider-prev" onClick={onPrev} aria-label="Foto sebelumnya"><ChevronLeft /></button>
            <button className="slider-button slider-next" onClick={onNext} aria-label="Foto berikutnya"><ChevronRight /></button>
            <span className="album-counter">{slide + 1} / {total}</span>
          </>}
        </div>
        {total > 1 && (
          <div className="album-dots">
            {album.images.map((image, index) => <button key={image} className={slide === index ? "active" : ""} onClick={() => onSelect(index)} aria-label={`Buka foto ${index + 1}`} />)}
          </div>
        )}
        <p className="modal-description">{album.description}</p>
      </div>
    </div>
  );
}

function GuideModal({ guide, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="guide-modal modal-card" role="dialog" aria-modal="true" aria-label={guide.title}>
        <div className="modal-head">
          <div>
            <span className={`tag tone-label-${guide.tone}`}>{guide.tag}</span>
            <h2>{guide.title}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Tutup"><X size={21} /></button>
        </div>
        <div className="modal-scroll-area">
          <ol className="guide-steps">{guide.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
        </div>
        <div className="modal-foot">
          <div className="modal-reminder"><CircleAlert size={18} /><span>Jika kondisi memburuk, segera hubungi 119 atau fasilitas kesehatan terdekat.</span></div>
          <button className="button button-dark full" onClick={onClose}>Saya mengerti <Check size={16} /></button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
