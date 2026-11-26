import { type RefObject, useLayoutEffect } from "react";

export function useJourneyDeck(ref: RefObject<HTMLElement | null>, filter: string, language: string) {
  useLayoutEffect(() => {
    const section = ref.current;
    const deck = section?.querySelector<HTMLOListElement>(".journey-deck");
    if (!section || !deck) return;

    const cards = Array.from(deck.querySelectorAll<HTMLElement>(".journey-card"));
    if (!cards.length) return;

    const counter = section.querySelector(".journey-position");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lastProgress: number[] = [];
    let frame = 0;
    let lastFront = -1;
    let lastDrift = Number.NaN;

    cards.forEach((card, index) => card.style.setProperty("--card-order", String(cards.length - index)));

    const draw = () => {
      frame = 0;
      if (reducedMotion.matches) return;

      const viewportHeight = window.innerHeight;
      const revealStart = viewportHeight - 24;
      const revealDistance = Math.min(224, viewportHeight * 0.3);
      const { top: deckTop, height: deckHeight } = deck.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (viewportHeight - deckTop) / (deckHeight + viewportHeight)));
      const drift = Math.round((progress - 0.5) * Math.min(220, window.innerWidth * 0.3));
      if (drift !== lastDrift) {
        section.style.setProperty("--journey-drift", `${drift}px`);
        lastDrift = drift;
      }
      const tops = cards.map((card) => deckTop + card.offsetTop);
      let front = 0;

      tops.forEach((top, index) => {
        if (top <= viewportHeight * 0.38) front = index;

        const progress = Math.min(1, Math.max(0, (revealStart - top) / revealDistance));
        if (progress === lastProgress[index]) return;

        lastProgress[index] = progress;
        const eased = progress * (2 - progress);
        cards[index].style.setProperty("--card-reveal", String(eased));
      });

      if (counter && front !== lastFront) {
        counter.textContent = `${front + 1} / ${cards.length}`;
        lastFront = front;
      }
    };

    const schedule = () => {
      if (!frame && !reducedMotion.matches) frame = window.requestAnimationFrame(draw);
    };

    const syncMotion = () => {
      section.toggleAttribute("data-scroll-reveal", !reducedMotion.matches);
      window.cancelAnimationFrame(frame);
      draw();
    };

    syncMotion();
    const resize = new ResizeObserver(schedule);
    resize.observe(deck);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    reducedMotion.addEventListener("change", syncMotion);

    return () => {
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      reducedMotion.removeEventListener("change", syncMotion);
      section.removeAttribute("data-scroll-reveal");
    };
  }, [ref, filter, language]);
}
