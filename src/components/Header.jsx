import { NAV_ITEMS } from "../lib/content.js";
import { cn } from "../lib/utils.js";
import { IconButton } from "./ui/Button.jsx";
import { Icon } from "./ui/Icon.jsx";

export function Header({ activeTab, onNavigate, onOpenMenu, menuOpen, theme, onToggleTheme, branding }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button type="button" className="brand" onClick={() => onNavigate("beranda")} aria-label={`${branding?.name || "PMR Wira"} — kembali ke beranda`}>
          <span className="brand-logo">
            <img src={branding?.logo || "/gudang/logo/pmr-logo.webp"} alt="" width="46" height="46" />
          </span>
          <span className="brand-copy">
            <strong>{branding?.short_name || "PMR WIRA"}</strong>
            <small>{branding?.school || "SMKN 4 Banjarmasin"}</small>
          </span>
        </button>

        <nav className="desktop-nav" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(activeTab === item.id && "active")}
              onClick={() => onNavigate(item.id)}
              aria-current={activeTab === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className={cn("btn btn-sm", activeTab === "admin" ? "btn-primary" : "btn-secondary")}
            onClick={() => onNavigate("admin")}
            aria-current={activeTab === "admin" ? "page" : undefined}
          >
            <Icon name="shield-check" size={16} />
            <span>Admin</span>
          </button>
          <IconButton
            icon={theme === "dark" ? "sun" : "moon"}
            label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            onClick={onToggleTheme}
            className="theme-button"
            aria-pressed={theme === "dark"}
          />
          <button
            type="button"
            id="menu-button"
            className={cn("menu-button", menuOpen && "is-active")}
            onClick={onOpenMenu}
            aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
          >
            <span className="menu-lines" aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
