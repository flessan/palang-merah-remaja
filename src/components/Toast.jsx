import { Icon } from "./ui/Icon.jsx";

const TONE_ICON = { success: "circle-check", error: "triangle-alert", info: "info" };

export function Toast({ toast, onDismiss }) {
  const type = toast.type || "success";

  return (
    <div className={`toast toast-${type}`} role={type === "error" ? "alert" : "status"} aria-live={type === "error" ? "assertive" : "polite"}>
      <Icon name={TONE_ICON[type] || "circle-check"} size={18} />
      <span>{toast.message}</span>
      {onDismiss ? (
        <button type="button" className="icon-btn icon-btn--sm" onClick={onDismiss} aria-label="Tutup notifikasi" style={{ background: "transparent" }}>
          <Icon name="x" size={15} />
        </button>
      ) : null}
    </div>
  );
}

export default Toast;
