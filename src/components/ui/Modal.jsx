import { useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils.js";
import { useDialog } from "../../lib/hooks.js";
import { IconButton } from "./Button.jsx";
import { Icon } from "./Icon.jsx";

/**
 * Accessible dialog: focus trap, Escape to close, scroll lock, focus restore.
 * On small screens it becomes a bottom sheet (see `components.css`).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  labelledBy = "pmr-dialog-title",
  initialFocusRef,
}) {
  const bodyRef = useRef(null);
  const containerRef = useDialog({ open, onClose, initialFocusRef });

  if (!open) return null;

  const content = (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <div
        ref={containerRef}
        className={cn("modal", size === "wide" && "modal--wide", size === "media" && "modal--media", size === "sheet" && "modal--sheet")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledBy : undefined}
        aria-label={title ? undefined : description || "Dialog"}
        tabIndex={-1}
      >
        <div className="modal-head">
          <div className="modal-head-copy">
            {title ? <h2 id={labelledBy}>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          <IconButton icon="x" label="Tutup dialog" onClick={onClose} className="modal-close" data-autofocus />
        </div>
        <div className="modal-body" ref={bodyRef}>{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Hapus", tone = "primary", onConfirm, onCancel, busy = false }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sheet"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Batal</button>
          <button type="button" className={cn("btn", tone === "primary" ? "btn-primary" : "btn-secondary")} onClick={onConfirm} disabled={busy}>
            {busy ? "Memproses…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="inline-note inline-note--warn">
        <Icon name="triangle-alert" size={20} />
        <p>{message}</p>
      </div>
    </Modal>
  );
}

export default Modal;
