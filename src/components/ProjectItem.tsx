import type { ProjectItemData } from "../translations";

const palettes = ["lime", "lilac", "peach"];
const symbols = ["orbit", "grid", "wave"];

export function ProjectItem({ project, websiteButtonLabel, index }: {
  project: ProjectItemData;
  websiteButtonLabel: string;
  index: number;
}) {
  return (
    <article className="project" data-reveal>
      <div className={`project-art ${palettes[index % palettes.length]}`} aria-hidden="true">
        {project.imagePath ? (
          <img src={project.imagePath} alt="" loading="lazy" />
        ) : (
          <div className={`project-symbol ${symbols[index % symbols.length]}`}><i /><i /><i /></div>
        )}
      </div>
      <div className="project-info">
        {project.company && <span className="mono">{project.company}</span>}
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="project-bottom">
          <ul className="tech-list">
            {project.frameworks.map((framework) => <li key={framework}>{framework}</li>)}
          </ul>
          {project.websiteUrl && (
            <a className="project-link" href={project.websiteUrl} target="_blank" rel="noreferrer">
              {websiteButtonLabel} <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
