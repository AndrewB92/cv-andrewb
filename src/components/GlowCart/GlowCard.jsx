"use client";

import { useEffect, useRef } from "react";
import styles from "./GlowCard.module.css";

export default function GlowCard({
  children,
  className = "",
  intro = true, // set false if you don't want the initial sweep animation
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Reduced motion support
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    // ---------- utils ----------
    const round = (value, precision = 3) => parseFloat(value.toFixed(precision));
    const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

    const centerOfElement = ($el) => {
      const { width, height } = $el.getBoundingClientRect();
      return [width / 2, height / 2];
    };

    const pointerPositionRelativeToElement = ($el, e) => {
      const { left, top, width, height } = $el.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      const px = clamp((100 / width) * x);
      const py = clamp((100 / height) * y);
      return { pixels: [x, y], percent: [px, py] };
    };

    const distanceFromCenter = ($el, x, y) => {
      const [cx, cy] = centerOfElement($el);
      return [x - cx, y - cy];
    };

    const closenessToEdge = ($el, x, y) => {
      // fraction [0..1]
      const [cx, cy] = centerOfElement($el);
      const [dx, dy] = distanceFromCenter($el, x, y);

      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);

      return clamp(1 / Math.min(kx, ky), 0, 1);
    };

    const angleFromPointer = (dx, dy) => {
      // degrees, normalized
      if (dx === 0 && dy === 0) return 0;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      return angle;
    };

    // ---------- pointer handler ----------
    let raf = 0;

    const updateFromEvent = (e) => {
      // keep it super light: single RAF per frame
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const pos = pointerPositionRelativeToElement(card, e);
        const [px, py] = pos.pixels;
        const [perx, pery] = pos.percent;

        const [dx, dy] = distanceFromCenter(card, px, py);
        const edge = closenessToEdge(card, px, py);
        const angle = angleFromPointer(dx, dy);

        card.style.setProperty("--pointer-x", `${round(perx)}%`);
        card.style.setProperty("--pointer-y", `${round(pery)}%`);
        card.style.setProperty("--pointer-°", `${round(angle)}deg`);
        card.style.setProperty("--pointer-d", `${round(edge * 100)}`);

        card.classList.remove(styles.animating);
      });
    };

    const onLeave = () => {
      // When leaving, fade effects out via CSS rule (not(:hover):not(.animating))
      cancelAnimationFrame(raf);
      raf = 0;
    };

    card.addEventListener("pointermove", updateFromEvent, { passive: true });
    card.addEventListener("pointerleave", onLeave, { passive: true });

    // ---------- optional intro animation ----------
    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
    const easeInCubic = (x) => x * x * x;

    const animateNumber = ({
      startValue = 0,
      endValue = 100,
      duration = 1000,
      delay = 0,
      ease = (t) => t,
      onUpdate = () => {},
      onEnd = () => {},
    }) => {
      const startTime = performance.now() + delay;

      const tick = () => {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(Math.max(elapsed / duration, 0), 1);
        const v = startValue + (endValue - startValue) * ease(t);
        onUpdate(v);
        if (t < 1) requestAnimationFrame(tick);
        else onEnd();
      };

      if (delay) setTimeout(() => requestAnimationFrame(tick), delay);
      else requestAnimationFrame(tick);
    };

    const playIntro = () => {
      if (reduceMotion) return;
      const angleStart = 110;
      const angleEnd = 465;

      card.style.setProperty("--pointer-°", `${angleStart}deg`);
      card.classList.add(styles.animating);

      animateNumber({
        ease: easeOutCubic,
        duration: 500,
        onUpdate: (v) => card.style.setProperty("--pointer-d", v),
      });

      animateNumber({
        ease: easeInCubic,
        duration: 1500,
        endValue: 50,
        onUpdate: (v) => {
          const d = (angleEnd - angleStart) * (v / 100) + angleStart;
          card.style.setProperty("--pointer-°", `${d}deg`);
        },
      });

      animateNumber({
        ease: easeOutCubic,
        delay: 1500,
        duration: 2250,
        startValue: 50,
        endValue: 100,
        onUpdate: (v) => {
          const d = (angleEnd - angleStart) * (v / 100) + angleStart;
          card.style.setProperty("--pointer-°", `${d}deg`);
        },
      });

      animateNumber({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        startValue: 100,
        endValue: 0,
        onUpdate: (v) => card.style.setProperty("--pointer-d", v),
        onEnd: () => card.classList.remove(styles.animating),
      });
    };

    if (intro) {
      const t = setTimeout(playIntro, 350);
      return () => {
        clearTimeout(t);
        cancelAnimationFrame(raf);
        card.removeEventListener("pointermove", updateFromEvent);
        card.removeEventListener("pointerleave", onLeave);
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener("pointermove", updateFromEvent);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, [intro]);

  return (
    <div ref={cardRef} className={`${styles.card} ${className}`}>
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>{children}</div>
    </div>
  );
}