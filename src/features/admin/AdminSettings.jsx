import { useEffect, useState } from "react";
import { EditorSection, RowListEditor } from "./RepeatableList.jsx";
import { Field } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { useUnsavedChanges } from "../../lib/hooks.js";

const STAT_FIELDS = [
  { name: "value", label: "Angka", placeholder: "120" },
  { name: "label", label: "Keterangan", placeholder: "Relawan aktif" },
  { name: "icon", label: "Ikon", placeholder: "users" },
];

const SCHEDULE_FIELDS = [
  { name: "hari", label: "Hari" },
  { name: "waktu", label: "Waktu" },
];

const SOCIAL_FIELDS = [
  { name: "label", label: "Label" },
  { name: "url", label: "URL" },
  { name: "icon", label: "Ikon", placeholder: "instagram" },
];

export function AdminSettings({ settings, onSave, busy, storageNote }) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => setDraft(settings), [settings]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  useUnsavedChanges(dirty);

  const setBranding = (name, value) => setDraft({ ...draft, branding: { ...draft.branding, [name]: value } });
  const setEmergency = (name, value) => setDraft({ ...draft, emergency: { ...draft.emergency, [name]: value } });
  const setSekretariat = (name, value) =>
    setDraft({ ...draft, contact: { ...draft.contact, sekretariat: { ...draft.contact.sekretariat, [name]: value } } });
  const setBergabung = (name, value) =>
    setDraft({ ...draft, contact: { ...draft.contact, bergabung: { ...draft.contact.bergabung, [name]: value } } });

  const sekretariat = draft.contact?.sekretariat || {};
  const bergabung = draft.contact?.bergabung || {};

  return (
    <EditorSection
      title="Pengaturan situs"
      description="Identitas, statistik beranda, kontak sekretariat, info keanggotaan, dan kanal sosial."
      dirty={dirty}
      busy={busy}
      onReset={() => setDraft(settings)}
      onSave={() => onSave("site_settings", draft)}
    >
      <h3 style={{ fontSize: "var(--step-1)" }}><Icon name="sparkles" size={17} /> Identitas</h3>
      <div className="form-grid">
        <Field label="Nama organisasi" htmlFor="set-name">
          <input id="set-name" className="input" value={draft.branding?.name || ""} onChange={(event) => setBranding("name", event.target.value)} />
        </Field>
        <Field label="Nama pendek" htmlFor="set-short">
          <input id="set-short" className="input" value={draft.branding?.short_name || ""} onChange={(event) => setBranding("short_name", event.target.value)} />
        </Field>
        <Field label="Sekolah" htmlFor="set-school">
          <input id="set-school" className="input" value={draft.branding?.school || ""} onChange={(event) => setBranding("school", event.target.value)} />
        </Field>
        <Field label="Tagline" htmlFor="set-tagline">
          <input id="set-tagline" className="input" value={draft.branding?.tagline || ""} onChange={(event) => setBranding("tagline", event.target.value)} />
        </Field>
        <Field label="URL logo" htmlFor="set-logo" hint="Unggah melalui menu Aset, lalu tempel URL publiknya.">
          <input id="set-logo" className="input" value={draft.branding?.logo || ""} onChange={(event) => setBranding("logo", event.target.value)} />
        </Field>
        <Field label="URL favicon" htmlFor="set-icon">
          <input id="set-icon" className="input" value={draft.branding?.icon || ""} onChange={(event) => setBranding("icon", event.target.value)} />
        </Field>
        <Field label="URL gambar OG (SEO)" htmlFor="set-og">
          <input id="set-og" className="input" value={draft.branding?.og_image || ""} onChange={(event) => setBranding("og_image", event.target.value)} />
        </Field>
        <Field label="Canonical URL" htmlFor="set-canonical">
          <input id="set-canonical" className="input" value={draft.branding?.canonical_url || ""} onChange={(event) => setBranding("canonical_url", event.target.value)} />
        </Field>
      </div>

      <RowListEditor
        label="Statistik beranda"
        hint="Tampil di hero dan bagian organisasi. Gunakan angka yang benar-benar dimiliki organisasi."
        rows={draft.stats}
        fields={STAT_FIELDS}
        makeEmpty={() => ({ value: 0, label: "", icon: "sparkles" })}
        onChange={(stats) => setDraft({ ...draft, stats })}
        addLabel="Tambah statistik"
        max={8}
      />

      <h3 style={{ fontSize: "var(--step-1)" }}><Icon name="circle-alert" size={17} /> Informasi darurat</h3>
      <div className="form-grid">
        <Field label="Judul" htmlFor="set-em-headline">
          <input id="set-em-headline" className="input" value={draft.emergency?.headline || ""} onChange={(event) => setEmergency("headline", event.target.value)} />
        </Field>
        <Field label="Nomor darurat" htmlFor="set-em-number">
          <input id="set-em-number" className="input" value={draft.emergency?.number || ""} onChange={(event) => setEmergency("number", event.target.value)} />
        </Field>
        <div className="span-2">
          <Field label="Catatan" htmlFor="set-em-note">
            <textarea id="set-em-note" className="textarea" style={{ minHeight: 74 }} value={draft.emergency?.note || ""} onChange={(event) => setEmergency("note", event.target.value)} />
          </Field>
        </div>
        <Field label="Tautan WhatsApp darurat" htmlFor="set-em-wa">
          <input id="set-em-wa" className="input" value={draft.emergency?.wa_link || ""} onChange={(event) => setEmergency("wa_link", event.target.value)} />
        </Field>
      </div>

      <h3 style={{ fontSize: "var(--step-1)" }}><Icon name="message-circle" size={17} /> Kontak sekretariat</h3>
      <div className="form-grid">
        <Field label="Alamat" htmlFor="set-alamat">
          <input id="set-alamat" className="input" value={sekretariat.alamat || ""} onChange={(event) => setSekretariat("alamat", event.target.value)} />
        </Field>
        <Field label="Telepon" htmlFor="set-telepon">
          <input id="set-telepon" className="input" value={sekretariat.telepon || ""} onChange={(event) => setSekretariat("telepon", event.target.value)} />
        </Field>
        <Field label="Email" htmlFor="set-email">
          <input id="set-email" className="input" type="email" value={sekretariat.email || ""} onChange={(event) => setSekretariat("email", event.target.value)} />
        </Field>
        <Field label="Instagram (tanpa @)" htmlFor="set-ig">
          <input id="set-ig" className="input" value={sekretariat.instagram || ""} onChange={(event) => setSekretariat("instagram", event.target.value)} />
        </Field>
        <Field label="Tautan WhatsApp" htmlFor="set-wa">
          <input id="set-wa" className="input" value={sekretariat.wa_link || ""} onChange={(event) => setSekretariat("wa_link", event.target.value)} />
        </Field>
        <Field label="Nomor WhatsApp" htmlFor="set-wa-number">
          <input id="set-wa-number" className="input" value={sekretariat.whatsapp_number || ""} onChange={(event) => setSekretariat("whatsapp_number", event.target.value)} />
        </Field>
      </div>

      <RowListEditor
        label="Jam layanan sekretariat"
        rows={sekretariat.jadwal}
        fields={SCHEDULE_FIELDS}
        makeEmpty={() => ({ hari: "", waktu: "" })}
        onChange={(jadwal) => setSekretariat("jadwal", jadwal)}
        addLabel="Tambah baris jam"
        max={10}
      />

      <h3 style={{ fontSize: "var(--step-1)" }}><Icon name="user-plus" size={17} /> Informasi keanggotaan</h3>
      <div className="form-grid">
        <div className="span-2">
          <Field label="Deskripsi" htmlFor="set-join-desc">
            <textarea id="set-join-desc" className="textarea" style={{ minHeight: 84 }} value={bergabung.deskripsi || ""} onChange={(event) => setBergabung("deskripsi", event.target.value)} />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Persyaratan" htmlFor="set-join-req" hint="Satu syarat per baris.">
            <textarea
              id="set-join-req"
              className="textarea"
              style={{ minHeight: 84 }}
              value={(bergabung.persyaratan || []).join("\n")}
              onChange={(event) => setBergabung("persyaratan", event.target.value.split("\n"))}
            />
          </Field>
        </div>
        <Field label="Catatan" htmlFor="set-join-note">
          <input id="set-join-note" className="input" value={bergabung.catatan || ""} onChange={(event) => setBergabung("catatan", event.target.value)} />
        </Field>
        <Field label="Tautan WhatsApp" htmlFor="set-join-wa">
          <input id="set-join-wa" className="input" value={bergabung.link_wa || ""} onChange={(event) => setBergabung("link_wa", event.target.value)} />
        </Field>
      </div>

      <RowListEditor
        label="Kanal sosial"
        rows={draft.social_links}
        fields={SOCIAL_FIELDS}
        makeEmpty={() => ({ label: "", url: "", icon: "link" })}
        onChange={(social_links) => setDraft({ ...draft, social_links })}
        addLabel="Tambah kanal"
        max={8}
      />

      <div className="inline-note">
        <Icon name="database" size={18} />
        <span>{storageNote}</span>
      </div>
    </EditorSection>
  );
}

export default AdminSettings;
