import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Crown,
  Droplets,
  Eye,
  Flame,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  Instagram,
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
  bell: Bell,
  calendar: CalendarDays,
  crown: Crown,
  droplets: Droplets,
  flame: Flame,
  "graduation-cap": GraduationCap,
  "hand-heart": HandHeart,
  "heart-handshake": HeartHandshake,
  "heart-pulse": HeartPulse,
  instagram: Instagram,
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
    faq: data.faq?.length ? data.faq : fallbackContent.faq,
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

async function postJSON(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Terjadi kesalahan. Coba lagi.");
  return body;
}

function App() {
  const [content, setContent] = useState(fallbackContent);
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get("tab") || "beranda");
  const [theme, setTheme] = useState(() => localStorage.getItem("pmr_theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [toast, setToast] = useState(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryFilter, setGalleryFilter] = useState("Semua");
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [slide, setSlide] = useState(0);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}), { once: true });
    }
    loadContent().then((data) => {
      setContent(data);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pmr_theme", theme);
  }, [theme]);

  useEffect(() => {
    const onPopState = () => setActiveTab(new URLSearchParams(window.location.search).get("tab") || "beranda");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedAlbum || selectedGuide ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedAlbum, selectedGuide]);

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
          <nav className={`desktop-nav ${mobileMenu ? "is-open" : ""}`} aria-label="Navigasi utama">
            {[{ id: "beranda", label: "Beranda" }, { id: "profil", label: "Profil" }, { id: "uks", label: "Ruang UKS & Obat" }, { id: "edukasi", label: "Edukasi P3K" }, { id: "galeri", label: "Galeri" }, { id: "kontak", label: "Kontak" }, { id: "admin", label: "Portal Admin" }].map((item) => (
              <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => goTo(item.id)}>{item.label}</button>
            ))}
          </nav>
          <div className="header-actions">
            <button className={`admin-badge-btn ${activeTab === "admin" ? "active" : ""}`} onClick={() => goTo("admin")} aria-label="Portal Admin" title="Portal Admin">
              <ShieldCheck size={17} />
              <span>Admin</span>
            </button>
            <button className="theme-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}>
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Buka menu" aria-expanded={mobileMenu}>{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {activeTab === "beranda" && <Home content={content} goTo={goTo} onGuide={() => goTo("edukasi")} />}
        {activeTab === "profil" && <Profile content={content} goTo={goTo} />}
        {activeTab === "edukasi" && <Education content={content} onGuide={setSelectedGuide} />}
        {activeTab === "galeri" && <Gallery albums={filteredGallery} categories={categories} search={gallerySearch} filter={galleryFilter} setSearch={setGallerySearch} setFilter={setGalleryFilter} onOpen={openAlbum} />}
        {activeTab === "kontak" && <Contact content={content} showToast={showToast} />}
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
          <div><img src="/gudang/logo/icon.svg" alt="" /><strong>PMR WIRA</strong><p>Humanis. Peduli. Tanggap.</p></div>
          <div className="footer-links"><button onClick={() => goTo("profil")}>Tentang kami</button><button onClick={() => goTo("edukasi")}>Belajar P3K</button><button onClick={() => goTo("kontak")}>Hubungi kami</button></div>
          <small>© {new Date().getFullYear()} PMR Wira SMKN 4 Banjarmasin</small>
        </div>
      </footer>

      <nav className="bottom-nav" aria-label="Navigasi mobile">
        {[{ id: "beranda", label: "Beranda", icon: "users" }, { id: "profil", label: "Profil", icon: "user-round" }, { id: "uks", label: "Ruang UKS", icon: "heart-pulse" }, { id: "edukasi", label: "P3K", icon: "shield-check" }, { id: "galeri", label: "Galeri", icon: "award" }, { id: "kontak", label: "Kontak", icon: "megaphone" }, { id: "admin", label: "Admin", icon: "crown" }].map((item) => (
          <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => goTo(item.id)}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>
        ))}
      </nav>

      {selectedAlbum && <AlbumModal album={selectedAlbum} slide={slide} onClose={() => setSelectedAlbum(null)} onPrev={() => changeSlide(-1)} onNext={() => changeSlide(1)} onSelect={setSlide} />}
      {selectedGuide && <GuideModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />}
      {toast && <div className={`toast toast-${toast.type}`} role="alert"><span>{toast.type === "success" ? <CircleCheck size={18} /> : <CircleAlert size={18} />}</span>{toast.message}</div>}
    </div>
  );
}

