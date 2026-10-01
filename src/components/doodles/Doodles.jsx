/**
 * Deterministic hand-drawn accents.
 *
 * These are small, fixed SVG shapes — no randomness, no animation loop, no
 * decorative particle effects. Used sparingly to keep the comic-pop feel.
 */

const BASE = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" };

export function Star({ size = 26, className = "", filled = true }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path
        d="M12 2.6l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9l6.1-.8z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Burst({ size = 62, className = "" }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path
        d="M50 4l7 15 15-7-2 17 17 5-14 11 12 13-17 3 3 17-15-8-10 14-6-16-16 8 5-16-16-6 14-11-11-13 17-4-1-17 15 9z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartDoodle({ size = 24, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path d="M12 20.4S3.6 15 3.6 9.6A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.4 2.7C20.4 15 12 20.4 12 20.4z" fill="currentColor" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function CrossMark({ size = 22, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path d="M9.5 2.5h5v7h7v5h-7v7h-5v-7h-7v-5h7z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowScribble({ size = 90, className = "" }) {
  return (
    <svg viewBox="0 0 120 60" width={size} height={(size * 60) / 120} className={className} aria-hidden="true" focusable="false">
      <path d="M4 40C18 12 52 6 78 16" {...BASE} strokeWidth="4" />
      <path d="M62 8l17 8-13 13" {...BASE} strokeWidth="4" />
    </svg>
  );
}

export function Squiggle({ width = 160, className = "" }) {
  return (
    <svg viewBox="0 0 160 18" width={width} height={(width * 18) / 160} className={className} aria-hidden="true" focusable="false">
      <path d="M3 12c14-10 26 6 40-2s26 8 40-1 28 6 34 0" {...BASE} strokeWidth="4.5" />
    </svg>
  );
}

export function SpeechBubble({ children, tone = "yellow", className = "" }) {
  return (
    <div className={className} style={{ display: "inline-grid", gap: 4 }}>
      <span className={`sticker sticker--${tone}`} style={{ borderRadius: 22, transform: "none" }}>{children}</span>
    </div>
  );
}

/** A tidy, intentional cluster used behind hero/CTA copy. */
export function DoodleCluster({ className = "" }) {
  return (
    <div className={className} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Star size={30} className="doodle-float rotate-left" style={{ top: "-8px", right: "12%", color: "var(--yellow)" }} />
      <HeartDoodle size={26} className="doodle-float rotate-right" style={{ bottom: "6%", left: "-6px", color: "var(--red)" }} />
    </div>
  );
}

export default { Star, Burst, HeartDoodle, CrossMark, ArrowScribble, Squiggle, SpeechBubble };
