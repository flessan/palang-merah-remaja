import { Icon } from "../../components/ui/Icon.jsx";
import { IconChip } from "../../components/ui/Bits.jsx";

const CARDS = [
  {
    id: "p3k",
    tone: "red",
    icon: "briefcase-medical",
    title: "Pertolongan pertama",
    text: "Latihan P3K rutin: pembidaian, pembalutan, evakuasi, dan penanganan luka.",
    tab: "edukasi",
  },
  {
    id: "sosial",
    tone: "yellow",
    icon: "hand-heart",
    title: "Aksi sosial",
    text: "Bakti sosial, donor darah, dan kegiatan kemanusiaan di lingkungan sekitar.",
    tab: "galeri",
  },
  {
    id: "latihan",
    tone: "blue",
    icon: "activity",
    title: "Latihan",
    text: "Latihan rutin setiap Kamis serta latihan gabungan lintas organisasi.",
    tab: "profil",
  },
  {
    id: "uks",
    tone: "mint",
    icon: "heart-pulse",
    title: "UKS",
    text: "Menjaga Ruang UKS tetap siap: obat, alat, dan petugas jaga setiap hari sekolah.",
    tab: "uks",
  },
];

export function IdentityGrid({ onNavigate }) {
  return (
    <section className="container" aria-labelledby="identity-title">
      <h2 id="identity-title" className="sr-only">Kegiatan utama PMR Wira</h2>
      <div className="identity-grid">
        {CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`identity-card identity-card--${card.tone}`}
            onClick={() => onNavigate(card.tab)}
          >
            <IconChip icon={card.icon} tone={card.tone} size="lg" />
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <span className="guide-card__cta">
              Selengkapnya <Icon name="arrow-right" size={15} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default IdentityGrid;
