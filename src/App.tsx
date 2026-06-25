import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { cvImagePath, cvPath } from "./content";
import { ProjectItem } from "./components/ProjectItem";
import { TimelineEntry } from "./components/TimelineEntry";
import { type Language, type ProjectFilter, type TimelineFilter, translations } from "./translations";

type SectionId = "inicio" | "percurso" | "projetos" | "cv" | "contacto";

const navItems = [
  { id: "inicio" },
  { id: "percurso" },
  { id: "projetos" },
  { id: "cv" },
  { id: "contacto" },
] satisfies Array<{ id: SectionId }>;

const depthGridCellSize = 48;
const depthGridRadius = 190;
const timelineMonthIndex: Record<string, number> = {
  janeiro: 0,
  january: 0,
  fevereiro: 1,
  february: 1,
  marco: 2,
  março: 2,
  march: 2,
  abril: 3,
  april: 3,
  maio: 4,
  may: 4,
  junho: 5,
  june: 5,
  julho: 6,
  july: 6,
  agosto: 7,
  august: 7,
  setembro: 8,
  september: 8,
  outubro: 9,
  october: 9,
  novembro: 10,
  november: 10,
  dezembro: 11,
  december: 11,
};

function getTimelineDateValue(date: string) {
  const normalizedDate = date.trim().toLowerCase();
  if (normalizedDate === "presente" || normalizedDate === "present") return Number.POSITIVE_INFINITY;

  const yearMatch = normalizedDate.match(/\d{4}/);
  if (!yearMatch) return 0;

  const year = Number(yearMatch[0]);
  const monthName = normalizedDate.replace(yearMatch[0], "").trim();
  const month = timelineMonthIndex[monthName] ?? 11;

  return year * 12 + month;
}

