"use client";

import React, { useEffect, useRef } from "react";
import styles from "./CardGlowBorder.module.css";

type Props = {
  children?: React.ReactNode;
  className?: string;
  /** Optional: set fixed size via props, otherwise use CSS defaults */
  width?: number;
  height?: number;
};

export default function CardGlowBorder({
  children,
  className = "",
  width,
  height,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduceMotion) return;

    let raf = 0;
    let lastEvent: PointerEvent | null = null;
    let rect: DOMRect | null = null;

    const measure = () => {
      rect = el.getBoundingClientRect();
    };

    const apply = (e: PointerEvent) => {
      if (!rect) measure();
      if (!rect) return;

      // Use latest coalesced event if supported (still one RAF)
      const events =
        typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
      const ev = events[events.length - 1];

      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      el.style.setProperty("--mouse-x", `${x.toFixed(2)}px`);
      el.style.setProperty("--mouse-y", `${y.toFixed(2)}px`);
    };

    const onMove = (e: PointerEvent) => {
      lastEvent = e;
      if (raf) return;

      raf = requestAnimationFrame(() => {
        raf = 0;
        if (lastEvent) apply(lastEvent);
        lastEvent = null;
      });
    };

    const onEnter = () => {
      measure();
      el.addEventListener("pointermove", onMove, { passive: true });
    };

    const onLeave = () => {
      el.removeEventListener("pointermove", onMove);
      rect = null;
      lastEvent = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // Keep rect fresh on scroll/resize (only while hovered would be even more strict,
    // but this is already light because we only measure on enter + these)
    const onScroll = () => measure();
    const onResize = () => measure();

    el.addEventListener("pointerenter", onEnter, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);

      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.cardGlowBorder} ${className}`}
      style={
        {
          ...(width ? { ["--card-w" as any]: `${width}px` } : null),
          ...(height ? { ["--card-h" as any]: `${height}px` } : null),
        } as React.CSSProperties
      }
    >
      <div className={styles.cardMiddle}>
        <div className={styles.cardContent}>{children}</div>
      </div>
    </div>
  );
}