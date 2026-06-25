import type { TimelineEntryData } from "../translations";

type TimelineEntryProps = {
  entry: TimelineEntryData;
  index: number;
  startLabel: string;
  endLabel: string;
  typeLabel: string;
};

export function TimelineEntry({ entry, index, startLabel, endLabel, typeLabel }: TimelineEntryProps) {
  return (
    <article className="timeline-item" data-reveal>
      <div className="timeline-pin" aria-hidden="true" />
      <div className="timeline-card">
        <img className="timeline-logo" src={entry.imagePath} alt={entry.title} />
        <span className="timeline-index">{String(index + 1).padStart(2, "0")}</span>
        <span className={`tag tag-${entry.type.toLowerCase()}`}>{typeLabel}</span>
        <h3>{entry.title}</h3>
        <p>{entry.description}</p>
        <div className="timeline-dates">
          <span>
            <strong>{startLabel}</strong>
            <em>{entry.startDate}</em>
          </span>
          <span>
            <strong>{endLabel}</strong>
            <em>{entry.endDate}</em>
          </span>
        </div>
      </div>
    </article>
  );
}