function App() {
  const [language, setLanguage] = useState<Language>("pt");
  const copy = translations[language];
  const profile = copy.profile;
  const timeline = copy.timelineSection.entries;
  const projects = copy.projectSection.projects;
  const cv = copy.cvSection;
  const [activeSection, setActiveSection] = useState<SectionId>("inicio");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("main");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("pessoal");
  const [isCvViewerOpen, setIsCvViewerOpen] = useState(false);
  const [isPhoneCopied, setIsPhoneCopied] = useState(false);
  const [pointer, setPointer] = useState({ x: -999, y: -999 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const sectionShellRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filteredTimeline = useMemo(
    () =>
      [...timeline.filter((entry) => entry.timelineType === timelineFilter)].sort((left, right) => {
          const endDifference = getTimelineDateValue(right.endDate) - getTimelineDateValue(left.endDate);
          if (endDifference !== 0) return endDifference;

          return getTimelineDateValue(right.startDate) - getTimelineDateValue(left.startDate);
        }),
    [timelineFilter, timeline],
  );
  const filteredProjects = useMemo(
    () => projects.filter((project) => project.type === projectFilter),
    [projectFilter, projects],
  );
  const activeSectionIndex = Math.max(
    0,
    navItems.findIndex((item) => item.id === activeSection),
  );
  const isPhotoPinned = activeSection !== "inicio";
  const depthGridCells = useMemo(() => {
    if (!viewport.width || !viewport.height) return [];

    const columns = Math.ceil(viewport.width / depthGridCellSize) + 1;
    const rows = Math.ceil(viewport.height / depthGridCellSize) + 1;

    return Array.from({ length: columns * rows }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const left = column * depthGridCellSize;
      const top = row * depthGridCellSize;
      const centerX = left + depthGridCellSize / 2;
      const centerY = top + depthGridCellSize / 2;
      const distanceX = pointer.x - centerX;
      const distanceY = pointer.y - centerY;
      const distance = Math.hypot(distanceX, distanceY);
      const lift = Math.max(0, 1 - distance / depthGridRadius);
      const easedLift = lift * lift;

      return {
        id: `${column}-${row}`,
        style: {
          left,
          top,
          "--grid-lift": `${easedLift}`,
          "--grid-depth": `${Math.round(easedLift * 22)}px`,
          "--grid-rotate-x": `${(-distanceY / depthGridRadius) * easedLift * 18}deg`,
          "--grid-rotate-y": `${(distanceX / depthGridRadius) * easedLift * 18}deg`,
          "--grid-border": `${easedLift * 44}%`,
          "--grid-paper": `${easedLift * 28}%`,
          "--grid-tint": `${easedLift * 18}%`,
          "--grid-shadow-x": `${easedLift * 10}px`,
          "--grid-shadow-y": `${easedLift * 14}px`,
          "--grid-shadow-blur": `${easedLift * 30}px`,
          "--grid-inset-dark": `${easedLift * 16}px`,
          "--grid-inset-light": `${easedLift * 14}px`,
          "--grid-opacity": `${easedLift * 0.92}`,
          "--grid-scale": `${1 + easedLift * 0.08}`,
        } as CSSProperties,
      };
    });
  }, [pointer.x, pointer.y, viewport.height, viewport.width]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!isPhoneCopied) return;
    const timeoutId = window.setTimeout(() => setIsPhoneCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [isPhoneCopied]);

  const moveToSection = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= navItems.length || nextIndex === activeSectionIndex) return;

    const nextSection = navItems[nextIndex].id;
    setActiveSection(nextSection);
    document.getElementById(nextSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(profile.phone);
      setIsPhoneCopied(true);
    } catch {
      setIsPhoneCopied(false);
    }
  };

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      setPointer({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isCvViewerOpen && event.key === "Escape") setIsCvViewerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCvViewerOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry?.target.id) return;
        setActiveSection(visibleEntry.target.id as SectionId);
      },
      {
        rootMargin: "-34% 0px -44%",
        threshold: [0.16, 0.32, 0.5],
      },
    );

    navItems.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        className="depth-grid"
        aria-hidden="true"
        style={
          {
            "--cursor-x": `${pointer.x}px`,
            "--cursor-y": `${pointer.y}px`,
          } as CSSProperties
        }
      >
        {depthGridCells.map((cell) => (
          <span className="depth-grid-cell" key={cell.id} style={cell.style} />
        ))}
      </div>

      <div className="language-switcher" aria-label={copy.languageLabel}>
        {(["pt", "en"] as const).map((item) => (
          <button
            key={item}
            className={language === item ? "is-active" : ""}
            type="button"
            onClick={() => setLanguage(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <aside className="section-rail" aria-label={copy.nav[activeSection]}>
        <div className="rail-track" style={{ "--rail-active": activeSectionIndex } as CSSProperties}>
          <span className="rail-progress" />
          {navItems.map((item, index) => (
            <button
              aria-current={activeSection === item.id ? "page" : undefined}
              aria-label={copy.nav[item.id]}
              className={`rail-item ${activeSection === item.id ? "is-active" : ""}`}
              key={item.id}
              type="button"
              onClick={() => moveToSection(index)}
            >
              <span className="rail-dot" />
              <span className="rail-label">{copy.nav[item.id]}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className={`floating-portrait ${isPhotoPinned ? "is-visible" : ""}`} aria-hidden={!isPhotoPinned}>
        <img
          className="floating-portrait-photo"
          src="/images/fotografia/fotografia.jpg"
          alt=""
        />
      </div>

      <main>
        <section
          id="inicio"
          className={`screen-section ${activeSection === "inicio" ? "is-active" : activeSectionIndex > 0 ? "is-before" : "is-after"}`}
        >
          <div
            ref={(node) => {
              sectionShellRefs.current.inicio = node;
            }}
            className="hero shell section-shell"
          >
          <div className="hero-copy" data-reveal>
            <span className="eyebrow">{copy.hero.eyebrow}</span>
            <h1>{profile.headline}</h1>
            <p>{profile.intro}</p>

            <div className="hero-actions">
              <button className="button primary" type="button" onClick={() => moveToSection(1)}>
                {copy.hero.exploreTimeline}
              </button>
              <button className="button ghost" type="button" onClick={() => moveToSection(2)}>
                {copy.hero.viewProjects}
              </button>
            </div>
          </div>

          <aside className="identity-panel" aria-label={copy.hero.identityLabel} data-reveal>
            <div className="portrait-card">
              <div className="portrait-grid" />
              <img
                className="portrait-photo"
                src="/images/fotografia/fotografia.jpg"
                alt={profile.photoAlt}
              />
            </div>
            <div className="signal-card signal-one">
              <strong>{profile.degreeTitle}</strong>
              <span>{profile.degreeText}</span>
            </div>
            <div className="signal-card signal-two">
              <strong>{profile.locationTitle}</strong>
              <span>{profile.locationText}</span>
            </div>
          </aside>
          </div>
        </section>

        <section
          id="percurso"
          className={`screen-section ${activeSection === "percurso" ? "is-active" : activeSectionIndex > 1 ? "is-before" : "is-after"}`}
        >
          <div
            ref={(node) => {
              sectionShellRefs.current.percurso = node;
            }}
            className="section shell section-shell"
          >
            <SectionHead
              kicker={copy.timelineSection.kicker}
              title={copy.timelineSection.title}
            />

            <div className="timeline-toolbar" data-reveal>
              {(Object.keys(copy.timelineSection.filters) as TimelineFilter[]).map((filter) => (
                <button
                  key={filter}
                  className={`filter-button ${timelineFilter === filter ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setTimelineFilter(filter)}
                >
                  {copy.timelineSection.filters[filter]}
                </button>
              ))}
            </div>

            <div className="timeline">
              {filteredTimeline.map((entry, index) => (
                <TimelineEntry
                  key={`${entry.startDate}-${entry.title}`}
                  entry={entry}
                  index={index}
                  startLabel={copy.timelineSection.startLabel}
                  endLabel={copy.timelineSection.endLabel}
                  typeLabel={copy.timelineSection.typeLabels[entry.type]}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="projetos"
          className={`screen-section ${activeSection === "projetos" ? "is-active" : activeSectionIndex > 2 ? "is-before" : "is-after"}`}
        >
          <div
            ref={(node) => {
              sectionShellRefs.current.projetos = node;
            }}
            className="section shell section-shell"
          >
            <SectionHead
              kicker={copy.projectSection.kicker}
              title={copy.projectSection.title}
            />

            <div className="project-toolbar" data-reveal>
              {(Object.keys(copy.projectSection.filters) as ProjectFilter[]).map((filter) => (
                <button
                  key={filter}
                  className={`filter-button ${projectFilter === filter ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setProjectFilter(filter)}
                >
                  {copy.projectSection.filters[filter]}
                </button>
              ))}
            </div>

            <div className="project-grid">
              {filteredProjects.map((project, index) => (
                <ProjectItem
                  key={project.title}
                  project={project}
                  typeLabels={copy.projectSection.typeLabels}
                  websiteButtonLabel={copy.projectSection.websiteButton}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="cv"
          className={`screen-section ${activeSection === "cv" ? "is-active" : activeSectionIndex > 3 ? "is-before" : "is-after"}`}
        >
          <div
            ref={(node) => {
              sectionShellRefs.current.cv = node;
            }}
            className="section shell section-shell cv-shell"
          >
            <div className="cv-section-layout" data-reveal>
              <div className="cv-copy">
                <span className="section-kicker">{cv.kicker}</span>
                <h2>{cv.title}</h2>
                <div className="cv-actions">
                  <button className="button primary" type="button" onClick={() => setIsCvViewerOpen(true)}>
                    {cv.view}
                  </button>
                  <a className="button ghost" href={cvPath} download>
                    {cv.download}
                  </a>
                </div>
              </div>

              <div className="cv-file-mark" aria-hidden="true">
                <span className="cv-file-label">{cv.pageTitle}</span>
                {Array.from({ length: 9 }).map((_, index) => (
                  <span className="cv-file-line" key={index} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="contacto"
          className={`screen-section ${activeSection === "contacto" ? "is-active" : "is-after"}`}
        >
          <div
            ref={(node) => {
              sectionShellRefs.current.contacto = node;
            }}
            className="section shell section-shell"
          >
            <div className="contact-section">
              <div data-reveal>
                <span className="section-kicker">{copy.contactSection.kicker}</span>
                <h2>{copy.contactSection.title}</h2>
              </div>
              <div className="contact-links" data-reveal>
                <a href={`mailto:${profile.email}`}>
                  <span>{copy.contactSection.emailLabel}</span>
                  <strong>{profile.email}</strong>
                </a>
                <button type="button" onClick={handleCopyPhone}>
                  <span>{copy.contactSection.phoneLabel}</span>
                  <strong>{isPhoneCopied ? copy.contactSection.phoneCopyDone : profile.phone}</strong>
                  <em>{isPhoneCopied ? copy.contactSection.phoneCopyDone : copy.contactSection.phoneCopyIdle}</em>
                </button>
                <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                  <span>{copy.contactSection.githubLabel}</span>
                  <strong>github.com/gcsilva10</strong>
                </a>
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                  <span>{copy.contactSection.linkedinLabel}</span>
                  <strong>LinkedIn</strong>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className={`cv-viewer ${isCvViewerOpen ? "is-open" : ""}`} aria-hidden={!isCvViewerOpen}>
        <div className="cv-viewer-shell">
          <div className="cv-viewer-topbar">
            <button className="button ghost" type="button" onClick={() => setIsCvViewerOpen(false)}>
              {cv.close}
            </button>
            <a className="button primary" href={cvPath} download>
              {cv.download}
            </a>
          </div>

          <div className="cv-image-frame">
            <div className="cv-image-header">
              <span className="section-kicker">{cv.pageTitle}</span>
              <strong>{profile.name}</strong>
            </div>
            <img className="cv-image" src={cvImagePath} alt={cv.pageTitle} />
          </div>
        </div>
      </section>

      <footer className="shell">
        <span>{new Date().getFullYear()} {profile.name}</span>
      </footer>
    </>
  );
}

function SectionHead({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <div className="section-head" data-reveal>
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export default App;
