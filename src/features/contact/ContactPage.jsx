import { Icon } from "../../components/ui/Icon.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { IconChip, SectionHead, Sticker } from "../../components/ui/Bits.jsx";

function ContactLine({ icon, label, value, href }) {
  const content = (
    <>
      <IconChip icon={icon} tone="blue" size="sm" />
      <span>
        <strong style={{ display: "block", fontFamily: "var(--font-display)" }}>{label}</strong>
        <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{value}</span>
      </span>
    </>
  );

  return href ? (
    <a className="contact-line" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {content}
    </a>
  ) : (
    <div className="contact-line">{content}</div>
  );
}

export function ContactPage({ content, onNavigate }) {
  const sekretariat = content.contact?.sekretariat || {};
  const bergabung = content.contact?.bergabung || {};
  const socials = content.settings?.social_links || [];

  return (
    <div className="page container">
      <SectionHead
        as="h1"
        kicker="Kontak sekretariat"
        title="Mari bicara langsung"
        description="Kami tidak memakai formulir daring. Hubungi sekretariat PMR Wira melalui kanal di bawah ini — biasanya lebih cepat lewat WhatsApp."
        action={<Sticker tone="mint" icon="message-circle" flat>Balasan oleh pengurus</Sticker>}
      />

      <div className="contact-grid">
        <div className="card">
          <h2 style={{ fontSize: "var(--step-2)" }}>Kanal resmi</h2>
          <div className="contact-list">
            {sekretariat.wa_link ? (
              <ContactLine icon="message-circle" label="WhatsApp sekretariat" value={sekretariat.telepon || "Chat pengurus PMR"} href={sekretariat.wa_link} />
            ) : null}
            {sekretariat.email ? (
              <ContactLine icon="mail" label="Email" value={sekretariat.email} href={`mailto:${sekretariat.email}`} />
            ) : null}
            {sekretariat.instagram ? (
              <ContactLine
                icon="instagram"
                label={`Instagram @${sekretariat.instagram}`}
                value="Dokumentasi & kabar harian"
                href={`https://www.instagram.com/${sekretariat.instagram}`}
              />
            ) : null}
            {sekretariat.alamat ? <ContactLine icon="map-pin" label="Sekretariat" value={sekretariat.alamat} /> : null}
          </div>

          <div className="hero-actions" style={{ marginTop: "var(--space-5)" }}>
            {sekretariat.wa_link ? (
              <Button tone="primary" icon="message-circle" href={sekretariat.wa_link} target="_blank" rel="noreferrer">
                Chat WhatsApp
              </Button>
            ) : null}
            <Button tone="ghost" icon="heart-pulse" onClick={() => onNavigate("uks")}>
              Info Ruang UKS
            </Button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "var(--space-5)" }}>
          <div className="card">
            <h2 style={{ fontSize: "var(--step-1)" }}><Icon name="clock" size={18} /> Jam layanan</h2>
            <table className="schedule-table">
              <caption className="sr-only">Jam layanan sekretariat PMR Wira</caption>
              <thead>
                <tr>
                  <th scope="col">Hari</th>
                  <th scope="col">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {(sekretariat.jadwal || []).map((slot) => (
                  <tr key={slot.hari}>
                    <th scope="row" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>{slot.hari}</th>
                    <td>{slot.waktu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="join-panel">
            <div>
              <Sticker tone="yellow" icon="user-plus" flat>Keanggotaan</Sticker>
              <h2 style={{ fontSize: "var(--step-1)", marginTop: 10 }}>Cara bergabung</h2>
              <p style={{ color: "var(--text-muted)" }}>{bergabung.deskripsi}</p>
            </div>
            <ul>
              {(bergabung.persyaratan || []).map((item) => (
                <li key={item}>
                  <Icon name="check" size={17} />
                  {item}
                </li>
              ))}
            </ul>
            {bergabung.catatan ? <p style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>{bergabung.catatan}</p> : null}
            {bergabung.link_wa ? (
              <Button tone="secondary" icon="message-circle" href={bergabung.link_wa} target="_blank" rel="noreferrer">
                Tanya lewat WhatsApp
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {socials.length ? (
        <section className="card" aria-labelledby="social-title">
          <h2 id="social-title" style={{ fontSize: "var(--step-1)" }}>Kanal lain</h2>
          <div className="chip-row">
            {socials.map((link) => (
              <a className="chip" key={link.url} href={link.url} target="_blank" rel="noreferrer">
                <Icon name={link.icon} size={15} />
                {link.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="emergency" aria-labelledby="contact-emergency-title">
        <div>
          <h2 id="contact-emergency-title">{content.settings.emergency.headline}</h2>
          <p>{content.settings.emergency.note}</p>
          <div className="emergency-actions">
            <Button tone="ink" icon="phone" href={`tel:${content.settings.emergency.number}`}>
              Hubungi {content.settings.emergency.number}
            </Button>
          </div>
        </div>
        <div className="emergency-number" aria-hidden="true">{content.settings.emergency.number}</div>
      </section>
    </div>
  );
}

export default ContactPage;
