import { type CSSProperties, type PointerEvent, useLayoutEffect, useRef } from "react";

const characterTime = 70;
const linePause = 460;

function TypedText({ text, startsAt }: { text: string; startsAt: number }) {
  return <>
    <span className="terminal-readable">{text}</span>
    <span aria-hidden="true">
      {Array.from(text).map((character, index) => (
        <span className="terminal-character" key={index}
          style={{ "--type-at": `${startsAt + index * characterTime}ms` } as CSSProperties}>{character}</span>
      ))}
    </span>
  </>;
}

function moveLight(event: PointerEvent<HTMLDialogElement>) {
  const terminal = event.currentTarget;
  terminal.style.setProperty("--light-x", `${event.clientX}px`);
  terminal.style.setProperty("--light-y", `${event.clientY}px`);
  terminal.dataset.light = "on";
}

function hideLight(event: PointerEvent<HTMLDialogElement>) {
  delete event.currentTarget.dataset.light;
}

export function TerminalIntro({ name, role, location, onClose }: {
  name: string;
  role: string;
  location: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const command = "whoami";
  const commandStart = 280;
  const nameStart = commandStart + command.length * characterTime + linePause;
  const roleStart = nameStart + name.length * characterTime + linePause;
  const locationStart = roleStart + role.length * characterTime + linePause;
  const readyAt = locationStart + location.length * characterTime + linePause;

  useLayoutEffect(() => {
    const terminal = dialog.current;
    if (!terminal) return;

    if (!terminal.open) terminal.showModal();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => terminal.close(), reducedMotion ? 4200 : readyAt + 2550);

    return () => window.clearTimeout(timeout);
  }, [readyAt]);

  return (
    <dialog className="terminal-intro" ref={dialog} aria-labelledby="terminal-intro-name"
      aria-describedby="terminal-intro-role terminal-intro-location" onClose={onClose}
      onPointerMove={moveLight} onPointerDown={moveLight} onPointerLeave={hideLight} onPointerCancel={hideLight}
      style={{ "--type-step": `${characterTime}ms`, "--ready-at": `${readyAt}ms` } as CSSProperties}>
      <div className="terminal-content">
        <p className="terminal-prompt" aria-hidden="true">$ <TypedText text={command} startsAt={commandStart} /></p>
        <p className="terminal-name" id="terminal-intro-name"><TypedText text={name} startsAt={nameStart} /></p>
        <p className="terminal-role" id="terminal-intro-role"><TypedText text={role} startsAt={roleStart} /></p>
        <p className="terminal-location" id="terminal-intro-location"><TypedText text={location} startsAt={locationStart} /></p>
        <p className="terminal-ready" aria-hidden="true">$ <span className="terminal-cursor" /></p>
      </div>
    </dialog>
  );
}
