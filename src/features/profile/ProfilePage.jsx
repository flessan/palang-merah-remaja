import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { IconChip, SectionHead, Sticker } from "../../components/ui/Bits.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";
import { initials } from "../../lib/utils.js";

function PersonCard({ person, variant = "leader" }) {
  return (
    <article className={`person-card ${variant === "leader" ? "person-card--lead" : ""} ${person.role === "Pembina PMR" ? "person-card--pembina" : ""}`}>
      <div className="person-card__photo">
        {person.photo ? (
          <SmartImage src={person.photo} alt={`Foto ${person.name}`} />
        ) : (
          <div className="person-card__avatar" aria-hidden="true">
            {initials(person.name) || <Icon name="user-round" size={34} />}
          </div>
        )}
      </div>
      <div className="person-card__body">
        <span className="person-card__role">{person.role}</span>
        <h3>{person.name || "Akan diumumkan"}</h3>
        {person.description ? <p>{person.description}</p> : null}
      </div>
    </article>
  );
}

function DivisionCard({ division }) {
  return (
    <article className={`division-card division-card--${division.tone || "red"}`}>
      <div className="division-card__head">
        <span className="division-card__photo">
          {division.photo ? (
            <SmartImage src={division.photo} alt={`Divisi ${division.name}`} />
          ) : (
            <span style={{ display: "grid", placeItems: "center", height: "100%" }}>
              <Icon name={division.icon} size={28} />
            </span>
          )}
        </span>
        <div>
          <span className="tag">Divisi</span>
          <h3>{division.name}</h3>
          {division.description ? <p>{division.description}</p> : null}
        </div>
      </div>
      <div className="member-chips">
        {division.members.map((member) => (
          <span className="member-chip" key={member}>
            <Icon name="user-round" size={13} />
            {member}
          </span>
        ))}
      </div>
    </article>
  );
}

export function ProfilePage({ content, onNavigate }) {
  const { org } = content;
  const mission = org.mission?.length ? org.mission : [];
  const ketua = (org.leaders || []).find((person) => /ketua$/i.test(person.role || ""));

  return (
    <div className="page container">
      <SectionHead
        as="h1"
        kicker="Tentang PMR Wira"
        title="Satu tim, satu kepedulian"
        description={`PMR Wira SMKN 4 Banjarmasin adalah ruang belajar untuk menjadi pribadi yang berkarakter, sigap, dan bermanfaat. Periode ${org.period}.`}
        action={<Sticker tone="blue" icon="heart-handshake" flat>Siamo tutti fratelli</Sticker>}
      />

      <div className="about-grid">
        <div className="quote-panel">
          <Icon name="quote" size={38} />
          <blockquote>“Kemanusiaan tidak mengenal batas. Di sini kita belajar menjadi pahlawan kecil bagi sesama.”</blockquote>
          <span>— Nilai yang kami bawa</span>
        </div>
        <div className="card">
          <span className="eyebrow"><Icon name="eye" size={14} /> Visi kami</span>
          <h3>{org.vision || "Berkarakter, peduli, terampil, dan siap berperan."}</h3>
          <Button tone="ghost" icon="landmark" onClick={() => onNavigate("sejarah")}>
            Baca sejarah &amp; pendiri
          </Button>
        </div>
      </div>

      <section aria-labelledby="mission-title">
        <SectionHead id="mission-title" kicker="Cara kami bertumbuh" title="Misi" />
        <ul className="mission-list">
          {mission.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section-anchor" id="member" aria-labelledby="structure-title">
        <SectionHead
          id="structure-title"
          kicker={`Periode ${org.period}`}
          title="Struktur organisasi"
          description="Kenali orang-orang yang menggerakkan PMR Wira SMKN 4 Banjarmasin."
        />

        {org.advisory?.length ? (
          <>
            <h3 style={{ fontSize: "var(--step-1)" }}>Penasihat &amp; pembina</h3>
            <div className="people-grid">
              {org.advisory.map((person) => (
                <PersonCard key={`${person.role}-${person.name}`} person={person} variant="advisory" />
              ))}
            </div>
          </>
        ) : null}

        <h3 style={{ fontSize: "var(--step-1)", marginTop: "var(--space-5)" }}>Pengurus inti</h3>
        <div className="people-grid">
          {(org.leaders || []).map((person) => (
            <PersonCard key={`${person.role}-${person.name}`} person={person} />
          ))}
        </div>
      </section>

      <section aria-labelledby="division-title">
        <SectionHead
          id="division-title"
          kicker="Empat divisi"
          title="Divisi & anggota"
          description="Setiap divisi punya warna kerja masing-masing — dari layanan UKS sampai aksi sosial."
        />
        <div className="division-grid">
          {(org.divisions || []).map((division) => (
            <DivisionCard key={division.name} division={division} />
          ))}
        </div>
      </section>

      <section className="cta-band" aria-labelledby="join-title">
        <div>
          <h2 id="join-title">Ingin mengenal kami lebih jauh?</h2>
          <p>
            {ketua ? `Periode ini dipimpin oleh ${ketua.name}. ` : ""}
            Hubungi sekretariat untuk informasi keanggotaan, atau lihat dokumentasi kegiatan kami.
          </p>
        </div>
        <div className="hero-actions">
          <Button tone="secondary" icon="images" onClick={() => onNavigate("galeri")}>
            Lihat galeri
          </Button>
          <Button tone="ghost" icon="message-circle" onClick={() => onNavigate("kontak")}>
            Kontak sekretariat
          </Button>
        </div>
      </section>

      <div className="disclaimer">
        <IconChip icon="shield-check" tone="mint" size="sm" />
        <p>Data pengurus dan anggota diperbarui oleh sekretariat melalui Panel Admin — bukan data contoh.</p>
      </div>
    </div>
  );
}

export default ProfilePage;
