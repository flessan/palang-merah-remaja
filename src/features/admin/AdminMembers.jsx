import { useMemo, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { ConfirmDialog } from "../../components/ui/Modal.jsx";
import { Chip, ChipRow, EmptyState } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { PickerSelect } from "../../components/ui/PickerSelect.jsx";
import { MemberCard } from "../../components/member/MemberCard.jsx";
import { MemberForm } from "./MemberForm.jsx";
import { classOptions, divisionOptions, roleOptions } from "../../lib/members.js";

/**
 * Member directory ("Anggota").
 *
 * A wall of portrait clippings with search + filters instead of a table: the
 * job here is "add members and give them photos", and a table makes that slow.
 */
export function AdminMembers({ members = [], org = null, onSave, onDelete, busy = false, onNotify }) {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("");
  const [className, setClassName] = useState("");
  const [role, setRole] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const classes = useMemo(() => classOptions(members, null), [members]);
  const divisions = useMemo(() => divisionOptions(members, org), [members, org]);
  const roles = useMemo(() => roleOptions(members, org), [members, org]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members
      .filter((member) => (division ? member.division === division : true))
      .filter((member) => (className ? member.class_name === className : true))
      .filter((member) => (role ? member.role === role : true))
      .filter((member) => (needle ? `${member.name} ${member.class_name} ${member.division} ${member.note}`.toLowerCase().includes(needle) : true))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "id"));
  }, [members, query, division, className, role]);

  const withPhoto = members.filter((member) => member.photo).length;
  const filtersActive = Boolean(division || className || role || query.trim());

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (member) => { setEditing(member); setFormOpen(true); };

  const submit = async (values) => {
    const result = await onSave?.("members", { ...(editing || {}), ...values });
    if (result?.ok !== false) {
      setFormOpen(false);
      setEditing(null);
      onNotify?.(editing?.id ? "Data anggota diperbarui." : `${values.name} ditambahkan ke direktori.`, "success");
    } else {
      onNotify?.(result?.error || "Gagal menyimpan anggota.", "error");
    }
  };

  const remove = async () => {
    const target = confirming;
    setConfirming(null);
    const result = await onDelete?.("members", target.id);
    onNotify?.(result?.ok === false ? result.error : `${target.name} dihapus dari direktori.`, result?.ok === false ? "error" : "success");
  };

  return (
    <section className="admin-section" aria-labelledby="admin-members-title">
      <div className="admin-section__head">
        <div>
          <h2 id="admin-members-title">Anggota</h2>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.86rem" }}>
            Direktori {members.length} orang · {withPhoto} sudah punya foto. Dipakai untuk struktur divisi dan jadwal jaga.
          </p>
        </div>
        <div className="row-actions">
          <Button tone="primary" icon="user-plus" onClick={openNew} data-add-member>Tambah anggota</Button>
        </div>
      </div>

      <div className="filter-bar">
        <label className="admin-search">
          <Icon name="search" size={17} />
          <span className="sr-only">Cari anggota</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, kelas, divisi…"
            aria-label="Cari anggota"
            data-member-search
          />
        </label>

        <div style={{ minWidth: 190, flex: "0 1 220px" }}>
          <PickerSelect label="Divisi" name="filter-division" icon="tags" value={division} onChange={setDivision} options={divisions} placeholder="Semua divisi" />
        </div>
        <div style={{ minWidth: 150, flex: "0 1 180px" }}>
          <PickerSelect label="Kelas" name="filter-class" icon="graduation-cap" value={className} onChange={setClassName} options={classes} placeholder="Semua kelas" />
        </div>
        <div style={{ minWidth: 170, flex: "0 1 200px" }}>
          <PickerSelect label="Jabatan" name="filter-role" icon="crown" value={role} onChange={setRole} options={roles} placeholder="Semua jabatan" />
        </div>

        {filtersActive ? (
          <Button size="sm" tone="ghost" icon="x" onClick={() => { setQuery(""); setDivision(""); setClassName(""); setRole(""); }}>
            Bersihkan filter
          </Button>
        ) : null}

        <span className="filter-bar__count" aria-live="polite">
          {filtered.length} dari {members.length} anggota
        </span>
      </div>

      {members.length && filtered.length ? (
        <div className="admin-member-grid">
          {filtered.map((member) => (
            <MemberCard
              key={member.id || member.name}
              member={member}
              className="admin-member-card"
              tone={member.role === "Ketua" ? "yellow" : member.division === "Unit Kesehatan Siswa" ? "red" : "mint"}
              actions={
                <>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => openEdit(member)}
                    aria-label={`Edit ${member.name}`}
                    title="Edit anggota"
                  >
                    <Icon name="pencil" size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => setConfirming(member)}
                    aria-label={`Hapus ${member.name}`}
                    title="Hapus anggota"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="users"
          title={members.length ? "Tidak ada anggota yang cocok" : "Direktori masih kosong"}
          description={members.length
            ? "Ubah kata kunci atau bersihkan filter untuk melihat seluruh anggota."
            : "Mulai dengan menambahkan pengurus inti, lalu lengkapi anggota tiap divisi beserta fotonya."}
          action={<Button tone="primary" icon="user-plus" onClick={openNew}>Tambah anggota pertama</Button>}
        />
      )}

      {!members.length ? (
        <ChipRow label="Saran urutan pengisian">
          {["Pembina PMR", "Ketua", "Wakil Ketua", "Sekretaris", "Bendahara", "Anggota divisi"].map((label) => (
            <Chip key={label} onClick={openNew}>{label}</Chip>
          ))}
        </ChipRow>
      ) : null}

      <MemberForm
        open={formOpen}
        item={editing}
        members={members}
        org={org}
        busy={busy}
        onCancel={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Hapus anggota ini?"
        message={`“${confirming?.name || "Anggota"}” akan dihapus dari direktori. Namanya di jadwal lama tetap tertulis, hanya tautan fotonya yang hilang.`}
        onCancel={() => setConfirming(null)}
        onConfirm={remove}
      />
    </section>
  );
}

export default AdminMembers;
