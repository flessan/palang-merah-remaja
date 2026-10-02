import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/ui/Modal.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Field } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { PickerSelect } from "../../components/ui/PickerSelect.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { AssetPicker } from "./AssetPicker.jsx";
import { classOptions, divisionOptions, roleOptions } from "../../lib/members.js";

const EMPTY = {
  name: "",
  role: "Anggota",
  class_name: "",
  division: "",
  photo: "",
  phone: "",
  note: "",
  active: true,
};

/**
 * Add/edit one person in the member directory — with a portrait.
 *
 * Photo first: the preview is a real polaroid frame, and the asset picker is
 * the same one the gallery uses, so uploading a portrait is two taps.
 */
export function MemberForm({ open, item, members = [], org = null, onCancel, onSubmit, busy = false }) {
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft({ ...EMPTY, ...(item || {}) });
    setError("");
  }, [open, item]);

  const classes = useMemo(() => classOptions(members, null), [members]);
  const divisions = useMemo(() => divisionOptions(members, org), [members, org]);
  const roles = useMemo(() => roleOptions(members, org), [members, org]);

  const set = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Nama anggota wajib diisi.");
      return;
    }
    setError("");
    onSubmit?.({
      ...draft,
      name: draft.name.trim(),
      role: draft.role || "Anggota",
    });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onCancel}
        size="wide"
        title={item?.id ? `Edit ${item.name}` : "Tambah anggota"}
        description="Data ini mengisi direktori anggota, jadwal jaga, dan struktur divisi."
        footer={
          <>
            <Button tone="ghost" onClick={onCancel} disabled={busy}>Batal</Button>
            <Button tone="primary" icon="save" onClick={submit} loading={busy} type="submit" form="member-form">
              {busy ? "Menyimpan…" : "Simpan anggota"}
            </Button>
          </>
        }
      >
        <form id="member-form" onSubmit={submit} style={{ display: "grid", gap: "var(--space-5)" }}>
          <div className="photo-field">
            <div className="photo-field__preview">
              {draft.photo ? (
                <SmartImage src={draft.photo} alt={`Pratinjau foto ${draft.name || "anggota"}`} />
              ) : (
                <span className="photo-field__placeholder">
                  <Icon name="image" size={26} />
                  Belum ada foto
                </span>
              )}
            </div>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <Field label="Foto anggota" htmlFor="member-photo" hint="Potret 4:5 atau bebas. Unggah langsung dari perangkat.">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button size="sm" tone="secondary" icon="image-plus" onClick={() => setPickerOpen(true)} data-member-photo>
                    Pilih / unggah foto
                  </Button>
                  {draft.photo ? (
                    <Button size="sm" tone="ghost" icon="x" onClick={() => set("photo", "")}>Hapus foto</Button>
                  ) : null}
                </div>
              </Field>
              <Field label="URL foto (opsional)" htmlFor="member-photo">
                <input
                  id="member-photo"
                  className="input"
                  value={draft.photo}
                  onChange={(event) => set("photo", event.target.value)}
                  placeholder="/gudang/org/… atau https://…/p/<project>/pmr-assets/…"
                />
              </Field>
            </div>
          </div>

          <div className="form-grid">
            <div className="span-2">
              <Field label="Nama lengkap" htmlFor="member-name" required error={error}>
                <input
                  id="member-name"
                  className="input"
                  value={draft.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="Nama sesuai daftar anggota"
                  aria-invalid={Boolean(error)}
                  maxLength={120}
                />
              </Field>
            </div>

            <Field label="Jabatan" htmlFor="member-role">
              <PickerSelect
                id="member-role"
                label="Jabatan"
                name="role"
                icon="crown"
                value={draft.role}
                onChange={(value) => set("role", value)}
                options={roles}
                allowCustom
                customLabel="Pakai jabatan"
                hint="Ketik untuk mencari, atau tulis jabatan baru."
              />
            </Field>

            <Field label="Kelas" htmlFor="member-class">
              <PickerSelect
                id="member-class"
                label="Kelas"
                name="class_name"
                icon="graduation-cap"
                value={draft.class_name}
                onChange={(value) => set("class_name", value)}
                options={classes}
                allowCustom
                customLabel="Pakai kelas"
                placeholder="Contoh: XI-RPL 1"
              />
            </Field>

            <Field label="Divisi" htmlFor="member-division">
              <PickerSelect
                id="member-division"
                label="Divisi"
                name="division"
                icon="tags"
                value={draft.division}
                onChange={(value) => set("division", value)}
                options={divisions}
                allowCustom
                customLabel="Pakai divisi"
                placeholder="Pilih divisi"
              />
            </Field>

            <Field label="Nomor WhatsApp (opsional)" htmlFor="member-phone" hint="Disimpan internal, tidak ditampilkan di situs publik.">
              <input
                id="member-phone"
                className="input"
                value={draft.phone}
                onChange={(event) => set("phone", event.target.value)}
                placeholder="08xx…"
                maxLength={40}
              />
            </Field>

            <div className="span-2">
              <Field label="Catatan singkat (opsional)" htmlFor="member-note" hint="Misalnya peran tambahan: dokumentasi, perlengkapan, pendamping kelas.">
                <input
                  id="member-note"
                  className="input"
                  value={draft.note}
                  onChange={(event) => set("note", event.target.value)}
                  maxLength={400}
                />
              </Field>
            </div>

            <div className="span-2">
              <label className="checkbox">
                <input type="checkbox" checked={Boolean(draft.active)} onChange={(event) => set("active", event.target.checked)} />
                <span>Aktif — ikut ditawarkan saat menyusun jadwal jaga</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <AssetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => { if (url) set("photo", url); setPickerOpen(false); }}
      />
    </>
  );
}

export default MemberForm;
