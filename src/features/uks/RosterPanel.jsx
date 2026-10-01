import { useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { Chip, ChipRow, IconChip } from "../../components/ui/Bits.jsx";

function shiftsToText(shifts, label) {
  const lines = shifts.map((shift) => `• ${shift.date}: ${shift.officers.join(", ")}`);
  return `Jadwal ${label} PMR Wira SMKN 4 Banjarmasin\n\n${lines.join("\n")}`;
}

/** Data-driven duty roster for the UKS room and the flag-field picket. */
export function RosterPanel({ roster }) {
  const [view, setView] = useState("uks");
  const [copied, setCopied] = useState(false);

  if (!roster || (!roster.uks_schedule?.length && !roster.field_schedule?.length)) return null;

  const shifts = view === "uks" ? roster.uks_schedule : roster.field_schedule;
  const label = view === "uks" ? "penjagaan UKS" : "piket lapangan";

  const copySchedule = async () => {
    const text = shiftsToText(shifts, label);
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="roster-panel card" aria-labelledby="roster-title">
      <div className="admin-section__head">
        <div>
          <span className="eyebrow"><Icon name="clipboard-check" size={14} /> Jadwal jaga</span>
          <h2 id="roster-title" style={{ margin: 0 }}>
            {roster.month_label || roster.period || "Jadwal penjagaan"}
          </h2>
        </div>
        <button type="button" className="chip" onClick={copySchedule}>
          <Icon name={copied ? "check" : "copy"} size={15} />
          {copied ? "Tersalin" : "Salin jadwal"}
        </button>
      </div>

      {roster.description ? <p style={{ color: "var(--text-muted)" }}>{roster.description}</p> : null}

      <ChipRow label="Pilih jenis jadwal">
        <Chip active={view === "uks"} icon="heart-pulse" onClick={() => setView("uks")}>
          Penjagaan UKS ({roster.uks_schedule?.length || 0} shift)
        </Chip>
        <Chip active={view === "field"} icon="calendar" onClick={() => setView("field")}>
          Piket lapangan ({roster.field_schedule?.length || 0} shift)
        </Chip>
      </ChipRow>

      <div className="roster-grid">
        {shifts.map((shift) => (
          <article className={`roster-shift ${view === "field" ? "roster-shift--field" : ""}`} key={`${view}-${shift.date}`}>
            <div className="roster-shift__head">
              <span>{shift.date}</span>
              {shift.day ? <span className="tag">{shift.day}</span> : null}
            </div>
            <ul>
              {shift.officers.map((officer) => (
                <li key={officer}>{officer}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="inline-note">
        <IconChip icon="info" tone="blue" size="sm" />
        <span>
          Ada perubahan jadwal? Hubungi ketua atau sekretaris agar jadwal di halaman ini diperbarui
          melalui Panel Admin.
        </span>
      </div>
    </section>
  );
}

export default RosterPanel;
