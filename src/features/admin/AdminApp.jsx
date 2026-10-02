import { useEffect, useMemo, useState } from "react";
import { adminBackup, clearAdminToken, fetchHealth } from "../../lib/api.js";
import { useAdminData } from "./useAdminData.js";
import { AdminLogin } from "./AdminLogin.jsx";
import { AdminOverview } from "./AdminOverview.jsx";
import { CollectionTable } from "./CollectionTable.jsx";
import { AdminOrganization } from "./AdminOrganization.jsx";
import { AdminMembers } from "./AdminMembers.jsx";
import { AdminRoster } from "./AdminRoster.jsx";
import { AdminUks } from "./AdminUks.jsx";
import { AdminSettings } from "./AdminSettings.jsx";
import { AdminAssets } from "./AdminAssets.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Sticker } from "../../components/ui/Bits.jsx";

const SUBNAV = [
  { id: "overview", label: "Ringkasan", icon: "layout-dashboard", group: "Mulai di sini" },
  { id: "announcements", label: "Kabar & berita", icon: "newspaper", group: "Konten situs" },
  { id: "events", label: "Agenda", icon: "calendar", group: "Konten situs" },
  { id: "gallery", label: "Galeri", icon: "images", group: "Konten situs" },
  { id: "guides", label: "Edukasi P3K", icon: "shield-plus", group: "Konten situs" },
  { id: "members", label: "Anggota", icon: "user-search", group: "Orang & jadwal" },
  { id: "organization", label: "Organisasi", icon: "users", group: "Orang & jadwal" },
  { id: "roster", label: "Jadwal jaga", icon: "clipboard-list", group: "Orang & jadwal" },
  { id: "uks", label: "Ruang UKS", icon: "heart-pulse", group: "Layanan" },
  { id: "assets", label: "Aset media", icon: "folder", group: "Media & pengaturan" },
  { id: "settings", label: "Pengaturan", icon: "settings", group: "Media & pengaturan" },
];

