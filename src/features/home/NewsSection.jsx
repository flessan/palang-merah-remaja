import { Icon } from "../../components/ui/Icon.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { SectionHead, Tag } from "../../components/ui/Bits.jsx";
import { SmartImage } from "../../components/media/SmartImage.jsx";

function NewsCard({ item, featured = false }) {
  return (
    <article className={`news-card ${featured ? "news-card--featured" : ""}`}>
      <div className="news-card__media">
        <SmartImage src={item.image} alt={item.title} />
        <Tag tone="yellow" className="news-card__tag">{item.category}</Tag>
      </div>
      <div className="news-card__body">
        <span className="news-card__date">
          <Icon name="clock" size={12} /> {item.date}
        </span>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
      </div>
    </article>
  );
}

export function NewsSection({ announcements, onNavigate }) {
  if (!announcements.length) return null;
  const [first, ...rest] = announcements.slice(0, 4);

  return (
    <section className="container" aria-labelledby="news-title">
      <SectionHead
        id="news-title"
        kicker="Kabar terbaru"
        title="Yang sedang kami kerjakan"
        description="Catatan kegiatan, prestasi, dan informasi terbaru dari sekretariat PMR Wira."
        action={
          <Button tone="ghost" icon="arrow-right" onClick={() => onNavigate("galeri")}>
            Lihat dokumentasi
          </Button>
        }
      />
      <div className="news-grid">
        <NewsCard item={first} featured={rest.length > 0} />
        {rest.map((item) => (
          <NewsCard key={item.id || item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

export default NewsSection;
