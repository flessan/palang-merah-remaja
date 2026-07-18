import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  Bell,
  Camera,
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
  ImagePlus,
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

/* --- Division photo uploads (client-side persistence) ------------------- */
/* The site is a static SPA; without a connected storage bucket we keep the
   uploaded division photos in localStorage so the feature is fully usable in
   the demo. A compressed data URL is stored to stay well within quota. */
const DIVISION_PHOTO_KEY = "pmr_division_photos";
function loadDivisionPhotos() {
  try { return JSON.parse(localStorage.getItem(DIVISION_PHOTO_KEY) || "{}"); } catch { return {}; }
}
function saveDivisionPhoto(divisi, dataUrl) {
  const map = loadDivisionPhotos();
  if (dataUrl) map[divisi] = dataUrl; else delete map[divisi];
  try { localStorage.setItem(DIVISION_PHOTO_KEY, JSON.stringify(map)); } catch { /* quota exceeded */ }
}
function applyDivisionPhotos(data) {
  const photos = loadDivisionPhotos();
  if (data?.org?.divisions?.length && Object.keys(photos).length) {
    data.org.divisions = data.org.divisions.map((division) =>
      photos[division.divisi] ? { ...division, foto: photos[division.divisi] } : division
    );
  }
  return data;
}

/* Downscale + re-encode an uploaded image so stored data URLs stay small. */
function compressImage(file, maxDim = 720, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Berkas harus berupa gambar."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Berkas gambar tidak valid."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          reject(new Error("Gagal memproses gambar."));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function App() {
  const [content, setContent] = useState(() => applyDivisionPhotos(fallbackContent));
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get("tab") || "beranda");
  const [theme, setTheme] = useState(() => localStorage.getItem("pmr_theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [toast, setToast] = useState(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryFilter, setGalleryFilter] = useState("Semua");
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [slide, setSlide] = useState(0);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showToTop, setShowToTop] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}), { once: true });
    }
    loadContent().then((data) => {
      setContent(applyDivisionPhotos(data));
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pmr_theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#121212" : "#f7f6f2");
  }, [theme]);

  useEffect(() => {
    const titles = {
      beranda: "PMR Wira — SMKN 4 Banjarmasin",
      profil: "Profil — PMR Wira",
      edukasi: "Edukasi P3K — PMR Wira",
      galeri: "Galeri — PMR Wira",
      kontak: "Kontak — PMR Wira",
    };
    document.title = titles[activeTab] || "PMR Wira — SMKN 4 Banjarmasin";
  }, [activeTab]);

  useEffect(() => {
    const onScroll = () => setShowToTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenu) return;
    const onDown = (event) => {
      if (!event.target.closest(".desktop-nav") && !event.target.closest(".menu-button")) setMobileMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [mobileMenu]);

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
            {[{ id: "beranda", label: "Beranda" }, { id: "profil", label: "Profil" }, { id: "edukasi", label: "Edukasi P3K" }, { id: "galeri", label: "Galeri" }, { id: "kontak", label: "Kontak" }].map((item) => (
              <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => goTo(item.id)}>{item.label}</button>
            ))}
          </nav>
          <div className="header-actions">
            <button className="theme-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}>
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Buka menu" aria-expanded={mobileMenu}>{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </header>

      {mobileMenu && <div className="nav-backdrop" onClick={() => setMobileMenu(false)} aria-hidden="true" />}

      <main id="main-content">
        {KNOWN_TABS.includes(activeTab) ? (
          <>
            {activeTab === "beranda" && <Home content={content} goTo={goTo} onGuide={() => goTo("edukasi")} />}
            {activeTab === "profil" && <Profile content={content} goTo={goTo} showToast={showToast} />}
            {activeTab === "edukasi" && <Education content={content} onGuide={setSelectedGuide} />}
            {activeTab === "galeri" && <Gallery albums={filteredGallery} categories={categories} search={gallerySearch} filter={galleryFilter} setSearch={setGallerySearch} setFilter={setGalleryFilter} onOpen={openAlbum} />}
            {activeTab === "kontak" && <Contact content={content} showToast={showToast} />}
          </>
        ) : (
          <NotFound goTo={goTo} />
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
        {[{ id: "beranda", label: "Beranda", icon: "users" }, { id: "profil", label: "Profil", icon: "user-round" }, { id: "edukasi", label: "P3K", icon: "shield-check" }, { id: "galeri", label: "Galeri", icon: "award" }, { id: "kontak", label: "Kontak", icon: "megaphone" }].map((item) => (
          <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => goTo(item.id)}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>
        ))}
      </nav>

      {selectedAlbum && <AlbumModal album={selectedAlbum} slide={slide} onClose={() => setSelectedAlbum(null)} onPrev={() => changeSlide(-1)} onNext={() => changeSlide(1)} onSelect={setSlide} />}
      {selectedGuide && <GuideModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />}
      {toast && <div className={`toast toast-${toast.type}`} role="alert"><span>{toast.type === "success" ? <CircleCheck size={18} /> : <CircleAlert size={18} />}</span>{toast.message}</div>}
      <button className={`to-top ${showToTop ? "show" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Kembali ke atas"><ArrowUp size={20} /></button>
    </div>
  );
}

const KNOWN_TABS = ["beranda", "profil", "edukasi", "galeri", "kontak"];

function NotFound({ goTo }) {
  return (
    <section className="page-section container notfound">
      <div className="eyebrow"><span className="eyebrow-dot" /> 404</div>
      <h1>Halaman<br /><em>tidak ada</em></h1>
      <p>Sepertinya halaman yang kamu cari belum tersedia atau sudah dipindahkan.</p>
      <button className="button button-primary" onClick={() => goTo("beranda")}>Kembali ke beranda <ArrowRight size={16} /></button>
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

    <section className="page-section container home-content">
      <SectionHeading kicker="Dari kegiatan kami" title="Kabar terkini" description="Cerita kecil, langkah nyata, dan semangat kebersamaan PMR Wira." action={<button className="text-button" onClick={() => goTo("galeri")}>Lihat semua <ArrowRight size={16} /></button>} />
      <div className="news-grid">{content.announcements.map((news, index) => <NewsCard key={news.id} news={news} featured={index === 0} />)}</div>

      <div className="split-heading"><SectionHeading kicker="Agenda" title="Waktu untuk bergerak" description="Simpan agenda berikut dan hadir bersama kami." /><button className="button button-dark" onClick={() => goTo("kontak")}>Tanya sekretariat <MessageCircle size={16} /></button></div>
      <div className="event-grid">{content.events.map((event) => <EventCard key={event.id} event={event} />)}</div>

      <div className="home-cta"><div><span className="eyebrow eyebrow-light"><Sparkles size={14} /> PANGGILAN KEMANUSIAAN</span><h2>Hal kecil yang kamu lakukan<br /><em>bisa berarti besar.</em></h2><p>Mulai dari belajar P3K, hadir di latihan, dan berani peduli pada sekitar.</p></div><button className="button button-yellow" onClick={() => goTo("kontak")}>Gabung PMR <ArrowRight size={17} /></button></div>
    </section>
  </>;
}

function Profile({ content, goTo, showToast }) {
  const { org } = content;
  return <section className="page-section container profile-page">
    <SectionHeading kicker="Tentang PMR Wira" title="Satu tim, satu kepedulian" description="PMR Wira SMKN 4 Banjarmasin adalah ruang belajar untuk menjadi pribadi yang berkarakter, sigap, dan bermanfaat." />
    <div className="about-grid"><div className="quote-panel"><Quote size={42} /><blockquote>“Kemanusiaan tidak mengenal batas. Di sini kita belajar menjadi pahlawan kecil bagi sesama.”</blockquote><span>— Nilai yang kami bawa</span></div><div className="vision-card"><div className="mini-label"><Eye size={16} /> VISI KAMI</div><h3>Berkarakter, peduli, terampil, dan siap berperan.</h3><p>Mewujudkan anggota Palang Merah Remaja yang aktif di lingkungan sekolah maupun masyarakat.</p></div></div>
    <div className="mission-grid"><div><SectionHeading kicker="Cara kami bertumbuh" title="Misi" /></div><ul className="mission-list">{["Menanamkan nilai kepedulian, kemanusiaan, dan solidaritas.", "Meningkatkan pengetahuan kepalangmerahan dan keterampilan P3K.", "Membentuk sikap disiplin, tanggung jawab, dan kerja sama.", "Mendukung sekolah yang sehat, aman, dan siaga.", "Berperan aktif dalam kegiatan sosial di masyarakat."].map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul></div>
    <div className="section-anchor" id="member"><SectionHeading kicker={`Periode ${org.periode || "2026/2027"}`} title="Struktur organisasi" description="Kenali orang-orang yang menggerakkan PMR Wira." /></div>
    <div className="advisory-grid">{(org.advisory || []).map((person) => <PersonCard key={person.nama} person={{ ...person, role: person.jabatan }} muted />)}</div>
    <div className="leaders-grid">{(org.leaders || []).map((person) => <PersonCard key={person.role} person={person} />)}</div>
    <h3 className="division-title">Koordinator divisi</h3><div className="division-grid">{(org.divisions || []).map((division) => <DivisionCard key={division.divisi} division={division} showToast={showToast} />)}</div>
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
function DivisionCard({ division, showToast }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState(division.foto || null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const pickPhoto = () => fileRef.current?.click();

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImage(file, 720, 0.82);
      setPhoto(dataUrl);
      saveDivisionPhoto(division.divisi, dataUrl);
      showToast?.("Foto divisi tersimpan.");
    } catch (error) {
      showToast?.(error.message || "Gagal mengunggah foto.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`division-card ${open ? "open" : ""}`}>
      <div className="division-head">
        <button className="division-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="division-thumb">{photo ? <img src={photo} alt={division.divisi} /> : <Camera size={18} />}</span>
          <span className="division-meta"><small>DIVISI</small><strong>{division.divisi}</strong></span>
          <ChevronDown size={18} className="division-chevron" />
        </button>
        <button className="division-edit" onClick={pickPhoto} disabled={busy} aria-label="Unggah foto divisi" title="Unggah foto">
          {busy ? <span className="spinner" aria-hidden="true" /> : <ImagePlus size={16} />}
        </button>
        <input ref={fileRef} className="visually-hidden" type="file" accept="image/*" onChange={handlePhoto} />
      </div>
      <div className="member-list">{division.anggota?.map((member) => <span key={member}><UserRound size={13} />{member}</span>)}</div>
    </article>
  );
}
function FAQ({ items }) { const [open, setOpen] = useState(0); return <div className="faq-list">{items.map((item, index) => <div className={`faq-item ${open === index ? "open" : ""}`} key={item.question}><button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span>{item.question}</span><ChevronDown size={18} /></button><div className="faq-answer"><p>{item.answer}</p></div></div>)}</div>; }
function ContactLine({ icon, text, href }) { const IconComponent = icon === "map" ? MapPin : icon === "phone" ? Phone : Mail; const content = <><IconComponent size={17} /><span>{text}</span></>; return href ? <a className="contact-line" href={href}>{content}</a> : <div className="contact-line">{content}</div>; }
function Field({ label, type = "text", value, onChange, required }) { return <label className="field"><span>{label}{required && <b>*</b>}</span><input type={type} value={value} onChange={onChange} required={required} /></label>; }
function AlbumModal({ album, slide, onClose, onPrev, onNext, onSelect }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="album-modal" role="dialog" aria-modal="true" aria-label={album.title}><div className="modal-head"><div><span className="eyebrow">{album.category || "Kegiatan"} · {album.date}</span><h2>{album.title}</h2></div><button className="close-button" onClick={onClose} aria-label="Tutup"><X size={21} /></button></div><div className="album-viewer"><img src={album.images?.[slide] || album.cover} alt={`${album.title} ${slide + 1}`} /><button className="slider-button slider-prev" onClick={onPrev} aria-label="Foto sebelumnya"><ChevronLeft /></button><button className="slider-button slider-next" onClick={onNext} aria-label="Foto berikutnya"><ChevronRight /></button></div><div className="album-dots">{album.images?.map((image, index) => <button key={image} className={slide === index ? "active" : ""} onClick={() => onSelect(index)} aria-label={`Buka foto ${index + 1}`} />)}</div><p className="modal-description">{album.description}</p></div></div>; }
function GuideModal({ guide, onClose }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="guide-modal" role="dialog" aria-modal="true" aria-label={guide.title}><div className="modal-head"><div><span className={`tag tone-label-${guide.tone}`}>{guide.tag}</span><h2>{guide.title}</h2></div><button className="close-button" onClick={onClose} aria-label="Tutup"><X size={21} /></button></div><ol className="guide-steps">{guide.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol><div className="modal-reminder"><CircleAlert size={18} /><span>Jika kondisi memburuk, segera hubungi 119 atau fasilitas kesehatan terdekat.</span></div><button className="button button-dark full" onClick={onClose}>Saya mengerti <Check size={16} /></button></div></div>; }

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error("PMR site error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page-section container notfound">
          <div className="eyebrow"><span className="eyebrow-dot" /> TERJADI KENDALA</div>
          <h1><em>Mohon maaf</em></h1>
          <p>Terjadi kendala saat menampilkan halaman. Coba muat ulang untuk melanjutkan.</p>
          <button className="button button-primary" onClick={() => location.reload()}>Muat ulang <ArrowRight size={16} /></button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
