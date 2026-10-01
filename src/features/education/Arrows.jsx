import { CrossMark, HeartDoodle, Star, Squiggle } from "../../components/doodles/Doodles.jsx";

/** Small, intentional doodle row used as a section divider. */
export function Arrows() {
  return (
    <div
      aria-hidden="true"
      style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}
    >
      <HeartDoodle size={22} style={{ color: "var(--red)" }} />
      <Squiggle width={140} style={{ color: "var(--ink)" }} />
      <Star size={22} style={{ color: "var(--yellow)" }} />
      <CrossMark size={20} style={{ color: "var(--red)" }} />
    </div>
  );
}

export default Arrows;
