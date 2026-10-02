import { useMemo, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Field } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { PickerSelect } from "../../components/ui/PickerSelect.jsx";
import { MemberAvatar } from "../../components/member/MemberBits.jsx";
import { OfficerPicker } from "../../components/member/MemberBits.jsx";
import { MONTHS, WEEKDAYS, buildMonthShifts, resolveOfficer } from "../../lib/members.js";
import { cn } from "../../lib/utils.js";

const YEAR = new Date().getFullYear();

/**
 * Duty-schedule editor.
 *
 * Each shift is an index card you can fill in three ways:
 *   1. pick the weekday from a dropdown (dates auto-fill),
 *   2. build a whole month with the generator (weekday dropdowns + chips),
 *   3. add officers by searching the member directory — portraits included.
 */
export function DutyScheduleEditor({
  label,
  hint,
  shifts = [],
  members = [],
  onChange,
  addLabel = "Tambah shift",
  emptyText = "Belum ada shift. Tambahkan satu, atau susun sebulan sekaligus.",
}) {
  const [pickerFor, setPickerFor] = useState(-1);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generator, setGenerator] = useState({
    month: MONTHS[new Date().getMonth()],
    year: String(YEAR),
    days: ["Senin"],
    count: "4",
    replace: false,
  });

  const list = shifts || [];
  const activeDirectory = useMemo(() => members.filter((member) => member.active !== false), [members]);

  const update = (index, patch) => {
    onChange(list.map((shift, position) => (position === index ? { ...shift, ...patch } : shift)));
  };

  const dateFor = (year, month, day) => {
    const monthIndex = MONTHS.indexOf(month);
    const target = new Date(Date.UTC(Number(year), monthIndex, 1));
    const wanted = (WEEKDAYS.indexOf(day) + 1) % 7; // JS: Sunday = 0
    while (target.getUTCDay() !== wanted) target.setUTCDate(target.getUTCDate() + 1);
    return `${day}, ${target.getUTCDate()} ${month} ${year}`;
  };

  const addShift = () => onChange([...list, { date: "", day: "", officers: [] }]);
  const removeShift = (index) => onChange(list.filter((_, position) => position !== index));
  const moveShift = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const setOfficers = (index, officers) => update(index, { officers });

  const generate = () => {
    const generated = buildMonthShifts({
      month: generator.month,
      year: generator.year,
      days: generator.days,
      count: Number(generator.count) || 4,
    });
    if (!generated.length) return;
    onChange(generator.replace ? generated : [...list, ...generated]);
    setGeneratorOpen(false);
  };

  const toggleDay = (day) => setGenerator((current) => ({
    ...current,
    days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day],
  }));

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-1)" }}>{label}</strong>
          {hint ? <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>{hint}</p> : null}
        </div>
        <div className="row-actions">
          <Button size="sm" tone="secondary" icon="calendar" onClick={() => setGeneratorOpen((open) => !open)} data-generate-month>
            Susun sebulan
          </Button>
          <Button size="sm" tone="mint" icon="plus" onClick={addShift} disabled={list.length >= 60} data-add-shift>
            {addLabel}
          </Button>
        </div>
      </div>

      {generatorOpen ? (
        <div className="shift-tools">
          <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 600 }}>
            <Icon name="sparkles" size={14} /> Pilih bulan dan hari jaga — tanggal serta nama hari dibuat otomatis.
          </p>
          <div className="shift-tools__row">
            <Field label="Bulan" htmlFor="gen-month">
              <PickerSelect
                id="gen-month"
                label="Bulan"
                name="gen-month"
                icon="calendar"
                value={generator.month}
                onChange={(value) => setGenerator((current) => ({ ...current, month: value }))}
                options={MONTHS.map((month) => ({ value: month, label: month }))}
              />
            </Field>
            <Field label="Tahun" htmlFor="gen-year">
              <PickerSelect
                id="gen-year"
                label="Tahun"
                name="gen-year"
                icon="calendar"
                value={generator.year}
                onChange={(value) => setGenerator((current) => ({ ...current, year: value }))}
                options={[YEAR - 1, YEAR, YEAR + 1].map((year) => ({ value: String(year), label: String(year) }))}
              />
            </Field>
            <Field label="Jumlah tiap minggu" htmlFor="gen-count">
              <PickerSelect
                id="gen-count"
                label="Jumlah tiap minggu"
                name="gen-count"
                icon="clipboard-list"
                value={generator.count}
                onChange={(value) => setGenerator((current) => ({ ...current, count: value }))}
                options={["1", "2", "3", "4", "5"].map((count) => ({ value: count, label: `${count}× per bulan` }))}
              />
            </Field>
          </div>

          <div>
            <span className="field-label">Hari jaga</span>
            <div className="weekday-row">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={cn("chip", generator.days.includes(day) && "is-active")}
                  aria-pressed={generator.days.includes(day)}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={generator.replace}
              onChange={(event) => setGenerator((current) => ({ ...current, replace: event.target.checked }))}
            />
            <span>Ganti seluruh daftar shift yang ada</span>
          </label>

          <div className="row-actions">
            <Button tone="ghost" onClick={() => setGeneratorOpen(false)}>Tutup</Button>
            <Button tone="primary" icon="check" onClick={generate} disabled={!generator.days.length} data-run-generate>
              Buat jadwal
            </Button>
          </div>
        </div>
      ) : null}

      {list.length ? (
        <div className="roster-grid">
          {list.map((shift, index) => (
            <div className="shift-card" key={`${shift.date}-${index}`}>
              <div className="shift-card__head">
                <div>
                  <span className="shift-card__day">{shift.day || "Hari belum dipilih"}</span>
                  <p className="shift-card__date" style={{ margin: 0 }}>{shift.date || "Tanggal belum diisi"}</p>
                </div>
                <div className="row-actions">
                  <button type="button" className="icon-btn icon-btn--sm" onClick={() => moveShift(index, -1)} aria-label={`Naikkan shift ${index + 1}`} disabled={index === 0}>
                    <Icon name="arrow-up" size={14} />
                  </button>
                  <button type="button" className="icon-btn icon-btn--sm" onClick={() => removeShift(index)} aria-label={`Hapus shift ${index + 1}`}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>

              <div className="shift-tools__row" style={{ gridTemplateColumns: "1fr" }}>
                <Field label="Hari" htmlFor={`shift-day-${index}`}>
                  <PickerSelect
                    id={`shift-day-${index}`}
                    label={`Hari shift ${index + 1}`}
                    name={`shift-day-${index}`}
                    icon="calendar"
                    value={shift.day || ""}
                    onChange={(day) => update(index, { day, date: day ? dateFor(generator.year, generator.month, day) : shift.date })}
                    options={WEEKDAYS.map((day) => ({ value: day, label: day }))}
                    placeholder="Pilih hari"
                    allowCustom
                    customLabel="Pakai hari"
                  />
                </Field>
                <Field label="Tanggal" htmlFor={`shift-date-${index}`}>
                  <input
                    id={`shift-date-${index}`}
                    className="input"
                    value={shift.date || ""}
                    onChange={(event) => update(index, { date: event.target.value })}
                    placeholder="Senin, 13 Juli 2026"
                    maxLength={120}
                  />
                </Field>
              </div>

              <div className="officer-list">
                {(shift.officers || []).map((officer, position) => {
                  const person = resolveOfficer(officer, members);
                  return (
                    <span className="officer-chip" key={`${person.name}-${position}`}>
                      <span className="officer-chip__avatar">
                        <MemberAvatar member={person} size={26} />
                      </span>
                      <span>
                        {person.name}
                        {person.class_name ? <span className="member-chip__small"> · {person.class_name}</span> : null}
                      </span>
                      <button
                        type="button"
                        className="member-chip__remove"
                        aria-label={`Hapus ${person.name} dari shift ${index + 1}`}
                        onClick={() => setOfficers(index, (shift.officers || []).filter((_, item) => item !== position))}
                      >
                        <Icon name="x" size={13} />
                      </button>
                    </span>
                  );
                })}
                {!(shift.officers || []).length ? (
                  <span className="officer-row__meta">Belum ada petugas pada shift ini.</span>
                ) : null}
              </div>

              <Button
                size="sm"
                tone="secondary"
                icon="user-search"
                onClick={() => setPickerFor(index)}
                data-pick-officers={index}
              >
                {(shift.officers || []).length ? "Ubah petugas" : "Cari & pilih petugas"}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="inline-note">
          <Icon name="info" size={18} />
          <span>{emptyText}</span>
        </div>
      )}

      <OfficerPicker
        open={pickerFor >= 0}
        members={activeDirectory}
        selected={pickerFor >= 0 ? list[pickerFor]?.officers || [] : []}
        title={`Petugas ${list[pickerFor]?.day || ""} ${list[pickerFor]?.date || ""}`.trim()}
        onClose={() => setPickerFor(-1)}
        onConfirm={(officers) => { if (pickerFor >= 0) setOfficers(pickerFor, officers); }}
      />
    </div>
  );
}

export default DutyScheduleEditor;
