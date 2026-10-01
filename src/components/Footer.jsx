import { Icon } from "./ui/Icon.jsx";
import { Sticker, Tag } from "./ui/Bits.jsx";

export function Footer({ onNavigate, branding, contact, source }) {
  const sekretariat = contact?.sekretariat || {};
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src={branding?.logo || "/gudang/logo/pmr-logo.webp"} alt="" width="74" height="74" />
          <div>
            <strong>{branding?.short_name || "PMR WIRA"}</strong>
            <p>{branding?.tagline || "Humanis. Peduli. Tanggap."}</p>
            <small>{branding?.school || "SMKN 4 Banjarmasin"} · Palang Merah Remaja tingkat Wira</small>
          </div>
          <div className="footer-badges">
            <Sticker tone="red" flat>Ekstrakurikuler resmi</Sticker>
            <Sticker tone="blue" flat>Siap · Tanggap</Sticker>
          </div>
        </div>

        <div className="footer-sitemap">
          <div className="sitemap-col">
            <span className="sitemap-title">Jelajahi</span>
            <button type="button" onClick={() => onNavigate("beranda")}>Beranda</button>
            <button type="button" onClick={() => onNavigate("profil")}>Profil &amp; struktur</button>
            <button type="button" onClick={() => onNavigate("sejarah")}>Sejarah &amp; pendiri</button>
            <button type="button" onClick={() => onNavigate("uks")}>Ruang UKS</button>
          </div>
          <div className="sitemap-col">
            <span className="sitemap-title">Konten</span>
            <button type="button" onClick={() => onNavigate("edukasi")}>Edukasi P3K</button>
            <button type="button" onClick={() => onNavigate("galeri")}>Galeri kegiatan</button>
            <button type="button" onClick={() => onNavigate("kontak")}>Kontak sekretariat</button>
            <button type="button" onClick={() => onNavigate("profil", "member")}>Struktur organisasi</button>
          </div>
          <div className="sitemap-col">
            <span className="sitemap-title">Hubungi</span>
            {sekretariat.wa_link ? <a href={sekretariat.wa_link} target="_blank" rel="noreferrer">WhatsApp sekretariat</a> : null}
            {sekretariat.email ? <a href={`mailto:${sekretariat.email}`}>{sekretariat.email}</a> : null}
            {sekretariat.instagram ? <a href={`https://www.instagram.com/${sekretariat.instagram}`} target="_blank" rel="noreferrer">Instagram @{sekretariat.instagram}</a> : null}
            {sekretariat.telepon ? <a href={`tel:${sekretariat.telepon.replace(/\s/g, "")}`}>{sekretariat.telepon}</a> : null}
          </div>
          <div className="sitemap-col">
            <span className="sitemap-title">Informasi</span>
            <a href="/sitemap.xml">Sitemap XML</a>
            <a href="/robots.txt">Robots</a>
            <button type="button" onClick={() => onNavigate("admin")}>Portal admin</button>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", opacity: 0.85 }}>
              <Icon name={source === "telegraph" ? "database" : "hard-drive"} size={14} />
              {source === "telegraph" ? "Telegraph Cloud" : "Mode fallback"}
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <small>© {year} PMR Wira SMKN 4 Banjarmasin — Ekstrakurikuler Palang Merah Remaja</small>
          <div className="footer-badges">
            <Tag tone="ink"><Icon name="shield-check" size={12} /> Humanis</Tag>
            <Tag tone="ink"><Icon name="heart" size={12} /> Peduli</Tag>
            <Tag tone="ink"><Icon name="activity" size={12} /> Tanggap</Tag>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
