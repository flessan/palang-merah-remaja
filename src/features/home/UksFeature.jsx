import { Icon } from "../../components/ui/Icon.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { IconChip, Sticker } from "../../components/ui/Bits.jsx";

export function UksFeature({ uks, onNavigate }) {
  const inventoryCount = uks?.inventory?.length || 0;

  return (
    <section className="uks-hero container" aria-labelledby="uks-title">
      <div className="uks-banner">
        <Sticker tone="red" icon="heart-pulse">Ruang UKS</Sticker>
        <h2 id="uks-title">{uks?.welcome_banner?.title || "Ruang UKS terbuka untuk seluruh siswa"}</h2>
        <p>{uks?.welcome_banner?.subtitle}</p>
        {uks?.welcome_banner?.highlight ? (
          <p className="uks-highlight">
            <Icon name="circle-check" size={18} />
            {uks.welcome_banner.highlight}
          </p>
        ) : null}
        <div className="hero-actions">
          <Button tone="ink" icon="arrow-right" onClick={() => onNavigate("uks")}>
            Jelajahi UKS
          </Button>
          <Button tone="ghost" icon="pill" onClick={() => onNavigate("uks", "inventaris")}>
            Lihat stok obat
          </Button>
        </div>
      </div>

      <div className="uks-facts">
        <div className="uks-fact">
          <IconChip icon="clock" tone="blue" />
          <div>
            <strong>Jam layanan</strong>
            <span>{uks?.service_hours || "Senin – Jumat, 07.00 – 15.30 WITA"}</span>
          </div>
        </div>
        <div className="uks-fact">
          <IconChip icon="map-pin" tone="yellow" />
          <div>
            <strong>Lokasi</strong>
            <span>{uks?.location || "Lantai 1 SMKN 4 Banjarmasin"}</span>
          </div>
        </div>
        <div className="uks-fact">
          <IconChip icon="package" tone="mint" />
          <div>
            <strong>{inventoryCount} item tersedia</strong>
            <span>Obat ringan, perban, alat pemeriksaan dasar, dan fasilitas istirahat — gratis.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UksFeature;
