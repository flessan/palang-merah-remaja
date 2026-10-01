import { Icon } from "../../components/ui/Icon.jsx";
import { SectionHead } from "../../components/ui/Bits.jsx";

export function EducationTeaser({ guides, onOpenGuide, onNavigate }) {
  return (
    <section className="container" aria-labelledby="edu-title">
      <SectionHead
        id="edu-title"
        kicker="EduScope P3K"
        title="Belajar pertolongan pertama"
        description="Panduan singkat dan jelas. Klik kartu untuk membuka langkah-langkahnya."
        action={
          <button type="button" className="chip" onClick={() => onNavigate("edukasi")}>
            <Icon name="book-open" size={15} /> Semua panduan
          </button>
        }
      />

      <div className="guide-grid">
        {guides.slice(0, 4).map((guide) => (
          <button
            key={guide.id}
            type="button"
            className={`guide-card guide-card--${guide.tone}`}
            onClick={() => onOpenGuide(guide)}
          >
            <span className="guide-card__icon">
              <Icon name={guide.icon} size={26} />
            </span>
            <span className="tag">{guide.tag}</span>
            <h3>{guide.title}</h3>
            <p>{guide.summary}</p>
            <span className="guide-card__cta">
              Buka panduan <Icon name="arrow-right" size={15} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default EducationTeaser;
