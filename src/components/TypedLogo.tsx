"use client";

import { useEffect, useRef } from "react";

type TypedLogoProps = {
  text?: string;
  startDelay?: number;
  baseSpeed?: number;
  variance?: number;
  blinkMs?: number;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const randBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function isHTMLElement(v: Element | null): v is HTMLElement {
  return v instanceof HTMLElement;
}

export default function TypedLogo({
  text = "andrew.dev",
  startDelay = 450,
  baseSpeed = 120,
  variance = 35,
  blinkMs = 520,
}: TypedLogoProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Prevent duplicate runs in React StrictMode (dev)
  const didRunRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // StrictMode in dev mounts/effects twice; guard to avoid double-typing.
    if (didRunRef.current) return;
    didRunRef.current = true;

    const prefixEl = root.querySelector(".cv-logo__prefix");
    const typedEl = root.querySelector(".cv-logo__typed");
    const suffixEl = root.querySelector(".cv-logo__suffix");
    const cursorEl = root.querySelector(".cv-logo__cursor");

    if (
      !isHTMLElement(prefixEl) ||
      !isHTMLElement(typedEl) ||
      !isHTMLElement(suffixEl) ||
      !isHTMLElement(cursorEl)
    ) {
      return;
    }

    const prefix = prefixEl;
    const typed = typedEl;
    const suffix = suffixEl;
    const cursor = cursorEl;

    const reducedMotion =
      typeof window !== "undefined" &&
      "matchMedia" in window &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let blinkTimer: number | null = null;
    let cancelled = false;

    const placeCursorBetween = () => {
      // Ensure order: prefix, typed, cursor, suffix
      typed.after(cursor);
      cursor.after(suffix);
      // Now ensure cursor is before suffix:
      suffix.before(cursor);
    };

    const placeCursorAtEnd = () => {
      // Order: prefix, typed, suffix, cursor
      suffix.after(cursor);
    };

    const startBlink = () => {
      if (blinkTimer !== null) return;
      cursor.style.opacity = "1";
      blinkTimer = window.setInterval(() => {
        cursor.style.opacity = cursor.style.opacity === "0" ? "1" : "0";
      }, blinkMs);
    };

    const stopBlink = () => {
      if (blinkTimer !== null) {
        window.clearInterval(blinkTimer);
        blinkTimer = null;
      }
      cursor.style.opacity = "1";
    };

    const reset = () => {
      stopBlink();
      typed.textContent = "";
      cursor.style.opacity = "1";
      placeCursorBetween();
    };

    const play = async () => {
      reset();

      if (reducedMotion) {
        typed.textContent = text;
        placeCursorAtEnd();
        stopBlink(); // solid cursor for reduced motion
        return;
      }

      startBlink();
      await sleep(startDelay);
      if (cancelled) return;

      for (let i = 0; i < text.length; i++) {
        if (cancelled) return;

        const ch = text[i]!;
        typed.textContent += ch;

        const extraPause = ch === "." ? 140 : 0;
        const delay = baseSpeed + randBetween(-variance, variance) + extraPause;

        await sleep(Math.max(40, delay));
      }

      if (cancelled) return;

      placeCursorAtEnd();
      cursor.style.opacity = "1";
      // Keep blinking forever
    };

    void play();

    return () => {
      cancelled = true;
      stopBlink();
      // Allow re-run if component unmounts/remounts (route changes)
      didRunRef.current = false;
    };
  }, [text, startDelay, baseSpeed, variance, blinkMs]);

  return (
    <div className="cv-logo" ref={rootRef} aria-label="<andrew.dev/> logo">
      <span className="cv-logo__prefix">&lt;</span>
      <span className="cv-logo__typed" aria-hidden="true" />
      <span className="cv-logo__suffix">/&gt;</span>
      <span className="cv-logo__cursor" aria-hidden="true">
        |
      </span>
    </div>
  );
}
