import { Button } from "../../components/ui/Button.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { SectionHead, Sticker } from "../../components/ui/Bits.jsx";
import { CrossMark, Star } from "../../components/doodles/Doodles.jsx";
import { FOUNDER_NOTES, HISTORY_TIMELINE, PMR_LEVELS } from "./history-data.js";

export function HistoryPage({ content, onNavigate }) {
  const { org, settings } = content;

  return (
    <div className="page container">
      <SectionHead
        as="h1"
        kicker="Sejarah & pendiri"
        title="Lahir dari kepedulian."
        description="Perjalanan PMR Wira SMKN 4 Banjarmasin — dari gagasan sederhana menjadi gerakan kemanusiaan yang hidup di sekolah."
        action={<Sticker tone="red" icon="landmark" flat>Sejak 1950 (PMR Indonesia)</Sticker>}
      />

      <section className="history-hero" aria-labelledby="history-hero-title">
        <div>
          <span className="tag tag-yellow"><Icon name="flag" size={13} /> PMR Wira · SMKN 4 Banjarmasin</span>
          <h2 id="history-hero-title" style={{ marginTop: 12 }}>
            Rumah bagi siswa yang belajar menolong
          </h2>
          <p className="lead">
            Palang Merah Remaja tingkat Wira adalah wadah pembinaan remaja PMI untuk siswa SMA/SMK sederajat.
            Di SMKN 4 Banjarmasin, PMR Wira tumbuh menjadi tempat belajar pertolongan pertama, hidup sehat,
            kesiapsiagaan, dan kepemimpinan yang berpihak pada kemanusiaan.
          </p>
          <div className="hero-actions">
            <Button tone="secondary" icon="arrow-right" onClick={() => onNavigate("profil", "member")}>
              Lihat struktur saat ini
            </Button>
            <Button tone="ghost" icon="message-circle" onClick={() => onNavigate("kontak")}>
              Hubungi sekretariat
            </Button>
          </div>
        </div>
        <div className="history-mark">
          <img src={settings.branding.logo} alt="Logo PMR Wira SMKN 4 Banjarmasin" width="220" height="220" />
        </div>
      </section>

      <section aria-labelledby="levels-title">
        <SectionHead
          id="levels-title"
          kicker="Tingkatan PMR"
          title="Mula, Madya, dan Wira"
          description="PMR membina remaja dalam tiga tingkatan sesuai jenjang pendidikan."
        />
        <div className="level-grid">
          {PMR_LEVELS.map((level) => (
            <article className={`level-card ${level.active ? "level-card--active" : ""}`} key={level.badge}>
              <span className="tag">{level.badge}</span>
              <h3 style={{ margin: 0 }}>{level.title}</h3>
              <p style={{ margin: 0 }}>{level.text}</p>
              {level.active ? (
                <span className="guide-card__cta"><CrossMark size={15} /> Tingkatan kami</span>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="timeline-title">
        <SectionHead
          id="timeline-title"
          kicker="Lini masa"
          title="Perjalanan kami"
          description="Tonggak penting yang membentuk PMR Wira hingga hari ini."
        />
        <ol className="timeline">
          {HISTORY_TIMELINE.map((item, index) => (
            <li key={item.year + index}>
              <span className="timeline-year">{item.year}</span>
              <span className="timeline-dot"><Icon name={item.icon} size={20} /></span>
              <div className="timeline-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="founder-title">
        <SectionHead
          id="founder-title"
          kicker="Orang-orang di baliknya"
          title="Pendiri & penerus perjuangan"
          description="PMR Wira berdiri karena keberanian mereka memulai — dan hidup karena kesetiaan para penerusnya."
        />
        <div className="guide-grid">
          {FOUNDER_NOTES.map((note) => (
            <article className="card card-lift" key={note.role}>
              <span className="icon-chip icon-chip--yellow"><Icon name={note.icon} size={22} /></span>
              <h3 style={{ fontSize: "var(--step-1)" }}>{note.role}</h3>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>{note.text}</p>
            </article>
          ))}
          <article className="card card-lift">
            <span className="icon-chip icon-chip--mint"><Icon name="users" size={22} /></span>
            <h3 style={{ fontSize: "var(--step-1)" }}>Periode aktif {org.period}</h3>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              Dipimpin {org.leaders?.find((leader) => /ketua$/i.test(leader.role || ""))?.name || "pengurus inti periode ini"} bersama
              {` ${org.divisions?.length || 4} divisi`} dan seluruh anggota aktif.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="history-cta-title">
        <div>
          <Star size={28} style={{ color: "var(--yellow)" }} />
          <h2 id="history-cta-title">“Siamo tutti fratelli — kita semua bersaudara.”</h2>
          <p>Semboyan gerakan Palang Merah yang kami jaga di setiap kegiatan.</p>
        </div>
        <Button tone="secondary" icon="images" onClick={() => onNavigate("galeri")}>
          Lihat dokumentasi
        </Button>
      </section>
    </div>
  );
}

export default HistoryPage;
