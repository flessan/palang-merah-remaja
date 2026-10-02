import { useMemo, useState } from "react";
import { SmartImage } from "../media/SmartImage.jsx";
import { Icon } from "../ui/Icon.jsx";
import { Button } from "../ui/Button.jsx";
import { Modal } from "../ui/Modal.jsx";
import { Field } from "../ui/Bits.jsx";
import { PickerSelect } from "../ui/PickerSelect.jsx";
import { cn } from "../../lib/utils.js";

/** Up to two initials, tolerant of missing names. */
export function initialsOf(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return `${first}${last}`.toUpperCase();
}

/**
 * Small round portrait used in duty lists and chips.
 * Falls back to a monogram — never a broken image, never a fake photo.
 */
export function MemberAvatar({ member, size = 28, className = "" }) {
  const photo = member?.photo;
  return (
    <span className={cn("member-chip__avatar", className)} style={{ width: size, height: size }}>
      {photo ? (
        <SmartImage src={photo} alt={member?.name ? `Foto ${member.name}` : "Foto anggota"} />
      ) : (
        <span aria-hidden="true">{initialsOf(member?.name) || <Icon name="user-round" size={size * 0.5} />}</span>
      )}
    </span>
  );
}

/** Chip that represents one picked member inside an editor. */
export function MemberChip({ member, onRemove, removeLabel }) {
  return (
    <span className="member-chip">
      <MemberAvatar member={member} size={28} />
      <span>
        {member.name}
        {member.class_name ? <span className="member-chip__small"> · {member.class_name}</span> : null}
      </span>
      {onRemove ? (
        <button type="button" className="member-chip__remove" onClick={onRemove} aria-label={removeLabel || `Hapus ${member.name}`}>
          <Icon name="x" size={13} />
        </button>
      ) : null}
    </span>
  );
}

/**
 * Search-and-pick dialog over the member directory.
 *
 * This is the "intuitive" part of duty scheduling: type two letters, tap a
 * portrait, and the officer lands on the shift. Free text is still allowed for
 * people who are not in the directory yet (guests, teachers, other classes).
 */
export function OfficerPicker({
  open,
  onClose,
  members = [],
  selected = [],
  onConfirm,
  title = "Pilih petugas jaga",
  description = "Cari berdasarkan nama, kelas, atau divisi. Nama di luar direktori tetap bisa ditambahkan.",
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(selected);
  const [division, setDivision] = useState("");

  const key = (member) => String(member.id || member.name || "").toLowerCase();

  const divisions = useMemo(() => {
    const values = new Set();
    members.forEach((member) => member.division && values.add(member.division));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [members]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members
      .filter((member) => (division ? member.division === division : true))
      .filter((member) => {
        if (!needle) return true;
        return `${member.name} ${member.class_name} ${member.division} ${member.role}`.toLowerCase().includes(needle);
      })
      .slice(0, 60);
  }, [members, query, division]);

  const isPicked = (member) => picked.some((entry) => key(entry) === key(member));

  const toggle = (member) => {
    setPicked((current) => (
      isPicked(member)
        ? current.filter((entry) => key(entry) !== key(member))
        : [...current, { id: member.id, name: member.name, class_name: member.class_name, photo: member.photo }]
    ));
  };

  const addFreeText = () => {
    const typed = query.trim();
    if (!typed) return;
    setPicked((current) => [...current, { id: "", name: typed, class_name: "", photo: "" }]);
    setQuery("");
  };

  const confirm = () => {
    onConfirm?.(picked);
    setQuery("");
    setPicked([]);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={() => { setQuery(""); setPicked([]); onClose?.(); }}
      size="wide"
      title={title}
      description={description}
      footer={
        <>
          <Button tone="ghost" onClick={() => { setQuery(""); setPicked([]); onClose?.(); }}>Batal</Button>
          <Button tone="primary" icon="check" onClick={confirm}>
            Tambahkan {picked.length ? `${picked.length} petugas` : "petugas"}
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {members.length ? (
          <div className="filter-bar">
            <label className="admin-search" style={{ maxWidth: 420 }}>
              <Icon name="search" size={17} />
              <span className="sr-only">Cari anggota</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ketik nama, kelas, atau divisi…"
                aria-label="Cari anggota"
                data-officer-search
                autoFocus
              />
            </label>
            <div style={{ minWidth: 220, flex: "0 1 240px" }}>
              <PickerSelect
                label="Filter divisi"
                name="filter-division"
                icon="tags"
                value={division}
                onChange={setDivision}
                options={divisions.map((item) => ({ value: item, label: item }))}
                placeholder="Semua divisi"
              />
            </div>
          </div>
        ) : (
          <div className="inline-note">
            <Icon name="info" size={18} />
            <span>Direktori anggota masih kosong. Tulis nama langsung di bawah, atau tambahkan anggota lebih dulu di menu “Anggota”.</span>
          </div>
        )}

        {members.length ? (
          <div className="officer-picker-list" role="group" aria-label="Daftar anggota">
            {filtered.length ? filtered.map((member) => {
              const active = isPicked(member);
              return (
                <button
                  key={key(member)}
                  type="button"
                  className={cn("officer-row", active && "is-picked")}
                  onClick={() => toggle(member)}
                  aria-pressed={active}
                  data-officer-row={member.id || member.name}
                >
                  <span className="officer-row__photo" style={member.photo ? undefined : { background: "var(--mint)" }}>
                    {member.photo ? <SmartImage src={member.photo} alt={`Foto ${member.name}`} /> : initialsOf(member.name)}
                  </span>
                  <Icon name={active ? "check" : "plus"} size={16} />
                  <span>
                    <span className="officer-row__name">{member.name}</span>
                    <span className="officer-row__meta">
                      {[member.role, member.class_name, member.division].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="tag" style={{ fontSize: "0.64rem" }}>{member.active === false ? "Nonaktif" : "Aktif"}</span>
                </button>
              );
            }) : (
              <div className="inline-note">
                <Icon name="search" size={18} />
                <span>Tidak ada anggota yang cocok. Tambahkan sebagai nama bebas di bawah.</span>
              </div>
            )}
          </div>
        ) : null}

        <div className="filter-bar" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 260px" }}>
            <Field label="Nama bebas (di luar direktori)" htmlFor="officer-free-text" hint="Contoh: Petugas piket kelas, guru pendamping.">
              <input
                id="officer-free-text"
                className="input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addFreeText(); } }}
                placeholder="Tulis nama lalu tekan Enter"
              />
            </Field>
          </div>
          <Button tone="secondary" icon="user-plus" onClick={addFreeText} disabled={!query.trim()} data-officer-add>
            Tambahkan nama
          </Button>
        </div>

        {picked.length ? (
          <div className="officer-list" aria-live="polite">
            {picked.map((member, index) => (
              <MemberChip
                key={`${key(member)}-${index}`}
                member={member}
                onRemove={() => setPicked((current) => current.filter((_, position) => position !== index))}
              />
            ))}
          </div>
        ) : (
          <div className="inline-note">
            <Icon name="clipboard-list" size={18} />
            <span>Belum ada petugas dipilih untuk shift ini.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default OfficerPicker;
