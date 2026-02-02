"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";

type DescriptionToggleProps = {
  /** CSS Modules class string of the element that should receive `.open` (e.g. styles.projectCard) */
  targetName: string;

  /** Button label text */
  openLabel?: string;
  closeLabel?: string;

  /** Optional initial state */
  defaultOpen?: boolean;

  /** The expandable content (can be <p>, <ul>, anything) */
  children: React.ReactNode;

  /** Optional extra class for the button itself */
  buttonClassName?: string;

  /** Optional extra class for the panel container */
  panelClassName?: string;
};

function cssEscape(value: string) {
  // CSS.escape is widely supported, but keep a safe fallback.
  // If you need full edge-case escaping, you can pull a tiny polyfill later.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const esc = (globalThis as any).CSS?.escape;
  return typeof esc === "function" ? esc(value) : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

export function DescriptionToggle({
  targetName,
  openLabel = "Open Description",
  closeLabel = "Close Description",
  defaultOpen = false,
  children,
  buttonClassName,
  panelClassName,
}: DescriptionToggleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const reactId = useId();
  const panelId = useMemo(() => `project-desc-${reactId.replace(/[:]/g, "")}`, [reactId]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Find nearest ancestor with the (hashed) CSS Modules class string you pass in.
    // Example: targetName = "page-module___8aEwW__projectCard"
    const selector = `.${cssEscape(targetName)}`;
    const target = root.closest(selector);

    if (!(target instanceof HTMLElement)) return;

    target.classList.toggle("open", open);

    // Cleanup guarantees we don't leave `.open` behind if component unmounts while open
    return () => {
      target.classList.remove("open");
    };
  }, [open, targetName]);

  return (
    <div className="projectDescriptionWrapper" ref={rootRef}>
      <div
        id={panelId}
        className={panelClassName ?? "projectDescription"}
        aria-hidden={!open}
      >
        {children}
      </div>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        {open ? closeLabel : openLabel}
      </button>
    </div>
  );
}