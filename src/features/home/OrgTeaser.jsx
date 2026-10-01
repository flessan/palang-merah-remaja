import { Button } from "../../components/ui/Button.jsx";
import { SectionHead, StatBlock, Sticker } from "../../components/ui/Bits.jsx";
import { initials } from "../../lib/utils.js";
import { SmartImage } from "../../components/media/SmartImage.jsx";

export function OrgTeaser({ org, stats, onNavigate }) {
  const leaders = (org?.leaders || []).slice(0, 4);

  return (
    <section className="container" aria-labelledby="org-title">
      <SectionHead
        id="org-title"
        kicker={`Kepengurusan ${org?.period || "2026/2027"}`}
        title="Orang-orang di balik layar"
        description="Pembina, pengurus inti, dan empat divisi yang menggerakkan PMR Wira setiap hari."
        action={
          <Button tone="ghost" icon="arrow-right" onClick={() => onNavigate("profil", "member")}>
            Lihat struktur lengkap
          </Button>
        }
      />

      <div className="people-grid">
        {leaders.map((person) => (
          <article className="person-card" key={`${person.role}-${person.name}`}>
            <div className="person-card__photo">
              {person.photo ? (
                <SmartImage src={person.photo} alt={`Foto ${person.name}`} />
              ) : (
                <div className="person-card__avatar" aria-hidden="true">{initials(person.name)}</div>
              )}
            </div>
            <div className="person-card__body">
              <span className="person-card__role">{person.role}</span>
              <h3>{person.name}</h3>
              <p>{person.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", marginTop: "var(--space-5)" }}>
        {stats.map((stat) => (
          <StatBlock key={stat.label} value={stat.value} label={stat.label} icon={stat.icon} />
        ))}
        <div style={{ display: "grid", alignContent: "center", gap: 8 }}>
          <Sticker tone="blue" icon="heart-handshake" flat>4 divisi aktif</Sticker>
          <Sticker tone="yellow" icon="users" flat>Lintas angkatan</Sticker>
        </div>
      </div>
    </section>
  );
}

export default OrgTeaser;
