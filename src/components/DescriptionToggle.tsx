"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";

type DescriptionToggleProps = {
  targetName: string;
  openLabel?: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  buttonClassName?: string;
  panelClassName?: string;
};

function cssEscape(value: string) {
  const esc = (globalThis as any).CSS?.escape;
  return typeof esc === "function" ? esc(value) : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

export function DescriptionToggle({
  targetName,
  openLabel = "Read More",
  closeLabel = "Read Less",
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

    const selector = `.${cssEscape(targetName)}`;
    const target = root.closest(selector);

    if (!(target instanceof HTMLElement)) return;

    target.classList.toggle("open", open);

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