import { useEffect, useState } from "react";
import { EditorSection } from "./RepeatableList.jsx";
import { Field } from "../../components/ui/Bits.jsx";
import { DutyScheduleEditor } from "./DutyScheduleEditor.jsx";
import { useUnsavedChanges } from "../../lib/hooks.js";

/**
 * Roster editor: two duty boards (UKS + field) built from the member
 * directory, plus the period labels that appear on the public page.
 */
export function AdminRoster({ roster, members = [], onSave, busy }) {
  const [draft, setDraft] = useState(roster);

  useEffect(() => setDraft(roster), [roster]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(roster);
  useUnsavedChanges(dirty);

  return (
    <EditorSection
      title="Jadwal jaga"
      description="Susun penjagaan Ruang UKS dan piket lapangan. Petugas dipilih dari direktori anggota, foto ikut tampil."
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

      <DutyScheduleEditor
        label="Jadwal penjagaan UKS"
        hint="Senin–Jumat saat jam sekolah. Klik “Cari & pilih petugas” untuk memilih dari direktori."
        shifts={draft.uks_schedule}
        members={members}
        onChange={(uks_schedule) => setDraft({ ...draft, uks_schedule })}
        addLabel="Tambah shift UKS"
      />

      <DutyScheduleEditor
        label="Piket lapangan upacara"
        hint="Biasanya satu kali per minggu, seluruh petugas bertugas bersama."
        shifts={draft.field_schedule}
        members={members}
        onChange={(field_schedule) => setDraft({ ...draft, field_schedule })}
        addLabel="Tambah piket lapangan"
        emptyText="Belum ada jadwal piket lapangan. Gunakan “Susun sebulan” untuk membuatnya otomatis."
      />
    </EditorSection>
  );
}

export default AdminRoster;
