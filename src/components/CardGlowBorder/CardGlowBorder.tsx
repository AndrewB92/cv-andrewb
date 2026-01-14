"use client";

import React, { useEffect, useRef } from "react";
import styles from "./CardGlowBorder.module.css";

type Props = {
  children?: React.ReactNode;
  className?: string;

  /** Optional sizing via props (falls back to CSS defaults) */
  width?: number;
  height?: number;

  /** Optional cosmetics */
  radius?: number;       // px
  borderWidth?: number;  // px
  glowSize?: number;     // px (radial size)
};

export default function CardGlowBorder({
  children,
  className = "",
  width,
  height,
  radius,
  borderWidth,
  glowSize,
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

  const styleVars = {
    ...(width ? ({ ["--card-w" as any]: `${width}px` } as const) : null),
    ...(height ? ({ ["--card-h" as any]: `${height}px` } as const) : null),
    ...(typeof radius === "number"
      ? ({ ["--radius" as any]: `${radius}px` } as const)
      : null),
    ...(typeof borderWidth === "number"
      ? ({ ["--border-w" as any]: `${borderWidth}px` } as const)
      : null),
    ...(typeof glowSize === "number"
      ? ({ ["--glow-size" as any]: `${glowSize}px` } as const)
      : null),
  } as React.CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`${styles.card} ${className}`}
      style={styleVars}
    >
      {children}
    </div>
  );
}