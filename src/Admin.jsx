import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  Award,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Copy,
  Crown,
  Database,
  Download,
  Droplets,
  Edit3,
  Flame,
  FolderOpen,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  Image as ImageIcon,
  Info,
  Instagram,
  Key,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  MessageCircle,
  NotebookPen,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserRound,
  UserRoundCheck,
  Users,
  UsersRound,
  WalletCards,
  Wind,
  X,
} from "lucide-react";
import { assetLibrary, fallbackContent } from "./data.js";

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

async function adminFetch(path, options = {}) {
  const pin = sessionStorage.getItem("pmr_admin_pin") || "2026";
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Admin-Pin": pin,
    ...(options.headers || {}),
  };
  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Gagal menghubungi server. Coba periksa PIN Admin.");
  return body;
}

export function AdminPanel({ showToast, onRefreshPublic }) {
  const [pinInput, setPinInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(() => Boolean(sessionStorage.getItem("pmr_admin_pin")));
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  // Search & Filters per module
  const [newsSearch, setNewsSearch] = useState("");
  const [newsCategory, setNewsCategory] = useState("Semua");
  const [eventSearch, setEventSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("Semua");
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("Semua");
  const [regSearch, setRegSearch] = useState("");
  const [regFilter, setRegFilter] = useState("Semua");
  const [msgSearch, setMsgSearch] = useState("");
  const [msgFilter, setMsgFilter] = useState("Semua");

  // Modals state
  const [editingNews, setEditingNews] = useState(null); // null when closed, {} or item when open
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingGallery, setEditingGallery] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null); // { type: 'advisory'|'leaders', item, index }
  const [editingDivision, setEditingDivision] = useState(null); // { item, index }
  const [editingGuide, setEditingGuide] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreJsonText, setRestoreJsonText] = useState("");

  const loadAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminFetch("/api/admin/data");
      if (res.ok && res.data) {
        setData(res.data);
        if (onRefreshPublic) onRefreshPublic(res.data);
      }
    } catch (err) {
      if (!silent) showToast(err.message, "error");
      if (err.message?.includes("PIN")) {
        sessionStorage.removeItem("pmr_admin_pin");
        setIsUnlocked(false);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch("/api/health").then((r) => r.json());
      setHealthStatus(res);
    } catch {
      setHealthStatus({ ok: false, database: false, service: "offline" });
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadAdminData();
      checkHealth();
    }
  }, [isUnlocked]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!pinInput.trim()) return;
    sessionStorage.setItem("pmr_admin_pin", pinInput.trim());
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/data");
      if (res.ok) {
        setData(res.data);
        setIsUnlocked(true);
        showToast("Masuk ke Portal Admin berhasil.");
        if (onRefreshPublic) onRefreshPublic(res.data);
      }
    } catch (err) {
      sessionStorage.removeItem("pmr_admin_pin");
      showToast(err.message || "PIN Admin salah.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pmr_admin_pin");
    setIsUnlocked(false);
    setData(null);
    showToast("Keluar dari Portal Admin.");
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Apakah kamu yakin ingin mereset data demo ke pengaturan bawaan awal?")) return;
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/reset", { method: "POST" });
      showToast(res.message || "Data berhasil direset.");
      await loadAdminData(true);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = () => {
    if (!data) return;
    const backupObj = {
      timestamp: new Date().toISOString(),
      stats: data.stats,
      announcements: data.announcements,
      events: data.events,
      gallery: data.gallery,
      org: data.org,
      contact: data.contact,
      guides: data.guides,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pmr-wira-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("File backup JSON berhasil diunduh.");
  };

  const handleRestoreBackup = async () => {
    try {
      const parsed = JSON.parse(restoreJsonText);
      setLoading(true);
      const res = await adminFetch("/api/admin/restore", {
        method: "POST",
        body: JSON.stringify({ backup: parsed }),
      });
      showToast(res.message || "Restore berhasil.");
      setShowRestoreModal(false);
      setRestoreJsonText("");
      await loadAdminData(true);
    } catch (err) {
      showToast("Format JSON tidak valid atau gagal dipulihkan: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // CRUD Actions
  const saveNews = async (formData) => {
    try {
      const res = await adminFetch("/api/admin/announcements", { method: "POST", body: JSON.stringify(formData) });
      showToast("Kabar berhasil disimpan!");
      setEditingNews(null);
      await loadAdminData(true);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteNews = async (id) => {
    if (!window.confirm("Hapus kabar ini dari daftar?")) return;
    try {
      await adminFetch(`/api/admin/announcements?id=${id}`, { method: "DELETE", body: JSON.stringify({ id }) });
      showToast("Kabar berhasil dihapus.");
      await loadAdminData(true);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const saveEvent = async (formData) => {
    try {
      await adminFetch("/api/admin/events", { method: "POST", body: JSON.stringify(formData) });
      showToast("Agenda berhasil disimpan!");
      setEditingEvent(null);
      await loadAdminData(true);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Hapus agenda ini?")) return;
    try {
      await adminFetch(`/api/admin/events?id=${id}`, { method: "DELETE", body: JSON.stringify({ id }) });
      showToast("Agenda berhasil dihapus.");
      await loadAdminData(true);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const saveGallery = async (formData) => {
    try {
      await adminFetch("/api/admin/gallery", { method: "POST", body: JSON.stringify(formData) });
      showToast("Album galeri berhasil disimpan!");
      setEditingGallery(null);
      await loadAdminData(true);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteGallery = async (id) => {
    if (!window.confirm("Hapus album galeri ini?")) return;
    try {
      await adminFetch(`/api/admin/gallery?id=${id}`, { method: "DELETE", body: JSON.stringify({ id }) });
      showToast("Album galeri berhasil dihapus.");
      await loadAdminData(true);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const saveContentKey = async (key, value) => {
    try {
      await adminFetch("/api/admin/content", { method: "POST", body: JSON.stringify({ key, value }) });
      showToast(`Konten bagian [${key.toUpperCase()}] berhasil disimpan!`);
      await loadAdminData(true);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="admin-gate-shell container">
        <div className="admin-gate-card">
          <div className="gate-header">
            <span className="gate-icon">
              <Lock size={28} />
            </span>
            <h2>Portal Admin PMR Wira</h2>
            <p>Masukkan PIN atau sandi rahasia untuk mengelola konten web, kabar, agenda, galeri, jadwal jaga, dan struktur organisasi.</p>
          </div>
          <form onSubmit={handleLogin} className="gate-form">
            <label className="field">
              <span>PIN Admin</span>
              <input
                type="password"
                placeholder="Masukkan PIN rahasia..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
              />
            </label>
            <button type="submit" className="button button-primary full" disabled={loading}>
              {loading ? "Memverifikasi..." : <>Masuk ke Admin <ArrowRight size={17} /></>}
            </button>
          </form>
          <div className="gate-hints">
            <div className="hint-chip">
              <Info size={15} />
              <span><strong>PIN Demo / Bawaan:</strong> <code>2026</code> (atau <code>pmr2026</code>)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-loading container">
        <RefreshCw className="spinner" size={28} />
        <p>Memuat data Portal Admin...</p>
      </div>
    );
  }

  // Filter lists for views
  const filteredNews = (data.announcements || []).filter((item) => {
    const matchQuery = !newsSearch.trim() || `${item.title} ${item.excerpt} ${item.category}`.toLowerCase().includes(newsSearch.toLowerCase());
    const matchCat = newsCategory === "Semua" || item.category === newsCategory;
    return matchQuery && matchCat;
  });

  const filteredEvents = (data.events || []).filter((item) => {
    const matchQuery = !eventSearch.trim() || `${item.title} ${item.location} ${item.description}`.toLowerCase().includes(eventSearch.toLowerCase());
    const matchStat = eventFilter === "Semua" || item.status === eventFilter;
    return matchQuery && matchStat;
  });

  const filteredGallery = (data.gallery || []).filter((item) => {
    const matchQuery = !gallerySearch.trim() || `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(gallerySearch.toLowerCase());
    const matchCat = galleryCategory === "Semua" || item.category === galleryCategory;
    return matchQuery && matchCat;
  });

  return (
    <div className="admin-shell container">
      {/* Top Admin Bar */}
      <header className="admin-topbar">
        <div className="topbar-left">
          <div className="admin-brand">
            <span className="admin-badge-icon"><ShieldCheck size={20} /></span>
            <div>
              <h3>PORTAL ADMIN PMR WIRA</h3>
              <small>SMKN 4 BANJARMASIN · {data.org?.periode || "2026/2027"}</small>
            </div>
          </div>
          <div className={`db-status-pill ${data.source === "telegraph" ? "db-telegraph" : "db-demo"}`}>
            <Database size={14} />
            <span>{data.source === "telegraph" ? "Telegraph Cloud Terhubung" : "Mode Demo (Penyimpanan Memori)"}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="button button-ghost button-sm" onClick={() => loadAdminData(false)} title="Muat Ulang Data">
            <RefreshCw size={15} /> <span>Refresh</span>
          </button>
          <button className="button button-ghost button-sm" onClick={handleExportBackup} title="Unduh Backup JSON">
            <Download size={15} /> <span>Backup</span>
          </button>
          <button className="button button-ghost button-sm" onClick={() => setShowRestoreModal(true)} title="Impor Restore">
            <Upload size={15} /> <span>Restore</span>
          </button>
          <button className="button button-ghost button-sm text-red" onClick={handleResetDemo} title="Reset ke Data Demo Bawaan">
            <RotateCcw size={15} /> <span>Reset</span>
          </button>
          <button className="button button-dark button-sm" onClick={handleLogout}>
            <LogOut size={15} /> <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-tabs */}
      <nav className="admin-subnav" aria-label="Navigasi Modul Admin">
        {[
          { id: "overview", label: "Dashboard", icon: "award" },
          { id: "announcements", label: "Kabar & Berita", icon: "megaphone", count: data.announcements?.length },
          { id: "events", label: "Agenda Kegiatan", icon: "calendar", count: data.events?.length },
          { id: "roster", label: "Jadwal Shift", icon: "shield-check" },
          { id: "gallery", label: "Galeri Album", icon: "flame", count: data.gallery?.length },
          { id: "org", label: "Organisasi & Divisi", icon: "users-round" },
          { id: "content", label: "Pengaturan & P3K", icon: "shield-check" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`subnav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`tab-count ${tab.highlight && tab.count > 0 ? "highlight" : ""}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="admin-content-area">
        {activeTab === "overview" && (
          <OverviewTab
            data={data}
            healthStatus={healthStatus}
            setActiveTab={setActiveTab}
            setEditingNews={setEditingNews}
            setEditingEvent={setEditingEvent}
            setEditingGallery={setEditingGallery}
          />
        )}
        {activeTab === "announcements" && (
          <AnnouncementsTab
            list={filteredNews}
            search={newsSearch}
            setSearch={setNewsSearch}
            category={newsCategory}
            setCategory={setNewsCategory}
            onOpenCreate={() => setEditingNews({ category: "Kabar PMR", title: "", excerpt: "", date_label: new Date().toLocaleDateString("id-ID"), image_url: "/gudang/gallery/juara.avif", is_published: true })}
            onEdit={(item) => setEditingNews(item)}
            onDelete={deleteNews}
          />
        )}
        {activeTab === "events" && (
          <EventsTab
            list={filteredEvents}
            search={eventSearch}
            setSearch={setEventSearch}
            filter={eventFilter}
            setFilter={setEventFilter}
            onOpenCreate={() => setEditingEvent({ title: "", date_label: "Setiap Kamis", time_label: "15.00–17.00 WITA", location: "Aula / lapangan sekolah", description: "", status: "Terbuka untuk anggota", is_published: true })}
            onEdit={(item) => setEditingEvent(item)}
            onDelete={deleteEvent}
          />
        )}
        {activeTab === "roster" && (
          <RosterTab
            roster={data.roster}
            org={data.org}
            showToast={showToast}
            onSaveRoster={async (newRoster, autoAnnounce) => {
              await saveContentKey("roster", newRoster);
              if (autoAnnounce) {
                await saveNews({
                  id: "news-roster-" + Date.now(),
                  category: "Jadwal Tugas",
                  title: `Jadwal Jaga UKS & Lapangan - ${newRoster.bulan_label}`,
                  excerpt: `Berikut pembagian tugas penjagaan Ruang UKS (Senin–Jumat) dan piket lapangan upacara (Senin) bagi anggota aktif periode ${newRoster.bulan_label}.`,
                  date_label: new Date().toLocaleDateString("id-ID"),
                  image_url: "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_1_elixib.avif",
                  is_published: true
                });
              }
            }}
          />
        )}
        {activeTab === "gallery" && (
          <GalleryTab
            list={filteredGallery}
            search={gallerySearch}
            setSearch={setGallerySearch}
            category={galleryCategory}
            setCategory={setGalleryCategory}
            onOpenCreate={() => setEditingGallery({ title: "", category: "Kegiatan", date_label: new Date().toLocaleDateString("id-ID"), event_date: new Date().toISOString().slice(0, 10), cover_url: "/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif", images: ["/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif"], description: "", is_published: true })}
            onEdit={(item) => setEditingGallery(item)}
            onDelete={deleteGallery}
          />
        )}
        {activeTab === "org" && (
          <OrgTab
            org={data.org}
            onSaveOrg={(newOrg) => saveContentKey("org", newOrg)}
            onEditPerson={(type, item, index) => setEditingPerson({ type, item, index })}
            onEditDivision={(item, index) => setEditingDivision({ item, index })}
          />
        )}
        {activeTab === "content" && (
          <SettingsTab
            stats={data.stats}
            guides={data.guides}
            contact={data.contact}
            uksInfo={data.uks_info}
            onSaveStats={(newStats) => saveContentKey("stats", newStats)}
            onSaveGuides={(newGuides) => saveContentKey("guides", newGuides)}
            onSaveContact={(newContact) => saveContentKey("contact", newContact)}
            onSaveUksInfo={(newUksInfo) => saveContentKey("uks_info", newUksInfo)}
            onEditGuide={(item) => setEditingGuide(item || { id: "guide-" + Date.now(), title: "", icon: "droplets", tone: "red", tag: "Tindakan cepat", summary: "", steps: ["Langkah 1..."] })}
          />
        )}
      </div>

      {/* Modals */}
      {editingNews && (
        <AnnouncementModal
          item={editingNews}
          onClose={() => setEditingNews(null)}
          onSave={saveNews}
          showToast={showToast}
        />
      )}
      {editingEvent && (
        <EventModal
          item={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={saveEvent}
        />
      )}
      {editingGallery && (
        <GalleryModal
          item={editingGallery}
          onClose={() => setEditingGallery(null)}
          onSave={saveGallery}
          showToast={showToast}
        />
      )}
      {editingPerson && (
        <PersonModal
          modalData={editingPerson}
          org={data.org}
          onClose={() => setEditingPerson(null)}
          onSaveOrg={(newOrg) => {
            saveContentKey("org", newOrg);
            setEditingPerson(null);
          }}
          showToast={showToast}
        />
      )}
      {editingDivision && (
        <DivisionModal
          modalData={editingDivision}
          org={data.org}
          onClose={() => setEditingDivision(null)}
          onSaveOrg={(newOrg) => {
            saveContentKey("org", newOrg);
            setEditingDivision(null);
          }}
          showToast={showToast}
        />
      )}
      {editingGuide && (
        <GuideEditModal
          guide={editingGuide}
          guidesList={data.guides}
          onClose={() => setEditingGuide(null)}
          onSaveGuides={(newGuides) => {
            saveContentKey("guides", newGuides);
            setEditingGuide(null);
          }}
        />
      )}
      {showRestoreModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowRestoreModal(false)}>
          <div className="admin-modal" role="dialog">
            <div className="modal-head">
              <div>
                <span className="eyebrow">PULIHKAN BACKUP</span>
                <h2>Impor File JSON</h2>
              </div>
              <button className="close-button" onClick={() => setShowRestoreModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p className="field-hint">Tempel isi teks dari file backup `.json` yang pernah diunduh sebelumnya:</p>
              <textarea
                rows="10"
                value={restoreJsonText}
                onChange={(e) => setRestoreJsonText(e.target.value)}
                placeholder='{"timestamp": "2026-07-17...", "stats": [...], ...}'
              />
            </div>
            <div className="modal-actions">
              <button className="button button-ghost" onClick={() => setShowRestoreModal(false)}>Batal</button>
              <button className="button button-primary" onClick={handleRestoreBackup} disabled={!restoreJsonText.trim()}>
                Restore Data Sekarang <Check size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-Tab 1: Overview Tab
function OverviewTab({ data, healthStatus, setActiveTab, setEditingNews, setEditingEvent, setEditingGallery }) {
  const publishedNews = (data.announcements || []).filter(a => a.is_published !== false).length;
  const upcomingEvents = (data.events || []).filter(e => e.status !== "Selesai").length;
  const totalPhotos = (data.gallery || []).reduce((acc, a) => acc + (a.images?.length || 1), 0);
  const divisionCount = (data.org?.divisions || []).length;
  const memberCount = (data.org?.divisions || []).reduce((acc, d) => acc + (d.anggota?.length || 0), 0);
  const medCount = (data.uks_info?.stok_obat_dan_alat || []).length;

  const recentContent = [
    ...(data.announcements || []).slice(0, 3).map((n) => ({ id: n.id, kind: "Kabar", icon: "megaphone", title: n.title, meta: n.date || n.date_label || "Terbit", tab: "announcements", published: n.is_published !== false })),
    ...(data.events || []).slice(0, 2).map((e) => ({ id: e.id, kind: "Agenda", icon: "calendar", title: e.title, meta: `${e.date || e.date_label || ""} ${e.time || e.time_label || ""}`.trim() || "Terjadwal", tab: "events", published: e.is_published !== false })),
  ];

  return (
    <div className="overview-tab">
      {/* Quick Launchers */}
      <div className="quick-actions-bar">
        <span><Sparkles size={16} /> AKSI CEPAT:</span>
        <button className="button button-yellow button-sm" onClick={() => { setActiveTab("announcements"); setEditingNews({ category: "Kabar PMR", title: "", excerpt: "", date_label: new Date().toLocaleDateString("id-ID"), image_url: "/gudang/gallery/juara.avif", is_published: true }); }}>
          <Plus size={15} /> Buat Kabar Baru
        </button>
        <button className="button button-dark button-sm" onClick={() => { setActiveTab("events"); setEditingEvent({ title: "", date_label: "Setiap Kamis", time_label: "15.00–17.00 WITA", location: "Aula / lapangan sekolah", description: "", status: "Terbuka untuk anggota", is_published: true }); }}>
          <Plus size={15} /> Tambah Agenda
        </button>
        <button className="button button-ghost button-sm" onClick={() => { setActiveTab("gallery"); setEditingGallery({ title: "", category: "Kegiatan", date_label: new Date().toLocaleDateString("id-ID"), event_date: new Date().toISOString().slice(0, 10), cover_url: "/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif", images: ["/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif"], description: "", is_published: true }); }}>
          <Plus size={15} /> Buat Album Galeri
        </button>
        <button className="button button-ghost button-sm" onClick={() => setActiveTab("roster")}>
          <ShieldCheck size={15} /> Susun Jadwal Shift
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setActiveTab("announcements")}>
          <div className="kpi-head"><span>Kabar & Artikel</span><span className="kpi-icon"><Icon name="megaphone" size={20} /></span></div>
          <strong>{data.announcements?.length || 0}</strong>
          <small>{publishedNews} terbit · {(data.announcements?.length || 0) - publishedNews} draf</small>
        </div>
        <div className="kpi-card" onClick={() => setActiveTab("events")}>
          <div className="kpi-head"><span>Agenda & Kegiatan</span><span className="kpi-icon"><Icon name="calendar" size={20} /></span></div>
          <strong>{data.events?.length || 0}</strong>
          <small>{upcomingEvents} kegiatan mendatang / rutin</small>
        </div>
        <div className="kpi-card" onClick={() => setActiveTab("gallery")}>
          <div className="kpi-head"><span>Album Galeri</span><span className="kpi-icon"><Icon name="flame" size={20} /></span></div>
          <strong>{data.gallery?.length || 0}</strong>
          <small>{totalPhotos} total foto tersimpan</small>
        </div>
        <div className="kpi-card" onClick={() => setActiveTab("org")}>
          <div className="kpi-head"><span>Divisi Organisasi</span><span className="kpi-icon"><Icon name="users-round" size={20} /></span></div>
          <strong>{divisionCount}</strong>
          <small>{memberCount} anggota terdaftar di seluruh divisi</small>
        </div>
        <div className="kpi-card" onClick={() => setActiveTab("content")}>
          <div className="kpi-head"><span>Panduan EduScope P3K</span><span className="kpi-icon"><Icon name="shield-check" size={20} /></span></div>
          <strong>{data.guides?.length || 0}</strong>
          <small>Mimisan, Pingsan, Luka Bakar, Tersedak</small>
        </div>
        <div className="kpi-card" onClick={() => setActiveTab("content")}>
          <div className="kpi-head"><span>Stok Obat & Alat UKS</span><span className="kpi-icon"><Icon name="heart-pulse" size={20} /></span></div>
          <strong>{medCount}</strong>
          <small>Item layanan gratis tampil di halaman UKS</small>
        </div>
      </div>

      {/* System Diagnostic Widget */}
      <div className="dashboard-grid-2">
        <div className="admin-section-card">
          <div className="card-top">
            <h4><Database size={17} /> Status Sistem & Penyimpanan</h4>
            <span className={`status-badge ${data.source === "telegraph" ? "badge-green" : "badge-yellow"}`}>
              {data.source === "telegraph" ? "PRODUKSI (TELEGRAPH CLOUD)" : "MODE DEMO LOKAL"}
            </span>
          </div>
          <div className="diag-table">
            <div className="diag-row">
              <span>Sumber Data Aktif:</span>
              <strong>{data.source === "telegraph" ? "Telegraph Cloud — document API + object storage" : "Penyimpanan Memori & Fallback Sesi (Demo Mode)"}</strong>
            </div>
            <div className="diag-row">
              <span>Koneksi Telegraph Cloud (TELEGRAPH_API_KEY):</span>
              <strong>{healthStatus?.database || data.source === "telegraph" ? "🟢 Terhubung & Siap Tulis" : "🟡 Belum Diatur (Pembaruan disimpan di memori browser)"}</strong>
            </div>
            <div className="diag-row">
              <span>Cloudflare Pages Functions API:</span>
              <strong>🟢 Aktif (`/api/admin/*`, `/api/content`)</strong>
            </div>
            <div className="diag-row">
              <span>Waktu Server / Sesi:</span>
              <strong>{healthStatus?.timestamp ? new Date(healthStatus.timestamp).toLocaleString("id-ID") : new Date().toLocaleString("id-ID")}</strong>
            </div>
          </div>
          {data.source !== "telegraph" && (
            <div className="info-banner">
              <Info size={18} />
              <p>
                <strong>Tip Pengembang:</strong> Aplikasi sedang berjalan di mode demo karena <code>TELEGRAPH_URL</code> / <code>TELEGRAPH_API_KEY</code> belum diatur di environment. Semua perubahan tetap terlihat dan bisa diuji penuh dalam sesi ini.
              </p>
            </div>
          )}
        </div>

        {/* Recent Content Feed */}
        <div className="admin-section-card">
          <div className="card-top">
            <h4><Clock3 size={17} /> Konten Terbaru Situs</h4>
            <button className="text-button" onClick={() => setActiveTab("announcements")}>Kelola <ArrowRight size={14} /></button>
          </div>
          <div className="feed-list">
            {recentContent.map((item) => (
              <div className="feed-item" key={`${item.kind}-${item.id}`} onClick={() => setActiveTab(item.tab)}>
                <span className={`status-dot ${item.published ? "dot-green" : "dot-yellow"}`} />
                <div className="feed-info">
                  <strong>{item.title || "(Tanpa judul)"}</strong>
                  <p>{item.meta}</p>
                </div>
                <span className="feed-status">{item.kind}</span>
              </div>
            ))}
            {!recentContent.length && (
              <p className="empty-msg">Belum ada konten. Mulai dengan membuat kabar atau agenda baru.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-Tab 2: Announcements Tab
function AnnouncementsTab({ list, search, setSearch, category, setCategory, onOpenCreate, onEdit, onDelete }) {
  const categories = ["Semua", "Latihan gabungan", "Kabar PMR", "Dokumentasi", "Prestasi", "Lomba"];
  return (
    <div className="module-tab">
      <div className="module-header">
        <div>
          <h2>Manajemen Kabar & Berita</h2>
          <p>Kelola artikel, dokumentasi kegiatan, dan pengumuman yang tampil di beranda utama.</p>
        </div>
        <button className="button button-primary" onClick={onOpenCreate}>
          <Plus size={16} /> Buat Kabar Baru
        </button>
      </div>

      <div className="admin-filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul, ringkasan, atau kategori..." />
          {search && <button onClick={() => setSearch("")}><X size={16} /></button>}
        </label>
        <div className="filter-pills">
          {categories.map((cat) => (
            <button key={cat} className={`filter-pill ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-grid-list">
        {list.map((item) => (
          <div className={`admin-item-card ${item.is_published === false ? "card-draft" : ""}`} key={item.id}>
            <div className="item-thumb">
              <img src={item.image || item.image_url} alt={item.title} loading="lazy" />
              <span className="item-badge">{item.category}</span>
              {item.is_published === false && <span className="draft-badge">DRAF</span>}
            </div>
            <div className="item-body">
              <small>{item.date || item.date_label}</small>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
              <div className="item-actions">
                <button className="button button-ghost button-sm" onClick={() => onEdit(item)}>
                  <Edit3 size={15} /> Edit
                </button>
                <button className="button button-ghost button-sm text-red" onClick={() => onDelete(item.id)}>
                  <Trash2 size={15} /> Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
        {!list.length && <div className="empty-box"><p>Tidak ada kabar atau berita yang sesuai dengan pencarian.</p></div>}
      </div>
    </div>
  );
}

// Sub-Tab 3: Events Tab
function EventsTab({ list, search, setSearch, filter, setFilter, onOpenCreate, onEdit, onDelete }) {
  const filters = ["Semua", "Terbuka untuk anggota", "Informasi", "Wajib Anggota", "Selesai"];
  return (
    <div className="module-tab">
      <div className="module-header">
        <div>
          <h2>Manajemen Agenda Kegiatan</h2>
          <p>Atur jadwal latihan rutin dan kegiatan khusus organisasi.</p>
        </div>
        <button className="button button-primary" onClick={onOpenCreate}>
          <Plus size={16} /> Tambah Agenda
        </button>
      </div>

      <div className="admin-filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari agenda atau lokasi..." />
          {search && <button onClick={() => setSearch("")}><X size={16} /></button>}
        </label>
        <div className="filter-pills">
          {filters.map((f) => (
            <button key={f} className={`filter-pill ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Agenda</th>
              <th>Waktu & Lokasi</th>
              <th>Status / Tag</th>
              <th>Terbit</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((event) => (
              <tr key={event.id} className={event.is_published === false ? "row-draft" : ""}>
                <td>
                  <strong>{event.title}</strong>
                  <p className="td-sub">{event.description}</p>
                </td>
                <td>
                  <div className="td-date">
                    <CalendarDays size={14} /> <span>{event.date || event.date_label} ({event.time || event.time_label})</span>
                  </div>
                  <div className="td-loc">
                    <MapPin size={14} /> <span>{event.location}</span>
                  </div>
                </td>
                <td>
                  <span className="tag">{event.status}</span>
                </td>
                <td>
                  <span className={`status-badge ${event.is_published !== false ? "badge-green" : "badge-gray"}`}>
                    {event.is_published !== false ? "Terbit" : "Draf"}
                  </span>
                </td>
                <td className="td-actions text-right">
                  <button className="button button-ghost button-sm" onClick={() => onEdit(event)} title="Edit Agenda">
                    <Edit3 size={15} />
                  </button>
                  <button className="button button-ghost button-sm text-red" onClick={() => onDelete(event.id)} title="Hapus Agenda">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan="5" className="empty-td">Tidak ada agenda kegiatan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sub-Tab: Jadwal Shift Standar (UKS & Lapangan)
//
// Penyusunan jadwal dilakukan manual: admin menyusun baris shift sendiri lalu
// memilih petugas dari daftar anggota lewat dropdown yang bisa dicari.
// Tidak ada lagi pengacakan/"jadwal jaga adil" otomatis.

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function pad2(value) {
  return String(value).padStart(2, "0");
}

/** "2026-08-14" → { tanggal: "Jumat, 14 Agustus 2026", hari: "Jumat" } */
function describeDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return {
    iso,
    tanggal: `${DAY_NAMES[date.getDay()]}, ${Number(d)} ${MONTH_NAMES[date.getMonth()]} ${y}`,
    hari: DAY_NAMES[date.getDay()],
  };
}

/** Nama hari dari label tanggal lama, mis. "Senin, 13 Juli 2026" → "Senin". */
function dayFromLabel(label) {
  const found = DAY_NAMES.find((name) => String(label || "").trim().toLowerCase().startsWith(name.toLowerCase()));
  return found || "Senin";
}

function isoFromLabel(label) {
  const text = String(label || "");
  const day = /\b(\d{1,2})\b/.exec(text);
  const year = /\b(20\d{2})\b/.exec(text);
  const monthIndex = MONTH_NAMES.findIndex((name) => text.toLowerCase().includes(name.toLowerCase()));
  if (!day || !year || monthIndex < 0) return "";
  return `${year[1]}-${pad2(monthIndex + 1)}-${pad2(Number(day[1]))}`;
}

function emptyShift(iso) {
  const described = describeDate(iso);
  return described
    ? { tanggal: described.tanggal, hari: described.hari, iso, petugas: [] }
    : { tanggal: "", hari: "Senin", iso: "", petugas: [] };
}

/**
 * Dropdown petugas: bisa dicari, muncul dari daftar anggota organisasi.
 * Anggota yang sudah terjadwal di shift ini tidak ditawarkan lagi, dan nama
 * di luar daftar tetap bisa ditambahkan manual sebagai opsi terakhir.
 */
function MemberPicker({ members, selected = [], onPick, label = "Tambah petugas" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const chosen = useMemo(() => new Set(selected.map((name) => String(name).toLowerCase())), [selected]);
  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members
      .filter((name) => !chosen.has(String(name).toLowerCase()))
      .filter((name) => !needle || String(name).toLowerCase().includes(needle))
      .slice(0, 40);
  }, [members, chosen, query]);

  // Tutup dropdown saat klik di luar atau menekan Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (name) => {
    onPick(name);
    setQuery("");
    setOpen(false);
  };

  const custom = query.trim();

  return (
    <div className="member-picker" ref={rootRef}>
      <button
        type="button"
        className={`mp-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Plus size={14} />
        <span>{label}</span>
        <ChevronDown size={14} className="mp-caret" />
      </button>

      {open && (
        <div className="mp-menu" role="listbox">
          <div className="mp-search">
            <Search size={15} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama anggota..."
              aria-label="Cari nama anggota"
            />
            {query && (
              <button type="button" className="mp-clear" onClick={() => setQuery("")} aria-label="Bersihkan pencarian">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mp-list">
            {options.map((name) => (
              <button type="button" className="mp-option" key={name} onClick={() => pick(name)} role="option" aria-selected="false">
                <span className="mp-avatar">{name.trim().charAt(0).toUpperCase()}</span>
                <span>{name}</span>
                <Check size={14} className="mp-check" />
              </button>
            ))}

            {!options.length && (
              <p className="mp-empty">
                {members.length && !custom ? "Semua anggota pada daftar sudah masuk shift ini." : "Nama tidak ditemukan pada daftar anggota."}
              </p>
            )}

            {custom && !members.some((name) => String(name).toLowerCase() === custom.toLowerCase()) && (
              <button type="button" className="mp-option mp-option-new" onClick={() => pick(custom)} role="option" aria-selected="false">
                <span className="mp-avatar">+</span>
                <span>Tambah manual: <strong>{custom}</strong></span>
              </button>
            )}
          </div>

          <div className="mp-foot">
            <span>{members.length} anggota pada daftar organisasi</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RosterTab({ roster, org, onSaveRoster, showToast }) {
  // Daftar anggota aktif: gabungan seluruh divisi + pengurus inti (tanpa pembina).
  const allMembers = useMemo(() => {
    const list = new Set();
    (org?.leaders || []).forEach((leader) => {
      if (leader?.nama && !/pembina/i.test(leader.role || "")) list.add(leader.nama);
    });
    (org?.advisory || []).forEach((person) => {
      if (person?.nama && !/pembina/i.test(person.jabatan || person.role || "")) list.add(person.nama);
    });
    (org?.divisions || []).forEach((division) => {
      (division?.anggota || []).forEach((member) => member && list.add(member));
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b, "id"));
  }, [org]);

  const [meta, setMeta] = useState({
    bulan_label: roster?.bulan_label || `${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`,
    keterangan: roster?.keterangan || "Jadwal penjagaan Ruang UKS (Senin–Jumat) dan piket lapangan upacara (Senin) untuk anggota aktif PMR Wira SMKN 4 Banjarmasin.",
    is_published: roster?.is_published !== false,
  });
  const [uksSchedule, setUksSchedule] = useState(() => (roster?.uks_schedule || []).map((shift) => ({ ...shift, petugas: shift.petugas || [] })));
  const [lapanganSchedule, setLapanganSchedule] = useState(() => (roster?.lapangan_schedule || []).map((shift) => ({ ...shift, petugas: shift.petugas || [] })));
  const [activeSubView, setActiveSubView] = useState("uks");
  const [autoAnnounce, setAutoAnnounce] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newDate, setNewDate] = useState({ uks: "", lapangan: "" });

  const schedule = activeSubView === "uks" ? uksSchedule : lapanganSchedule;
  const setSchedule = activeSubView === "uks" ? setUksSchedule : setLapanganSchedule;
  const perShift = activeSubView === "uks" ? roster?.petugas_per_shift_uks : roster?.petugas_per_shift_lapangan;

  /* ---------------------- aksi penyuntingan manual ---------------------- */

  const updateShift = (index, patch) => {
    setSchedule((list) => list.map((shift, i) => (i === index ? { ...shift, ...patch } : shift)));
  };

  const addShift = (iso) => {
    const described = describeDate(iso);
    if (!described) {
      showToast("Pilih tanggal shift terlebih dahulu.", "error");
      return;
    }
    if (schedule.some((shift) => shift.iso === iso)) {
      showToast("Tanggal itu sudah ada pada jadwal.", "error");
      return;
    }
    const next = [...schedule, { tanggal: described.tanggal, hari: described.hari, iso, petugas: [] }];
    next.sort((a, b) => String(a.iso || isoFromLabel(a.tanggal)).localeCompare(String(b.iso || isoFromLabel(b.tanggal))));
    setSchedule(next);
    setNewDate((value) => ({ ...value, [activeSubView]: "" }));
  };

  const removeShift = (index) => {
    setSchedule((list) => list.filter((_, i) => i !== index));
  };

  const changeShiftDate = (index, iso) => {
    const described = describeDate(iso);
    if (!described) return;
    updateShift(index, { iso, tanggal: described.tanggal, hari: described.hari });
  };

  const addPetugas = (index, name) => {
    setSchedule((list) => list.map((shift, i) => (i === index ? { ...shift, petugas: [...(shift.petugas || []), name] } : shift)));
  };

  const removePetugas = (index, memberIndex) => {
    setSchedule((list) =>
      list.map((shift, i) => (i === index ? { ...shift, petugas: (shift.petugas || []).filter((_, m) => m !== memberIndex) } : shift)),
    );
  };

  const replacePetugas = (index, memberIndex, name) => {
    setSchedule((list) =>
      list.map((shift, i) =>
        i === index ? { ...shift, petugas: (shift.petugas || []).map((current, m) => (m === memberIndex ? name : current)) } : shift,
      ),
    );
  };

  /** Kerangka hari kerja kosong (tanpa penugasan otomatis) agar penyusunan lebih cepat. */
  const buildMonthSkeleton = () => {
    let year = new Date().getFullYear();
    let monthIndex = new Date().getMonth();
    const yearMatch = /\b(20\d{2})\b/.exec(meta.bulan_label);
    if (yearMatch) year = Number(yearMatch[1]);
    const foundMonth = MONTH_NAMES.findIndex((name) => meta.bulan_label.toLowerCase().includes(name.toLowerCase()));
    if (foundMonth >= 0) monthIndex = foundMonth;

    const days = new Date(year, monthIndex + 1, 0).getDate();
    const rows = [];
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(year, monthIndex, day);
      const weekday = date.getDay();
      const isWorkday = weekday >= 1 && weekday <= 5;
      const isMonday = weekday === 1;
      if (!isWorkday && !isMonday) continue;
      const iso = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
      rows.push({ iso, ...emptyShift(iso), petugas: [] });
    }

    if (activeSubView === "uks") {
      setUksSchedule(rows);
      showToast(`Kerangka ${rows.length} hari kerja UKS (${meta.bulan_label}) dibuat. Silakan pilih petugas per hari.`);
    } else {
      const mondays = rows.filter((row) => row.hari === "Senin");
      setLapanganSchedule(mondays);
      showToast(`Kerangka ${mondays.length} hari Senin piket lapangan (${meta.bulan_label}) dibuat. Silakan pilih petugas.`);
    }
  };

  const clearSchedule = () => {
    if (!window.confirm(`Kosongkan seluruh baris jadwal ${activeSubView === "uks" ? "Ruang UKS" : "lapangan upacara"}?`)) return;
    setSchedule([]);
  };

  const handleSaveAndPublish = async () => {
    const buildRows = (list) =>
      list.map((shift) => ({ tanggal: shift.tanggal, hari: shift.hari, petugas: (shift.petugas || []).filter(Boolean) }));
    const payload = {
      periode: meta.bulan_label,
      bulan_label: meta.bulan_label,
      keterangan: meta.keterangan,
      petugas_per_shift_uks: Number(roster?.petugas_per_shift_uks) || 1,
      petugas_per_shift_lapangan: Number(roster?.petugas_per_shift_lapangan) || 8,
      uks_schedule: buildRows(uksSchedule),
      lapangan_schedule: buildRows(lapanganSchedule),
      is_published: meta.is_published,
      updated_at: new Date().toISOString(),
    };
    try {
      setIsSaving(true);
      await onSaveRoster(payload, autoAnnounce);
      showToast("Jadwal shift berhasil disimpan dan diterbitkan ke website!");
    } catch (err) {
      showToast(err.message || "Gagal menyimpan jadwal.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatAdminWA = (viewType) => {
    const baseUrl = window.location.origin || "https://pmr-wira-smkn4.pages.dev";
    if (viewType === "uks") {
      const list = uksSchedule.slice(0, 5);
      let range = meta.bulan_label;
      if (list.length) {
        range = `${String(list[0].tanggal).replace(/^[A-Za-z]+,\s*/, "")} – ${String(list[list.length - 1].tanggal).replace(/^[A-Za-z]+,\s*/, "")}`;
      }
      let text = `*Jadwal Piket Jaga UKS ${range}*\n`;
      list.forEach((item) => {
        text += `\n${item.tanggal}\n\n`;
        (item.petugas || []).forEach((nama) => { text += `* ${nama}\n`; });
      });
      return `${text}\nCek jadwal lengkap dan live update di:\n${baseUrl}?tab=beranda`;
    }
    const nextMonday = lapanganSchedule[0] || { tanggal: "Belum dijadwalkan", petugas: [] };
    let text = `*Jadwal Jaga Upacara ${nextMonday.tanggal}*\n\n`;
    (nextMonday.petugas || []).forEach((nama) => { text += `* ${nama}\n`; });
    return `${text}\nCek jadwal lengkap dan live update di:\n${baseUrl}?tab=beranda`;
  };

  const handleAdminShareWA = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(formatAdminWA(activeSubView))}`, "_blank");
  };

  const handleAdminCopyText = () => {
    const text = formatAdminWA(activeSubView);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Teks jadwal berhasil disalin! Siap ditempel ke WhatsApp.");
    } else {
      prompt("Salin teks jadwal berikut:", text);
    }
  };

  const totalPetugas = schedule.reduce((sum, shift) => sum + (shift.petugas?.length || 0), 0);

  return (
    <div className="module-tab">
      <div className="module-header">
        <div>
          <h2>Manajemen Jadwal Shift</h2>
          <p>Susun jadwal shift Ruang UKS dan piket lapangan secara manual: tentukan tanggalnya, lalu pilih petugas dari daftar anggota.</p>
        </div>
        <button className="button button-primary" onClick={handleSaveAndPublish} disabled={isSaving}>
          {isSaving ? "Menyimpan..." : <>Simpan &amp; Terbitkan Jadwal <Check size={16} /></>}
        </button>
      </div>

      {/* Pengaturan umum jadwal */}
      <div className="roster-control-card">
        <div className="rcc-head">
          <h3><CalendarDays size={18} /> Pengaturan Jadwal</h3>
          <span className="rcc-summary">{schedule.length} shift · {totalPetugas} penugasan</span>
        </div>

        <div className="rcc-grid">
          <label className="field">
            <span>Periode Jadwal</span>
            <input value={meta.bulan_label} onChange={(event) => setMeta({ ...meta, bulan_label: event.target.value })} placeholder="Agustus 2026" />
          </label>
          <label className="field field-wide">
            <span>Keterangan Jadwal</span>
            <input value={meta.keterangan} onChange={(event) => setMeta({ ...meta, keterangan: event.target.value })} placeholder="Jadwal resmi penjagaan Ruang UKS..." />
          </label>
          <label className="field">
            <span>Status Terbit</span>
            <select value={meta.is_published ? "terbit" : "draft"} onChange={(event) => setMeta({ ...meta, is_published: event.target.value === "terbit" })}>
              <option value="terbit">Terbit (tampil di situs)</option>
              <option value="draft">Draft (disembunyikan)</option>
            </select>
          </label>
        </div>

        <div className="rcc-foot">
          <label className="field-checkbox">
            <input type="checkbox" checked={autoAnnounce} onChange={(event) => setAutoAnnounce(event.target.checked)} />
            <span>Buat pengumuman otomatis di Beranda saat jadwal disimpan</span>
          </label>
          <div className="rcc-actions">
            <button type="button" className="button button-yellow button-sm" onClick={buildMonthSkeleton}>
              <CalendarDays size={14} /> Buat Kerangka Hari Kerja
            </button>
            <button type="button" className="button button-ghost button-sm" onClick={clearSchedule}>
              <Trash2 size={14} /> Kosongkan
            </button>
          </div>
        </div>
      </div>

      {/* Penyusun shift */}
      <div className="roster-schedule-section">
        <div className="rss-tabs">
          <button className={`rss-tab ${activeSubView === "uks" ? "active" : ""}`} onClick={() => setActiveSubView("uks")}>
            <HeartPulse size={16} /> Ruang UKS ({uksSchedule.length} shift)
          </button>
          <button className={`rss-tab ${activeSubView === "lapangan" ? "active" : ""}`} onClick={() => setActiveSubView("lapangan")}>
            <Award size={16} /> Lapangan Upacara ({lapanganSchedule.length} shift)
          </button>
        </div>

        <div className="roster-add-bar">
          <label className="field">
            <span>Tanggal shift baru ({activeSubView === "uks" ? "Senin–Jumat" : "umumnya Senin"})</span>
            <input
              type="date"
              value={newDate[activeSubView]}
              onChange={(event) => setNewDate({ ...newDate, [activeSubView]: event.target.value })}
            />
          </label>
          <button type="button" className="button button-dark button-sm" onClick={() => addShift(newDate[activeSubView])}>
            <Plus size={15} /> Tambah Baris Shift
          </button>
          <span className="roster-hint">
            Tiap shift diisi lewat dropdown “Tambah petugas” yang bisa dicari dari daftar anggota organisasi.
            {perShift ? ` Rekomendasi ${perShift} petugas per shift.` : ""}
          </span>
        </div>

        <div className="wa-share-bar">
          <div className="wa-share-info">
            <MessageCircle size={18} />
            <span>Bagikan jadwal {activeSubView === "uks" ? "piket jaga UKS" : "jaga upacara Senin"} ke WhatsApp:</span>
          </div>
          <div className="wa-share-btns">
            <button type="button" className="button button-wa button-sm" onClick={handleAdminShareWA}>
              <Send size={14} /> Share ke WhatsApp
            </button>
            <button type="button" className="button button-ghost button-sm" onClick={handleAdminCopyText}>
              <Copy size={14} /> Salin Teks &amp; Link
            </button>
          </div>
        </div>

        <div className="rss-list">
          {schedule.map((shift, shiftIdx) => (
            <div className="rss-row" key={`${shift.iso || shift.tanggal}-${shiftIdx}`}>
              <div className="rss-date">
                <input
                  type="date"
                  className="rss-date-input"
                  value={shift.iso || isoFromLabel(shift.tanggal)}
                  onChange={(event) => changeShiftDate(shiftIdx, event.target.value)}
                  aria-label="Tanggal shift"
                />
                <strong>{shift.tanggal}</strong>
                <span className="tag">{shift.hari}</span>
              </div>

              <div className="rss-petugas">
                <span>Petugas bertugas ({shift.petugas?.length || 0} orang):</span>
                <div className="petugas-pills">
                  {(shift.petugas || []).map((nama, memberIdx) => (
                    <div className="petugas-pill" key={`${nama}-${memberIdx}`}>
                      <UserRound size={13} />
                      <input
                        value={nama}
                        onChange={(event) => replacePetugas(shiftIdx, memberIdx, event.target.value)}
                        title="Ubah nama petugas bila perlu"
                        aria-label={`Petugas ${memberIdx + 1}`}
                      />
                      <button type="button" className="petugas-remove" onClick={() => removePetugas(shiftIdx, memberIdx)} aria-label={`Hapus ${nama}`}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <MemberPicker
                    members={allMembers}
                    selected={shift.petugas || []}
                    onPick={(name) => addPetugas(shiftIdx, name)}
                    label="Tambah petugas"
                  />
                </div>
              </div>

              <button type="button" className="rss-delete" onClick={() => removeShift(shiftIdx)} aria-label={`Hapus shift ${shift.tanggal}`}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {!schedule.length && (
            <div className="empty-box">
              <p>Belum ada baris shift. Tambahkan tanggal di atas, atau tekan “Buat Kerangka Hari Kerja” untuk menyiapkan baris kosong.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-Tab 4: Gallery Tab
function GalleryTab({ list, search, setSearch, category, setCategory, onOpenCreate, onEdit, onDelete }) {
  const categories = ["Semua", "Latihan", "Aksi sosial", "Prestasi", "Lomba"];
  return (
    <div className="module-tab">
      <div className="module-header">
        <div>
          <h2>Manajemen Galeri & Album Foto</h2>
          <p>Unggah dan kelola album kegiatan serta dokumentasi PMR Wira.</p>
        </div>
        <button className="button button-primary" onClick={onOpenCreate}>
          <Plus size={16} /> Buat Album Baru
        </button>
      </div>

      <div className="admin-filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari album atau keterangan..." />
          {search && <button onClick={() => setSearch("")}><X size={16} /></button>}
        </label>
        <div className="filter-pills">
          {categories.map((cat) => (
            <button key={cat} className={`filter-pill ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="gallery-admin-grid">
        {list.map((album) => (
          <div className="gallery-admin-card" key={album.id}>
            <div className="ga-thumb">
              <img src={album.cover || album.cover_url} alt={album.title} loading="lazy" />
              <span className="ga-count"><ImageIcon size={13} /> {album.images?.length || 1} Foto</span>
              {album.is_published === false && <span className="draft-badge">DRAF</span>}
            </div>
            <div className="ga-info">
              <small>{album.category} · {album.date || album.date_label}</small>
              <h4>{album.title}</h4>
              <p>{album.description}</p>
              <div className="ga-actions">
                <button className="button button-ghost button-sm" onClick={() => onEdit(album)}>
                  <Edit3 size={15} /> Edit Album
                </button>
                <button className="button button-ghost button-sm text-red" onClick={() => onDelete(album.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!list.length && <div className="empty-box"><p>Belum ada album galeri.</p></div>}
      </div>
    </div>
  );
}

// Sub-Tab 5: Organization Tab
function OrgTab({ org, onSaveOrg, onEditPerson, onEditDivision }) {
  const [periode, setPeriode] = useState(org?.periode || "2026/2027");

  const handleSavePeriode = (e) => {
    e.preventDefault();
    onSaveOrg({ ...org, periode });
  };

  const deletePerson = (type, idx) => {
    if (!window.confirm("Hapus pengurus/penasihat ini?")) return;
    const list = [...(org[type] || [])];
    list.splice(idx, 1);
    onSaveOrg({ ...org, [type]: list });
  };

  const deleteDivision = (idx) => {
    if (!window.confirm("Hapus divisi ini?")) return;
    const list = [...(org.divisions || [])];
    list.splice(idx, 1);
    onSaveOrg({ ...org, divisions: list });
  };

  return (
    <div className="module-tab">
      <div className="module-header">
        <div>
          <h2>Struktur Organisasi & Divisi</h2>
          <p>Kelola periode kepengurusan, dewan penasihat/pembina, pengurus harian, dan anggota per divisi.</p>
        </div>
      </div>

      {/* Periode Config */}
      <form onSubmit={handleSavePeriode} className="periode-box">
        <label className="field-inline">
          <span><strong>Periode Kepengurusan Aktif:</strong></span>
          <input type="text" value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="2026/2027" />
        </label>
        <button type="submit" className="button button-dark button-sm"><Check size={15} /> Simpan Periode</button>
      </form>

      {/* Dewan Pembina / Advisory */}
      <div className="org-admin-section">
        <div className="section-header-row">
          <h3><GraduationCap size={19} /> Dewan Penasihat & Pembina Sekolah</h3>
          <button className="button button-ghost button-sm" onClick={() => onEditPerson("advisory", { jabatan: "Wakasek Kesiswaan", nama: "", icon: "graduation-cap", deskripsi: "" }, -1)}>
            <Plus size={14} /> Tambah Pembina
          </button>
        </div>
        <div className="org-cards-row">
          {(org.advisory || []).map((person, idx) => (
            <div className="org-admin-card" key={idx}>
              <div className="oac-icon"><Icon name={person.icon || "graduation-cap"} size={22} /></div>
              <div className="oac-info">
                <span>{person.jabatan || person.role}</span>
                <h4>{person.nama}</h4>
                <p>{person.deskripsi}</p>
                <div className="oac-btns">
                  <button onClick={() => onEditPerson("advisory", person, idx)}><Edit3 size={14} /> Edit</button>
                  <button className="text-red" onClick={() => deletePerson("advisory", idx)}><Trash2 size={14} /> Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pengurus Inti / Leaders */}
      <div className="org-admin-section">
        <div className="section-header-row">
          <h3><Crown size={19} /> Pengurus Inti (Ketua, Wakil, Sekretaris, Bendahara)</h3>
          <button className="button button-ghost button-sm" onClick={() => onEditPerson("leaders", { role: "Anggota Pengurus", nama: "", icon: "users", foto: "", deskripsi: "" }, -1)}>
            <Plus size={14} /> Tambah Pengurus
          </button>
        </div>
        <div className="org-cards-row">
          {(org.leaders || []).map((person, idx) => (
            <div className="org-admin-card" key={idx}>
              {person.foto ? (
                <img src={person.foto} alt={person.nama} className="oac-img" />
              ) : (
                <div className="oac-icon"><Icon name={person.icon || "users"} size={22} /></div>
              )}
              <div className="oac-info">
                <span>{person.role}</span>
                <h4>{person.nama}</h4>
                <p>{person.deskripsi}</p>
                <div className="oac-btns">
                  <button onClick={() => onEditPerson("leaders", person, idx)}><Edit3 size={14} /> Edit</button>
                  <button className="text-red" onClick={() => deletePerson("leaders", idx)}><Trash2 size={14} /> Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Koordinator Divisi & Anggota */}
      <div className="org-admin-section">
        <div className="section-header-row">
          <h3><UsersRound size={19} /> Koordinator Divisi & Daftar Anggota</h3>
          <button className="button button-ghost button-sm" onClick={() => onEditDivision({ divisi: "Divisi Baru", icon: "heart-pulse", foto: "", anggota: ["Anggota 1"] }, -1)}>
            <Plus size={14} /> Tambah Divisi
          </button>
        </div>
        <div className="division-admin-grid">
          {(org.divisions || []).map((div, idx) => (
            <div className="division-admin-card" key={idx}>
              <div className="dac-head">
                <div className="dac-title">
                  <Icon name={div.icon || "users-round"} size={20} />
                  <div>
                    <small>DIVISI</small>
                    <h4>{div.divisi}</h4>
                  </div>
                </div>
                <div className="oac-btns">
                  <button onClick={() => onEditDivision(div, idx)}><Edit3 size={14} /></button>
                  <button className="text-red" onClick={() => deleteDivision(idx)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="dac-members">
                <span>Daftar Anggota ({div.anggota?.length || 0}):</span>
                <div className="member-chips">
                  {(div.anggota || []).map((m, mi) => (
                    <span key={mi} className="chip"><UserRound size={12} /> {m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-Tab 8: Settings & EduScope Tab
function SettingsTab({ stats, guides, contact, uksInfo, onSaveStats, onSaveGuides, onSaveContact, onSaveUksInfo, onEditGuide }) {
  const [statsState, setStatsState] = useState(stats || fallbackContent.stats);
  const [contactState, setContactState] = useState(contact || fallbackContent.contact);
  const [uksInfoState, setUksInfoState] = useState(uksInfo || fallbackContent.uks_info);

  const updateStat = (idx, key, val) => {
    const list = [...statsState];
    list[idx] = { ...list[idx], [key]: key === "value" ? Number(val) || 0 : val };
    setStatsState(list);
  };

  const updateSekretariat = (key, val) => {
    setContactState({ ...contactState, sekretariat: { ...contactState.sekretariat, [key]: val } });
  };

  const updateBergabung = (key, val) => {
    setContactState({ ...contactState, bergabung: { ...contactState.bergabung, [key]: val } });
  };

  const updateWelcome = (key, val) => {
    setUksInfoState({ ...uksInfoState, welcome_banner: { ...uksInfoState.welcome_banner, [key]: val } });
  };

  // Helper for contact updates already defined above
  // Note: bergabung is already handled via updateBergabung in the contact section below.

  const updateMedicineItem = (idx, key, val) => {
    const list = [...(uksInfoState.stok_obat_dan_alat || [])];
    list[idx] = { ...list[idx], [key]: val };
    setUksInfoState({ ...uksInfoState, stok_obat_dan_alat: list });
  };

  const addMedicineItem = () => {
    const list = [...(uksInfoState.stok_obat_dan_alat || []), { id: Date.now(), kategori: "Obat Minum Ringan", nama: "Obat Baru", kegunaan: "Kegunaan dan indikasi...", status: "Tersedia & Gratis" }];
    setUksInfoState({ ...uksInfoState, stok_obat_dan_alat: list });
  };

  const removeMedicineItem = (idx) => {
    if (!window.confirm("Hapus item obat/alat ini dari stok UKS?")) return;
    const list = [...(uksInfoState.stok_obat_dan_alat || [])];
    list.splice(idx, 1);
    setUksInfoState({ ...uksInfoState, stok_obat_dan_alat: list });
  };

  const deleteGuide = (idx) => {
    if (!window.confirm("Hapus panduan P3K ini?")) return;
    const list = [...(guides || [])];
    list.splice(idx, 1);
    onSaveGuides(list);
  };

  return (
    <div className="module-tab">
      <div className="module-header">
        <div>
          <h2>Pengaturan Konten, Statistik, EduScope & Kontak</h2>
          <p>Sesuaikan statistik beranda, materi edukasi P3K EduScope, dan informasi jam operasional sekretariat.</p>
        </div>
      </div>

      {/* 1. Statistik Beranda */}
      <div className="admin-section-box">
        <div className="box-head">
          <h3><Award size={18} /> Statistik Utama Beranda (`stats`)</h3>
          <button className="button button-dark button-sm" onClick={() => onSaveStats(statsState)}>
            <Check size={14} /> Simpan Statistik
          </button>
        </div>
        <div className="stats-edit-grid">
          {statsState.map((st, idx) => (
            <div className="stat-edit-card" key={idx}>
              <label className="field">
                <span>Angka ({st.label})</span>
                <input type="number" value={st.value} onChange={(e) => updateStat(idx, "value", e.target.value)} />
              </label>
              <label className="field">
                <span>Label Keterangan</span>
                <input type="text" value={st.label} onChange={(e) => updateStat(idx, "label", e.target.value)} />
              </label>
              <label className="field">
                <span>Nama Ikon Lucide</span>
                <select value={st.icon} onChange={(e) => updateStat(idx, "icon", e.target.value)}>
                  <option value="users">users</option>
                  <option value="user-round-check">user-round-check</option>
                  <option value="heart-handshake">heart-handshake</option>
                  <option value="shield-check">shield-check</option>
                  <option value="award">award</option>
                </select>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 2. EduScope Guides */}
      <div className="admin-section-box">
        <div className="box-head">
          <h3><HeartPulse size={18} /> EduScope: Panduan P3K (`guides`)</h3>
          <button className="button button-primary button-sm" onClick={() => onEditGuide(null)}>
            <Plus size={14} /> Tambah Panduan P3K
          </button>
        </div>
        <div className="guides-admin-grid">
          {(guides || []).map((gd, idx) => (
            <div className={`guide-admin-card tone-${gd.tone}`} key={gd.id || idx}>
              <div className="gac-head">
                <Icon name={gd.icon || "droplets"} size={24} />
                <span className="tag">{gd.tag}</span>
              </div>
              <h4>{gd.title}</h4>
              <p>{gd.summary}</p>
              <div className="gac-steps-count">
                <small>{gd.steps?.length || 0} Langkah Pertolongan</small>
              </div>
              <div className="gac-btns">
                <button className="button button-ghost button-sm" onClick={() => onEditGuide(gd)}><Edit3 size={14} /> Edit</button>
                <button className="button button-ghost button-sm text-red" onClick={() => deleteGuide(idx)}><Trash2 size={14} /> Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Info Kontak & Sekretariat */}
      <div className="admin-section-box">
        <div className="box-head">
          <h3><Phone size={18} /> Info Sekretariat & Jam Operasional (`contact`)</h3>
          <button className="button button-dark button-sm" onClick={() => onSaveContact(contactState)}>
            <Check size={14} /> Simpan Kontak
          </button>
        </div>
        <div className="contact-edit-form">
          <div className="two-fields">
            <label className="field">
              <span>Alamat Sekolah / Ruangan</span>
              <input value={contactState.sekretariat?.alamat || ""} onChange={(e) => updateSekretariat("alamat", e.target.value)} />
            </label>
            <label className="field">
              <span>Nomor Telepon / WhatsApp</span>
              <input value={contactState.sekretariat?.telepon || ""} onChange={(e) => updateSekretariat("telepon", e.target.value)} />
            </label>
          </div>
          <div className="two-fields">
            <label className="field">
              <span>Email Resmi</span>
              <input value={contactState.sekretariat?.email || ""} onChange={(e) => updateSekretariat("email", e.target.value)} />
            </label>
            <label className="field">
              <span>Instagram Handle</span>
              <input value={contactState.sekretariat?.instagram || ""} onChange={(e) => updateSekretariat("instagram", e.target.value)} />
            </label>
          </div>
            <label className="field full">
              <span>Link WhatsApp Langsung (`wa_link`)</span>
              <input value={contactState.sekretariat?.wa_link || ""} onChange={(e) => updateSekretariat("wa_link", e.target.value)} />
            </label>
            <div className="two-fields">
              <label className="field">
                <span>Nomor WhatsApp Sekretariat (format internasional)</span>
                <input value={contactState.sekretariat?.whatsapp_number || ""} onChange={(e) => updateSekretariat("whatsapp_number", e.target.value)} placeholder="6283191735329" />
              </label>
              <label className="field">
                <span>Catatan Info Keanggotaan (`bergabung.catatan`)</span>
                <input value={contactState.bergabung?.catatan || ""} onChange={(e) => updateBergabung("catatan", e.target.value)} placeholder="Informasi keanggotaan dapat ditanyakan via WhatsApp..." />
              </label>
            </div>

        </div>
      </div>

      {/* 5. Layanan Ruang UKS & Stok Obat */}
      <div className="admin-section-box">
        <div className="box-head">
          <h3><HeartPulse size={18} /> Layanan Ruang UKS & Stok Obat (`uks_info`)</h3>
          <button className="button button-primary button-sm" onClick={() => onSaveUksInfo(uksInfoState)}>
            <Check size={14} /> Simpan Info & Obat UKS
          </button>
        </div>
        <div className="contact-edit-form" style={{ marginBottom: "20px" }}>
          <label className="field full">
            <span>Judul Banner Welcome (`title`)</span>
            <input value={uksInfoState.welcome_banner?.title || ""} onChange={(e) => updateWelcome("title", e.target.value)} />
          </label>
          <label className="field full">
            <span>Sub-judul Penjelasan (`subtitle`)</span>
            <textarea rows="2" value={uksInfoState.welcome_banner?.subtitle || ""} onChange={(e) => updateWelcome("subtitle", e.target.value)} />
          </label>
          <label className="field full">
            <span>Highlight Info Obat Gratis (`highlight`)</span>
            <input value={uksInfoState.welcome_banner?.highlight || ""} onChange={(e) => updateWelcome("highlight", e.target.value)} />
          </label>
          <div className="two-fields">
            <label className="field">
              <span>Jam Layanan (`jam_layanan`)</span>
              <input value={uksInfoState.jam_layanan || ""} onChange={(e) => setUksInfoState({ ...uksInfoState, jam_layanan: e.target.value })} />
            </label>
            <label className="field">
              <span>Lokasi Ruang UKS (`lokasi`)</span>
              <input value={uksInfoState.lokasi || ""} onChange={(e) => setUksInfoState({ ...uksInfoState, lokasi: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="box-head" style={{ borderTop: "1px dashed var(--line)", paddingTop: "16px" }}>
          <h4><Check size={16} /> Daftar Stok Obat & Alat (`stok_obat_dan_alat`) ({uksInfoState.stok_obat_dan_alat?.length || 0} Item)</h4>
          <button type="button" className="button button-ghost button-sm" onClick={addMedicineItem}>
            <Plus size={14} /> Tambah Item Obat
          </button>
        </div>
        <div className="admin-grid-list">
          {uksInfoState.stok_obat_dan_alat?.map((item, idx) => (
            <div className="stat-edit-card" key={idx} style={{ background: "var(--paper)" }}>
              <div className="two-fields">
                <label className="field">
                  <span>Kategori</span>
                  <input value={item.kategori || ""} onChange={(e) => updateMedicineItem(idx, "kategori", e.target.value)} />
                </label>
                <label className="field">
                  <span>Status Ketersediaan</span>
                  <input value={item.status || ""} onChange={(e) => updateMedicineItem(idx, "status", e.target.value)} />
                </label>
              </div>
              <label className="field full">
                <span>Nama Obat / Alat Medis</span>
                <input value={item.nama || ""} onChange={(e) => updateMedicineItem(idx, "nama", e.target.value)} />
              </label>
              <label className="field full">
                <span>Indikasi / Kegunaan</span>
                <textarea rows="2" value={item.kegunaan || ""} onChange={(e) => updateMedicineItem(idx, "kegunaan", e.target.value)} />
              </label>
              <div style={{ textAlign: "right" }}>
                <button type="button" className="button button-ghost button-sm text-red" onClick={() => removeMedicineItem(idx)}>
                  <Trash2 size={14} /> Hapus Item
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================
// MODAL COMPONENTS
// ==========================

// Pengunggah foto sederhana: preview lokal lalu simpan ke object storage
// Telegraph Cloud lewat /api/admin/upload (kunci API tetap di server).
async function uploadPhoto(file, showToast) {
  if (!file) {
    showToast("Pilih file gambar terlebih dahulu.", "error");
    return null;
  }
  const formData = new FormData();
  formData.append("image", file);
  try {
    const pin = sessionStorage.getItem("pmr_admin_pin") || "2026";
    const resp = await fetch("/api/admin/upload", { method: "POST", headers: { "X-Admin-Pin": pin }, body: formData });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || !json.ok) throw new Error(json.error || "Unggah gagal");
    const url = json.data?.url || json.data?.display_url;
    showToast("Foto berhasil diunggah ke Telegraph Cloud!");
    return url;
  } catch (e) {
    showToast("Gagal mengunggah foto: " + e.message, "error");
    return null;
  }
}

function PhotoUploadField({ label, value, onChange, showToast }) {
  const [preview, setPreview] = useState(value || "");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const doUpload = async () => {
    if (!file) {
      showToast("Pilih file gambar terlebih dahulu.", "error");
      return;
    }
    setUploading(true);
    const url = await uploadPhoto(file, showToast);
    if (url) {
      onChange(url);
      setPreview(url);
      setFile(null);
    }
    setUploading(false);
  };

  return (
    <div className="photo-upload-field">
      <span className="field-label">{label}</span>
      <div className="photo-upload-row">
        <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://... atau pilih file" />
        <label className="button button-ghost button-sm file-label">
          Pilih File
          <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
        </label>
        <button type="button" className="button button-primary button-sm" onClick={doUpload} disabled={uploading || !file}>
          {uploading ? "Mengunggah..." : "Unggah Foto"}
        </button>
      </div>

      {preview && (
        <div className="photo-preview">
          <img src={preview} alt="Preview" />
          <small>Preview foto — klik &quot;Unggah Foto&quot; untuk menyimpan</small>
        </div>
      )}
    </div>
  );
}


function AssetLibraryPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const combinedAssets = useMemo(() => {
    return [...(window.__pmrUploadedAssets || []), ...assetLibrary];
  }, [open]);

  return (
    <div className="asset-picker-wrapper">
      <button type="button" className="button button-ghost button-sm" onClick={() => setOpen(!open)}>
        <FolderOpen size={14} /> Pilih dari Gudang ({combinedAssets.length})
      </button>
      {open && (
        <div className="asset-picker-dropdown">
          <div className="ap-head"><span>Pilih Foto dari Pustaka Aset</span><button type="button" onClick={() => setOpen(false)}><X size={15} /></button></div>
          <div className="ap-grid">
            {combinedAssets.map((item, idx) => (
              <div key={item.path + idx} className="ap-item" onClick={() => { onSelect(item.path); setOpen(false); }}>
                <img src={item.path} alt={item.label} loading="lazy" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementModal({ item, onClose, onSave, showToast }) {
  const [form, setForm] = useState(item);
  const update = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" role="dialog">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{form.id ? "EDIT KABAR" : "BUAT KABAR BARU"}</span>
            <h2>{form.id ? "Perbarui Artikel" : "Tambah Kabar Terkini"}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="modal-body-form">
          <div className="two-fields">
            <label className="field">
              <span>Kategori</span>
              <input value={form.category || ""} onChange={(e) => update("category", e.target.value)} placeholder="Latihan gabungan / Kabar PMR / dll" required />
            </label>
            <label className="field">
              <span>Tanggal / Label Waktu</span>
              <input value={form.date || form.date_label || ""} onChange={(e) => update("date_label", e.target.value)} placeholder="16 Januari 2026" required />
            </label>
          </div>
          <label className="field full">
            <span>Judul Kabar</span>
            <input value={form.title || ""} onChange={(e) => update("title", e.target.value)} placeholder="Latgab bersama Pramuka..." required />
          </label>
            <div className="field full">
              <span>URL Gambar Cover</span>
              <div className="input-with-picker">
                <input value={form.image || form.image_url || ""} onChange={(e) => update("image_url", e.target.value)} placeholder="/gudang/gallery/juara.avif" required />
                <AssetLibraryPicker onSelect={(path) => update("image_url", path)} />
              </div>
              <PhotoUploadField
                label="Atau Upload Foto Baru (preview + upload)"
                value={form.image || form.image_url || ""}
                onChange={(url) => update("image_url", url)}
                showToast={showToast}
              />
            </div>
          <label className="field full">
            <span>Ringkasan / Isi Kabar (`excerpt`)</span>
            <textarea rows="4" value={form.excerpt || ""} onChange={(e) => update("excerpt", e.target.value)} placeholder="Tulis deskripsi atau ringkasan kegiatan..." required />
          </label>
          <label className="field-checkbox">
            <input type="checkbox" checked={form.is_published !== false} onChange={(e) => update("is_published", e.target.checked)} />
            <span>Terbitkan langsung ke beranda umum (`is_published`)</span>
          </label>

          <div className="modal-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="button button-primary"><Check size={16} /> Simpan Kabar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item);
  const update = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" role="dialog">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{form.id ? "EDIT AGENDA" : "TAMBAH AGENDA"}</span>
            <h2>{form.id ? "Perbarui Agenda Kegiatan" : "Buat Agenda Baru"}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="modal-body-form">
          <label className="field full">
            <span>Judul Agenda</span>
            <input value={form.title || ""} onChange={(e) => update("title", e.target.value)} placeholder="Latihan rutin PMR..." required />
          </label>
          <div className="two-fields">
            <label className="field">
              <span>Tanggal / Label Hari</span>
              <input value={form.date || form.date_label || ""} onChange={(e) => update("date_label", e.target.value)} placeholder="Setiap Kamis / 24 Juli 2026" required />
            </label>
            <label className="field">
              <span>Jam / Waktu</span>
              <input value={form.time || form.time_label || ""} onChange={(e) => update("time_label", e.target.value)} placeholder="15.00–17.00 WITA" required />
            </label>
          </div>
          <div className="two-fields">
            <label className="field">
              <span>Lokasi Kegiatan</span>
              <input value={form.location || ""} onChange={(e) => update("location", e.target.value)} placeholder="Aula / lapangan sekolah" required />
            </label>
            <label className="field">
              <span>Status / Tag</span>
              <select value={form.status || "Informasi"} onChange={(e) => update("status", e.target.value)}>
                <option value="Terbuka untuk anggota">Terbuka untuk anggota</option>
                <option value="Informasi">Informasi</option>
                <option value="Wajib Anggota">Wajib Anggota</option>
                <option value="Selesai">Selesai</option>
              </select>
            </label>
          </div>
          <label className="field full">
            <span>Deskripsi Agenda</span>
            <textarea rows="3" value={form.description || ""} onChange={(e) => update("description", e.target.value)} placeholder="Penjelasan kegiatan..." required />
          </label>
          <label className="field-checkbox">
            <input type="checkbox" checked={form.is_published !== false} onChange={(e) => update("is_published", e.target.checked)} />
            <span>Tampilkan di agenda beranda (`is_published`)</span>
          </label>

          <div className="modal-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="button button-primary"><Check size={16} /> Simpan Agenda</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GalleryModal({ item, onClose, onSave, showToast }) {
  const [form, setForm] = useState({ ...item, images: item.images || [item.cover || item.cover_url || ""] });
  const update = (k, v) => setForm({ ...form, [k]: v });

  const updateImageRow = (idx, val) => {
    const list = [...form.images];
    list[idx] = val;
    setForm({ ...form, images: list });
  };

  const addImageRow = (val = "/gudang/gallery/juara.avif") => {
    setForm({ ...form, images: [...form.images, val] });
  };

  const removeImageRow = (idx) => {
    const list = [...form.images];
    list.splice(idx, 1);
    setForm({ ...form, images: list });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal modal-lg" role="dialog">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{form.id ? "EDIT ALBUM" : "ALBUM GALERI BARU"}</span>
            <h2>{form.id ? "Perbarui Album Galeri" : "Buat Album Galeri Baru"}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="modal-body-form">
          <div className="two-fields">
            <label className="field">
              <span>Judul Album</span>
              <input value={form.title || ""} onChange={(e) => update("title", e.target.value)} required />
            </label>
            <label className="field">
              <span>Kategori</span>
              <input value={form.category || ""} onChange={(e) => update("category", e.target.value)} placeholder="Latihan / Aksi sosial / Prestasi" required />
            </label>
          </div>
          <div className="two-fields">
            <label className="field">
              <span>Label Tanggal (`date_label`)</span>
              <input value={form.date || form.date_label || ""} onChange={(e) => update("date_label", e.target.value)} placeholder="16 Januari 2026" required />
            </label>
            <label className="field">
              <span>Tanggal Sorting (`event_date`)</span>
              <input type="date" value={form.event_date || new Date().toISOString().slice(0, 10)} onChange={(e) => update("event_date", e.target.value)} required />
            </label>
          </div>
          <div className="field full">
            <span>URL Cover Album Utama</span>
            <div className="input-with-picker">
              <input value={form.cover || form.cover_url || ""} onChange={(e) => update("cover_url", e.target.value)} required />
              <AssetLibraryPicker onSelect={(path) => update("cover_url", path)} />
              <PhotoUploadField
                label="Upload Foto Cover Baru"
                value={form.cover || form.cover_url || ""}
                onChange={(url) => update("cover_url", url)}
                showToast={showToast}
              />
            </div>
          </div>
          <label className="field full">
            <span>Deskripsi Album</span>
            <textarea rows="3" value={form.description || ""} onChange={(e) => update("description", e.target.value)} required />
          </label>

          {/* Daftar Foto */}
          <div className="images-list-box">
            <div className="ilb-head">
              <span>Daftar Foto dalam Album ({form.images?.length || 0})</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <PhotoUploadField
                  label=""
                  value=""
                  onChange={(url) => addImageRow(url)}
                    showToast={showToast}
                />
                <button type="button" className="button button-ghost button-sm" onClick={() => addImageRow()}>
                  <Plus size={14} /> Tambah Foto
                </button>
              </div>
            </div>
            <div className="ilb-rows">
              {form.images?.map((imgUrl, idx) => (
                <div className="ilb-row" key={idx}>
                  <span className="row-num">{idx + 1}</span>
                  <input value={imgUrl} onChange={(e) => updateImageRow(idx, e.target.value)} placeholder="/gudang/gallery/..." />
                  <AssetLibraryPicker onSelect={(path) => updateImageRow(idx, path)} />
                  <PhotoUploadField
                    label=""
                    value={imgUrl}
                    onChange={(url) => updateImageRow(idx, url)}
                        showToast={showToast}
                  />
                  {form.images.length > 1 && (
                    <button type="button" className="text-red" onClick={() => removeImageRow(idx)}><Trash2 size={15} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="field-checkbox">
            <input type="checkbox" checked={form.is_published !== false} onChange={(e) => update("is_published", e.target.checked)} />
            <span>Terbitkan album di galeri (`is_published`)</span>
          </label>

          <div className="modal-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="button button-primary"><Check size={16} /> Simpan Album</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PersonModal({ modalData, org, onClose, onSaveOrg, showToast }) {
  const { type, item, index } = modalData;
  const [form, setForm] = useState(item);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = (e) => {
    e.preventDefault();
    const list = [...(org[type] || [])];
    if (index >= 0) list[index] = form;
    else list.push(form);
    onSaveOrg({ ...org, [type]: list });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" role="dialog">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{index >= 0 ? "EDIT PENGURUS" : "TAMBAH PENGURUS"}</span>
            <h2>{type === "advisory" ? "Penasihat / Pembina Sekolah" : "Pengurus Inti Organisasi"}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="two-fields">
            <label className="field">
              <span>Jabatan / Role</span>
              <input value={form.role || form.jabatan || ""} onChange={(e) => { update("role", e.target.value); update("jabatan", e.target.value); }} required />
            </label>
            <label className="field">
              <span>Nama Lengkap</span>
              <input value={form.nama || ""} onChange={(e) => update("nama", e.target.value)} placeholder="Adilla Hafiza..." required />
            </label>
          </div>
          <div className="two-fields">
            <label className="field">
              <span>Ikon Lucide</span>
              <select value={form.icon || "users"} onChange={(e) => update("icon", e.target.value)}>
                <option value="graduation-cap">graduation-cap</option>
                <option value="user-round">user-round</option>
                <option value="shield-check">shield-check</option>
                <option value="crown">crown</option>
                <option value="users">users</option>
                <option value="notebook-pen">notebook-pen</option>
                <option value="wallet-cards">wallet-cards</option>
              </select>
            </label>
            {type === "leaders" && (
              <div className="field">
                <span>URL Foto Pengurus <small>(opsional)</small></span>
                <div className="input-with-picker">
                  <input value={form.foto || ""} onChange={(e) => update("foto", e.target.value)} placeholder="/gudang/org/..." />
              <AssetLibraryPicker onSelect={(path) => update("foto", path)} />
              <PhotoUploadField
                label=""
                value={form.foto || ""}
                onChange={(url) => update("foto", url)}
                showToast={showToast}
              />
                </div>
              </div>
            )}
          </div>
          <label className="field full">
            <span>Deskripsi Tugas / Peran</span>
            <textarea rows="3" value={form.deskripsi || ""} onChange={(e) => update("deskripsi", e.target.value)} required />
          </label>
          <div className="modal-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="button button-primary"><Check size={16} /> Simpan Data</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DivisionModal({ modalData, org, onClose, onSaveOrg, showToast }) {
  const { item, index } = modalData;
  const [form, setForm] = useState({ ...item, anggota: item.anggota || [] });
  const [newMember, setNewMember] = useState("");
  const update = (k, v) => setForm({ ...form, [k]: v });

  const addMember = (e) => {
    e.preventDefault();
    if (!newMember.trim()) return;
    setForm({ ...form, anggota: [...form.anggota, newMember.trim()] });
    setNewMember("");
  };

  const removeMember = (mi) => {
    const list = [...form.anggota];
    list.splice(mi, 1);
    setForm({ ...form, anggota: list });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const list = [...(org.divisions || [])];
    if (index >= 0) list[index] = form;
    else list.push(form);
    onSaveOrg({ ...org, divisions: list });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" role="dialog">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{index >= 0 ? "EDIT DIVISI" : "TAMBAH DIVISI"}</span>
            <h2>Kelola Divisi & Anggota</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="two-fields">
            <label className="field">
              <span>Nama Divisi</span>
              <input value={form.divisi || ""} onChange={(e) => update("divisi", e.target.value)} required />
            </label>
            <label className="field">
              <span>Ikon Divisi (jika tidak pakai foto)</span>
              <select value={form.icon || "users-round"} onChange={(e) => update("icon", e.target.value)}>
                <option value="heart-pulse">heart-pulse (UKS)</option>
                <option value="megaphone">megaphone (Humas)</option>
                <option value="users-round">users-round (PSDM)</option>
                <option value="hand-heart">hand-heart (Sosmas)</option>
              </select>
            </label>
          </div>

          <div className="field full">
            <span>Foto Divisi (opsional, prioritas atas ikon)</span>
            <div className="input-with-picker">
              <input value={form.foto || ""} onChange={(e) => update("foto", e.target.value)} placeholder="/gudang/org/division-photo.jpg" />
              <AssetLibraryPicker onSelect={(path) => update("foto", path)} />
              <PhotoUploadField
                label=""
                value={form.foto || ""}
                onChange={(url) => update("foto", url)}
                showToast={showToast}
              />
            </div>
          </div>

          <div className="members-editor">
            <span>Anggota Divisi ({form.anggota?.length || 0}):</span>
            <div className="members-input-row">
              <input
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Ketik nama anggota lalu tekan Enter / Tambah..."
                onKeyDown={(e) => { if (e.key === "Enter") addMember(e); }}
              />
              <button type="button" className="button button-ghost button-sm" onClick={addMember}><Plus size={14} /> Tambah</button>
            </div>
            <div className="members-chip-cloud">
              {form.anggota?.map((m, mi) => (
                <span key={mi} className="edit-chip">
                  <UserRound size={12} /> {m}
                  <button type="button" onClick={() => removeMember(mi)}><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="button button-primary"><Check size={16} /> Simpan Divisi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GuideEditModal({ guide, guidesList, onClose, onSaveGuides }) {
  const [form, setForm] = useState({ ...guide, steps: guide.steps || [""] });
  const update = (k, v) => setForm({ ...form, [k]: v });

  const updateStep = (idx, val) => {
    const list = [...form.steps];
    list[idx] = val;
    setForm({ ...form, steps: list });
  };

  const addStep = () => setForm({ ...form, steps: [...form.steps, ""] });
  const removeStep = (idx) => {
    const list = [...form.steps];
    list.splice(idx, 1);
    setForm({ ...form, steps: list });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const list = [...(guidesList || [])];
    const idx = list.findIndex((g) => String(g.id) === String(form.id));
    if (idx >= 0) list[idx] = form;
    else list.push(form);
    onSaveGuides(list);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" role="dialog">
        <div className="modal-head">
          <div>
            <span className="eyebrow">EDUSCOPE P3K</span>
            <h2>{form.id ? "Edit Panduan Pertolongan" : "Tambah Panduan P3K Baru"}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="two-fields">
            <label className="field">
              <span>ID Slug (`mimisan`, `pingsan`)</span>
              <input value={form.id || ""} onChange={(e) => update("id", e.target.value)} required />
            </label>
            <label className="field">
              <span>Judul Panduan</span>
              <input value={form.title || ""} onChange={(e) => update("title", e.target.value)} required />
            </label>
          </div>
          <div className="two-fields">
            <label className="field">
              <span>Ikon Lucide</span>
              <select value={form.icon || "droplets"} onChange={(e) => update("icon", e.target.value)}>
                <option value="droplets">droplets</option>
                <option value="accessibility">accessibility</option>
                <option value="flame">flame</option>
                <option value="wind">wind</option>
                <option value="heart-pulse">heart-pulse</option>
              </select>
            </label>
            <label className="field">
              <span>Tone Warna</span>
              <select value={form.tone || "red"} onChange={(e) => update("tone", e.target.value)}>
                <option value="red">red (Merah)</option>
                <option value="yellow">yellow (Kuning)</option>
                <option value="orange">orange (Jingga)</option>
                <option value="blue">blue (Biru)</option>
              </select>
            </label>
          </div>
          <label className="field full">
            <span>Tag Peringatan</span>
            <input value={form.tag || ""} onChange={(e) => update("tag", e.target.value)} placeholder="Tindakan cepat / Keadaan darurat" required />
          </label>
          <label className="field full">
            <span>Ringkasan Singkat (`summary`)</span>
            <input value={form.summary || ""} onChange={(e) => update("summary", e.target.value)} required />
          </label>

          <div className="steps-list-editor">
            <div className="sle-head">
              <span>Langkah-langkah Pertolongan ({form.steps?.length || 0})</span>
              <button type="button" className="button button-ghost button-sm" onClick={addStep}><Plus size={14} /> Tambah Langkah</button>
            </div>
            {form.steps?.map((step, idx) => (
              <div className="sle-row" key={idx}>
                <span className="step-num">{idx + 1}</span>
                <input value={step} onChange={(e) => updateStep(idx, e.target.value)} placeholder={`Instruksi langkah ke-${idx + 1}...`} required />
                {form.steps.length > 1 && (
                  <button type="button" className="text-red" onClick={() => removeStep(idx)}><Trash2 size={15} /></button>
                )}
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="button button-primary"><Check size={16} /> Simpan Panduan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

