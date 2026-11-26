import { useEffect, useRef, useState } from "react";
import { cvImagePaths, cvPath } from "./content";
import { ProjectItem } from "./components/ProjectItem";
import { TerminalIntro } from "./components/TerminalIntro";
import { TimelineEntry } from "./components/TimelineEntry";
import { type Language, type ProjectFilter, type TimelineFilter, translations } from "./translations";
import { useMotion } from "./useMotion";

const sections = ["inicio", "projetos", "percurso", "cv", "contacto"] as const;

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

function getAge(birthDate: string, today = new Date()) {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const birthdayHasPassed =
    today.getMonth() + 1 > birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() >= birthDay);

  return today.getFullYear() - birthYear - (birthdayHasPassed ? 0 : 1);
}

function App() {
  const [showIntro, setShowIntro] = useState(() => !window.location.hash || window.location.hash === "#inicio");
  const [language, setLanguage] = useState<Language>("pt");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("pessoal");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("main");
  const [cvPage, setCvPage] = useState(0);
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "copied" | "failed">("idle");
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const heroHeading = useRef<HTMLHeadingElement>(null);
  const activeSection = useMotion(page, canvas, cursor, sections);

  const pt = language === "pt";
  const copy = translations[language];
  const profile = copy.profile;
  const cv = copy.cvSection;
  const projects = copy.projectSection.projects.filter((project) => project.type === projectFilter);
  const timeline = copy.timelineSection.entries
    .filter((entry) => entry.timelineType === timelineFilter)
    .sort((a, b) => (getTimelineDateValue(b.startDate) - getTimelineDateValue(a.startDate)) ||
      (getTimelineDateValue(b.endDate) - getTimelineDateValue(a.endDate)));

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (phoneStatus === "idle") return;
    const timeout = window.setTimeout(() => setPhoneStatus("idle"), 2400);
    return () => window.clearTimeout(timeout);
  }, [phoneStatus]);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(profile.phone);
      setPhoneStatus("copied");
    } catch {
      setPhoneStatus("failed");
    }
  }

  return (<>
    {showIntro && <TerminalIntro name={profile.name} role={copy.terminal.role}
      location={`${profile.locationTitle}, ${profile.locationText}`}
      onClose={() => {
        setShowIntro(false);
        heroHeading.current?.focus({ preventScroll: true });
      }} />}
    <div className="site" ref={page}>
      <div className="cursor" ref={cursor} aria-hidden="true"><span /></div>
      <a className="skip-link" href="#main">{pt ? "Saltar para o conteúdo" : "Skip to content"}</a>
      <header className="site-header">
        <a className="wordmark" href="#inicio" aria-label={profile.name}>gs<span>.</span></a>
        <nav aria-label={pt ? "Navegação principal" : "Main navigation"}>
          {sections.slice(1).map((id) => (
            <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined}>
              {copy.nav[id]}
            </a>
          ))}
        </nav>
        <div className="languages" role="group" aria-label={copy.languageLabel}>
          {(["pt", "en"] as const).map((item) => (
            <button key={item} type="button" lang={item} onClick={() => setLanguage(item)} aria-pressed={language === item}>
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="read-progress" aria-hidden="true" />
      </header>

      <main id="main">
        <section id="inicio" className="hero">
          <div className="hero-layout wrap">
            <div className="hero-text">
              <h1 ref={heroHeading} tabIndex={-1} aria-label={profile.name}><span>Gonçalo</span><span>Silva<em>.</em></span></h1>
              <p>{profile.degreeText}<br />{copy.terminal.role}</p>
            </div>
            <figure className="portrait">
              <div className="portrait-frame">
                <img src="/images/fotografia/fotografia.jpg" alt={profile.photoAlt} fetchPriority="high" />
                <span className="portrait-cross" aria-hidden="true">+</span>
              </div>
              <figcaption className="mono">
                <span>{profile.locationTitle}, PT</span>
                <span>{getAge(profile.birthDate)} {copy.hero.ageUnit}</span>
              </figcaption>
            </figure>
            <a className="hero-jump" href="#projetos"><span aria-hidden="true">↓</span>{copy.hero.viewProjects}</a>
          </div>
        </section>

        <div className="motion-scene" aria-hidden="true">
          <div className="motion-stage">
            <canvas ref={canvas} />
            <span className="scene-cross">+</span><span className="scene-cross">+</span>
          </div>
        </div>

        <section id="projetos" className="work">
          <div className="wrap">
            <div className="section-top" data-reveal>
              <h2>{copy.projectSection.title}</h2>
              <div className="filters" role="group" aria-label={copy.nav.projetos}>
                {(Object.keys(copy.projectSection.filters) as ProjectFilter[]).map((filter) => (
                  <button key={filter} type="button" aria-pressed={projectFilter === filter} onClick={() => setProjectFilter(filter)}>
                    {copy.projectSection.filters[filter]}
                  </button>
                ))}
              </div>
            </div>
            <div className="project-grid" key={projectFilter}>
              {projects.map((project, index) => (
                <ProjectItem key={project.title} project={project} index={index} websiteButtonLabel={copy.projectSection.websiteButton} />
              ))}
            </div>
          </div>
        </section>

        <section id="percurso" className="journey wrap">
          <div className="journey-heading" data-reveal>
            <span className="mono">{copy.timelineSection.kicker}</span>
            <h2>{copy.timelineSection.title}</h2>
            <div className="filters" role="group" aria-label={copy.nav.percurso}>
              {(Object.keys(copy.timelineSection.filters) as TimelineFilter[]).map((filter) => (
                <button key={filter} type="button" aria-pressed={timelineFilter === filter} onClick={() => setTimelineFilter(filter)}>
                  {copy.timelineSection.filters[filter]}
                </button>
              ))}
            </div>
          </div>
          <div className="timeline" key={timelineFilter}>
            {timeline.map((entry) => (
              <TimelineEntry key={`${entry.startDate}-${entry.title}`} entry={entry} typeLabel={copy.timelineSection.typeLabels[entry.type]} />
            ))}
          </div>
        </section>

        <section id="cv" className="cv">
          <div className="wrap cv-layout">
            <div data-reveal>
              <h2>{cv.kicker}</h2>
              <div className="cv-actions">
                <button className="pill solid" type="button" disabled={!cvImagePaths.length} onClick={() => {
                  setCvPage(0);
                  dialog.current?.showModal();
                }}>{cv.view} <span aria-hidden="true">↗</span></button>
                <a className="pill" href={cvPath} download>{cv.download} <span aria-hidden="true">↓</span></a>
              </div>
            </div>
            <div className="paper-stack" aria-hidden="true">
              <img src={cvImagePaths[0]} alt="" loading="lazy" />
            </div>
          </div>
        </section>

        <footer id="contacto" className="contact">
          <div className="wrap">
            <h2 data-reveal>{pt ? "Vamos falar?" : "Let’s talk?"}</h2>
            <a className="email" href={`mailto:${profile.email}`}>{profile.email}<span aria-hidden="true">↗</span></a>
            <div className="contact-links">
              <div>
                <a href={`tel:${profile.phone.replaceAll(" ", "")}`}>{profile.phone}</a>
                <button type="button" onClick={copyPhone} aria-label={copy.contactSection.phoneCopyIdle} title={copy.contactSection.phoneCopyIdle}>⧉</button>
                <span className="phone-feedback" role="status">{phoneStatus === "copied" ? copy.contactSection.phoneCopyDone : phoneStatus === "failed" ? (pt ? "Não foi possível copiar" : "Could not copy") : ""}</span>
              </div>
              <div>
                <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn ↗</a>
              </div>
            </div>
            <div className="footer-line mono">
              <span>{profile.name} © {new Date().getFullYear()}</span>
              <a href="#inicio">{pt ? "Voltar ao topo" : "Back to top"} ↑</a>
            </div>
          </div>
        </footer>
      </main>

      <dialog className="cv-dialog" ref={dialog} aria-labelledby="cv-dialog-title">
        <header>
          <strong id="cv-dialog-title">{cv.pageTitle}</strong>
          <form method="dialog"><button className="pill" type="submit">{cv.close} ×</button></form>
        </header>
        <div className="cv-page">
          {cvImagePaths[cvPage] && <img src={cvImagePaths[cvPage]} alt={`${cv.pageTitle}, ${cv.pageCounter.toLowerCase()} ${cvPage + 1}`} />}
        </div>
        <footer>
          <button className="pill" type="button" disabled={cvPage === 0} onClick={() => setCvPage(cvPage - 1)}>{cv.previousPage}</button>
          <span aria-live="polite">{cvPage + 1} / {cvImagePaths.length}</span>
          <button className="pill" type="button" disabled={cvPage >= cvImagePaths.length - 1} onClick={() => setCvPage(cvPage + 1)}>{cv.nextPage}</button>
        </footer>
      </dialog>
    </div>
  </>
  );
}

export default App;
