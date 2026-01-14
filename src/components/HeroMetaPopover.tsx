"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function HeroMetaPopover({ children, className }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const popoverId = useId();

  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  // Close on click/tap outside
  useEffect(() => {
    if (!open) return;

    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      // If click is outside wrapper, close
      if (wrapRef.current && !wrapRef.current.contains(target)) {
        close();
      }
    };

    // Capture phase helps when other handlers stopPropagation
    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        // return focus to button for good UX
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Optional: focus panel when opened (helps keyboard users)
  useEffect(() => {
    if (!open) return;
    // Wait a tick so the panel is in the DOM
    const t = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div ref={wrapRef} className={className} data-popover-root>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Hide details" : "Show details"}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={toggle}
        data-popover-trigger
      >
        {/* Simple info icon (no deps) */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 17v-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 8.5h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={popoverId}
          ref={panelRef}
          role="dialog"
          aria-label="Short facts"
          tabIndex={-1}
          data-popover-panel
        >
          {children}
        </div>
      )}
    </div>
  );
}