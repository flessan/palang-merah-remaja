import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "../../lib/hooks.js";
import { cn } from "../../lib/utils.js";
import { IconButton } from "../ui/Button.jsx";
import { Icon } from "../ui/Icon.jsx";
import { Tag } from "../ui/Bits.jsx";
import { SmartImage } from "./SmartImage.jsx";

/**
 * Full-screen album viewer.
 * Keyboard: ← / → move, Home / End jump, Escape closes. Touch friendly.
 */
export function AlbumLightbox({ album, onClose, initialIndex = 0 }) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef(null);
  const containerRef = useDialog({ open: Boolean(album), onClose });

  useEffect(() => {
    setIndex(initialIndex);
  }, [album, initialIndex]);

  const total = album?.images?.length || 0;

  const go = useCallback(
    (delta) => {
      setIndex((current) => {
        if (!total) return 0;
        return (current + delta + total) % total;
      });
    },
    [total],
  );

  useEffect(() => {
    if (!album) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
      if (event.key === "Home") { event.preventDefault(); setIndex(0); }
      if (event.key === "End") { event.preventDefault(); setIndex(Math.max(total - 1, 0)); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [album, go, total]);

  if (!album || typeof document === "undefined") return null;

  const image = album.images?.[index] || album.cover;

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
    >
      <div className="lightbox" ref={containerRef} role="dialog" aria-modal="true" aria-label={`Album: ${album.title}`} tabIndex={-1}>
        <div className="modal-head">
          <div className="modal-head-copy">
            <h2>{album.title}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Tag tone="red">{album.category || "Kegiatan"}</Tag>
              {album.date ? <Tag>{album.date}</Tag> : null}
              <span className="lightbox__counter album-counter" aria-live="polite">
                {total ? `${index + 1} / ${total}` : "0 / 0"}
              </span>
            </div>
          </div>
          <IconButton icon="x" label="Tutup album" onClick={onClose} className="close-button" data-autofocus />
        </div>

        <div
          className="lightbox__stage"
          onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
            if (Math.abs(delta) > 48) go(delta > 0 ? -1 : 1);
            touchStartX.current = null;
          }}
        >
          <IconButton icon="chevron-left" label="Foto sebelumnya" onClick={() => go(-1)} disabled={total < 2} />
          <div className="lightbox__image">
            <SmartImage
              key={image}
              src={image}
              alt={`${album.title} — foto ${index + 1} dari ${total}`}
              priority
              loading="eager"
            />
          </div>
          <IconButton icon="chevron-right" label="Foto berikutnya" onClick={() => go(1)} disabled={total < 2} />
        </div>

        {album.description ? (
          <p style={{ margin: 0, padding: "0 var(--space-5)", color: "var(--text-muted)", fontSize: "0.9rem" }}>{album.description}</p>
        ) : null}

        {total > 1 ? (
          <div className="lightbox__thumbs" role="tablist" aria-label="Pilih foto">
            {album.images.map((thumb, thumbIndex) => (
              <button
                key={`${thumb}-${thumbIndex}`}
                type="button"
                role="tab"
                aria-selected={thumbIndex === index}
                aria-label={`Foto ${thumbIndex + 1}`}
                className={cn("lightbox__thumb", thumbIndex === index && "is-active")}
                onClick={() => setIndex(thumbIndex)}
              >
                <SmartImage src={thumb} alt="" />
              </button>
            ))}
          </div>
        ) : null}

        <p className="sr-only" aria-live="polite">
          <Icon name="image" size={12} /> Foto {index + 1} dari {total}
        </p>
      </div>
    </div>,
    document.body,
  );
}

export default AlbumLightbox;
