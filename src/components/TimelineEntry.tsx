import type { TimelineEntryData } from "../translations";

export function TimelineEntry({ entry, typeLabel }: { entry: TimelineEntryData; typeLabel: string }) {
  return (
    <article className="timeline-item" data-reveal>
      <div className="timeline-meta">
        <img src={entry.imagePath} alt="" loading="lazy" />
        <p className="mono">{entry.startDate} — {entry.endDate}</p>
      </div>
      <span className="mono timeline-type">{typeLabel}</span>
      <h3>{entry.title}</h3>
      <p>{entry.description}</p>
    </article>
  );
}
