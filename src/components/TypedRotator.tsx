"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type TypedRotatorProps = {
  items: string[];

  /** Delay before the very first typing starts */
  startDelay?: number;

  /** Base per-character delay (typing) */
  typeSpeed?: number;

  /** Random +/- variance added to typeSpeed for a more human feel */
  typeVariance?: number;

  /** Per-character delay (deleting). Often faster than typing */
  deleteSpeed?: number;

  /** How long to hold the fully typed word before deleting */
  holdDelay?: number;

  /** How long to pause after fully deleting before typing next item */
  betweenDelay?: number;

  /** Loop forever */
  loop?: boolean;

  /** Cursor blink interval (ms). Set 0 to disable blink animation */
  cursorBlinkMs?: number;

  /** Cursor char */
  cursor?: string;

  /** If true, it deletes the previous string before typing next (default true) */
  deleteBetween?: boolean;

  /** Optional className */
  className?: string;

  /** Optional aria label */
  ariaLabel?: string;
};

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const randBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export default function TypedRotator({
  items,
  startDelay = 300,
  typeSpeed = 70,
  typeVariance = 25,
  deleteSpeed = 40,
  holdDelay = 900,
  betweenDelay = 250,
  loop = true,
  cursorBlinkMs = 520,
  cursor = "|",
  deleteBetween = true,
  className,
  ariaLabel = "Rotating typed text",
}: TypedRotatorProps) {
  const safeItems = useMemo(
    () => items.filter((s) => typeof s === "string" && s.length > 0),
    [items]
  );

  const [text, setText] = useState<string>("");
  const [index, setIndex] = useState<number>(0);
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);

  // StrictMode guard (dev)
  const didRunRef = useRef(false);

  // Cursor blinking
  useEffect(() => {
    if (!cursorBlinkMs || cursorBlinkMs <= 0) {
      setCursorVisible(true);
      return;
    }
    let id: number | undefined = window.setInterval(() => {
      setCursorVisible((v) => !v);
    }, cursorBlinkMs);

    return () => {
      if (id) window.clearInterval(id);
    };
  }, [cursorBlinkMs]);

  useEffect(() => {
    if (safeItems.length === 0) return;

    // Avoid double-run in React StrictMode (dev)
    if (didRunRef.current) return;
    didRunRef.current = true;

    let cancelled = false;

    const run = async () => {
      const reduced = prefersReducedMotion();

      // Reduced motion: just show first item (or all joined) and stop.
      if (reduced) {
        setText(safeItems[0] ?? "");
        return;
      }

      await sleep(startDelay);
      if (cancelled) return;

      let i = 0;

      while (!cancelled) {
        const current = safeItems[i]!;
        // TYPE
        for (let c = 0; c < current.length; c++) {
          if (cancelled) return;
          const next = current.slice(0, c + 1);
          setText(next);

          const jitter = randBetween(-typeVariance, typeVariance);
          await sleep(Math.max(20, typeSpeed + jitter));
        }

        if (cancelled) return;

        // HOLD
        await sleep(holdDelay);
        if (cancelled) return;

        const isLast = i === safeItems.length - 1;

        // Stop if not looping and we finished last item
        if (!loop && isLast) return;

        // DELETE
        if (deleteBetween) {
          for (let c = current.length; c >= 0; c--) {
            if (cancelled) return;
            setText(current.slice(0, c));
            await sleep(Math.max(10, deleteSpeed));
          }
        }

        if (cancelled) return;

        // BETWEEN
        await sleep(betweenDelay);

        // NEXT
        i = (i + 1) % safeItems.length;
        setIndex(i);
      }
    };

    void run();

    return () => {
      cancelled = true;
      didRunRef.current = false;
    };
  }, [
    safeItems,
    startDelay,
    typeSpeed,
    typeVariance,
    deleteSpeed,
    holdDelay,
    betweenDelay,
    loop,
    deleteBetween,
  ]);

  return (
    <span className={className} aria-label={ariaLabel}>
      <span aria-hidden="true">{text}</span>
      <span aria-hidden="true" style={{ opacity: cursorVisible ? 1 : 0 }}>
        {cursor}
      </span>

      {/* Helpful for screen readers (no constant updates) */}
      <span style={srOnly}>{safeItems[index] ?? ""}</span>
    </span>
  );
}

// Minimal sr-only style without needing a CSS file
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};