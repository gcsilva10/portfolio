import type { ProjectFilter, ProjectItemData } from "../translations";

type ProjectItemProps = {
  project: ProjectItemData;
  typeLabels: Record<ProjectFilter, string>;
  websiteButtonLabel: string;
  index: number;
};

export function ProjectItem({ project, typeLabels, websiteButtonLabel, index }: ProjectItemProps) {
  return (
    <article className={`project-card ${project.imagePath ? "has-logo" : ""}`} data-reveal>
      {project.imagePath ? <img className="project-logo" src={project.imagePath} alt={project.company ?? project.title} /> : null}

      <div className="project-card-aside">
        <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="project-type">{typeLabels[project.type]}</span>
      </div>

      <div className="project-card-main">
        <div>
          {project.company ? <span className="project-company">{project.company}</span> : null}
          <h3>{project.title}</h3>
          <p>{project.description}</p>
        </div>

        <div className="project-card-footer">
          <div className="project-frameworks">
            {project.frameworks.map((framework) => (
              <span key={framework}>{framework}</span>
            ))}
          </div>
          {project.websiteUrl ? (
            <a className="project-link" href={project.websiteUrl} target="_blank" rel="noreferrer">
              {websiteButtonLabel}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
