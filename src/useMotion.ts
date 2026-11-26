import { type RefObject, useEffect, useState } from "react";

function drawForm(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, progress: number,
  rotation: number, inclination: number, pointer: { x: number; y: number }) {
  const { width, height } = canvas;
  const size = Math.min(width, height) * 0.30;
  const angle = progress * Math.PI * 2;
  const direction = angle + rotation + pointer.x * 0.38;
  const tilt = 0.75 + Math.sin(angle) * 0.46 + inclination + pointer.y * 0.28;
  const centerX = width * (0.65 + pointer.x * 0.065);
  const centerY = height * (0.41 + pointer.y * 0.05);
  const sinTilt = Math.sin(tilt);
  const cosTilt = Math.cos(tilt);
  const sinDirection = Math.sin(direction);
  const cosDirection = Math.cos(direction);
  const morph = Math.sin(Math.PI * progress) ** 2;
  const twist = Math.min(1, Math.abs(rotation) * 0.3 + Math.abs(inclination) * 0.65);
  const rows = 32;
  const columns = 56;
  const mesh = Array.from({ length: rows + 1 }, (_, row) => {
    const v = row * Math.PI * 2 / rows;
    return Array.from({ length: columns + 1 }, (_, column) => {
      const u = column * Math.PI * 2 / columns;
      const phase = v + twist * Math.sin(u * 3) * 1.15;
      const tube = 0.36 + morph * Math.cos(u * 3 + angle) * 0.22;
      const radius = 1 + tube * Math.cos(phase) + twist * Math.cos(u * 3) * 0.19;
      const x = radius * Math.cos(u);
      const y = radius * Math.sin(u);
      const z = tube * Math.sin(phase) + (morph * 0.72 + twist * 0.48) * Math.sin(u * 3);
      const depth = y * sinTilt + z * cosTilt;
      const vertical = y * cosTilt - z * sinTilt;
      const scale = size * 4 / (4 + depth);
      return [
        centerX + (x * cosDirection - vertical * sinDirection) * scale,
        centerY + (x * sinDirection + vertical * cosDirection) * scale,
      ] as const;
    });
  });

  context.clearRect(0, 0, width, height);
  context.lineWidth = Math.max(1, size / 190);
  context.strokeStyle = `rgba(${221 - twist * 20}, ${255 - twist * 71}, ${83 + twist * 172}, 0.72)`;
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
    const work = scene?.closest(".work");
    if (!page || !canvas || !cursor || !scene || !work) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const context = canvas.getContext("2d");
    const sectionElements = sections.map((id) => document.getElementById(id));
    const canvasEvents = new AbortController();
    let drag: { id: number; x: number; y: number } | undefined;
    let frame = 0;
    let lastProgress = -1;
    let rotation = 0;
    let inclination = 0;
    let lastRotation = 0;
    let lastInclination = 0;
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    const lastPointer = { x: 0, y: 0 };
    let lastGrid: HTMLElement | null = null;
    let lastGridTop = Number.NaN;
    let lastGridWidth = 0;
    let lastGridHeight = 0;
    let lastViewportHeight = 0;

    const updateProjectEntry = (viewHeight: number) => {
      const grid = work.querySelector<HTMLElement>(".project-grid");
      if (!grid) return;
      const { top, width, height } = grid.getBoundingClientRect();
      if (grid === lastGrid && top === lastGridTop && width === lastGridWidth &&
        height === lastGridHeight && viewHeight === lastViewportHeight) return;
      lastGrid = grid;
      lastGridTop = top;
      lastGridWidth = width;
      lastGridHeight = height;
      lastViewportHeight = viewHeight;

      const distance = Math.min(255, viewHeight * 0.32);
      for (const item of grid.children) {
        if (!(item instanceof HTMLElement)) continue;
        const entry = Math.min(1, Math.max(0, (viewHeight + 22 - top - item.offsetTop) / distance));
        item.style.setProperty("--project-entry", String(entry));
      }
    };

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
      if (bounds.bottom < 0 || bounds.top > viewHeight + 150) return;
      updateProjectEntry(viewHeight);
      if (!context) return;

      if (reduceMotion.matches) {
        pointerTarget.x = 0;
        pointerTarget.y = 0;
      }
      const dx = pointerTarget.x - pointer.x;
      const dy = pointerTarget.y - pointer.y;
      if (reduceMotion.matches || Math.max(Math.abs(dx), Math.abs(dy)) < 0.006) {
        pointer.x = pointerTarget.x;
        pointer.y = pointerTarget.y;
      } else {
        pointer.x += dx * 0.18;
        pointer.y += dy * 0.18;
        schedule();
      }

      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(canvas.clientWidth * pixelRatio);
      const height = Math.round(canvas.clientHeight * pixelRatio);
      if (!width || !height) return;
      const progress = reduceMotion.matches ? 0.38 : Math.min(1, Math.max(0, (viewHeight - bounds.top) / (bounds.height + viewHeight)));
      if (width === canvas.width && height === canvas.height && lastProgress === progress &&
        lastRotation === rotation && lastInclination === inclination && lastPointer.x === pointer.x && lastPointer.y === pointer.y) return;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      drawForm(canvas, context, progress, rotation, inclination, pointer);
      lastProgress = progress;
      lastRotation = rotation;
      lastInclination = inclination;
      lastPointer.x = pointer.x;
      lastPointer.y = pointer.y;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const moveForm = (horizontal: number, vertical: number) => {
      rotation = Math.min(Math.PI, Math.max(-Math.PI, rotation + horizontal));
      inclination = Math.min(1.2, Math.max(-1.2, inclination + vertical));
      schedule();
    };

    const resetPointer = () => {
      if (!pointerTarget.x && !pointerTarget.y) return;
      pointerTarget.x = 0;
      pointerTarget.y = 0;
      schedule();
    };

    const hideCursor = () => {
      delete page.dataset.cursor;
      resetPointer();
    };
    const moveCursor = (event: PointerEvent, target = event.target) => {
      if (!(target instanceof Element) || event.pointerType !== "mouse" || !finePointer.matches || reduceMotion.matches || document.querySelector("dialog[open]")) {
        hideCursor();
        return;
      }

      if (work.contains(target)) {
        pointerTarget.x = 2 * event.clientX / window.innerWidth - 1;
        pointerTarget.y = 2 * event.clientY / window.innerHeight - 1;
        schedule();
      } else {
        resetPointer();
      }

      if (target === canvas) {
        cursor.dataset.kind = drag ? "shape-dragging" : "shape";
      } else {
        const control = target.closest("a, button:not(:disabled)");
        cursor.dataset.kind = control ? (control instanceof HTMLAnchorElement && control.target === "_blank" ? "external" : "control") : "default";
      }
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      page.dataset.cursor = "on";
    };

    const canvasListener = { signal: canvasEvents.signal };
    canvas.addEventListener("pointerdown", (event) => {
      if (drag || !event.isPrimary || event.button !== 0) return;
      canvas.setPointerCapture(event.pointerId);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setAttribute("data-dragging", "");
      moveCursor(event);
    }, canvasListener);
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId !== drag?.id) return;
      moveForm((event.clientX - drag.x) * 0.012, (event.clientY - drag.y) * 0.009);
      drag.x = event.clientX;
      drag.y = event.clientY;
    }, canvasListener);
    canvas.addEventListener("lostpointercapture", (event) => {
      if (event.pointerId !== drag?.id) return;
      drag = undefined;
      canvas.removeAttribute("data-dragging");
      moveCursor(event, document.elementFromPoint(event.clientX, event.clientY));
    }, canvasListener);
    canvas.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      switch (event.key) {
        case "ArrowLeft": moveForm(-0.18, 0); break;
        case "ArrowRight": moveForm(0.18, 0); break;
        case "ArrowUp": moveForm(0, -0.14); break;
        case "ArrowDown": moveForm(0, 0.14); break;
        case "Home":
          rotation = 0;
          inclination = 0;
          schedule();
          break;
        default: return;
      }
      event.preventDefault();
    }, canvasListener);

    const resize = new ResizeObserver(schedule);
    resize.observe(page);

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
      canvasEvents.abort();
      canvas.removeAttribute("data-dragging");
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
      delete page.dataset.cursor;
    };
  }, [pageRef, canvasRef, cursorRef, sections]);

  return activeSection;
}
