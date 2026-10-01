import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { Chip, ChipRow, EmptyState, SectionHead, Sticker } from "../../components/ui/Bits.jsx";
import { AlbumLightbox } from "../../components/media/AlbumLightbox.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { galleryCategories } from "../../lib/content.js";
import { tilt } from "../../lib/utils.js";

export function GalleryPage({ albums }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [openAlbum, setOpenAlbum] = useState(null);

  const categories = useMemo(() => galleryCategories(albums), [albums]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return albums.filter((album) => {
      const matchesFilter = filter === "Semua" || album.category === filter;
      const haystack = `${album.title} ${album.description} ${album.category} ${album.date}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [albums, filter, query]);

  const photoCount = useMemo(() => albums.reduce((total, album) => total + (album.images?.length || 0), 0), [albums]);

  return (
    <div className="page container">
      <SectionHead
        as="h1"
        kicker="Buku tempel kegiatan"
        title="Galeri PMR Wira"
        description={`${albums.length} album · ${photoCount} foto dokumentasi asli dari latihan, aksi sosial, dan kebersamaan anggota.`}
        action={<Sticker tone="mint" icon="images" flat>Scrapbook resmi</Sticker>}
      />

      <div className="gallery-toolbar">
        <label className="search-field">
          <Icon name="search" size={18} />
          <span className="sr-only">Cari album kegiatan</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari album kegiatan…"
            aria-label="Cari album kegiatan"
          />
          {query ? (
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => setQuery("")} aria-label="Hapus pencarian">
              <Icon name="x" size={16} />
            </button>
          ) : null}
        </label>

        <ChipRow label="Filter kategori galeri" scroll>
          {categories.map((category) => (
            <Chip key={category} active={filter === category} onClick={() => setFilter(category)}>
              {category}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {filtered.length ? (
        <div className="scrapbook">
          {filtered.map((album, index) => (
            <button
              key={album.id || album.title}
              type="button"
              className="album-card gallery-card"
              style={{ "--tilt": `${tilt(album.id || album.title, 2.2)}deg` }}
              onClick={() => setOpenAlbum(album)}
            >
              <div className="album-card__media">
                <SmartImage src={album.cover} alt={album.title} />
                <Sticker tone={index % 3 === 0 ? "yellow" : index % 3 === 1 ? "mint" : "pink"} className="album-card__count" flat>
                  {album.images.length} foto
                </Sticker>
              </div>
              <div className="album-card__meta">
                <small>{album.category} · {album.date || "Arsip"}</small>
                <strong>{album.title}</strong>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: "0.82rem" }}>
                  Lihat album <Icon name="arrow-right" size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="Album tidak ditemukan"
          description="Coba kata kunci lain atau pilih kategori “Semua”."
          action={
            <button type="button" className="btn btn-secondary" onClick={() => { setQuery(""); setFilter("Semua"); }}>
              Reset pencarian
            </button>
          }
        />
      )}

      <AlbumLightbox album={openAlbum} onClose={() => setOpenAlbum(null)} />
    </div>
  );
}

export default GalleryPage;
