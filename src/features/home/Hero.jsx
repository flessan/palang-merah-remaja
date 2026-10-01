import { Icon } from "../../components/ui/Icon.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { PhotoFrame, Sticker } from "../../components/ui/Bits.jsx";
import { Star } from "../../components/doodles/Doodles.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";

const HERO_PRIMARY = "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_1_elixib.avif";
const HERO_SECONDARY = "/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif";

export function Hero({ onNavigate, stats = [], highlights = [] }) {
  const lead = stats[0];

  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="hero-pill">
          <Icon name="heart-handshake" size={15} />
          Ekstrakurikuler Palang Merah Remaja · SMKN 4 Banjarmasin
        </span>

        <h1 className="hero-title" id="hero-title">
          <span>Humanis.</span>
          <span>Peduli.</span>
          <span>Tanggap.</span>
        </h1>

        <p className="lead">
          Rumah bagi siswa SMKN 4 Banjarmasin yang ingin belajar pertolongan pertama, melayani
          Ruang UKS, dan hadir untuk sesama — dengan cara yang menyenangkan dan serius.
        </p>

        <div className="hero-actions">
          <Button tone="primary" size="lg" icon="arrow-right" onClick={() => onNavigate("galeri")}>
            Lihat kegiatan
          </Button>
          <Button tone="secondary" size="lg" icon="shield-plus" onClick={() => onNavigate("edukasi")}>
            Belajar P3K
          </Button>
        </div>

        <div className="hero-marquee">
          {(highlights.length ? highlights : [
            { icon: "calendar", label: "Latihan rutin setiap Kamis" },
            { icon: "heart-pulse", label: "Piket UKS Senin–Jumat" },
            { icon: "circle-alert", label: "Darurat? Hubungi 119" },
          ]).map((item) => (
            <span key={item.label}>
              <Icon name={item.icon} size={15} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-art">
        <PhotoFrame
          className="hero-photo"
          variant="wide"
          tape
          tilt={-1.6}
          src={HERO_PRIMARY}
          alt="Anggota PMR Wira berlatih bersama di SMKN 4 Banjarmasin"
          imgProps={{ loading: "eager", fetchpriority: "high" }}
        />
        <PhotoFrame
          className="hero-photo-2"
          variant="tall"
          tilt={2.2}
          src={HERO_SECONDARY}
          alt="Kebersamaan anggota PMR Wira seusai kegiatan"
        />

        <div className="hero-deco-1" style={{ justifySelf: "end" }}>
          <Star size={44} className="rotate-right" style={{ color: "var(--yellow)" }} />
        </div>

        <Sticker className="hero-deco-2" tone="ink" icon="shield-check" style={{ transform: "rotate(-3deg)" }}>
          Siap siaga
        </Sticker>

        <div className="hero-stat-card">
          <strong>{lead ? lead.value : "120"}</strong>
          <span>{lead ? lead.label : "Relawan aktif"}</span>
        </div>

        <span className="sr-only">
          <SmartImage src={HERO_PRIMARY} alt="Kolase foto kegiatan PMR Wira" />
        </span>
      </div>
    </section>
  );
}

export default Hero;
