"use client";

import { useEffect, useMemo, useRef } from "react";
import styles from "./MagicText.module.css";
import type { ReactNode } from "react";

type MagicTextProps = {
  // children: string;          // the gradient text itself (e.g. "magic")
  children: ReactNode;
  before?: string;           // optional plain text before
  stars?: number;            // default 3
  intervalMs?: number;       // default 1000
  staggerMs?: number;        // default interval/3
  className?: string;        // optional wrapper class
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function MagicText({
  children,
  before,
  stars = 3,
  intervalMs = 1000,
  staggerMs,
  className = "",
}: MagicTextProps) {
  const starElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const dueAtRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const svgStars = useMemo(() => Array.from({ length: stars }, (_, i) => i), [stars]);
  const perStarStagger = staggerMs ?? Math.max(0, Math.floor(intervalMs / 3));

  useEffect(() => {
    const starsEls = starElsRef.current.filter(Boolean) as HTMLSpanElement[];
    if (!starsEls.length) return;

    const now = performance.now();
    dueAtRef.current = starsEls.map((_, i) => now + i * perStarStagger);

    const animateStar = (star: HTMLSpanElement) => {
      star.style.setProperty("--star-left", `${randInt(-10, 100)}%`);
      star.style.setProperty("--star-top", `${randInt(-40, 80)}%`);

      // restart CSS animation without forcing reflow:
      // toggle a data-attr so the animation-name changes
      const next = star.dataset.a === "1" ? "0" : "1";
      star.dataset.a = next;
    };

    const tick = (t: number) => {
      const dueAt = dueAtRef.current;

      for (let i = 0; i < starsEls.length; i++) {
        if (t >= dueAt[i]) {
          animateStar(starsEls[i]);
          dueAt[i] = t + intervalMs; // schedule next run
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // start loop
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [intervalMs, perStarStagger, stars]);

  return (
    <span className={`${styles.magicWrap} ${className}`.trim()}>
      {before ? <span className={styles.before}>{before} </span> : null}

      <span className={styles.magic}>
        {svgStars.map((i) => (
          <span
            key={i}
            ref={(el) => {
              starElsRef.current[i] = el;
            }}
            className={styles.magicStar}
            data-a="0"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7-6.2-3.4-6.2 3.4 1.2-7-5-4.9 7.1-.7L12 2z" />
            </svg>
          </span>
        ))}

        <span className={styles.magicText}>{children}</span>
      </span>
    </span>
  );
}