import { Icon } from "../../components/ui/Icon.jsx";
import { SectionHead, Tag } from "../../components/ui/Bits.jsx";

export function EventsSection({ events, onNavigate }) {
  if (!events.length) return null;

  return (
    <section className="container" aria-labelledby="events-title">
      <SectionHead
        id="events-title"
        kicker="Agenda"
        title="Jadwal & kegiatan mendatang"
        description="Latihan rutin, piket UKS, dan kegiatan lain yang bisa kamu ikuti."
        action={
          <button type="button" className="chip" onClick={() => onNavigate("kontak")}>
            <Icon name="calendar-clock" size={15} /> Tanya jadwal
          </button>
        }
      />
      <div className="event-list">
        {events.slice(0, 4).map((event) => (
          <article className="event-card" key={event.id || event.title}>
            <div className="event-card__when">
              <Icon name="calendar" size={20} />
              <strong>{event.date}</strong>
              {event.time ? <span>{event.time}</span> : null}
            </div>
            <div className="event-card__body">
              <Tag tone="blue">{event.status}</Tag>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <div className="event-card__meta">
                <span><Icon name="map-pin" size={15} /> {event.location}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default EventsSection;
