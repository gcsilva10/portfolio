import { useEffect, useRef } from "react";
import type { ProjectItemData } from "../translations";

const palettes = ["lime", "lilac", "peach"];
const symbols = ["orbit", "grid", "wave"];

type ProjectProps = {
  project: ProjectItemData;
  websiteButtonLabel: string;
  index: number;
};

function ProjectArt({ project, index, className = "" }: Pick<ProjectProps, "project" | "index"> & { className?: string }) {
  if (project.previewImagePath) {
    return (
      <div className={`project-art project-preview ${className}`} aria-hidden="true">
        <img src={project.previewImagePath} width={1120} height={756} alt="" loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`project-art ${palettes[index % palettes.length]} ${className}`}
      data-logo-background={project.logoBackground} aria-hidden="true">
      {project.imagePath ? (
        <img src={project.imagePath} alt="" loading="lazy" />
      ) : (
        <div className={`project-symbol ${symbols[index % symbols.length]}`}><i /><i /><i /></div>
      )}
    </div>
  );
}

function ProjectTechnologies({ frameworks }: Pick<ProjectItemData, "frameworks">) {
  return (
    <ul className="tech-list">
      {frameworks.map((framework) => <li key={framework}>{framework}</li>)}
    </ul>
  );
}

function ProjectWebsite({ url, label }: { url?: string; label: string }) {
  if (!url) return null;

  return (
    <a className="project-link" href={url} target="_blank" rel="noreferrer">
      {label} <span aria-hidden="true">↗</span>
    </a>
  );
}

export function ProjectItem({ project, websiteButtonLabel, index, exploreLabel, onExplore }: ProjectProps & {
  exploreLabel: string;
  onExplore: (opener: HTMLButtonElement) => void;
}) {
  return (
    <article className="project">
      <ProjectArt project={project} index={index} />
      <div className="project-info">
        {project.company && <span className="mono">{project.company}</span>}
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="project-bottom">
          <ProjectTechnologies frameworks={project.frameworks} />
        </div>
        <div className="project-actions">
          <button className="pill project-explore" type="button" aria-haspopup="dialog"
            aria-label={`${exploreLabel}: ${project.title}`} onClick={(event) => onExplore(event.currentTarget)}>
            {exploreLabel} <span aria-hidden="true">+</span>
          </button>
          <ProjectWebsite url={project.websiteUrl} label={websiteButtonLabel} />
        </div>
      </div>
    </article>
  );
}

export function ProjectDialog({ selection, websiteButtonLabel, closeLabel, detailLabels, onClose }: {
  selection: Pick<ProjectProps, "project" | "index"> | null;
  websiteButtonLabel: string;
  closeLabel: string;
  detailLabels: Record<keyof NonNullable<ProjectItemData["details"]>, string>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const panel = dialog.current;
    if (selection && panel && !panel.open) {
      panel.showModal();
      panel.scrollTop = 0;
    }
  }, [selection]);

  return (
    <dialog className="project-dialog" ref={dialog} aria-labelledby="project-dialog-title" onClose={onClose}>
      {selection && <>
        <header className="project-dialog-header">
          <h2 id="project-dialog-title">{selection.project.title}</h2>
          <form method="dialog"><button className="pill" type="submit">{closeLabel} ×</button></form>
        </header>
        <ProjectArt {...selection} className="project-dialog-art" />
        <div className="project-dialog-content">
          {selection.project.company && <span className="mono">{selection.project.company}</span>}
          <p>{selection.project.description}</p>
          {(Object.keys(detailLabels) as Array<keyof typeof detailLabels>).map((key) => {
            const text = selection.project.details?.[key];
            return text && <section key={key}><h3>{detailLabels[key]}</h3><p>{text}</p></section>;
          })}
          <ProjectTechnologies frameworks={selection.project.frameworks} />
          <ProjectWebsite url={selection.project.websiteUrl} label={websiteButtonLabel} />
        </div>
      </>}
    </dialog>
  );
}
