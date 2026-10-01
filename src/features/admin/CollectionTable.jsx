import { useMemo, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { ConfirmDialog, Modal } from "../../components/ui/Modal.jsx";
import { EmptyState, StatusPill } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { ItemForm } from "./ItemForm.jsx";
import { COLLECTION_LABELS, emptyItem, summarize } from "./admin-fields.js";
import { formatDateLabel } from "../../lib/utils.js";

const IMAGE_KEY = { announcements: "image", gallery: "cover", organization: "photo" };

function thumbFor(collection, item) {
  if (collection === "gallery") return item.cover || item.images?.[0];
  return item[IMAGE_KEY[collection]] || "";
}

/**
 * Dense management table for a content collection: search, filter, publish
 * toggle, edit, delete-with-confirmation, all keyboard accessible.
 */
export function CollectionTable({ collection, items, onSave, onDelete, busy, filterKey, filterOptions = [], emptyHint }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === "Semua" || (filterKey ? item[filterKey] === filter : true);
      const haystack = `${item.title || ""} ${item.category || ""} ${item.status || ""} ${item.excerpt || ""}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [items, query, filter, filterKey]);

  const submit = async (draft) => {
    setSaving(true);
    setNotice(null);
    const result = await onSave(collection, draft);
    setSaving(false);
    if (result?.ok === false) {
      setNotice({ type: "error", message: result.error });
      return;
    }
    setEditing(null);
    setNotice({ type: "success", message: "Perubahan tersimpan." });
  };

  const confirmDelete = async () => {
    setSaving(true);
    const target = confirming;
    setConfirming(null);
    const result = await onDelete(collection, target.id);
    setSaving(false);
    setNotice(result?.ok === false ? { type: "error", message: result.error } : { type: "success", message: "Data dihapus." });
  };

  return (
    <section className="admin-section" aria-labelledby={`admin-${collection}-title`}>
      <div className="admin-section__head">
        <div>
          <h2 id={`admin-${collection}-title`}>{COLLECTION_LABELS[collection]}</h2>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.86rem" }}>
            {items.length} data · {items.filter((item) => item.published !== false).length} tayang
          </p>
        </div>
        <Button tone="primary" icon="plus" onClick={() => setEditing(emptyItem(collection))}>
          Tambah {COLLECTION_LABELS[collection].toLowerCase()}
        </Button>
      </div>

      <div className="admin-toolbar">
        <label className="admin-search">
          <Icon name="search" size={17} />
          <span className="sr-only">Cari data</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul atau kategori…"
            aria-label={`Cari ${COLLECTION_LABELS[collection]}`}
          />
        </label>

        {filterOptions.length ? (
          <div className="chip-row">
            {["Semua", ...filterOptions].map((option) => (
              <button
                key={option}
                type="button"
                className={`chip ${filter === option ? "is-active" : ""}`}
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {notice ? (
        <div className={`inline-note ${notice.type === "error" ? "inline-note--error" : ""}`} role="status">
          <Icon name={notice.type === "error" ? "triangle-alert" : "circle-check"} size={18} />
          <span>{notice.message}</span>
        </div>
      ) : null}

      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">{COLLECTION_LABELS[collection]}</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Detail</th>
                <th scope="col">Status</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const thumb = thumbFor(collection, item);
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {thumb ? (
                          <span className="table-thumb"><SmartImage src={thumb} alt="" /></span>
                        ) : (
                          <span className="table-thumb" style={{ display: "grid", placeItems: "center" }}>
                            <Icon name="file-text" size={18} />
                          </span>
                        )}
                        <span>
                          <strong style={{ display: "block" }}>{item.title || "(tanpa judul)"}</strong>
                          <small style={{ color: "var(--text-muted)" }}>
                            {item.date ? formatDateLabel(item.date, item.date) : item._updated_at ? formatDateLabel(item._updated_at) : "—"}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{summarize(collection, item) || "—"}</td>
                    <td><StatusPill published={item.published !== false} /></td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm"
                          onClick={() => onSave(collection, { ...item, published: item.published === false })}
                          aria-label={`${item.published === false ? "Tayangkan" : "Sembunyikan"} ${item.title || "data"}`}
                          title={item.published === false ? "Tayangkan" : "Sembunyikan"}
                        >
                          <Icon name={item.published === false ? "eye" : "circle-check"} size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm"
                          onClick={() => setEditing(item)}
                          aria-label={`Ubah ${item.title || "data"}`}
                          title="Ubah"
                        >
                          <Icon name="pencil" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm"
                          onClick={() => setConfirming(item)}
                          aria-label={`Hapus ${item.title || "data"}`}
                          title="Hapus"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="file-text"
          title="Belum ada data"
          description={emptyHint || "Tambahkan data pertama untuk mulai mengisi halaman publik."}
          action={<Button tone="secondary" icon="plus" onClick={() => setEditing(emptyItem(collection))}>Tambah data</Button>}
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        size="wide"
        title={editing?.id ? `Ubah ${COLLECTION_LABELS[collection].toLowerCase()}` : `Tambah ${COLLECTION_LABELS[collection].toLowerCase()}`}
        description="Perubahan langsung tersimpan ke Telegraph Cloud saat kamu menekan Simpan."
      >
        {editing ? (
          <ItemForm
            collection={collection}
            item={editing}
            busy={saving || busy}
            onCancel={() => setEditing(null)}
            onSubmit={submit}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Hapus data ini?"
        message={`“${confirming?.title || "Data"}” akan dihapus dari Telegraph Cloud. Tindakan ini tidak dapat dibatalkan dari panel.`}
        busy={saving}
        onCancel={() => setConfirming(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

export default CollectionTable;
