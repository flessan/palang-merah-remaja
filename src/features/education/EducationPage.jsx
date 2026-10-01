import { useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Disclaimer, IconChip, SectionHead, Sticker } from "../../components/ui/Bits.jsx";
import { GuideModal } from "./GuideModal.jsx";
import { Arrows } from "./Arrows.jsx";

const PRINCIPLES = [
  { icon: "shield-check", title: "Pastikan aman", text: "Amankan diri, korban, dan lingkungan sekitar sebelum bertindak." },
  { icon: "user-round", title: "Periksa respons", text: "Cek kesadaran dan pernapasan dengan tenang dan hati-hati." },
  { icon: "phone", title: "Panggil bantuan", text: "Hubungi 119 atau minta orang lain menghubungi bantuan medis." },
];

export function EducationPage({ content, onOpenGuide }) {
  const [localGuide, setLocalGuide] = useState(null);
  const guides = content.guides;
  const emergencyNumber = content.settings?.emergency?.number || "119";

  // When the app shell owns the dialog we use it directly, so only one modal
  // instance is ever mounted; the local state keeps the page usable standalone.
  const openGuide = (guide) => {
    if (onOpenGuide) onOpenGuide(guide);
    else setLocalGuide(guide);
  };

  return (
    <div className="page container">
      <SectionHead
        as="h1"
        kicker="EduScope P3K"
        title="Bekal untuk tetap siaga"
        description="Panduan singkat pertolongan pertama untuk anggota PMR dan siapa pun yang ingin siap menolong."
        action={
          <div className="emergency-call">
            <span><Icon name="circle-alert" size={15} /> Darurat</span>
            <strong>{emergencyNumber}</strong>
            <span>Hubungi bantuan medis</span>
          </div>
        }
      />

      <Disclaimer icon="triangle-alert">
        Semua materi di halaman ini bersifat edukatif dan tidak menggantikan penanganan tenaga medis profesional.
        Prioritaskan keselamatan diri sendiri sebelum menolong orang lain.
      </Disclaimer>

      <div className="guide-grid">
        {guides.map((guide) => (
          <button
            key={guide.id}
            type="button"
            className={`guide-card guide-card--${guide.tone}`}
            onClick={() => openGuide(guide)}
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

      <section className="card" aria-labelledby="principle-title">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
          <Sticker tone="blue" icon="lightbulb" flat>Tenang itu keterampilan</Sticker>
          <h2 id="principle-title" style={{ margin: 0 }}>Tiga hal yang selalu pertama</h2>
        </div>
        <div className="form-grid">
          {PRINCIPLES.map((item, index) => (
            <div className="uks-fact" key={item.title}>
              <IconChip icon={item.icon} tone={["red", "yellow", "blue"][index]} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "var(--space-5)" }}>
          <Arrows />
        </div>
      </section>

      <section className="cta-band" aria-labelledby="edu-cta-title">
        <div>
          <h2 id="edu-cta-title">Ingin ikut pelatihan langsung?</h2>
          <p>Latihan PMR Wira terbuka untuk anggota setiap Kamis, 15.00–17.00 WITA.</p>
        </div>
        <Button tone="secondary" icon="message-circle" href={content.contact?.bergabung?.link_wa || "https://wa.me/6283191735329"} target="_blank" rel="noreferrer">
          Tanya sekretariat
        </Button>
      </section>

      {onOpenGuide ? null : (
        <GuideModal guide={localGuide} onClose={() => setLocalGuide(null)} emergencyNumber={emergencyNumber} />
      )}
    </div>
  );
}

export default EducationPage;
