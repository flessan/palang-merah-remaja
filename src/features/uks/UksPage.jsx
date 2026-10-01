import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Chip, ChipRow, IconChip, SectionHead, Sticker } from "../../components/ui/Bits.jsx";
import { RosterPanel } from "./RosterPanel.jsx";

export function UksPage({ content, onNavigate }) {
  const uks = content.uks;
  const [category, setCategory] = useState("Semua");

  const categories = useMemo(
    () => ["Semua", ...[...new Set((uks.inventory || []).map((item) => item.category).filter(Boolean))]],
    [uks.inventory],
  );

  const items = useMemo(
    () => (uks.inventory || []).filter((item) => category === "Semua" || item.category === category),
    [uks.inventory, category],
  );

  return (
    <div className="page container">
      <SectionHead
        as="h1"
        kicker="Stasiun kesehatan sekolah"
        title={uks.welcome_banner.title}
        description={uks.welcome_banner.subtitle}
        action={<Sticker tone="mint" icon="heart-pulse" flat>Gratis untuk siswa</Sticker>}
      />

      <div className="uks-hero">
        <div className="uks-banner">
          {uks.welcome_banner.highlight ? (
            <p className="uks-highlight">
              <Icon name="circle-check" size={18} />
              {uks.welcome_banner.highlight}
            </p>
          ) : null}
          <div className="hero-actions">
            <Button tone="ink" icon="message-circle" onClick={() => onNavigate("kontak")}>
              Hubungi petugas UKS
            </Button>
            <Button tone="ghost" icon="shield-plus" onClick={() => onNavigate("edukasi")}>
              Panduan P3K
            </Button>
          </div>
        </div>

        <div className="uks-facts">
          <div className="uks-fact">
            <IconChip icon="clock" tone="blue" />
            <div>
              <strong>Jam layanan</strong>
              <span>{uks.service_hours}</span>
            </div>
          </div>
          <div className="uks-fact">
            <IconChip icon="map-pin" tone="yellow" />
            <div>
              <strong>Lokasi</strong>
              <span>{uks.location}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="section-anchor" id="inventaris" aria-labelledby="inventory-title">
        <SectionHead
          id="inventory-title"
          kicker="Inventaris"
          title="Obat & peralatan yang tersedia"
          description={`${uks.inventory.length} item tercatat. Daftar ini diperbarui langsung dari Panel Admin.`}
        />
        <ChipRow label="Filter kategori inventaris" scroll>
          {categories.map((item) => (
            <Chip key={item} active={category === item} onClick={() => setCategory(item)}>
              {item}
            </Chip>
          ))}
        </ChipRow>

        <div className="inventory-grid" style={{ marginTop: "var(--space-4)" }}>
          {items.map((item) => (
            <article className="inventory-item" key={item.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                <span className="tag">{item.category}</span>
                <span className="inventory-item__status">
                  <Icon name="circle-check" size={14} />
                  {item.status}
                </span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.purpose}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="procedure-title">
        <SectionHead
          id="procedure-title"
          kicker="Prosedur"
          title="Cara berkunjung ke Ruang UKS"
          description="Empat langkah sederhana agar pelayanan cepat dan tertib."
        />
        <ol className="procedure-list">
          {uks.procedure.map((step, index) => (
            <li key={step.step}>
              <span className="step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{step.step}</strong>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-grid" aria-labelledby="rules-title">
        <div className="card">
          <h2 id="rules-title" style={{ fontSize: "var(--step-2)" }}>Tata tertib Ruang UKS</h2>
          <ul className="rule-list">
            {uks.rules.map((rule) => (
              <li key={rule}>
                <Icon name="check" size={18} />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel panel-yellow">
          <Sticker tone="red" icon="circle-alert" flat>Darurat</Sticker>
          <h2 style={{ marginTop: 12 }}>{content.settings.emergency.headline}</h2>
          <p>{content.settings.emergency.note}</p>
          <Button tone="ink" icon="phone" href={`tel:${content.settings.emergency.number}`}>
            Hubungi {content.settings.emergency.number}
          </Button>
        </div>
      </section>

      <RosterPanel roster={content.roster} />
    </div>
  );
}

export default UksPage;