function PublicRosterWidget({ roster }) {
  if (!roster || roster.is_published === false) return null;
  const [activeView, setActiveView] = useState("uks"); // 'uks' or 'lapangan'
  const [modalOpen, setModalOpen] = useState(false);

  const scheduleList = activeView === "uks" ? (roster.uks_schedule || []) : (roster.lapangan_schedule || []);

  return (
    <div className="public-roster-section">
      <div className="roster-public-card">
        <div className="rpc-head">
          <div>
            <span className="eyebrow eyebrow-light"><Sparkles size={14} /> JADWAL TUGAS RESMI · {roster.periode || "2026/2027"}</span>
            <h3><HeartPulse size={24} /> Jadwal Jaga UKS & Piket Lapangan</h3>
            <p style={{ color: "#ccc", fontSize: "13px", marginTop: "4px" }}>{roster.keterangan}</p>
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
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal modal-lg" role="dialog">
        <div className="modal-head">
          <div>
            <span className="eyebrow">JADWAL ADIL PMR WIRA · {roster.bulan_label}</span>
            <h2>Daftar Lengkap Shift Jaga UKS & Piket Lapangan</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body-form">
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>{roster.keterangan}</p>
          
          <div className="rss-tabs" style={{ marginBottom: 0 }}>
            <button className={`rss-tab ${tab === "uks" ? "active" : ""}`} onClick={() => setTab("uks")}>
              📍 Penjagaan Ruang UKS (Senin–Jumat)
            </button>
            <button className={`rss-tab ${tab === "lapangan" ? "active" : ""}`} onClick={() => setTab("lapangan")}>
              🚩 Piket Lapangan Upacara (Setiap Senin)
            </button>
            <button className={`rss-tab ${tab === "fairness" ? "active" : ""}`} onClick={() => setTab("fairness")}>
              ⚖️ Bukti Keadilan Distribusi
            </button>
          </div>

          <div style={{ maxHeight: "50vh", overflowY: "auto", display: "grid", gap: "10px", paddingRight: "4px" }}>
            {tab !== "fairness" ? (
              (tab === "uks" ? roster.uks_schedule : roster.lapangan_schedule)?.map((shift, sIdx) => (
                <div className="rss-row" key={sIdx} style={{ background: "var(--paper)" }}>
                  <div className="rss-date">
                    <strong>{shift.tanggal}</strong>
                    <span className="tag">{shift.hari}</span>
                  </div>
                  <div className="rss-petugas">
                    <span>Petugas Bertugas:</span>
                    <div className="petugas-pills">
                      {shift.petugas?.map((nama, mi) => (
                        <div className="petugas-pill" key={mi}>
                          <UserRound size={13} /> <span>{nama}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                <div className="fair-badge" style={{ alignSelf: "start" }}>
                  <Check size={16} /> DISTRIBUSI SECARA ALGORITMA TERBUKTI 100% ADIL (Selisih frekuensi antar anggota $\le 1$)
                </div>
                <p style={{ fontSize: "13px", color: "var(--muted)" }}>Algoritma Fair Shuffling kami mendistribusikan shift agar setiap anggota mendapatkan jumlah giliran yang seimbang dalam sebulan, tanpa jadwal berturut-turut pada hari berikutnya dan tanpa bentrok hari Senin antara UKS dan Lapangan.</p>
                <div className="audit-chips">
                  {Object.entries(roster.summary_counts || {}).map(([nama, c]) => (
                    <div className="audit-chip" key={nama} style={{ background: "var(--card)" }}>
                      <strong>{nama}</strong>
                      <span>UKS: {c.uks} · Lapangan: {c.lapangan} ➔ <b>Total: {c.total} shift</b></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="button button-dark" onClick={onClose}>Tutup Jadwal <Check size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UksHomepageBanner({ uksInfo, goTo }) {
  const info = uksInfo || fallbackContent.uks_info;
  return (
    <section className="container uks-home-banner-section">
      <div className="uks-home-banner">
        <div className="uhb-left">
          <span className="eyebrow eyebrow-light"><Sparkles size={14} /> LAYANAN KESEHATAN SEKOLAH · 100% GRATIS</span>
          <h2>{info.welcome_banner?.title || "Ruang UKS Terbuka untuk Seluruh Siswa-Siswi."}</h2>
          <p>{info.welcome_banner?.subtitle || "Merasa kurang sehat atau butuh obat pusing/demam saat jam pelajaran? Datanglah ke Ruang UKS. Semua pemeriksaan & stok obat P3K disediakan secara gratis."}</p>
          <div className="uhb-tags">
            <span><Check size={14} /> Paracetamol & Antasida Gratis</span>
            <span><Check size={14} /> Minyak Kayu Putih & Betadine</span>
            <span><Check size={14} /> Cek Suhu & Tensi Darah</span>
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
          <strong>Butuh konsultasi lebih lanjut atau punya pertanyaan?</strong>
          <span>Hubungi tim sekretariat PMR Wira & Pembina UKS SMKN 4 Banjarmasin.</span>
        </div>
        <button className="button button-primary" onClick={() => goTo("kontak")}>
          Hubungi Sekretariat <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function Home({ content, goTo, onGuide }) {
  return <>
    <section className="hero-section page-section">
      <div className="hero-grid container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> EKSTRAKURIKULER KEMANUSIAAN · 2026/2027</div>
          <h1>Siap.<br /><em>Tanggap.</em><br />Selamatkan.</h1>
          <p className="hero-lede">Membentuk generasi <strong>humanis</strong> yang peduli, terampil, dan siap beraksi untuk kemanusiaan di sekolah maupun masyarakat.</p>
          <div className="hero-actions"><button className="button button-primary" onClick={() => goTo("kontak")}><HeartHandshake size={18} /> Jadi relawan <ArrowRight size={17} /></button><button className="button button-ghost" onClick={onGuide}><Play size={16} fill="currentColor" /> Mulai belajar P3K</button></div>
          <div className="hero-note"><span className="pulse-dot" /> Pendaftaran anggota dibuka setiap awal semester genap</div>
        </div>
        <div className="hero-art" aria-label="Ilustrasi semangat kemanusiaan">
          <div className="art-circle art-circle-back" /><div className="art-circle art-circle-mid" /><div className="art-cross">+</div>
          <div className="art-card art-card-top"><span className="art-icon"><ShieldCheck size={19} /></span><span><b>SIAGA</b><small>Belajar pertolongan pertama</small></span></div>
          <div className="art-card art-card-bottom"><HeartPulse size={21} /><span><b>56</b><small>Aksi sosial terlaksana</small></span></div>
          <div className="art-badge"><img src="/gudang/logo/pmr-logo.webp" alt="" /><span><b>PMR</b><small>WIRA</small></span></div>
          <div className="art-label">BE<br />THE<br /><strong>HELP</strong></div>
        </div>
      </div>
    </section>

    <section className="stats-section"><div className="container stats-grid">{content.stats.map((stat) => <div className="stat" key={stat.label}><Icon name={stat.icon} size={22} /><strong>{stat.value}<small>+</small></strong><span>{stat.label}</span></div>)}</div></section>

    <PublicRosterWidget roster={content.roster} />
    <UksHomepageBanner uksInfo={content.uks_info} goTo={goTo} />

    <section className="page-section container home-content">
      <SectionHeading kicker="Dari kegiatan kami" title="Kabar terkini" description="Cerita kecil, langkah nyata, dan semangat kebersamaan PMR Wira." action={<button className="text-button" onClick={() => goTo("galeri")}>Lihat semua <ArrowRight size={16} /></button>} />
      <div className="news-grid">{content.announcements.map((news, index) => <NewsCard key={news.id} news={news} featured={index === 0} />)}</div>

      <div className="split-heading"><SectionHeading kicker="Agenda" title="Waktu untuk bergerak" description="Simpan agenda berikut dan hadir bersama kami." /><button className="button button-dark" onClick={() => goTo("kontak")}>Tanya sekretariat <MessageCircle size={16} /></button></div>
      <div className="event-grid">{content.events.map((event) => <EventCard key={event.id} event={event} />)}</div>

      <div className="home-cta"><div><span className="eyebrow eyebrow-light"><Sparkles size={14} /> PANGGILAN KEMANUSIAAN</span><h2>Hal kecil yang kamu lakukan<br /><em>bisa berarti besar.</em></h2><p>Mulai dari belajar P3K, hadir di latihan, dan berani peduli pada sekitar.</p></div><button className="button button-yellow" onClick={() => goTo("kontak")}>Gabung PMR <ArrowRight size={17} /></button></div>
    </section>
  </>;
}

function Profile({ content, goTo }) {
  const { org } = content;
  return <section className="page-section container profile-page">
    <SectionHeading kicker="Tentang PMR Wira" title="Satu tim, satu kepedulian" description="PMR Wira SMKN 4 Banjarmasin adalah ruang belajar untuk menjadi pribadi yang berkarakter, sigap, dan bermanfaat." />
    <div className="about-grid"><div className="quote-panel"><Quote size={42} /><blockquote>“Kemanusiaan tidak mengenal batas. Di sini kita belajar menjadi pahlawan kecil bagi sesama.”</blockquote><span>— Nilai yang kami bawa</span></div><div className="vision-card"><div className="mini-label"><Eye size={16} /> VISI KAMI</div><h3>Berkarakter, peduli, terampil, dan siap berperan.</h3><p>Mewujudkan anggota Palang Merah Remaja yang aktif di lingkungan sekolah maupun masyarakat.</p></div></div>
    <div className="mission-grid"><div><SectionHeading kicker="Cara kami bertumbuh" title="Misi" /></div><ul className="mission-list">{["Menanamkan nilai kepedulian, kemanusiaan, dan solidaritas.", "Meningkatkan pengetahuan kepalangmerahan dan keterampilan P3K.", "Membentuk sikap disiplin, tanggung jawab, dan kerja sama.", "Mendukung sekolah yang sehat, aman, dan siaga.", "Berperan aktif dalam kegiatan sosial di masyarakat."].map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul></div>
    <div className="section-anchor" id="member"><SectionHeading kicker={`Periode ${org.periode || "2026/2027"}`} title="Struktur organisasi" description="Kenali orang-orang yang menggerakkan PMR Wira." /></div>
    <div className="advisory-grid">{(org.advisory || []).map((person) => <PersonCard key={person.nama} person={{ ...person, role: person.jabatan }} muted />)}</div>
    <div className="leaders-grid">{(org.leaders || []).map((person) => <PersonCard key={person.role} person={person} />)}</div>
    <h3 className="division-title">Koordinator divisi</h3><div className="division-grid">{(org.divisions || []).map((division) => <DivisionCard key={division.divisi} division={division} />)}</div>
    <div className="faq-section"><SectionHeading kicker="Masih penasaran?" title="Pertanyaan umum" /> <FAQ items={content.faq} /></div>
    <div className="inline-cta"><div><strong>Ingin terlibat lebih jauh?</strong><span>Temukan cara bergabung dengan PMR Wira.</span></div><button className="button button-primary" onClick={() => goTo("kontak")}>Hubungi kami <ArrowRight size={16} /></button></div>
  </section>;
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
    {albums.length ? <div className="gallery-grid">{albums.map((album, index) => <button className={`gallery-card gallery-card-${index % 4}`} key={album.id} onClick={() => onOpen(album)}><img src={album.cover} alt={album.title} loading="lazy" /><span className="gallery-shade" /><span className="gallery-info"><small>{album.category || "Kegiatan"} · {album.date}</small><strong>{album.title}</strong><span className="gallery-open">Lihat album <ArrowRight size={14} /></span></span></button>)}</div> : <div className="empty-state"><Search size={30} /><h3>Album tidak ditemukan</h3><p>Coba gunakan kata kunci atau filter lain.</p></div>}
  </section>;
}

function Contact({ content, showToast }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", className: "", message: "", website: "" });
  const [messageForm, setMessageForm] = useState({ name: "", email: "", message: "", website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const { sekretariat, bergabung } = content.contact;

  const update = (setter, key) => (event) => setter((current) => ({ ...current, [key]: event.target.value }));
  const submitRegistration = async (event) => {
    event.preventDefault();
    if (form.website) return;
    setSubmitting(true);
    try {
      await postJSON("/api/registrations", form);
      setForm({ name: "", email: "", phone: "", className: "", message: "", website: "" });
      showToast("Pendaftaran terkirim. Sekretariat akan menghubungi kamu.");
    } catch (error) { showToast(error.message, "error"); } finally { setSubmitting(false); }
  };
  const submitMessage = async (event) => {
    event.preventDefault();
    if (messageForm.website) return;
    setMessageSubmitting(true);
    try {
      await postJSON("/api/messages", messageForm);
      setMessageForm({ name: "", email: "", message: "", website: "" });
      showToast("Pesan terkirim. Terima kasih sudah menghubungi kami.");
    } catch (error) { showToast(error.message, "error"); } finally { setMessageSubmitting(false); }
  };

  return <section className="page-section container contact-page"><SectionHeading kicker="Mari terhubung" title="Ada yang bisa kami bantu?" description="Datang, belajar, dan bertumbuh bersama PMR Wira." />
    <div className="contact-grid"><div className="contact-info"><div className="contact-card contact-card-dark"><span className="card-kicker">SEKRETARIAT</span><h3>Temui kami di sekolah.</h3><ContactLine icon="map" text={sekretariat.alamat} /><ContactLine icon="phone" text={sekretariat.telepon} href={`tel:${(sekretariat.telepon || "").replace(/\s/g, "")}`} /><ContactLine icon="mail" text={sekretariat.email} href={`mailto:${sekretariat.email}`} /><div className="social-row"><a href={`https://instagram.com/${sekretariat.instagram}`} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a><a href={sekretariat.wa_link} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a><a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={18} /></a></div></div><div className="schedule-card"><div className="card-kicker"><Clock3 size={15} /> JAM SEKRETARIAT</div>{(sekretariat.jadwal || []).map((row) => <div className="schedule-row" key={row.hari}><span>{row.hari}</span><strong>{row.waktu}</strong></div>)}</div></div>
      <div className="contact-card registration-card"><span className="card-kicker">PENDAFTARAN RELAWAN</span><h3>Mulai dari satu langkah.</h3><p>{bergabung.deskripsi}</p><ul>{bergabung.persyaratan?.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul><form onSubmit={submitRegistration} className="form-grid"><input className="honeypot" tabIndex="-1" autoComplete="off" value={form.website} onChange={update(setForm, "website")} /><Field label="Nama lengkap" value={form.name} onChange={update(setForm, "name")} required /><Field label="Email aktif" type="email" value={form.email} onChange={update(setForm, "email")} required /><Field label="Nomor WhatsApp" value={form.phone} onChange={update(setForm, "phone")} required /><Field label="Kelas / jurusan" value={form.className} onChange={update(setForm, "className")} /><label className="field full"><span>Ceritakan motivasimu <small>(opsional)</small></span><textarea rows="3" value={form.message} onChange={update(setForm, "message")} placeholder="Saya ingin belajar..." /></label><button className="button button-primary full" disabled={submitting}>{submitting ? "Mengirim..." : <>Kirim pendaftaran <Send size={16} /></>}</button></form><small className="form-note">{bergabung.catatan}</small></div></div>
    <div className="contact-bottom"><div><SectionHeading kicker="Pesan singkat" title="Bicaralah dengan kami" description="Untuk pertanyaan umum, tinggalkan pesan dan kami akan membalas melalui email." /></div><form className="message-form" onSubmit={submitMessage}><input className="honeypot" tabIndex="-1" autoComplete="off" value={messageForm.website} onChange={update(setMessageForm, "website")} /><div className="two-fields"><Field label="Nama" value={messageForm.name} onChange={(event) => setMessageForm((current) => ({ ...current, name: event.target.value }))} required /><Field label="Email" type="email" value={messageForm.email} onChange={(event) => setMessageForm((current) => ({ ...current, email: event.target.value }))} required /></div><label className="field"><span>Pesan</span><textarea rows="5" value={messageForm.message} onChange={(event) => setMessageForm((current) => ({ ...current, message: event.target.value }))} required placeholder="Tulis pertanyaanmu di sini..." /></label><button className="button button-dark" disabled={messageSubmitting}>{messageSubmitting ? "Mengirim..." : <>Kirim pesan <ArrowRight size={16} /></>}</button></form></div>
  </section>;
}

function SectionHeading({ kicker, title, description, action }) { return <div className="section-heading"><div><span className="eyebrow">{kicker}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>; }
function NewsCard({ news, featured }) { return <article className={`news-card ${featured ? "featured" : ""}`}><div className="news-image"><img src={news.image} alt="" loading="lazy" /><span>{news.category}</span></div><div className="news-body"><small>{news.date}</small><h3>{news.title}</h3><p>{news.excerpt}</p><span className="read-more">Baca selengkapnya <ArrowRight size={15} /></span></div></article>; }
function EventCard({ event }) { return <article className="event-card"><div className="event-date"><CalendarDays size={18} /><strong>{event.date}</strong><span>{event.time}</span></div><div className="event-detail"><span className="tag">{event.status}</span><h3>{event.title}</h3><p>{event.description}</p><small><MapPin size={14} /> {event.location}</small></div></article>; }
function PersonCard({ person, muted }) { return <article className={`person-card ${muted ? "person-muted" : ""}`}>{person.foto ? <img src={person.foto} alt={person.nama} /> : <div className="person-avatar"><Icon name={person.icon} size={23} /></div>}<div className="person-content"><span>{person.role || person.jabatan}</span><h3>{person.nama || "Akan diumumkan"}</h3><p>{person.deskripsi}</p></div></article>; }
function DivisionCard({ division }) { const [open, setOpen] = useState(false); return <article className={`division-card ${open ? "open" : ""}`}><button onClick={() => setOpen(!open)} aria-expanded={open}><span className="division-icon"><Icon name={division.icon} size={20} /></span><span><small>DIVISI</small><strong>{division.divisi}</strong></span><ChevronDown size={18} /></button><div className="member-list">{division.anggota?.map((member) => <span key={member}><UserRound size={13} />{member}</span>)}</div></article>; }
function FAQ({ items }) { const [open, setOpen] = useState(0); return <div className="faq-list">{items.map((item, index) => <div className={`faq-item ${open === index ? "open" : ""}`} key={item.question}><button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span>{item.question}</span><ChevronDown size={18} /></button><div className="faq-answer"><p>{item.answer}</p></div></div>)}</div>; }
function ContactLine({ icon, text, href }) { const IconComponent = icon === "map" ? MapPin : icon === "phone" ? Phone : Mail; const content = <><IconComponent size={17} /><span>{text}</span></>; return href ? <a className="contact-line" href={href}>{content}</a> : <div className="contact-line">{content}</div>; }
function Field({ label, type = "text", value, onChange, required }) { return <label className="field"><span>{label}{required && <b>*</b>}</span><input type={type} value={value} onChange={onChange} required={required} /></label>; }
function AlbumModal({ album, slide, onClose, onPrev, onNext, onSelect }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="album-modal" role="dialog" aria-modal="true" aria-label={album.title}><div className="modal-head"><div><span className="eyebrow">{album.category || "Kegiatan"} · {album.date}</span><h2>{album.title}</h2></div><button className="close-button" onClick={onClose} aria-label="Tutup"><X size={21} /></button></div><div className="album-viewer"><img src={album.images?.[slide] || album.cover} alt={`${album.title} ${slide + 1}`} /><button className="slider-button slider-prev" onClick={onPrev} aria-label="Foto sebelumnya"><ChevronLeft /></button><button className="slider-button slider-next" onClick={onNext} aria-label="Foto berikutnya"><ChevronRight /></button></div><div className="album-dots">{album.images?.map((image, index) => <button key={image} className={slide === index ? "active" : ""} onClick={() => onSelect(index)} aria-label={`Buka foto ${index + 1}`} />)}</div><p className="modal-description">{album.description}</p></div></div>; }
function GuideModal({ guide, onClose }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="guide-modal" role="dialog" aria-modal="true" aria-label={guide.title}><div className="modal-head"><div><span className={`tag tone-label-${guide.tone}`}>{guide.tag}</span><h2>{guide.title}</h2></div><button className="close-button" onClick={onClose} aria-label="Tutup"><X size={21} /></button></div><ol className="guide-steps">{guide.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol><div className="modal-reminder"><CircleAlert size={18} /><span>Jika kondisi memburuk, segera hubungi 119 atau fasilitas kesehatan terdekat.</span></div><button className="button button-dark full" onClick={onClose}>Saya mengerti <Check size={16} /></button></div></div>; }

createRoot(document.getElementById("root")).render(<App />);
