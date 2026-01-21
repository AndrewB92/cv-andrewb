"use client";

import { useEffect, useRef } from "react";
import styles from "./CustomCursor.module.css";

type Options = {
  particleCount?: number;
};

type Particle = {
  el: HTMLDivElement;
  size: number;
  anim?: Animation;
  onIter?: () => void;
};

const INTERACTIVE_SELECTOR = [
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

function isInteractive(node: Element | null) {
  if (!node) return false;
  const el = node as HTMLElement;
  return !!el.closest?.(INTERACTIVE_SELECTOR);
}

function isKeyframeEffect(v: AnimationEffect | null): v is KeyframeEffect {
  return !!v && typeof (v as KeyframeEffect).setKeyframes === "function";
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function CustomCursor({ particleCount = 7 }: Options) {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const particleContainerRef = useRef<HTMLSpanElement | null>(null);

  // store latest pointer coords without causing re-renders
  const pos = useRef({ x: -9999, y: -9999 });
  const raf = useRef<number | null>(null);

  const particlesRef = useRef<Particle[]>([]);
  const containerSizeRef = useRef({ w: 30, h: 30 });

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const container = particleContainerRef.current;
    if (!cursor || !dot || !container) return;

    // hide custom cursor on touch devices / coarse pointers
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    if (coarse) return;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    const readContainerSize = () => {
      const rect = container.getBoundingClientRect();
      containerSizeRef.current.w = rect.width || container.clientWidth || 30;
      containerSizeRef.current.h = rect.height || container.clientHeight || 30;
    };

    readContainerSize();

    // --- Cursor move (one listener + rAF) ---
    const apply = () => {
      raf.current = null;

      const { x, y } = pos.current;

      // Keep CSS vars in sync (used by .dotActive)
      cursor.style.setProperty("--x", `${x}px`);
      cursor.style.setProperty("--y", `${y}px`);
      dot.style.setProperty("--x", `${x}px`);
      dot.style.setProperty("--y", `${y}px`);

      const t = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
      cursor.style.transform = t;
      dot.style.transform = t;

      // Hover detection without pointerover/out
      const target = document.elementFromPoint(x, y);
      if (isInteractive(target)) cursor.classList.add(styles.hover);
      else cursor.classList.remove(styles.hover);
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

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });

    // --- Particles ---
    if (!prefersReducedMotion && particleCount > 0) {
      // Build particles once
      const built: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const el = document.createElement("div");
        el.className = styles.particle;

        // known size: avoid offsetWidth reads
        const size = randInt(1, 3);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;

        container.appendChild(el);
        built.push({ el, size });
      }
      particlesRef.current = built;

      const place = (p: Particle) => {
        const { w, h } = containerSizeRef.current;
        const x = Math.max(0, Math.random() * (w - p.size));
        const y = Math.max(0, Math.random() * (h - p.size));
        p.el.style.left = `${x}px`;
        p.el.style.top = `${y}px`;
      };

      const makeKeyframes = () => {
        const appearMs = randInt(250, 600);
        const liveMs = randInt(2200, 5200);
        const disappearMs = randInt(300, 700);
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

        const kf: Keyframe[] = [
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
        ];

        return { kf, totalMs };
      };

      built.forEach((p, i) => {
        place(p);

        const startDelay = i * 120;
        const first = makeKeyframes();

        const anim = p.el.animate(first.kf, {
          duration: first.totalMs,
          delay: startDelay,
          easing: "ease-in-out",
          fill: "both",
          iterations: Infinity,
        });

        const onIter = () => {
          place(p);
          const next = makeKeyframes();

          const effect = anim.effect;
          if (isKeyframeEffect(effect)) {
            effect.setKeyframes(next.kf);
            effect.updateTiming({ duration: next.totalMs });
          }
        };

        // If supported, this avoids timers; otherwise it just keeps looping with same path.
        (anim as unknown as { addEventListener?: Function }).addEventListener?.(
          "iteration",
          onIter
        );

        p.anim = anim;
        p.onIter = onIter;
      });

      const onResize = () => {
        readContainerSize();
        particlesRef.current.forEach(place);
      };
      window.addEventListener("resize", onResize, { passive: true });

      const onVis = () => {
        const hidden = document.visibilityState === "hidden";
        particlesRef.current.forEach((p) => {
          if (!p.anim) return;
          hidden ? p.anim.pause() : p.anim.play();
        });
      };
      document.addEventListener("visibilitychange", onVis, { passive: true });

      return () => {
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVis);

        particlesRef.current.forEach((p) => {
          try {
            (p.anim as unknown as { removeEventListener?: Function })
              .removeEventListener?.("iteration", p.onIter);
          } catch {}
          p.anim?.cancel();
        });
        particlesRef.current = [];
        container.innerHTML = "";
      };
    }

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);

      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;

      // in case particles were disabled due to reduced motion after init
      container.innerHTML = "";
      particlesRef.current = [];
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