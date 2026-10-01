import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { StatusPill } from "../../components/ui/Bits.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { formatDateLabel } from "../../lib/utils.js";

function Kpi({ tone, label, value, icon }) {
  return (
    <div className={`kpi kpi--${tone}`}>
      <Icon name={icon} size={20} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function AdminOverview({ dataset, collections, onGoTo, onBackup, onRefresh, health }) {
  const latest = [...(collections.announcements || [])]
    .sort((a, b) => String(b._updated_at || "").localeCompare(String(a._updated_at || "")))
    .slice(0, 5);

  return (
    <>
      <section className="admin-section" aria-labelledby="admin-overview-title">
        <div className="admin-section__head">
          <div>
            <h2 id="admin-overview-title">Ringkasan konten</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.86rem" }}>
              Sumber data: <strong>Telegraph Cloud</strong> · proyek {health?.project || "—"} · bucket {health?.bucket || "pmr-assets"}
            </p>
          </div>
          <div className="row-actions">
            <Button size="sm" tone="ghost" icon="refresh" onClick={onRefresh}>Muat ulang</Button>
            <Button size="sm" tone="secondary" icon="download" onClick={onBackup}>Unduh backup</Button>
          </div>
        </div>

        <div className="kpi-grid">
          <Kpi tone="red" icon="newspaper" label="Kabar" value={(collections.announcements || []).length} />
          <Kpi tone="yellow" icon="calendar" label="Agenda" value={(collections.events || []).length} />
          <Kpi tone="blue" icon="images" label="Album galeri" value={(collections.gallery || []).length} />
          <Kpi tone="mint" icon="shield-plus" label="Panduan P3K" value={(collections.guides || []).length} />
          <Kpi tone="yellow" icon="heart-pulse" label="Item UKS" value={dataset?.uks?.inventory?.length || 0} />
          <Kpi tone="blue" icon="users" label="Pengurus" value={(dataset?.org?.leaders || []).length} />
        </div>
      </section>

      <section className="admin-section" aria-labelledby="admin-latest-title">
        <div className="admin-section__head">
          <h2 id="admin-latest-title">Kabar terbaru</h2>
          <Button size="sm" tone="ghost" icon="arrow-right" onClick={() => onGoTo("announcements")}>
            Kelola kabar
          </Button>
        </div>

        {latest.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Kabar terbaru</caption>
              <thead>
                <tr>
                  <th scope="col">Judul</th>
                  <th scope="col">Diperbarui</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {item.image ? <span className="table-thumb"><SmartImage src={item.image} alt="" /></span> : null}
                        <strong>{item.title}</strong>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{formatDateLabel(item._updated_at || item.date, "—")}</td>
                    <td><StatusPill published={item.published !== false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="inline-note">
            <Icon name="info" size={18} />
            <span>Belum ada kabar. Tambahkan dari menu <strong>Kabar &amp; berita</strong>.</span>
          </div>
        )}
      </section>

      <section className="admin-section" aria-labelledby="admin-checks-title">
        <h2 id="admin-checks-title">Kesiapan layanan</h2>
        <div className="switch-row">
          <span>Adapter Telegraph Cloud</span>
          <StatusPill published={Boolean(health?.configured)} labels={["Terhubung", "Belum dikonfigurasi"]} />
        </div>
        <div className="switch-row">
          <span>Bucket aset</span>
          <strong>{health?.bucket || "pmr-assets"}</strong>
        </div>
        <div className="switch-row" style={{ borderBottom: 0 }}>
          <span>Kunci API Telegraph</span>
          <strong>Disimpan sebagai secret Cloudflare (tidak pernah ke peramban)</strong>
        </div>
        {health?.issues?.length ? (
          <div className="inline-note inline-note--warn">
            <Icon name="triangle-alert" size={18} />
            <div>
              <strong>Perlu perhatian</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: "1.1em" }}>
                {health.issues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

export default AdminOverview;
