import { useEffect, useState } from "react";
import { EditorSection, RowListEditor, StringListEditor } from "./RepeatableList.jsx";
import { Field } from "../../components/ui/Bits.jsx";
import { useUnsavedChanges } from "../../lib/hooks.js";

const INVENTORY_FIELDS = [
  { name: "name", label: "Nama obat / alat" },
  { name: "category", label: "Kategori", placeholder: "Obat minum ringan" },
  { name: "purpose", label: "Kegunaan", type: "textarea", span: 2 },
  { name: "status", label: "Status", placeholder: "Tersedia & gratis" },
];

const PROCEDURE_FIELDS = [
  { name: "step", label: "Judul langkah" },
  { name: "description", label: "Penjelasan", type: "textarea", span: 2 },
];

export function AdminUks({ uks, onSave, busy }) {
  const [draft, setDraft] = useState(uks);

  useEffect(() => setDraft(uks), [uks]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(uks);
  useUnsavedChanges(dirty);

  const setBanner = (name, value) => setDraft({ ...draft, welcome_banner: { ...draft.welcome_banner, [name]: value } });

  return (
    <EditorSection
      title="Ruang UKS"
      description="Banner sambutan, jam layanan, inventaris obat, prosedur kunjungan, dan tata tertib."
      dirty={dirty}
      busy={busy}
      onReset={() => setDraft(uks)}
      onSave={() => onSave("uks", draft)}
    >
      <Field label="Judul banner" htmlFor="uks-title">
        <input id="uks-title" className="input" value={draft.welcome_banner?.title || ""} onChange={(event) => setBanner("title", event.target.value)} />
      </Field>
      <Field label="Subjudul banner" htmlFor="uks-subtitle">
        <textarea
          id="uks-subtitle"
          className="textarea"
          style={{ minHeight: 84 }}
          value={draft.welcome_banner?.subtitle || ""}
          onChange={(event) => setBanner("subtitle", event.target.value)}
        />
      </Field>
      <Field label="Sorotan (gratis / layanan)" htmlFor="uks-highlight">
        <input id="uks-highlight" className="input" value={draft.welcome_banner?.highlight || ""} onChange={(event) => setBanner("highlight", event.target.value)} />
      </Field>

      <div className="form-grid">
        <Field label="Jam layanan" htmlFor="uks-hours">
          <input id="uks-hours" className="input" value={draft.service_hours || ""} onChange={(event) => setDraft({ ...draft, service_hours: event.target.value })} />
        </Field>
        <Field label="Lokasi" htmlFor="uks-location">
          <input id="uks-location" className="input" value={draft.location || ""} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
        </Field>
      </div>

      <RowListEditor
        label="Inventaris obat & alat"
        hint="Data ini tampil di halaman UKS dan beranda."
        rows={draft.inventory}
        fields={INVENTORY_FIELDS}
        makeEmpty={() => ({ id: "", name: "", category: "", purpose: "", status: "Tersedia & gratis" })}
        onChange={(inventory) => setDraft({ ...draft, inventory })}
        addLabel="Tambah item"
        max={80}
      />

      <RowListEditor
        label="Prosedur kunjungan"
        rows={draft.procedure}
        fields={PROCEDURE_FIELDS}
        makeEmpty={() => ({ step: "", description: "" })}
        onChange={(procedure) => setDraft({ ...draft, procedure })}
        addLabel="Tambah langkah"
        max={12}
      />

      <StringListEditor
        label="Tata tertib"
        items={draft.rules}
        onChange={(rules) => setDraft({ ...draft, rules })}
        placeholder="Tulis aturan…"
      />
    </EditorSection>
  );
}

export default AdminUks;
