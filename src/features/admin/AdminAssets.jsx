import { useCallback, useEffect, useState } from "react";
import { adminDeleteAsset, adminListAssets, adminUploadAsset, ASSET_FOLDERS } from "../../lib/api.js";
import { Button } from "../../components/ui/Button.jsx";
import { ConfirmDialog, Modal } from "../../components/ui/Modal.jsx";
import { Chip, ChipRow, EmptyState, Sticker } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { formatDateLabel } from "../../lib/utils.js";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Asset manager for Telegraph Cloud Object Storage.
 *
 * Organised by folder (branding / gallery / organization / documents).
 * Only public delivery URLs are shown; private storage metadata stays server-side.
 */
export function AdminAssets({ onUseAsset, onNotify }) {
  const [folder, setFolder] = useState("gallery");
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const payload = await adminListAssets({ folder, q: query });
      setAssets(payload?.assets || []);
      setStatus("ready");
    } catch (cause) {
      setError(cause?.message || "Gagal memuat aset.");
      setStatus("error");
    }
  }, [folder, query]);

  useEffect(() => { load(); }, [load]);

  const uploadFiles = async (files) => {
    const list = [...files];
    if (!list.length) return;
    setError("");
    let index = 0;
    for (const file of list) {
      index += 1;
      if (file.size > MAX_BYTES) {
        setError(`${file.name} melebihi 8 MB dan dilewati.`);
        continue;
      }
      setProgress({ name: file.name, percent: Math.round(((index - 1) / list.length) * 100) });
      try {
        const payload = await adminUploadAsset(file, { folder });
        if (payload?.asset) setAssets((current) => [payload.asset, ...current]);
      } catch (cause) {
        setError(cause?.message || `Gagal mengunggah ${file.name}.`);
      }
    }
    setProgress(null);
    onNotify?.("Unggahan selesai.", "success");
  };

  const remove = async () => {
    const asset = confirming;
    setConfirming(null);
    try {
      await adminDeleteAsset(asset.key);
      setAssets((current) => current.filter((item) => item.key !== asset.key));
      onNotify?.("Aset dihapus.", "success");
    } catch (cause) {
      onNotify?.(cause?.message || "Gagal menghapus aset.", "error");
    }
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(""), 1800);
      onNotify?.("URL publik disalin.", "success");
    } catch {
      onNotify?.("Tidak dapat menyalin otomatis. Salin manual dari kolom URL.", "error");
    }
  };

  return (
    <>
      <section className="admin-section" aria-labelledby="admin-assets-title">
        <div className="admin-section__head">
          <div>
            <h2 id="admin-assets-title">Aset media</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.86rem" }}>
              Telegraph Cloud Object Storage · bucket PMR · folder terorganisir
            </p>
          </div>
          <Sticker tone="blue" icon="upload" flat>{assets.length} berkas</Sticker>
        </div>

        <ChipRow label="Folder aset">
          {ASSET_FOLDERS.map((item) => (
            <Chip key={item.id} active={folder === item.id} onClick={() => setFolder(item.id)}>
              {item.label}
            </Chip>
          ))}
        </ChipRow>

        <div
          className={`dropzone ${dragOver ? "is-over" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            uploadFiles(event.dataTransfer.files);
          }}
        >
          <Icon name="upload" size={30} />
          <div>
            <strong>Tarik berkas ke sini</strong>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.86rem" }}>
              JPG, PNG, WEBP, AVIF, SVG, atau PDF — maksimal 8 MB per berkas.
            </p>
          </div>
          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            <Icon name="image-plus" size={16} />
            Pilih berkas
            <input type="file" accept="image/*,application/pdf" multiple hidden onChange={(event) => uploadFiles(event.target.files)} />
          </label>
          {progress ? (
            <div style={{ width: "100%", display: "grid", gap: 6 }} role="status">
              <span style={{ fontSize: "0.82rem" }}>Mengunggah {progress.name}…</span>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progress.percent}%` }} /></div>
            </div>
          ) : null}
        </div>

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
          <Button size="sm" tone="ghost" icon="refresh" onClick={load}>Muat ulang</Button>
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
          <div className="asset-grid">
            {assets.map((asset) => (
              <article className="asset-card" key={asset.key}>
                <div className="asset-card__media">
                  {asset.type?.startsWith("image/") ? (
                    <SmartImage src={asset.url} alt={asset.name} />
                  ) : (
                    <Icon name="file-text" size={30} />
                  )}
                </div>
                <div className="asset-card__body">
                  <strong title={asset.key}>{asset.name}</strong>
                  <small>
                    {Math.max(1, Math.round((asset.size || 0) / 1024))} KB · {formatDateLabel(asset.updated_at, "—")}
                  </small>
                  <div className="row-actions">
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => setPreview(asset)} aria-label={`Pratinjau ${asset.name}`} title="Pratinjau">
                      <Icon name="eye" size={15} />
                    </button>
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => copy(asset.url)} aria-label={`Salin URL ${asset.name}`} title="Salin URL publik">
                      <Icon name={copied === asset.url ? "check" : "copy"} size={15} />
                    </button>
                    {onUseAsset ? (
                      <button type="button" className="icon-btn icon-btn--sm" onClick={() => onUseAsset(asset.url)} aria-label={`Gunakan ${asset.name}`} title="Gunakan untuk konten">
                        <Icon name="link" size={15} />
                      </button>
                    ) : null}
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => setConfirming(asset)} aria-label={`Hapus ${asset.name}`} title="Hapus">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="image"
            title="Folder ini masih kosong"
            description="Unggah foto kegiatan, logo, atau dokumen untuk dipakai di konten PMR."
          />
        )}

        <div className="inline-note">
          <Icon name="lock" size={18} />
          <span>URL publik berbentuk <code>/p/&lt;project&gt;/&lt;bucket&gt;/&lt;key&gt;</code>. Kunci storage dan metadata privat hanya dipakai di server.</span>
        </div>
      </section>

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.name || "Pratinjau"} size="wide">
        {preview ? (
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <div className="photo-frame photo-frame--wide">
              <SmartImage src={preview.url} alt={preview.name} priority />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="asset-url">URL publik</label>
              <input id="asset-url" className="input" readOnly value={preview.url} onFocus={(event) => event.target.select()} />
            </div>
            <div className="row-actions">
              <Button size="sm" tone="secondary" icon="copy" onClick={() => copy(preview.url)}>Salin URL</Button>
              <Button size="sm" tone="ghost" icon="arrow-up-right" href={preview.url} target="_blank" rel="noreferrer">Buka di tab baru</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Hapus aset ini?"
        message={`“${confirming?.name || "Aset"}” akan dihapus dari bucket PMR. Konten yang masih menautkannya akan memakai gambar cadangan.`}
        onCancel={() => setConfirming(null)}
        onConfirm={remove}
      />
    </>
  );
}

export default AdminAssets;
