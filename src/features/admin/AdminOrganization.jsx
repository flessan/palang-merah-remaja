import { useEffect, useState } from "react";
import { EditorSection, RowListEditor, StringListEditor } from "./RepeatableList.jsx";
import { Field } from "../../components/ui/Bits.jsx";
import { useUnsavedChanges } from "../../lib/hooks.js";

const LEADER_FIELDS = [
  { name: "name", label: "Nama", placeholder: "Nama lengkap" },
  { name: "role", label: "Jabatan", placeholder: "Ketua / Sekretaris 1" },
  { name: "photo", label: "Foto pengurus", type: "photo", span: 2 },
  { name: "description", label: "Keterangan", type: "textarea", span: 2 },
];

const DIVISION_FIELDS = [
  { name: "name", label: "Nama divisi" },
  { name: "icon", label: "Ikon", placeholder: "heart-pulse" },
  { name: "tone", label: "Warna", placeholder: "red / blue / mint / yellow / pink" },
  { name: "photo", label: "Foto divisi", type: "photo", span: 2 },
  { name: "description", label: "Keterangan", type: "textarea", span: 2 },
  { name: "members", label: "Anggota divisi", type: "members", span: 2, hint: "Cari dari direktori anggota — foto akan muncul di halaman profil." },
];

export function AdminOrganization({ org, members = [], onSave, busy }) {
  const [draft, setDraft] = useState(org);

  useEffect(() => setDraft(org), [org]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(org);
  useUnsavedChanges(dirty);

  return (
    <EditorSection
      title="Organisasi & divisi"
      description="Periode kepengurusan, visi & misi, pengurus inti, dan anggota divisi."
      dirty={dirty}
      busy={busy}
      onReset={() => setDraft(org)}
      onSave={() => onSave("organization", draft)}
    >
      <div className="form-grid">
        <Field label="Periode" htmlFor="org-period">
          <input id="org-period" className="input" value={draft.period || ""} onChange={(event) => setDraft({ ...draft, period: event.target.value })} />
        </Field>
        <div className="span-2">
          <Field label="Visi" htmlFor="org-vision">
            <textarea id="org-vision" className="textarea" style={{ minHeight: 84 }} value={draft.vision || ""} onChange={(event) => setDraft({ ...draft, vision: event.target.value })} />
          </Field>
        </div>
      </div>

      <StringListEditor
        label="Misi"
        hint="Satu misi per baris."
        items={draft.mission}
        onChange={(mission) => setDraft({ ...draft, mission })}
      />

      <RowListEditor
        label="Penasihat & pembina"
        rows={draft.advisory}
        fields={LEADER_FIELDS}
        members={members}
        makeEmpty={() => ({ name: "", role: "", description: "", photo: "" })}
        onChange={(advisory) => setDraft({ ...draft, advisory })}
        addLabel="Tambah penasihat"
      />

      <RowListEditor
        label="Pengurus inti"
        hint="Pembina, ketua, wakil, sekretaris, dan bendahara. Unggah foto tiap pengurus langsung dari barisnya."
        rows={draft.leaders}
        fields={LEADER_FIELDS}
        members={members}
        makeEmpty={() => ({ name: "", role: "", description: "", photo: "" })}
        onChange={(leaders) => setDraft({ ...draft, leaders })}
        addLabel="Tambah pengurus"
      />

      <RowListEditor
        label="Divisi"
        hint="Anggota dipilih dari direktori (menu “Anggota”) supaya foto dan kelasnya ikut terbaca."
        rows={draft.divisions}
        fields={DIVISION_FIELDS}
        members={members}
        makeEmpty={() => ({ name: "", icon: "heart-handshake", tone: "red", description: "", photo: "", members: [] })}
        onChange={(divisions) => setDraft({ ...draft, divisions })}
        addLabel="Tambah divisi"
      />
    </EditorSection>
  );
}

export default AdminOrganization;
