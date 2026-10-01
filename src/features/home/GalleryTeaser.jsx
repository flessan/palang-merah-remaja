import { Button } from "../../components/ui/Button.jsx";
import { SectionHead, Sticker } from "../../components/ui/Bits.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { tilt, unique } from "../../lib/utils.js";

export function GalleryTeaser({ albums, onNavigate, onOpenAlbum }) {
  const photos = unique(albums.flatMap((album) => album.images?.slice(0, 1) || [])).slice(0, 5);
  if (!photos.length) return null;

  return (
    <section className="container" aria-labelledby="gallery-teaser-title">
      <SectionHead
        id="gallery-teaser-title"
        kicker="Buku tempel kegiatan"
        title="Momen yang kami jaga"
        description="Foto asli dari latihan, aksi sosial, dan kebersamaan anggota."
        action={
          <Button tone="blue" icon="images" onClick={() => onNavigate("galeri")}>
            Buka galeri
          </Button>
        }
      />

      <div className="scrapbook">
        {photos.map((photo, index) => {
          const album = albums.find((item) => item.images?.includes(photo));
          return (
            <button
              key={photo}
              type="button"
              className="album-card"
              style={{ "--tilt": `${tilt(photo, 2)}deg` }}
              onClick={() => (album && onOpenAlbum ? onOpenAlbum(album) : onNavigate("galeri"))}
            >
              <div className="album-card__media">
                <SmartImage src={photo} alt={album?.title || `Dokumentasi kegiatan PMR Wira ${index + 1}`} />
                <Sticker tone={index % 2 === 0 ? "yellow" : "mint"} className="album-card__count" flat>
                  {album?.images?.length || 1} foto
                </Sticker>
              </div>
              <div className="album-card__meta">
                <small>{album?.category || "Kegiatan"} · {album?.date || "Arsip"}</small>
                <strong>{album?.title || "Dokumentasi PMR Wira"}</strong>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-5)" }}>
        <Button tone="ghost" icon="arrow-right" onClick={() => onNavigate("galeri")}>
          Lihat semua album kegiatan
        </Button>
      </div>
    </section>
  );
}

export default GalleryTeaser;
