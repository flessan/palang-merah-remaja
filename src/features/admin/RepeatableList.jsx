import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Field } from "../../components/ui/Bits.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { OfficerPicker, MemberChip } from "../../components/member/MemberBits.jsx";
import { AssetPicker } from "./AssetPicker.jsx";

/**
 * Photo field for people records: polaroid preview + asset picker + URL.
 * Every member/pengurus row can carry a portrait without leaving the editor.
 */
function PhotoField({ id, label, value, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manual, setManual] = useState(false);
  return (
    <Field label={label} htmlFor={id}>
      <div className="photo-field" style={{ gridTemplateColumns: "104px minmax(0, 1fr)" }}>
        <div className="photo-field__preview">
          {value ? (
            <SmartImage src={value} alt="Pratinjau foto" />
          ) : (
            <span className="photo-field__placeholder"><Icon name="image" size={22} />Belum ada</span>
          )}
        </div>
        <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
          <div className="row-actions">
            <Button size="sm" tone="secondary" icon="image-plus" onClick={() => setPickerOpen(true)}>
              Pilih / unggah foto
            </Button>
            {value ? <Button size="sm" tone="ghost" icon="x" onClick={() => onChange("")}>Hapus</Button> : null}
            <Button size="sm" tone="ghost" icon="link" onClick={() => setManual((open) => !open)}>
              {manual ? "Tutup URL" : "Tempel URL"}
            </Button>
          </div>
          {manual ? (
            <input
              id={id}
              className="input"
              value={value || ""}
              onChange={(event) => onChange(event.target.value)}
              placeholder="https://…/p/<project>/pmr-assets/…"
            />
          ) : null}
        </div>
      </div>
      <AssetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => { if (url) onChange(url); setPickerOpen(false); }}
      />
    </Field>
  );
}

/**
 * A division's member list, filled from the member directory (search +
 * portraits) with free text kept available for people who are not in the
 * directory yet.
 */
function DirectoryMemberField({ id, label, hint, value, onChange, members = [] }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const list = value || [];

  const known = list.map((name) => members.find((member) => member.name.toLowerCase() === String(name).toLowerCase()) || { name });
  const remaining = members.filter((member) => !list.some((name) => String(name).toLowerCase() === member.name.toLowerCase()));

  const addNames = (picked) => {
    const names = picked.map((member) => member.name).filter(Boolean);
    onChange([...new Set([...list, ...names])]);
  };

  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div style={{ display: "grid", gap: 8 }}>
        <div className="officer-list" id={id}>
          {known.length ? known.map((member, index) => (
            <MemberChip
              key={`${member.name}-${index}`}
              member={member}
              onRemove={() => onChange(list.filter((_, position) => position !== index))}
            />
          )) : (
            <span className="officer-row__meta">Belum ada anggota di divisi ini.</span>
          )}
        </div>
        <div className="row-actions">
          <Button size="sm" tone="secondary" icon="user-search" onClick={() => setPickerOpen(true)}>
            Pilih dari direktori
          </Button>
        </div>
        <input
          className="input"
          placeholder="Atau tambahkan nama manual, pisahkan dengan koma"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const names = event.target.value.split(",").map((name) => name.trim()).filter(Boolean);
            if (names.length) {
              onChange([...new Set([...list, ...names])]);
              event.target.value = "";
            }
          }}
        />
      </div>
      <OfficerPicker
        open={pickerOpen}
        members={remaining}
        selected={[]}
        title={`Tambah anggota ${label}`}
        description="Cari dari direktori anggota. Nama yang sudah ada di divisi ini tidak ditampilkan lagi."
        onClose={() => setPickerOpen(false)}
        onConfirm={addNames}
      />
    </Field>
  );
}

