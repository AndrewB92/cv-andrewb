"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./RainbowGlowLink.module.css";

type RainbowGlowLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function RainbowGlowLink({ href, children, className = "" }: RainbowGlowLinkProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let rect: DOMRect | null = null;
    let raf = 0;

    let tx = 0, ty = 0;
    let x = 0, y = 0;

    // Lower = snappier, higher = smoother
    const SMOOTH = 0.22;

    const recache = () => {
      rect = el.getBoundingClientRect();
      // start centered so it looks nice on enter
      tx = rect.width * 0.5;
      ty = rect.height * 0.5;
      x = tx; y = ty;
      el.style.setProperty("--pointer-x", `${x.toFixed(2)}px`);
      el.style.setProperty("--pointer-y", `${y.toFixed(2)}px`);
    };

    const loop = () => {
      raf = 0;

      // smooth
      x += (tx - x) * SMOOTH;
      y += (ty - y) * SMOOTH;

      el.style.setProperty("--pointer-x", `${x.toFixed(2)}px`);
      el.style.setProperty("--pointer-y", `${y.toFixed(2)}px`);

      // keep animating until close to target
      if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) {
        raf = requestAnimationFrame(loop);
      }
    };

    const requestLoop = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onEnter = () => {
      recache();
      requestLoop();
    };

    const onMove = (e: PointerEvent) => {
      if (!rect) return;

      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;

      // clamp
      tx = nx < 0 ? 0 : nx > rect.width ? rect.width : nx;
      ty = ny < 0 ? 0 : ny > rect.height ? rect.height : ny;

      requestLoop();
    };

    const onLeave = () => {
      if (!rect) return;
      tx = rect.width * 0.5;
      ty = rect.height * 0.5;
      requestLoop();
    };

    // Events
    el.addEventListener("pointerenter", onEnter, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });

    // Resize: recache next enter, but also handle active hover resizes
    const onResize = () => { rect = null; };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span ref={wrapRef} className={`${styles.wrapper} ${className}`}>
      <Link href={href} className={styles.link}>
        {children}
      </Link>
      <span className={styles.bg} aria-hidden="true" />
      <span className={styles.glow} aria-hidden="true" />
    </span>
  );
}