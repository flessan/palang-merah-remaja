import { SmartImage } from "../media/SmartImage.jsx";
import { initialsOf } from "./MemberBits.jsx";
import { cn } from "../../lib/utils.js";

/**
 * One member as a small portrait clipping.
 *
 * Used by the public profile page (read-only) and by the admin directory
 * (with `actions`). A member without a photo shows a monogram — the real
 * organisation has photos for some people only, and we never fake one.
 */
export function MemberCard({ member, actions, tone = "mint", className = "", style, as: Tag = "article" }) {
  const meta = [member.class_name, member.division].filter(Boolean);
  return (
    <Tag className={cn("member-card", className)} style={style}>
      <span className="member-card__role">{member.role || "Anggota"}</span>
      <div className="member-card__media">
        {member.photo ? (
          <SmartImage src={member.photo} alt={`Foto ${member.name}`} />
        ) : (
          <span className="member-card__monogram" style={{ background: `var(--${tone})` }} aria-hidden="true">
            {initialsOf(member.name)}
          </span>
        )}
      </div>
      <div className="member-card__body">
        <span className="member-card__name">{member.name || "Tanpa nama"}</span>
        {meta.length ? (
          <span className="member-card__meta">
            {meta.map((item) => (
              <span key={item} className="member-card__tag">{item}</span>
            ))}
          </span>
        ) : null}
        {member.note ? <span className="member-card__tag">{member.note}</span> : null}
        {actions ? <div className="row-actions" style={{ marginTop: 6 }}>{actions}</div> : null}
      </div>
    </Tag>
  );
}

export default MemberCard;