/** Editor for a plain list of strings (missions, rules, requirements). */
export function StringListEditor({ label, hint, items, onChange, placeholder = "Tulis di sini…", max = 20 }) {
  const list = items?.length ? items : [""];
  const update = (index, value) => onChange(list.map((item, position) => (position === index ? value : item)));

  return (
    <Field label={label} hint={hint}>
      <div style={{ display: "grid", gap: 8 }}>
        {list.map((item, index) => (
          <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="tag" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <input
              className="input"
              value={item}
              placeholder={placeholder}
              aria-label={`${label} ${index + 1}`}
              onChange={(event) => update(index, event.target.value)}
            />
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => onChange(list.filter((_, position) => position !== index))}
              aria-label={`Hapus item ${index + 1}`}
              disabled={list.length <= 1}
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
        <div>
          <Button size="sm" tone="mint" icon="plus" onClick={() => onChange([...list, ""])} disabled={list.length >= max}>
            Tambah baris
          </Button>
        </div>
      </div>
    </Field>
  );
}

/** Editor for a list of small objects with fixed, declarative fields. */
export function RowListEditor({ label, hint, rows, fields, onChange, addLabel = "Tambah baris", makeEmpty, max = 40, members = [] }) {
  const list = rows || [];
  const update = (index, name, value) =>
    onChange(list.map((row, position) => (position === index ? { ...row, [name]: value } : row)));

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div>
          <strong>{label}</strong>
          {hint ? <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{hint}</p> : null}
        </div>
        <Button size="sm" tone="mint" icon="plus" onClick={() => onChange([...list, makeEmpty()])} disabled={list.length >= max}>
          {addLabel}
        </Button>
      </div>

      {list.map((row, index) => (
        <div
          key={index}
          className="card card-tight"
          style={{ display: "grid", gap: "var(--space-3)", background: "var(--surface-alt)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="tag">#{index + 1}</span>
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => onChange(list.filter((_, position) => position !== index))}
              aria-label={`Hapus baris ${index + 1}`}
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
          <div className="form-grid">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.span === 2 ? "span-2" : undefined}
              >
                {field.type === "textarea" ? (
                  <textarea
                    id={`row-${index}-${field.name}`}
                    className="textarea"
                    style={{ minHeight: 74 }}
                    value={row[field.name] || ""}
                    onChange={(event) => update(index, field.name, event.target.value)}
                  />
                ) : field.type === "photo" ? (
                  <PhotoField
                    id={`row-${index}-${field.name}`}
                    label={field.label}
                    value={row[field.name] || ""}
                    onChange={(value) => update(index, field.name, value)}
                  />
                ) : field.type === "members" ? (
                  <DirectoryMemberField
                    id={`row-${index}-${field.name}`}
                    label={field.label}
                    hint={field.hint}
                    value={row[field.name] || []}
                    members={members}
                    onChange={(value) => update(index, field.name, value)}
                  />
                ) : field.type === "list" ? (
                  <textarea
                    id={`row-${index}-${field.name}`}
                    className="textarea"
                    style={{ minHeight: 84 }}
                    value={(row[field.name] || []).join("\n")}
                    placeholder="Satu nama per baris"
                    onChange={(event) => update(index, field.name, event.target.value.split("\n"))}
                  />
                ) : (
                  <input
                    id={`row-${index}-${field.name}`}
                    className="input"
                    value={row[field.name] || ""}
                    placeholder={field.placeholder}
                    onChange={(event) => update(index, field.name, event.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {!list.length ? (
        <div className="inline-note">
          <Icon name="info" size={18} />
          <span>Belum ada baris. Gunakan tombol di atas untuk menambahkan.</span>
        </div>
      ) : null}
    </div>
  );
}

/** Section wrapper with an explicit dirty/save footer. */
export function EditorSection({ title, description, children, dirty, busy, onSave, onReset, saveLabel = "Simpan perubahan" }) {
  return (
    <section className="admin-section" aria-labelledby={`editor-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <div className="admin-section__head">
        <div>
          <h2 id={`editor-${title.replace(/\s+/g, "-").toLowerCase()}`}>{title}</h2>
          {description ? <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.86rem" }}>{description}</p> : null}
        </div>
        <div className="row-actions">
          {dirty ? <span className="status-pill status-pill--draft">Belum disimpan</span> : <span className="status-pill status-pill--live">Tersimpan</span>}
        </div>
      </div>

      {children}

      <div className="modal-foot" style={{ margin: "0 calc(-1 * var(--space-5)) calc(-1 * var(--space-5))" }}>
        <Button tone="ghost" onClick={onReset} disabled={!dirty || busy}>Batalkan perubahan</Button>
        <Button tone="primary" icon="save" onClick={onSave} loading={busy} disabled={!dirty}>
          {saveLabel}
        </Button>
      </div>
    </section>
  );
}

export default StringListEditor;
