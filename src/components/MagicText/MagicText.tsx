"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./MagicText.module.css";
import type { ReactNode } from "react";

type MagicTextProps = {
  children: ReactNode;
  before?: string;
  stars?: number;
  intervalMs?: number;
  staggerMs?: number;
  className?: string;

  /** Optional: how much of the element should be visible before we animate */
  threshold?: number;
  /** Optional: start animating slightly before it enters view */
  rootMargin?: string;
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function MagicText({
  children,
  before,
  stars = 3,
  intervalMs = 1000,
  staggerMs,
  className = "",
  threshold = 0.15,
  rootMargin = "120px",
}: MagicTextProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const starElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const dueAtRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const [inView, setInView] = useState(true); // default true to avoid “dead” on first paint
  const reduceMotionRef = useRef(false);

  const svgStars = useMemo(() => Array.from({ length: stars }, (_, i) => i), [stars]);
  const perStarStagger = staggerMs ?? Math.max(0, Math.floor(intervalMs / 3));

  // Observe visibility
  useEffect(() => {
    reduceMotionRef.current = prefersReducedMotion();

    const el = wrapRef.current;
    if (!el) return;

    // If reduced motion: don’t animate at all.
    if (reduceMotionRef.current) {
      setInView(false);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(!!entry?.isIntersecting);
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold]);

  // Star loop: only run when inView
  useEffect(() => {
    if (!inView) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const starsEls = starElsRef.current.filter(Boolean) as HTMLSpanElement[];
    if (!starsEls.length) return;

    const animateStar = (star: HTMLSpanElement) => {
      star.style.setProperty("--star-left", `${randInt(-10, 100)}%`);
      star.style.setProperty("--star-top", `${randInt(-40, 80)}%`);
      star.dataset.a = star.dataset.a === "1" ? "0" : "1";
    };

    const now = performance.now();
    dueAtRef.current = starsEls.map((_, i) => now + i * perStarStagger);

    const tick = (t: number) => {
      const dueAt = dueAtRef.current;

      for (let i = 0; i < starsEls.length; i++) {
        if (t >= dueAt[i]) {
          animateStar(starsEls[i]);
          dueAt[i] = t + intervalMs;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [inView, intervalMs, perStarStagger, stars]);

  return (
    <span
      ref={wrapRef}
      className={`${styles.magicWrap} ${className}`.trim()}
      data-paused={inView ? "0" : "1"}
    >
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