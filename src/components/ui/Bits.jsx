import { cn } from "../../lib/utils.js";
import { Icon } from "./Icon.jsx";

export function Tag({ children, tone, className = "", icon }) {
  return (
    <span className={cn("tag", tone && `tag-${tone}`, className)}>
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  );
}

export function Sticker({ children, tone, icon, flat = false, className = "", style }) {
  return (
    <span className={cn("sticker", tone && `sticker--${tone}`, flat && "sticker--flat", className)} style={style}>
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}

export function Chip({ children, active = false, icon, className = "", ...rest }) {
  return (
    <button type="button" className={cn("chip", active && "is-active", className)} aria-pressed={active} {...rest}>
      {icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </button>
  );
}

export function ChipRow({ children, scroll = false, label, className = "" }) {
  return (
    <div className={cn("chip-row", scroll && "chip-row--scroll", className)} role="group" aria-label={label}>
      {children}
    </div>
  );
}

export function SectionHead({ kicker, title, description, action, id, as: Heading = "h2" }) {
  return (
    <div className="section-head">
      <div className="section-head__copy">
        {kicker ? <span className="eyebrow"><Icon name="sparkles" size={13} />{kicker}</span> : null}
        <Heading id={id}>{title}</Heading>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function IconChip({ icon, tone = "yellow", size = "md", round = false, className = "" }) {
  return (
    <span className={cn("icon-chip", `icon-chip--${tone}`, size === "sm" && "icon-chip--sm", size === "lg" && "icon-chip--lg", round && "icon-chip--round", className)}>
      <Icon name={icon} size={size === "sm" ? 18 : size === "lg" ? 28 : 22} />
    </span>
  );
}

export function PhotoFrame({ src, alt, tone, variant = "wide", tilt, tape = false, className = "", children, style, imgProps = {} }) {
  return (
    <figure
      className={cn("photo-frame", `photo-frame--${variant}`, tilt !== undefined && "photo-frame--tilt", tape && "photo-frame--tape", className)}
      style={{ ...(tilt !== undefined ? { "--tilt": `${tilt}deg` } : null), ...style }}
    >
      <img src={src} alt={alt} loading="lazy" decoding="async" {...imgProps} />
      {children}
    </figure>
  );
}

export function StatBlock({ value, label, icon }) {
  return (
    <div className="stat-block">
      {icon ? <IconChip icon={icon} tone="mint" size="sm" /> : null}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon = "search", title, description, action }) {
  return (
    <div className="empty-state">
      <IconChip icon={icon} tone="blue" size="lg" round />
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function StatusPill({ published, labels = ["Tayang", "Draf"] }) {
  return (
    <span className={cn("status-pill", published ? "status-pill--live" : "status-pill--draft")}>
      <Icon name={published ? "circle-check" : "circle-dot"} size={12} />
      {published ? labels[0] : labels[1]}
    </span>
  );
}

export function Disclaimer({ children, icon = "info" }) {
  return (
    <div className="disclaimer">
      <Icon name={icon} size={19} />
      <p>{children}</p>
    </div>
  );
}

export function Skeleton({ height = 160, label = "Memuat konten" }) {
  return <div className="skeleton" style={{ minHeight: height }} role="status" aria-label={label} />;
}

export function Field({ label, hint, error, htmlFor, children, required = false }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error" role="alert">{error}</span> : null}
    </div>
  );
}
