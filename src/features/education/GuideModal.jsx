import { Modal } from "../../components/ui/Modal.jsx";
import { Disclaimer, IconChip, Tag } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Button } from "../../components/ui/Button.jsx";

/** Focused learning view for one P3K topic: numbered steps, calm and factual. */
export function GuideModal({ guide, onClose, emergencyNumber = "119" }) {
  if (!guide) return null;

  return (
    <Modal
      open={Boolean(guide)}
      onClose={onClose}
      size="wide"
      title={guide.title}
      description={guide.summary}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Button tone="primary" icon="phone" href={`tel:${emergencyNumber}`}>
            Darurat: {emergencyNumber}
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: "var(--space-5)" }}>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          <IconChip icon={guide.icon} tone={guide.tone} size="lg" />
          <Tag tone={guide.tone}>{guide.tag}</Tag>
          <span className="eyebrow"><Icon name="clipboard-list" size={14} /> {guide.steps.length} langkah</span>
        </div>

        <ol className="step-list">
          {guide.steps.map((step, index) => (
            <li className="step-item" key={`${guide.id}-${index}`}>
              <span className="step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>
                <span className="sr-only">Langkah {index + 1}: </span>
                {step}
              </p>
            </li>
          ))}
        </ol>

        <Disclaimer icon="triangle-alert">
          <strong>Penting.</strong> Materi ini bersifat edukatif dan tidak menggantikan penanganan tenaga medis.
          Pastikan lokasi aman, minta bantuan, dan hubungi {emergencyNumber} untuk kondisi serius.
        </Disclaimer>
      </div>
    </Modal>
  );
}

export default GuideModal;
