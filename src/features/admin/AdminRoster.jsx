import { useEffect, useState } from "react";
import { EditorSection, RowListEditor } from "./RepeatableList.jsx";
import { Field } from "../../components/ui/Bits.jsx";
import { useUnsavedChanges } from "../../lib/hooks.js";

const SHIFT_FIELDS = [
  { name: "date", label: "Tanggal", placeholder: "Senin, 13 Juli 2026" },
  { name: "day", label: "Hari", placeholder: "Senin" },
  { name: "officers", label: "Petugas", type: "list", span: 2 },
];

export function AdminRoster({ roster, onSave, busy }) {
  const [draft, setDraft] = useState(roster);

  useEffect(() => setDraft(roster), [roster]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(roster);
  useUnsavedChanges(dirty);

  return (
    <EditorSection
      title="Jadwal jaga"
      description="Jadwal penjagaan Ruang UKS dan piket lapangan upacara."
      dirty={dirty}
      busy={busy}
      onReset={() => setDraft(roster)}
      onSave={() => onSave("roster", draft)}
    >
      <div className="form-grid">
        <Field label="Periode" htmlFor="roster-period">
          <input id="roster-period" className="input" value={draft.period || ""} onChange={(event) => setDraft({ ...draft, period: event.target.value })} />
        </Field>
        <Field label="Label bulan" htmlFor="roster-month">
          <input id="roster-month" className="input" value={draft.month_label || ""} onChange={(event) => setDraft({ ...draft, month_label: event.target.value })} />
        </Field>
        <div className="span-2">
          <Field label="Keterangan" htmlFor="roster-description">
            <textarea
              id="roster-description"
              className="textarea"
              style={{ minHeight: 84 }}
              value={draft.description || ""}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </Field>
        </div>
      </div>

      <RowListEditor
        label="Jadwal penjagaan UKS"
        hint="Satu petugas per baris pada kolom petugas."
        rows={draft.uks_schedule}
        fields={SHIFT_FIELDS}
        makeEmpty={() => ({ date: "", day: "", officers: [] })}
        onChange={(uks_schedule) => setDraft({ ...draft, uks_schedule })}
        addLabel="Tambah shift UKS"
      />

      <RowListEditor
        label="Piket lapangan"
        rows={draft.field_schedule}
        fields={SHIFT_FIELDS}
        makeEmpty={() => ({ date: "", day: "", officers: [] })}
        onChange={(field_schedule) => setDraft({ ...draft, field_schedule })}
        addLabel="Tambah piket lapangan"
      />
    </EditorSection>
  );
}

export default AdminRoster;
