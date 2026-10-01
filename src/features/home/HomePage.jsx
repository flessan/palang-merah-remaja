import { useState } from "react";
import { Hero } from "./Hero.jsx";
import { IdentityGrid } from "./IdentityGrid.jsx";
import { EmergencyBand } from "./EmergencyBand.jsx";
import { NewsSection } from "./NewsSection.jsx";
import { EventsSection } from "./EventsSection.jsx";
import { UksFeature } from "./UksFeature.jsx";
import { EducationTeaser } from "./EducationTeaser.jsx";
import { GalleryTeaser } from "./GalleryTeaser.jsx";
import { OrgTeaser } from "./OrgTeaser.jsx";
import { AlbumLightbox } from "../../components/media/AlbumLightbox.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Sticker } from "../../components/ui/Bits.jsx";

export function HomePage({ content, onNavigate, onOpenGuide }) {
  const [album, setAlbum] = useState(null);
  const { announcements, events, gallery, guides, org, uks, stats, settings } = content;

  return (
    <div className="page">
      <Hero
        onNavigate={onNavigate}
        stats={stats}
        highlights={[
          { icon: "calendar", label: "Latihan rutin setiap Kamis" },
          { icon: "heart-pulse", label: "Piket UKS Senin–Jumat" },
          { icon: "circle-alert", label: `Darurat? Hubungi ${settings.emergency.number}` },
        ]}
      />

      <IdentityGrid onNavigate={onNavigate} />
      <EmergencyBand emergency={settings.emergency} onNavigate={onNavigate} />
      <NewsSection announcements={announcements} onNavigate={onNavigate} />
      <EventsSection events={events} onNavigate={onNavigate} />
      <UksFeature uks={uks} onNavigate={onNavigate} />
      <EducationTeaser guides={guides} onOpenGuide={onOpenGuide} onNavigate={onNavigate} />
      <GalleryTeaser albums={gallery} onNavigate={onNavigate} onOpenAlbum={setAlbum} />
      <OrgTeaser org={org} stats={stats} onNavigate={onNavigate} />

      <section className="container">
        <div className="cta-band">
          <div>
            <Sticker tone="yellow" icon="hand-heart" flat>Terbuka untuk siswa aktif</Sticker>
            <h2>Tertarik ikut bergabung?</h2>
            <p>Hubungi sekretariat PMR Wira di Ruang UKS atau lewat WhatsApp untuk informasi keanggotaan.</p>
          </div>
          <div className="hero-actions">
            <Button tone="primary" icon="message-circle" onClick={() => onNavigate("kontak")}>
              Hubungi sekretariat
            </Button>
            <Button tone="ghost" icon="book-open" onClick={() => onNavigate("edukasi")}>
              <span className="sr-only">Buka edukasi P3K</span>
              Belajar P3K
            </Button>
          </div>
        </div>
      </section>

      <section className="container" aria-labelledby="home-source-title">
        <h2 id="home-source-title" className="sr-only">Status data konten</h2>
        <div className="disclaimer">
          <Icon name={content.source === "telegraph" ? "database" : "hard-drive"} size={19} />
          <p>
            {content.source === "telegraph"
              ? "Konten halaman ini dibaca langsung dari Telegraph Cloud melalui adapter /api/content."
              : "Telegraph Cloud belum terhubung — situs menampilkan data fallback lokal agar tetap bisa dibaca."}
          </p>
        </div>
      </section>

      <AlbumLightbox album={album} onClose={() => setAlbum(null)} />
    </div>
  );
}

export default HomePage;
