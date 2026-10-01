import { forwardRef } from "react";
import { cn } from "../../lib/utils.js";
import { Icon } from "./Icon.jsx";

const TONES = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  blue: "btn-blue",
  mint: "btn-mint",
  pink: "btn-pink",
  ghost: "btn-ghost",
  ink: "btn-ink",
};

/**
 * Semantic button. Always renders a real <button> unless `href` is provided,
 * in which case it renders a link with the same visual grammar.
 */
export const Button = forwardRef(function Button(
  { tone = "ghost", size = "md", block = false, icon, iconLeft, className = "", children, href, loading = false, ...rest },
  ref,
) {
  const classes = cn("btn", TONES[tone] || TONES.ghost, size === "sm" && "btn-sm", size === "lg" && "btn-lg", block && "btn-block", className);
  const content = (
    <>
      {loading ? <Icon name="loader" size={17} className="btn-spin" /> : iconLeft ? <Icon name={iconLeft} size={17} /> : null}
      {children ? <span>{children}</span> : null}
      {icon ? <Icon name={icon} size={17} /> : null}
    </>
  );

  if (href) {
    return (
      <a ref={ref} className={classes} href={href} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} type={rest.type || "button"} className={classes} aria-busy={loading || undefined} disabled={rest.disabled || loading} {...rest}>
      {content}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton(
  { icon, label, tone = "ghost", size = "md", active = false, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn("icon-btn", size === "sm" && "icon-btn--sm", active && "is-active", className)}
      aria-label={label}
      title={label}
      aria-pressed={rest["aria-pressed"] ?? (active ? true : undefined)}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 17 : 19} />
      {children}
    </button>
  );
});

export default Button;
