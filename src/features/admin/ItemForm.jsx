import { useEffect, useMemo, useState } from "react";
import { FIELD_DEFS, ICON_OPTIONS, TONE_OPTIONS, validate } from "./admin-fields.js";
import { Field } from "../../components/ui/Bits.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { AssetPicker } from "./AssetPicker.jsx";
import { useUnsavedChanges } from "../../lib/hooks.js";
import { cn } from "../../lib/utils.js";

const MAX_IMAGES = 24;

function ImageField({ field, value, onChange, onPick }) {
  return (
    <Field label={field.label} hint="Unggah ke Telegraph Cloud atau tempel URL gambar." htmlFor={`field-${field.name}`}>
      <div style={{ display: "grid", gap: 10 }}>
        {value ? (
          <div className="table-thumb" style={{ width: 132, height: 96 }}>
            <SmartImage src={value} alt="" />
          </div>
        ) : null}
        <input
          id={`field-${field.name}`}
          className="input"
          type="url"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/gudang/gallery/… atau https://…"
        />
        <div>
          <Button size="sm" tone="secondary" icon="image-plus" onClick={onPick}>
            Pilih dari aset
          </Button>
        </div>
      </div>
    </Field>
  );
}

function StepsField({ value, onChange }) {
  const steps = value?.length ? value : [""];
  const update = (index, text) => onChange(steps.map((step, position) => (position === index ? text : step)));

  return (
    <Field label="Langkah-langkah" hint="Tulis satu langkah per baris. Nomor 01, 02, … dibuat otomatis.">
      <div style={{ display: "grid", gap: 10 }}>
        {steps.map((step, index) => (
          <div key={index} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span className="step-number" style={{ width: 48, height: 48, fontSize: "1rem", flex: "0 0 auto" }} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <textarea
              className="textarea"
              style={{ minHeight: 70 }}
              value={step}
              onChange={(event) => update(index, event.target.value)}
              aria-label={`Langkah ${index + 1}`}
            />
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => onChange(steps.filter((_, position) => position !== index))}
              aria-label={`Hapus langkah ${index + 1}`}
              disabled={steps.length <= 1}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
        <div>
          <Button size="sm" tone="mint" icon="plus" onClick={() => onChange([...steps, ""])}>
            Tambah langkah
          </Button>
        </div>
      </div>
    </Field>
  );
}

function ImagesField({ value, onChange }) {
  const images = value || [];
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Field
      label="Daftar foto album"
      hint={`${images.length}/${MAX_IMAGES} foto. Klik untuk memilih banyak foto sekaligus dari aset.`}
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {images.map((image, index) => (
            <div key={`${image}-${index}`} style={{ position: "relative" }}>
              <div className="table-thumb" style={{ width: 96, height: 74 }}>
                <SmartImage src={image} alt="" />
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                style={{ position: "absolute", top: -8, right: -8 }}
                onClick={() => onChange(images.filter((_, position) => position !== index))}
                aria-label={`Hapus foto ${index + 1}`}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button size="sm" tone="secondary" icon="image-plus" onClick={() => setPickerOpen(true)}>
            Pilih foto
          </Button>
          <label className="btn btn-sm btn-ghost" style={{ cursor: "pointer" }}>
            <Icon name="link" size={15} />
            Tambah dari URL
            <input
              type="url"
              hidden
              onChange={(event) => {
                const url = event.target.value.trim();
                if (url) onChange([...images, url].slice(0, MAX_IMAGES));
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
      <AssetPicker
        open={pickerOpen}
        multiple
        selected={images}
        onClose={() => setPickerOpen(false)}
        onSelect={(selected) => {
          onChange([...new Set([...(Array.isArray(selected) ? selected : [selected]), ...images])].slice(0, MAX_IMAGES));
          setPickerOpen(false);
        }}
      />
    </Field>
  );
}

/** Create/edit form for one announcement, event, album or guide. */
export function ItemForm({ collection, item, onSubmit, onCancel, busy = false }) {
  const fields = FIELD_DEFS[collection] || [];
  const initial = useMemo(() => item || {}, [item]);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState({});
  const [pickerField, setPickerField] = useState(null);

  useEffect(() => {
    setDraft(initial);
    setErrors({});
  }, [initial]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  useUnsavedChanges(dirty);

  const setValue = (name, value) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validate(collection, draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = document.querySelector("[aria-invalid='true']");
      first?.focus?.();
      return;
    }
    onSubmit(draft);
  };

  const inputId = (name) => `field-${collection}-${name}`;

  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: "var(--space-4)" }}>
      <div className="form-grid">
        {fields.map((field) => {
          const value = draft[field.name];
          const error = errors[field.name];

          if (field.type === "boolean") {
            return (
              <label className="checkbox" key={field.name} htmlFor={inputId(field.name)}>
                <input
                  id={inputId(field.name)}
                  type="checkbox"
                  checked={value !== false}
                  onChange={(event) => setValue(field.name, event.target.checked)}
                />
                {field.label}
              </label>
            );
          }

          if (field.type === "textarea") {
            return (
              <div className={cn(field.span === 2 && "span-2")} key={field.name}>
                <Field label={field.label} error={error} htmlFor={inputId(field.name)} required={field.required}>
                  <textarea
                    id={inputId(field.name)}
                    className="textarea"
                    value={value || ""}
                    onChange={(event) => setValue(field.name, event.target.value)}
                    aria-invalid={Boolean(error)}
                    maxLength={field.max}
                  />
                </Field>
              </div>
            );
          }

          if (field.type === "image") {
            return (
              <div className={cn(field.span === 2 && "span-2")} key={field.name}>
                <ImageField
                  field={field}
                  value={value}
                  onChange={(next) => setValue(field.name, next)}
                  onPick={() => setPickerField(field.name)}
                />
                {error ? <span className="field-error">{error}</span> : null}
              </div>
            );
          }

          if (field.type === "images") {
            return (
              <div className={cn(field.span === 2 && "span-2")} key={field.name}>
                <ImagesField value={value} onChange={(next) => setValue(field.name, next)} />
                {error ? <span className="field-error">{error}</span> : null}
              </div>
            );
          }

          if (field.type === "steps") {
            return (
              <div className={cn(field.span === 2 && "span-2")} key={field.name}>
                <StepsField value={value} onChange={(next) => setValue(field.name, next)} />
                {error ? <span className="field-error">{error}</span> : null}
              </div>
            );
          }

          if (field.type === "icon") {
            return (
              <Field key={field.name} label={field.label} error={error} htmlFor={inputId(field.name)}>
                <select id={inputId(field.name)} className="select" value={value || ""} onChange={(event) => setValue(field.name, event.target.value)}>
                  {ICON_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>
            );
          }

          if (field.type === "tone") {
            return (
              <Field key={field.name} label={field.label} error={error} htmlFor={inputId(field.name)}>
                <select id={inputId(field.name)} className="select" value={value || "red"} onChange={(event) => setValue(field.name, event.target.value)}>
                  {TONE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>
            );
          }

          return (
            <div className={cn(field.span === 2 && "span-2")} key={field.name}>
              <Field label={field.label} error={error} htmlFor={inputId(field.name)} required={field.required}>
                <input
                  id={inputId(field.name)}
                  className="input"
                  type="text"
                  value={value || ""}
                  placeholder={field.placeholder}
                  onChange={(event) => setValue(field.name, event.target.value)}
                  aria-invalid={Boolean(error)}
                  maxLength={field.max}
                />
              </Field>
            </div>
          );
        })}
      </div>

      {dirty ? (
        <div className="inline-note inline-note--warn">
          <Icon name="triangle-alert" size={18} />
          <span>Ada perubahan yang belum disimpan.</span>
        </div>
      ) : null}

      <div className="modal-foot" style={{ margin: "0 calc(-1 * var(--space-5)) calc(-1 * var(--space-5))", borderTop: "var(--border-w) solid var(--outline)" }}>
        <Button tone="ghost" onClick={onCancel} disabled={busy}>Batal</Button>
        <Button tone="primary" type="submit" icon="save" loading={busy}>
          {busy ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>

      <AssetPicker
        open={Boolean(pickerField)}
        onClose={() => setPickerField(null)}
        onSelect={(url) => {
          if (pickerField) setValue(pickerField, url);
          setPickerField(null);
        }}
      />
    </form>
  );
}

export default ItemForm;