export function AdminApp({ showToast, onPublicRefresh, onExit }) {
  const [session, setSession] = useState(false);
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState(null);
  const admin = useAdminData();

  useEffect(() => {
    if (!session) return;
    admin.load().then((data) => {
      if (data) onPublicRefresh?.(data);
    });
    fetchHealth().then(setHealth).catch(() => setHealth(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleLogin = (payload) => {
    setSession(true);
    showToast?.(payload?.mode === "fallback" ? "Masuk mode fallback (Telegraph belum dikonfigurasi)." : "Berhasil masuk sebagai admin.", "success");
  };

  const logout = () => {
    clearAdminToken();
    setSession(false);
    setTab("overview");
    admin.setDataset?.(null);
    showToast?.("Sesi admin diakhiri.", "info");
  };

  const saveSingleton = async (collection, value) => {
    setBusy(true);
    const result = await admin.saveSingleton(collection, value);
    setBusy(false);
    showToast?.(result.ok ? "Perubahan tersimpan." : result.error, result.ok ? "success" : "error");
    if (result.ok) onPublicRefresh?.(admin.dataset);
  };

  const backup = async () => {
    try {
      const payload = await adminBackup();
      const blob = new Blob([JSON.stringify(payload.content || payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `pmr-wira-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast?.("Backup diunduh.", "success");
    } catch (cause) {
      showToast?.(cause?.message || "Gagal membuat backup.", "error");
    }
  };

  const categories = useMemo(() => {
    const values = new Set();
    for (const album of admin.collections.gallery || []) if (album.category) values.add(album.category);
    return [...values];
  }, [admin.collections.gallery]);

  if (!session) {
    return <AdminLogin onAuthenticated={handleLogin} onCancel={() => onExit?.()} />;
  }

  const { dataset } = admin;
  const members = admin.collections.members || [];
  const activeSection = SUBNAV.find((item) => item.id === tab);

  return (
    <div className="admin-shell container-wide">
      <div className="admin-bar">
        <div className="admin-bar__meta">
          <Sticker tone="blue" icon="shield-check" flat>Portal admin</Sticker>
          <strong>Meja kerja pengurus</strong>
          <small>
            {admin.status === "loading"
              ? "Memuat data…"
              : `${members.length} anggota · ${(admin.collections.announcements || []).length} kabar · ${(admin.collections.gallery || []).length} album · Telegraph Cloud`}
          </small>
        </div>
        <div className="row-actions">
          <Button size="sm" tone="ghost" icon="refresh" onClick={() => admin.load().then((data) => data && onPublicRefresh?.(data))}>
            Sinkronkan
          </Button>
          <Button size="sm" tone="ghost" icon="log-out" onClick={logout}>Keluar</Button>
        </div>
      </div>

      <div className="admin-layout">
        <nav className="admin-subnav" aria-label="Menu admin">
          {SUBNAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`subnav-tab ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-panel">
          {/* Phones get a real select instead of a horizontal tab scroller. */}
          <div className="admin-section-picker">
            <label htmlFor="admin-section">
              Bagian admin
              {activeSection ? <span className="sr-only"> — sekarang {activeSection.label}</span> : null}
            </label>
            <select
              id="admin-section"
              className="select"
              value={tab}
              onChange={(event) => setTab(event.target.value)}
            >
              {SUBNAV.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          {admin.status === "error" ? (
            <div className="inline-note inline-note--error" role="alert">
              <Icon name="wifi-off" size={18} />
              <div>
                <strong>Gagal memuat data admin</strong>
                <p style={{ margin: "4px 0 0" }}>{admin.error}</p>
              </div>
            </div>
          ) : null}

          {tab === "overview" ? (
            <AdminOverview
              dataset={dataset}
              collections={admin.collections}
              health={health}
              onGoTo={setTab}
              onBackup={backup}
              onRefresh={() => admin.load()}
            />
          ) : null}

          {["announcements", "events", "gallery", "guides"].includes(tab) ? (
            <CollectionTable
              collection={tab}
              items={admin.collections[tab] || []}
              onSave={admin.saveItem}
              onDelete={admin.deleteItem}
              busy={busy}
              filterKey={tab === "gallery" ? "category" : undefined}
              filterOptions={tab === "gallery" ? categories : []}
            />
          ) : null}

          {tab === "members" ? (
            <AdminMembers
              members={members}
              org={dataset?.org}
              busy={busy}
              onSave={async (collection, item) => {
                setBusy(true);
                const result = await admin.saveItem(collection, item);
                setBusy(false);
                if (result.ok) onPublicRefresh?.(admin.dataset);
                return result;
              }}
              onDelete={async (collection, id) => {
                setBusy(true);
                const result = await admin.deleteItem(collection, id);
                setBusy(false);
                if (result.ok) onPublicRefresh?.(admin.dataset);
                return result;
              }}
              onNotify={(message, type) => showToast?.(message, type)}
            />
          ) : null}

          {tab === "organization" && dataset ? (
            <AdminOrganization org={dataset.org} members={members} busy={busy} onSave={saveSingleton} />
          ) : null}

          {tab === "roster" && dataset ? (
            <AdminRoster roster={dataset.roster} members={members} busy={busy} onSave={saveSingleton} />
          ) : null}

          {tab === "uks" && dataset ? (
            <AdminUks uks={dataset.uks} busy={busy} onSave={saveSingleton} />
          ) : null}

          {tab === "settings" && dataset ? (
            <AdminSettings
              settings={dataset.settings}
              busy={busy}
              onSave={saveSingleton}
              storageNote="Pengaturan disimpan sebagai dokumen site_settings di Telegraph Cloud. Kunci API hanya ada di server."
            />
          ) : null}

          {tab === "assets" ? (
            <AdminAssets
              onNotify={(message, type) => showToast?.(message, type)}
              onUseAsset={(url) => showToast?.(`URL aset siap dipakai: ${url}`, "info")}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AdminApp;
