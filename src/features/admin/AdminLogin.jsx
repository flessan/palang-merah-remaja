import { useRef, useState } from "react";
import { adminLogin } from "../../lib/api.js";
import { Button } from "../../components/ui/Button.jsx";
import { Disclaimer, Field, Sticker } from "../../components/ui/Bits.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

/**
 * Admin gate.
 *
 * The PIN is posted over HTTPS to the Pages Function, which compares it
 * server-side and returns a short-lived session token held in memory. The PIN
 * is never stored, never placed in the URL, and never written to localStorage.
 */
export function AdminLogin({ onAuthenticated, onCancel }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const submit = async (event) => {
    event.preventDefault();
    if (!pin.trim()) {
      setError("Masukkan PIN admin terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = await adminLogin(pin.trim());
      setPin("");
      onAuthenticated(payload);
    } catch (cause) {
      setError(cause?.message || "PIN admin tidak valid.");
      setPin("");
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-shell container">
      <form className="admin-gate card" onSubmit={submit} aria-labelledby="admin-gate-title">
        <span className="admin-gate__art"><Icon name="lock" size={34} /></span>
        <div>
          <Sticker tone="blue" icon="shield-check" flat>Portal admin</Sticker>
          <h1 id="admin-gate-title" style={{ fontSize: "var(--step-3)", marginTop: 12 }}>Masuk untuk mengelola konten</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Kelola kabar, agenda, galeri, struktur organisasi, jadwal UKS, dan aset media PMR Wira.
          </p>
        </div>

        <Field
          label="PIN admin"
          htmlFor="admin-pin"
          error={error}
          hint="PIN dikirim ke server PMR dan tidak disimpan di peramban."
          required
        >
          <input
            id="admin-pin"
            ref={inputRef}
            className="input"
            type="password"
            name="pin"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(event) => { setPin(event.target.value); if (error) setError(""); }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-pin-error" : undefined}
            placeholder="••••"
            required
          />
        </Field>

        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <Button tone="primary" type="submit" icon="shield-check" loading={busy}>
            {busy ? "Memeriksa…" : "Masuk"}
          </Button>
          <Button tone="ghost" onClick={onCancel}>
            Kembali ke situs
          </Button>
        </div>

        <Disclaimer icon="info">
          Sesi admin hanya tersimpan di memori peramban dan berakhir saat halaman dimuat ulang.
          Kunci Telegraph Cloud tidak pernah dikirim ke peramban.
        </Disclaimer>
      </form>
    </div>
  );
}

export default AdminLogin;
