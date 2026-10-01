import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Field } from "../../components/ui/Bits.jsx";

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
export function RowListEditor({ label, hint, rows, fields, onChange, addLabel = "Tambah baris", makeEmpty, max = 40 }) {
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
              <Field
                key={field.name}
                label={field.label}
                htmlFor={`row-${index}-${field.name}`}
                {...(field.span === 2 ? { className: "span-2" } : {})}
              >
                {field.type === "textarea" ? (
                  <textarea
                    id={`row-${index}-${field.name}`}
                    className="textarea"
                    style={{ minHeight: 74 }}
                    value={row[field.name] || ""}
                    onChange={(event) => update(index, field.name, event.target.value)}
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
              </Field>
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
