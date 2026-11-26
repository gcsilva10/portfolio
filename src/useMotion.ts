import { type RefObject, useEffect, useState } from "react";

function drawForm(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, progress: number) {
  const { width, height } = canvas;
  const size = Math.min(width, height) * 0.30;
  const angle = progress * Math.PI * 2;
  const morph = Math.sin(Math.PI * progress) ** 2;
  const rows = 32;
  const columns = 56;
  const mesh = Array.from({ length: rows + 1 }, (_, row) => {
    const v = row * Math.PI * 2 / rows;
    return Array.from({ length: columns + 1 }, (_, column) => {
      const u = column * Math.PI * 2 / columns;
      const tube = 0.36 + morph * Math.cos(u * 3 + angle) * 0.22;
      const radius = 1 + tube * Math.cos(v);
      const x = radius * Math.cos(u);
      const y = radius * Math.sin(u);
      const z = tube * Math.sin(v) + morph * Math.sin(u * 3) * 0.72;
      const tilt = 0.75 + Math.sin(angle) * 0.46;
      const depth = y * Math.sin(tilt) + z * Math.cos(tilt);
      const vertical = y * Math.cos(tilt) - z * Math.sin(tilt);
      const scale = size * 4 / (4 + depth);
      return [
        width / 2 + (x * Math.cos(angle) - vertical * Math.sin(angle)) * scale,
        height / 2 + (x * Math.sin(angle) + vertical * Math.cos(angle)) * scale,
      ] as const;
    });
  });

  context.clearRect(0, 0, width, height);
  context.lineWidth = Math.max(1, size / 190);
  context.strokeStyle = "rgba(221, 255, 83, 0.62)";
  context.beginPath();
  for (const ring of mesh) {
    context.moveTo(...ring[0]);
    ring.slice(1).forEach((point) => context.lineTo(...point));
  }
  for (let column = 0; column < columns; column += 2) {
    context.moveTo(...mesh[0][column]);
    mesh.slice(1).forEach((ring) => context.lineTo(...ring[column]));
  }
  context.stroke();
}

export function useMotion<T extends string>(
  pageRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  cursorRef: RefObject<HTMLDivElement | null>,
  sections: readonly T[],
) {
  const [activeSection, setActiveSection] = useState(sections[0]);

  useEffect(() => {
    const page = pageRef.current;
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    const scene = canvas?.closest(".motion-scene");
    if (!page || !canvas || !cursor || !scene) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const context = canvas.getContext("2d");
    const sectionElements = sections.map((id) => document.getElementById(id));
    let frame = 0;
    let lastProgress = -1;

    const update = () => {
      frame = 0;
      const viewHeight = window.innerHeight;
      const scrollRange = document.documentElement.scrollHeight - viewHeight;
      const pageProgress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;
      page.style.setProperty("--page-progress", String(pageProgress));

      let current = sections[0];
      sectionElements.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= viewHeight * 0.42) current = sections[index];
      });
      setActiveSection(pageProgress >= 0.995 ? sections[sections.length - 1] : current);

      const hero = sectionElements[0]?.getBoundingClientRect();
      const heroProgress = hero && !reduceMotion.matches ? Math.min(1, Math.max(0, -hero.top / hero.height)) : 0;
      const backgroundProgress = hero && !reduceMotion.matches ? Math.min(1, Math.max(0, window.scrollY / hero.height)) : 0;
      page.style.setProperty("--hero-shift", `${heroProgress * 100}px`);
      page.style.setProperty("--portrait-angle", `${4 - heroProgress * 12}deg`);
      page.style.setProperty("--hero-background-progress", String(backgroundProgress));

      const journey = sectionElements[2]?.getBoundingClientRect();
      if (journey) {
        const ratio = (viewHeight * 0.65 - journey.top) / journey.height;
        page.style.setProperty("--timeline-progress", `${Math.min(1, Math.max(0, ratio)) * 100}%`);
      }

      const bounds = scene.getBoundingClientRect();
      if (!context || bounds.bottom < 0 || bounds.top > viewHeight) return;
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(canvas.clientWidth * pixelRatio);
      const height = Math.round(canvas.clientHeight * pixelRatio);
      if (!width || !height) return;
      const progress = reduceMotion.matches ? 0.38 : Math.min(1, Math.max(0, (viewHeight - bounds.top) / (bounds.height + viewHeight)));
      if (width === canvas.width && height === canvas.height && lastProgress === progress) return;
      canvas.width = width;
      canvas.height = height;
      drawForm(canvas, context, progress);
      lastProgress = progress;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(page);
    const hideCursor = () => {
      delete page.dataset.cursor;
    };
    const moveCursor = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !finePointer.matches || reduceMotion.matches || document.querySelector("dialog[open]")) {
        hideCursor();
        return;
      }

      const control = event.target instanceof Element && event.target.closest("a, button:not(:disabled)");
      cursor.dataset.kind = control ? (control instanceof HTMLAnchorElement && control.target === "_blank" ? "external" : "control") : "default";
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      page.dataset.cursor = "on";
    };

    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.12 });

    function observeReveals() {
      page?.querySelectorAll("[data-reveal]:not(.revealed)").forEach((item) => revealObserver.observe(item));
    }

    const contentObserver = new MutationObserver((entries) => {
      for (const entry of entries) {
        if (entry.type === "childList") {
          entry.removedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            revealObserver.unobserve(node);
            node.querySelectorAll("[data-reveal]").forEach((item) => revealObserver.unobserve(item));
          });
        } else if (entry.target instanceof HTMLDialogElement && entry.target.open) {
          hideCursor();
        }
      }
      observeReveals();
      schedule();
    });
    contentObserver.observe(page, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    observeReveals();
    schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("blur", hideCursor);
    document.documentElement.addEventListener("pointerleave", hideCursor);
    reduceMotion.addEventListener("change", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", moveCursor);
      window.removeEventListener("blur", hideCursor);
      document.documentElement.removeEventListener("pointerleave", hideCursor);
      reduceMotion.removeEventListener("change", schedule);
      window.cancelAnimationFrame(frame);
      contentObserver.disconnect();
      revealObserver.disconnect();
      resize.disconnect();
      hideCursor();
    };
  }, [pageRef, canvasRef, cursorRef, sections]);

  return activeSection;
}
