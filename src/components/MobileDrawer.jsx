import { useCallback, useEffect, useRef } from "react";
import { useDialog } from "../lib/hooks.js";
import { NAV_ITEMS } from "../lib/content.js";
import { cn } from "../lib/utils.js";
import { IconButton } from "./ui/Button.jsx";
import { Icon } from "./ui/Icon.jsx";

export function MobileDrawer({ open, activeTab, onNavigate, onClose, theme, onToggleTheme, contact }) {
  const asideRef = useRef(null);
  const toggleRef = useRef(null);
  // Let the dialog hook own the aside element so keyboard focus is trapped
  // inside the drawer while it is open.
  const containerRef = useDialog({ open, onClose, initialFocusRef: toggleRef });
  const setAsideRef = useCallback((node) => {
    asideRef.current = node;
    containerRef.current = node;
  }, [containerRef]);

  useEffect(() => {
    const node = asideRef.current;
    if (!node) return;
    if (open) node.removeAttribute("inert");
    else node.setAttribute("inert", "");
  }, [open]);

  const waLink = contact?.sekretariat?.wa_link || "https://wa.me/6283191735329";

  return (
    <div className={cn("drawer-root", open && "is-open")} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside
        id="mobile-drawer"
        ref={setAsideRef}
        className="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        inert={open ? undefined : ""}
      >
        <div className="drawer-head">
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>Menu PMR Wira</strong>
          <IconButton icon="x" label="Tutup menu" onClick={onClose} size="sm" />
        </div>

        <nav className="drawer-nav" aria-label="Navigasi halaman">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("drawer-link", activeTab === item.id && "active")}
              onClick={() => onNavigate(item.id)}
              aria-current={activeTab === item.id ? "page" : undefined}
            >
              <span className="drawer-icon"><Icon name={item.icon} size={19} /></span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="drawer-extras">
          <button type="button" className="btn btn-secondary btn-block" onClick={onToggleTheme} ref={toggleRef}>
            <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
            <span>{theme === "dark" ? "Mode terang" : "Mode gelap"}</span>
          </button>
          <a className="btn btn-primary btn-block" href={waLink} target="_blank" rel="noreferrer">
            <Icon name="message-circle" size={17} />
            <span>WhatsApp sekretariat</span>
          </a>
          <button
            type="button"
            className={cn("btn btn-ink btn-block", activeTab === "admin" && "btn-blue")}
            onClick={() => onNavigate("admin")}
          >
            <Icon name="shield-check" size={17} />
            <span>Portal admin</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default MobileDrawer;
