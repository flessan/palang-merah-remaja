import { Icon } from "../../components/ui/Icon.jsx";
import { Button } from "../../components/ui/Button.jsx";

export function EmergencyBand({ emergency, onNavigate }) {
  const number = emergency?.number || "119";

  return (
    <section className="container" aria-labelledby="emergency-title">
      <div className="emergency">
        <div>
          <span className="eyebrow" style={{ color: "var(--ink)" }}>
            <Icon name="circle-alert" size={14} /> Layanan darurat
          </span>
          <h2 id="emergency-title">{emergency?.headline || "Butuh bantuan medis segera?"}</h2>
          <p>{emergency?.note || "Hubungi ambulans atau petugas UKS sekolah. Utamakan keselamatan diri dan korban."}</p>
          <div className="emergency-actions">
            <Button tone="ink" icon="phone" href={`tel:${number}`}>
              Hubungi {number}
            </Button>
            {emergency?.wa_link ? (
              <Button tone="ghost" icon="message-circle" href={emergency.wa_link} target="_blank" rel="noreferrer">
                WhatsApp sekretariat
              </Button>
            ) : null}
            <Button tone="ghost" icon="heart-pulse" onClick={() => onNavigate("uks")}>
              Petunjuk Ruang UKS
            </Button>
          </div>
        </div>
        <div className="emergency-number" aria-hidden="true">{number}</div>
      </div>
    </section>
  );
}

export default EmergencyBand;
