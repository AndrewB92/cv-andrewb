"use client";

import { useEffect, useRef } from "react";
import styles from "./CustomCursor.module.css";

type Options = {
  particleCount?: number;
};

export function CustomCursor({ particleCount = 7 }: Options) {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const particleContainerRef = useRef<HTMLSpanElement | null>(null);

  // store latest pointer coords without causing re-renders
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  // keep particle related handles for cleanup
  const particleAnimations = useRef<Animation[]>([]);
  const particleTimeouts = useRef<number[]>([]);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const particleContainer = particleContainerRef.current;
    if (!cursor || !dot || !particleContainer) return;

    // Optional: hide custom cursor on touch devices / coarse pointers
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    if (coarse) return;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    // --- Cursor move (one listener + rAF) ---
    const apply = () => {
      raf.current = null;

      const { x, y } = pos.current;

      // Big cursor follows pointer with transform only
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;

      // Small dot: can be either left/top or transform. Transform is cheaper & consistent.
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
    };

    const onPointerMove = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;

      if (raf.current == null) {
        raf.current = window.requestAnimationFrame(apply);
      }
    };

    // Click states
    const onPointerDown = () => {
      cursor.classList.add(styles.click);
      dot.classList.add(styles.dotActive);
    };
    const onPointerUp = () => {
      cursor.classList.remove(styles.click);
      dot.classList.remove(styles.dotActive);
    };

    // Hover detection via event delegation
    const interactiveSelector = [
      "a[href]",
      "button",
      "input",
      "select",
      "textarea",
      "label",
      "summary",
      "[role='button']",
      "[role='link']",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const isInteractive = (el: Element | null) =>
      !!el && (el as HTMLElement).closest(interactiveSelector);

    const onPointerOver = (e: PointerEvent) => {
      if (isInteractive(e.target as Element)) cursor.classList.add(styles.hover);
    };

    const onPointerOut = (e: PointerEvent) => {
      // If leaving an interactive element to a non-interactive element
      const related = (e.relatedTarget as Element | null) ?? null;
      if (!isInteractive(related)) cursor.classList.remove(styles.hover);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });

    // --- Particles ---
    if (!prefersReducedMotion) {
      const particles = Array.from({ length: particleCount }, (_, i) => {
        const p = document.createElement("div");
        p.className = styles.particle;

        const size = randInt(1, 3);
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;

        particleContainer.appendChild(p);
        return { el: p, i };
      });

      const placeParticle = (p: HTMLDivElement) => {
        // container is 30x30 by default, cheap to read
        const cw = particleContainer.clientWidth;
        const ch = particleContainer.clientHeight;

        const pw = p.offsetWidth || 1;
        const ph = p.offsetHeight || 1;

        const x = Math.max(0, Math.random() * (cw - pw));
        const y = Math.max(0, Math.random() * (ch - ph));

        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
      };

      const runLife = (p: HTMLDivElement, initialDelay = 0) => {
        placeParticle(p);

        const appearMs = randInt(250, 600);
        const liveMs = randInt(2200, 5200);
        const disappearMs = randInt(300, 700);
        const pauseMs = randInt(150, 600);
        const totalMs = appearMs + liveMs + disappearMs;

        const dx1 = randFloat(-14, 14);
        const dy1 = randFloat(-14, 14);
        const dx2 = randFloat(-22, 22);
        const dy2 = randFloat(-22, 22);

        const s0 = randFloat(0.35, 0.65);
        const s1 = randFloat(0.85, 1.15);
        const sMid = randFloat(s1 * 0.9, s1 * 1.05);
        const s2 = randFloat(0.45, 0.75);

        const o1 = randFloat(0.35, 0.8);

        const anim = p.animate(
          [
            { transform: `translate3d(0,0,0) scale(${s0})`, opacity: 0 },
            {
              offset: appearMs / totalMs,
              transform: `translate3d(${dx1}px, ${dy1}px, 0) scale(${s1})`,
              opacity: o1,
            },
            {
              offset: (appearMs + liveMs * 0.55) / totalMs,
              transform: `translate3d(${dx2}px, ${dy2}px, 0) scale(${sMid})`,
              opacity: o1,
            },
            {
              transform: `translate3d(${dx2 * 0.6}px, ${dy2 * 0.6}px, 0) scale(${s2})`,
              opacity: 0,
            },
          ],
          {
            duration: totalMs,
            delay: initialDelay,
            easing: "ease-in-out",
            fill: "forwards",
          }
        );

        particleAnimations.current.push(anim);

        anim.onfinish = () => {
          p.style.opacity = "0";
          p.style.transform = `translate3d(0,0,0) scale(${s0})`;

          const t = window.setTimeout(() => runLife(p, 0), pauseMs);
          particleTimeouts.current.push(t);
        };
      };

      particles.forEach(({ el, i }) => runLife(el, i * 120));

      // On resize, re-place particles (throttled)
      let resizeRaf: number | null = null;
      const onResize = () => {
        if (resizeRaf != null) return;
        resizeRaf = window.requestAnimationFrame(() => {
          resizeRaf = null;
          particles.forEach(({ el }) => placeParticle(el));
        });
      };
      window.addEventListener("resize", onResize, { passive: true });

      // Cleanup resize listener too
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    // main cleanup
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);

      if (raf.current != null) cancelAnimationFrame(raf.current);

      // stop particles
      particleAnimations.current.forEach((a) => a.cancel());
      particleAnimations.current = [];
      particleTimeouts.current.forEach((t) => clearTimeout(t));
      particleTimeouts.current = [];

      // remove nodes we created
      particleContainer.innerHTML = "";
    };
  }, [particleCount]);

  return (
    <>
      <div ref={cursorRef} className={styles.cursor} aria-hidden="true">
        <span ref={particleContainerRef} className={styles.particleContainer} />
      </div>
      <div ref={dotRef} className={styles.cursorDot} aria-hidden="true" />
    </>
  );
}

// helpers
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}