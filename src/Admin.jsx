import React, { useEffect, useMemo, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  Award,
  Bell,
  CalendarDays,
  Check,
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
          <div className={`db-status-pill ${data.source === "neon" ? "db-neon" : "db-demo"}`}>
            <Database size={14} />
            <span>{data.source === "neon" ? "Database Neon Terhubung" : "Mode Demo (Penyimpanan Memori)"}</span>
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
          { id: "roster", label: "Jadwal Jaga Adil", icon: "shield-check", highlight: true },
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
                  excerpt: `Berikut pembagian tugas penjagaan Ruang UKS (Senin–Jumat) dan piket lapangan upacara (Senin) bagi seluruh anggota aktif periode ${newRoster.bulan_label}.`,
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
          imgbbApiKey={data?.contact?.imgbb_api_key}
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
          imgbbApiKey={data?.contact?.imgbb_api_key}
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
          imgbbApiKey={data?.contact?.imgbb_api_key}
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
          imgbbApiKey={data?.contact?.imgbb_api_key}
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
          <ShieldCheck size={15} /> Generate Jadwal Jaga
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
            <h4><Database size={17} /> Status Sistem & Database</h4>
            <span className={`status-badge ${data.source === "neon" ? "badge-green" : "badge-yellow"}`}>
              {data.source === "neon" ? "PRODUKSI (NEON SQL)" : "MODE DEMO LOKAL"}
            </span>
          </div>
          <div className="diag-table">
            <div className="diag-row">
              <span>Sumber Data Aktif:</span>
              <strong>{data.source === "neon" ? "Neon Serverless Postgres (@neondatabase/serverless)" : "Penyimpanan Memori & Fallback Sesi (Demo Mode)"}</strong>
            </div>
            <div className="diag-row">
              <span>Koneksi Database (DATABASE_URL):</span>
              <strong>{healthStatus?.database || data.source === "neon" ? "🟢 Terhubung & Siap Tulis" : "🟡 Belum Diatur (Pembaruan disimpan di memori browser)"}</strong>
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
          {data.source !== "neon" && (
            <div className="info-banner">
              <Info size={18} />
              <p>
                <strong>Tip Pengembang:</strong> Saat ini aplikasi berjalan di mode demo tanpa variabel rahasia <code>DATABASE_URL</code>. Semua penambahan/pengeditan yang kamu lakukan tetap langsung terlihat dan dapat diuji sepenuhnya dalam sesi ini!
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

// Sub-Tab: Jadwal Jaga Adil (UKS & Lapangan)
function RosterTab({ roster, org, onSaveRoster, showToast }) {
  const allMembers = useMemo(() => {
    const list = new Set();
    (org?.divisions || []).forEach((div) => {
      (div.anggota || []).forEach((m) => list.add(m));
    });
    (org?.leaders || []).forEach((l) => {
      if (l.nama && !l.role?.toLowerCase().includes("pembina")) list.add(l.nama);
    });
    return Array.from(list);
  }, [org]);

  const [bulanLabel, setBulanLabel] = useState(roster?.bulan_label || "Agustus 2026");
  const [uksPerShift, setUksPerShift] = useState(roster?.petugas_per_shift_uks || 2);
  const [lapanganPerShift, setLapanganPerShift] = useState(roster?.petugas_per_shift_lapangan || 4);
  const [autoAnnounce, setAutoAnnounce] = useState(true);
  const [currentRoster, setCurrentRoster] = useState(roster || {
    periode: "Agustus 2026",
    bulan_label: "Agustus 2026",
    petugas_per_shift_uks: 2,
    petugas_per_shift_lapangan: 4,
    uks_schedule: [],
    lapangan_schedule: [],
    summary_counts: {},
    is_published: true
  });
  const [memberText, setMemberText] = useState(() => (allMembers.length ? allMembers.join("\n") : "Syifa Maurinjia\nNazma Az Zahra\nNahdhah\nAndi Nabilla Ramadani\nMaulidia Hayuningdiah\nNaufa Azmi Khairizqa\nMelsia Oktavia\nEva Regina Putri Riyanti\nLisa Erfina\nNaylah Azkiya\nRama\nAlia Rahmawati\nFerdi Herlino\nAlmira Fakhriah Hasan\nA. Ustman Abdullah\nKirani\nHalissa Azzahra\nDelya Ananda\nLionel Abdi Darma W.\nSelviana Dewi\nMuhammad Sultan Ariady\nNur Aleesya Nashirah\nNabila Rosydah Zahro\nZahrah Fitri Aisy\nWulandari\nLietya Aisya\nFiry al Humairoh Rahmah\nSofha Raihana Kamelia"));
  const [activeSubView, setActiveSubView] = useState("uks"); // 'uks' or 'lapangan'
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (allMembers.length > 0 && (!memberText || !memberText.trim())) {
      setMemberText(allMembers.join("\n"));
    }
  }, [allMembers]);

  const generateFairSchedule = () => {
    const members = memberText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!members.length) {
      showToast("Daftar anggota tidak boleh kosong!", "error");
      return;
    }

    // Determine target month and year from label or default August 2026
    let year = 2026;
    let monthIndex = 7; // August is 7 (0-indexed)
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    monthNames.forEach((m, idx) => {
      if (bulanLabel.toLowerCase().includes(m.toLowerCase())) monthIndex = idx;
    });
    const yearMatch = bulanLabel.match(/\b(20\d\d)\b/);
    if (yearMatch) year = parseInt(yearMatch[1], 10);

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const uksDays = [];
    const lapanganDays = [];
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, monthIndex, d);
      const dayNum = dt.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
      const tglStr = `${dayNames[dayNum]}, ${d} ${monthNames[monthIndex]} ${year}`;
      if (dayNum >= 1 && dayNum <= 5) {
        uksDays.push({ tanggal: tglStr, hari: dayNames[dayNum], petugas: [] });
      }
      if (dayNum === 1) {
        lapanganDays.push({ tanggal: tglStr, hari: "Senin", petugas: [] });
      }
    }

    // Initialize shift counts
    const counts = {};
    const lastDayIdx = {};
    members.forEach(m => {
      counts[m] = { uks: 0, lapangan: 0, total: 0 };
      lastDayIdx[m] = -10;
    });

    // 1. Allocate Lapangan (Every Monday flag ceremony)
    lapanganDays.forEach((ld) => {
      const pool = [...members].sort((a, b) => {
        if (counts[a].lapangan !== counts[b].lapangan) return counts[a].lapangan - counts[b].lapangan;
        if (counts[a].total !== counts[b].total) return counts[a].total - counts[b].total;
        return Math.random() - 0.5;
      });
      const selected = pool.slice(0, Math.min(lapanganPerShift, pool.length));
      ld.petugas = selected;
      selected.forEach(m => {
        counts[m].lapangan++;
        counts[m].total++;
      });
    });

    // 2. Allocate UKS (Monday - Friday)
    uksDays.forEach((ud, dIdx) => {
      const isMon = ud.hari === "Senin";
      const monDuty = isMon ? (lapanganDays.find(l => l.tanggal === ud.tanggal)?.petugas || []) : [];

      const pool = [...members].sort((a, b) => {
        // Heavy penalty if already guarding Lapangan on this exact same Monday
        const aMon = monDuty.includes(a) ? 1 : 0;
        const bMon = monDuty.includes(b) ? 1 : 0;
        if (aMon !== bMon) return aMon - bMon;

        // Heavy penalty if guarded UKS yesterday
        const aYest = (dIdx - lastDayIdx[a] === 1) ? 1 : 0;
        const bYest = (dIdx - lastDayIdx[b] === 1) ? 1 : 0;
        if (aYest !== bYest) return aYest - bYest;

        // Sort by least UKS shifts then total shifts
        if (counts[a].uks !== counts[b].uks) return counts[a].uks - counts[b].uks;
        if (counts[a].total !== counts[b].total) return counts[a].total - counts[b].total;
        return Math.random() - 0.5;
      });

      const selected = pool.slice(0, Math.min(uksPerShift, pool.length));
      ud.petugas = selected;
      selected.forEach(m => {
        counts[m].uks++;
        counts[m].total++;
        lastDayIdx[m] = dIdx;
      });
    });

    const newRosterObj = {
      periode: bulanLabel,
      bulan_label: bulanLabel,
      keterangan: `Jadwal resmi penjagaan Ruang UKS (Senin–Jumat) dan piket lapangan upacara (Setiap Senin) untuk seluruh anggota aktif PMR Wira SMKN 4 Banjarmasin periode ${bulanLabel}.`,
      petugas_per_shift_uks: Number(uksPerShift) || 2,
      petugas_per_shift_lapangan: Number(lapanganPerShift) || 4,
      uks_schedule: uksDays,
      lapangan_schedule: lapanganDays,
      summary_counts: counts,
      is_published: true,
      updated_at: new Date().toISOString()
    };

    setCurrentRoster(newRosterObj);
    showToast(`Jadwal adil untuk ${bulanLabel} berhasil dibentuk (${uksDays.length} shift UKS, ${lapanganDays.length} shift Lapangan)!`);
  };

  const handleSwapPetugas = (scheduleKey, shiftIdx, memberIdx, newName) => {
    const updatedSchedule = [...(currentRoster[scheduleKey] || [])];
    const shiftPetugas = [...updatedSchedule[shiftIdx].petugas];
    shiftPetugas[memberIdx] = newName;
    updatedSchedule[shiftIdx] = { ...updatedSchedule[shiftIdx], petugas: shiftPetugas };
    setCurrentRoster({ ...currentRoster, [scheduleKey]: updatedSchedule });
  };

  const handleSaveAndPublish = async () => {
    try {
      setIsSaving(true);
      await onSaveRoster(currentRoster, autoAnnounce);
      showToast("Jadwal jaga berhasil disimpan dan diterbitkan ke website!");
    } catch (err) {
      showToast(err.message || "Gagal menyimpan jadwal.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatAdminWA = (viewType) => {
    const uksList = currentRoster.uks_schedule || [];
    const lapList = currentRoster.lapangan_schedule || [];
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
      uksList.slice(0, 5).forEach((item) => {
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
  };

  const handleAdminShareWA = () => {
    const text = formatAdminWA(activeSubView);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleAdminCopyText = () => {
    const text = formatAdminWA(activeSubView);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Teks jadwal tanpa emoji & link berhasil disalin! Siap ditempel ke WA.");
    } else {
      prompt("Salin teks jadwal berikut:", text);
    }
  };

  // Check fairness difference
  const countsArr = Object.values(currentRoster.summary_counts || {}).map(c => c.total || 0);
  const maxShift = countsArr.length ? Math.max(...countsArr) : 0;
  const minShift = countsArr.length ? Math.min(...countsArr) : 0;
  const isFair = (maxShift - minShift) <= 1 && countsArr.length > 0;

  return (
    <div className="module-tab">
      <div className="module-header">
        <div>
          <h2>Generator & Manajemen Jadwal Jaga Adil</h2>
          <p>Bentuk pembagian tugas Ruang UKS (Senin–Jumat) dan Piket Lapangan Upacara (Senin) dengan distribusi otomatis merata bagi seluruh anggota.</p>
        </div>
        <button className="button button-primary" onClick={handleSaveAndPublish} disabled={isSaving}>
          {isSaving ? "Menyimpan..." : <>Simpan & Terbitkan Jadwal <Check size={16} /></>}
        </button>
      </div>

      {/* Control Generator Box */}
      <div className="roster-control-card">
        <div className="rcc-head">
          <h3><RotateCcw size={18} /> Pengaturan Algoritma Keadilan Shift</h3>
          <button type="button" className="button button-ghost button-sm" onClick={() => setMemberText(allMembers.join("\n"))}>
            <RefreshCw size={14} /> Reset Anggota dari Divisi ({allMembers.length} Orang)
          </button>
        </div>
        <div className="rcc-grid">
          <label className="field">
            <span>Target Bulan & Tahun</span>
            <input value={bulanLabel} onChange={(e) => setBulanLabel(e.target.value)} placeholder="Agustus 2026" />
          </label>
          <label className="field">
            <span>Petugas Jaga UKS (Senin–Jumat) per Hari</span>
            <input type="number" min="1" max="6" value={uksPerShift} onChange={(e) => setUksPerShift(Number(e.target.value) || 2)} />
          </label>
          <label className="field">
            <span>Petugas Jaga Lapangan (Senin) per Hari</span>
            <input type="number" min="1" max="12" value={lapanganPerShift} onChange={(e) => setLapanganPerShift(Number(e.target.value) || 4)} />
          </label>
        </div>
        <div className="rcc-members">
          <span><strong>Daftar Seluruh Anggota Aktif untuk Diundi</strong> <small>(Satu nama per baris, dapat ditambah/diubah bebas):</small></span>
          <textarea
            rows="5"
            value={memberText}
            onChange={(e) => setMemberText(e.target.value)}
            placeholder="Ketik nama-nama anggota di sini..."
          />
        </div>
        <div className="rcc-foot">
          <label className="field-checkbox">
            <input type="checkbox" checked={autoAnnounce} onChange={(e) => setAutoAnnounce(e.target.checked)} />
            <span>Otomatis buat & terbitkan pengumuman di Beranda ("Jadwal Jaga UKS & Lapangan - {bulanLabel}")</span>
          </label>
          <button type="button" className="button button-yellow" onClick={generateFairSchedule}>
            ⚡ Acak & Generate Jadwal Adil Sekarang
          </button>
        </div>
      </div>

      {/* Fairness Audit Summary */}
      {Object.keys(currentRoster.summary_counts || {}).length > 0 && (
        <div className="roster-audit-card">
          <div className="audit-head">
            <div className="ah-left">
              <h4><ShieldCheck size={18} /> Audit Keadilan Distribusi Shift (`{currentRoster.bulan_label}`)</h4>
              <p>Mengecek keseimbangan beban tugas tiap anggota agar tidak ada yang terbebani berlebihan.</p>
            </div>
            {isFair ? (
              <span className="fair-badge"><Check size={14} /> 100% DISTRIBUSI ADIL (Selisih beban $\le 1$ shift)</span>
            ) : (
              <span className="fair-badge badge-warn"><CircleAlert size={14} /> Distribusi Normal (Selisih: {maxShift - minShift} shift)</span>
            )}
          </div>
          <div className="audit-chips">
            {Object.entries(currentRoster.summary_counts || {}).map(([nama, c]) => (
              <div className="audit-chip" key={nama}>
                <strong>{nama}</strong>
                <span>UKS: {c.uks} · Lapangan: {c.lapangan} ➔ <b>Total: {c.total} shift</b></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roster Viewer & Editor */}
      <div className="roster-schedule-section">
        <div className="rss-tabs">
          <button
            className={`rss-tab ${activeSubView === "uks" ? "active" : ""}`}
            onClick={() => setActiveSubView("uks")}
          >
            <HeartPulse size={16} /> Jadwal Penjagaan Ruang UKS ({currentRoster.uks_schedule?.length || 0} Hari)
          </button>
          <button
            className={`rss-tab ${activeSubView === "lapangan" ? "active" : ""}`}
            onClick={() => setActiveSubView("lapangan")}
          >
            <Award size={16} /> Jadwal Piket Lapangan Upacara ({currentRoster.lapangan_schedule?.length || 0} Hari Senin)
          </button>
        </div>

        <div className="wa-share-bar">
          <div className="wa-share-info">
            <MessageCircle size={18} />
            <span>Bagikan jadwal {activeSubView === "uks" ? "Piket Jaga UKS" : "Jaga Upacara Senin"} ke WhatsApp (Format rapi tanpa emoji beserta tautan link):</span>
          </div>
          <div className="wa-share-btns">
            <button type="button" className="button button-wa button-sm" onClick={handleAdminShareWA}>
              <Send size={14} /> Share ke WhatsApp
            </button>
            <button type="button" className="button button-ghost button-sm" onClick={handleAdminCopyText}>
              <Copy size={14} /> Salin Teks & Link
            </button>
          </div>
        </div>

        <div className="rss-list">
          {(activeSubView === "uks" ? currentRoster.uks_schedule : currentRoster.lapangan_schedule)?.map((shift, shiftIdx) => (
            <div className="rss-row" key={shiftIdx}>
              <div className="rss-date">
                <strong>{shift.tanggal}</strong>
                <span className="tag">{shift.hari}</span>
              </div>
              <div className="rss-petugas">
                <span>Petugas Bertugas ({shift.petugas?.length || 0} Orang):</span>
                <div className="petugas-pills">
                  {shift.petugas?.map((nama, memberIdx) => (
                    <div className="petugas-pill" key={memberIdx}>
                      <UserRound size={13} />
                      <input
                        value={nama}
                        onChange={(e) => handleSwapPetugas(activeSubView, shiftIdx, memberIdx, e.target.value)}
                        title="Klik untuk mengubah nama petugas jika izin/ganti"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {(!currentRoster.uks_schedule?.length && !currentRoster.lapangan_schedule?.length) && (
            <div className="empty-box"><p>Tekan tombol "⚡ Acak & Generate Jadwal Adil Sekarang" di atas untuk membentuk jadwal baru.</p></div>
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

            {/* ImgBB API Key (stored server-side via Neon) */}
            <div className="field full">
              <label>
                <span>ImgBB API Key (untuk upload foto di form admin)</span>
                <input
                  type="password"
                  value={contactState.imgbb_api_key || ""}
                  onChange={(e) => setContactState({ ...contactState, imgbb_api_key: e.target.value })}
                  placeholder="Masukkan API Key ImgBB (disimpan di database)"
                />
              </label>
              <small style={{color: "var(--muted)", fontSize: "11px"}}>Kunci ini disimpan aman di Neon DB. Digunakan untuk preview + upload foto langsung di form.</small>
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

// Simple reusable photo uploader with preview + ImgBB upload
// The apiKey is passed from parent (stored in Neon via Admin)
async function uploadToImgBB(file, apiKey, showToast) {
  if (!apiKey || apiKey.length < 10) {
    showToast("API Key ImgBB belum disimpan di Admin Panel.", "error");
    return null;
  }
  const base64 = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const formData = new FormData();
  formData.append("image", base64);

  try {
    const resp = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });
    const json = await resp.json();
    if (!resp.ok || !json.success) throw new Error(json.error?.message || "Upload gagal");
    const url = json.data?.url || json.data?.display_url;
    showToast("Foto berhasil diunggah ke ImgBB!");
    return url;
  } catch (e) {
    showToast("Gagal upload ke ImgBB: " + e.message, "error");
    return null;
  }
}

function PhotoUploadField({ label, value, onChange, apiKey, showToast }) {
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
    const url = await uploadToImgBB(file, apiKey, showToast);
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
          {uploading ? "Mengunggah..." : "Unggah ke ImgBB"}
        </button>
      </div>

      {preview && (
        <div className="photo-preview">
          <img src={preview} alt="Preview" />
          <small>Preview foto (klik "Unggah ke ImgBB" untuk upload)</small>
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
          <div className="ap-head"><span>Pilih Foto dari Repository atau ImgBB</span><button type="button" onClick={() => setOpen(false)}><X size={15} /></button></div>
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

function AnnouncementModal({ item, onClose, onSave, showToast, imgbbApiKey }) {
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
                apiKey={imgbbApiKey}
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

function GalleryModal({ item, onClose, onSave, showToast, imgbbApiKey }) {
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
                apiKey={imgbbApiKey}
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
                  apiKey={imgbbApiKey}
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
                    apiKey={imgbbApiKey}
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

function PersonModal({ modalData, org, onClose, onSaveOrg, showToast, imgbbApiKey }) {
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
                apiKey={imgbbApiKey}
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

function DivisionModal({ modalData, org, onClose, onSaveOrg, showToast, imgbbApiKey }) {
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
                apiKey={imgbbApiKey}
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

