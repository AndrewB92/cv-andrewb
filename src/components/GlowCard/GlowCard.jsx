"use client";

import { useEffect, useRef } from "react";
import styles from "./GlowCard.module.css";

/**
 * GlowCard (optimized)
 * - No intro animation
 * - Pointer listeners only while hovered
 * - Cached geometry (ResizeObserver + scroll capture)
 * - Single RAF loop (latest event), optional coalesced events
 * - Thresholded CSS var updates to reduce style churn
 */
export default function GlowCard({ children, className = "" }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    // If reduced motion, we keep the card static (no pointer tracking).
    if (reduceMotion) return;

    // ---------- helpers ----------
    const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
    const angleFrom = (dx, dy) => {
      if (dx === 0 && dy === 0) return 0;
      let a = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (a < 0) a += 360;
      return a;
    };

    // ---------- cached geometry ----------
    let rect = null;
    let cx = 0;
    let cy = 0;

    const measure = () => {
      rect = card.getBoundingClientRect();
      cx = rect.width / 2;
      cy = rect.height / 2;
    };

    // Initial measure
    measure();

    // Keep rect fresh when card changes size
    const ro = new ResizeObserver(() => measure());
    ro.observe(card);

    // Keep rect fresh when layout shifts due to scroll
    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    // ---------- thresholded CSS var writes ----------
    const EPS_PCT = 0.15;  // percent
    const EPS_DEG = 0.4;   // degrees
    const EPS_EDGE = 0.25; // 0..100

    const prev = { x: null, y: null, a: null, d: null };

    const setVarIfChanged = (key, next, prevKey, eps, fmt) => {
      const prevVal = prev[prevKey];
      if (prevVal === null || Math.abs(prevVal - next) > eps) {
        card.style.setProperty(key, fmt(next));
        prev[prevKey] = next;
      }
    };

    const commitVars = (xPct, yPct, angleDeg, edge100) => {
      setVarIfChanged("--pointer-x", xPct, "x", EPS_PCT, (v) => `${v.toFixed(3)}%`);
      setVarIfChanged("--pointer-y", yPct, "y", EPS_PCT, (v) => `${v.toFixed(3)}%`);
      setVarIfChanged("--pointer-°", angleDeg, "a", EPS_DEG, (v) => `${v.toFixed(3)}deg`);
      setVarIfChanged("--pointer-d", edge100, "d", EPS_EDGE, (v) => `${v.toFixed(3)}`);
    };

    // Set sane defaults to avoid first-hover jump
    commitVars(50, 50, 45, 0);

    // ---------- RAF loop ----------
    let rafId = 0;
    let lastEvent = null;

    const frame = () => {
      rafId = 0;
      if (!lastEvent || !rect) return;

      // Use coalesced events if available, still one RAF.
      const events =
        typeof lastEvent.getCoalescedEvents === "function"
          ? lastEvent.getCoalescedEvents()
          : [lastEvent];

      const e = events[events.length - 1];

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xPct = clamp((100 / rect.width) * x);
      const yPct = clamp((100 / rect.height) * y);

      const dx = x - cx;
      const dy = y - cy;

      // closeness to edge in [0..1] => [0..100]
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);

      const edge100 = clamp(1 / Math.min(kx, ky), 0, 1) * 100;
      const angleDeg = angleFrom(dx, dy);

      commitVars(xPct, yPct, angleDeg, edge100);
    };

    const requestFrame = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(frame);
    };

    const onPointerMove = (e) => {
      lastEvent = e;
      requestFrame();
    };

    // Attach pointermove only while hovered (major CPU win)
    const onEnter = () => {
      measure();
      card.addEventListener("pointermove", onPointerMove, { passive: true });
    };

    const onLeave = () => {
      card.removeEventListener("pointermove", onPointerMove);
      lastEvent = null;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    card.addEventListener("pointerenter", onEnter, { passive: true });
    card.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll, true);

      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      card.removeEventListener("pointermove", onPointerMove);

      lastEvent = null;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={cardRef} className={`${styles.card} ${className}`}>
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>{children}</div>
    </div>
  );
}