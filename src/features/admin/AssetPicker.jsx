import { useEffect, useState } from "react";
import { adminListAssets, adminUploadAsset, ASSET_FOLDERS } from "../../lib/api.js";
import { Modal } from "../../components/ui/Modal.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Chip, ChipRow, EmptyState, Field } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { cn } from "../../lib/utils.js";

/**
 * Asset picker backed by Telegraph Cloud object storage.
 *
 * Only public delivery URLs are shown — internal Telegram file identifiers and
 * private storage metadata never reach the browser.
 */
export function AssetPicker({ open, onClose, onSelect, multiple = false, selected = [] }) {
  const [folder, setFolder] = useState("gallery");
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(selected);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setStatus("loading");
    setError("");
    adminListAssets({ folder, q: query })
      .then((payload) => {
        if (cancelled) return;
        setAssets(payload?.assets || []);
        setStatus("ready");
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(cause?.message || "Gagal memuat aset.");
        setStatus("error");
      });
    return () => { cancelled = true; };
  }, [open, folder, query]);

  useEffect(() => {
    if (open) setPicked(selected);
  }, [open, selected]);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const payload = await adminUploadAsset(file, { folder });
      const asset = payload?.asset;
      if (asset) {
        setAssets((current) => [asset, ...current]);
        setPicked(multiple ? [...picked, asset.url] : [asset.url]);
      }
    } catch (cause) {
      setError(cause?.message || "Unggahan gagal.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const toggle = (url) => {
    setPicked((current) => {
      if (!multiple) return [url];
      return current.includes(url) ? current.filter((item) => item !== url) : [...current, url];
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title="Pilih aset"
      description="Semua gambar tersimpan di Telegraph Cloud Object Storage."
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>Batal</Button>
          <Button tone="primary" icon="check" onClick={() => onSelect(multiple ? picked : picked[0] || "")} disabled={!picked.length}>
            Gunakan {picked.length > 1 ? `${picked.length} aset` : "aset"}
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        <ChipRow label="Folder aset">
          {ASSET_FOLDERS.map((item) => (
            <Chip key={item.id} active={folder === item.id} onClick={() => setFolder(item.id)}>
              {item.label}
            </Chip>
          ))}
        </ChipRow>

        <div className="admin-toolbar">
          <label className="admin-search">
            <Icon name="search" size={17} />
            <span className="sr-only">Cari aset</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama berkas…"
              aria-label="Cari aset"
            />
          </label>
          <label className="btn btn-sm btn-secondary" style={{ cursor: "pointer" }}>
            <Icon name="upload" size={16} />
            {busy ? "Mengunggah…" : "Unggah berkas"}
            <input type="file" accept="image/*,application/pdf" onChange={upload} hidden disabled={busy} />
          </label>
        </div>

        {error ? (
          <div className="inline-note inline-note--error" role="alert">
            <Icon name="triangle-alert" size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="inline-note"><Icon name="loader" size={18} /><span>Memuat aset…</span></div>
        ) : assets.length ? (
          <div className="asset-picker-grid">
            {assets.map((asset) => (
              <button
                key={asset.key}
                type="button"
                className={cn("asset-picker-item", picked.includes(asset.url) && "is-selected")}
                onClick={() => toggle(asset.url)}
                aria-pressed={picked.includes(asset.url)}
                title={asset.key}
              >
                <SmartImage src={asset.url} alt={asset.name} />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="image"
            title="Belum ada aset di folder ini"
            description="Unggah foto kegiatan atau logo untuk mulai mengisi folder."
          />
        )}

        <Field label="Atau tempel URL gambar" htmlFor="asset-manual" hint="URL publik Telegraph Cloud atau path lokal /gudang/…">
          <input
            id="asset-manual"
            className="input"
            type="url"
            value={picked[0] || ""}
            onChange={(event) => setPicked(event.target.value ? [event.target.value] : [])}
            placeholder="https://…/p/<projectId>/pmr-assets/gallery/foto.jpg"
          />
        </Field>
      </div>
    </Modal>
  );
}

export default AssetPicker;
