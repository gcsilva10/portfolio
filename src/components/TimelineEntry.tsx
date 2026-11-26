import type { TimelineEntryData } from "../translations";

export function TimelineEntry({ entry, typeLabel }: { entry: TimelineEntryData; typeLabel: string }) {
  return (
    <li className="journey-card">
      <div className="journey-card-meta">
        <img src={entry.imagePath} data-logo-background={entry.logoBackground} alt="" loading="lazy" />
        <p className="mono">{entry.startDate} — {entry.endDate}</p>
      </div>
      <div className="journey-card-body">
        <span className="mono journey-card-type">{typeLabel}</span>
        <h3>{entry.title}</h3>
        <p>{entry.description}</p>
      </div>
    </li>
  );
}
