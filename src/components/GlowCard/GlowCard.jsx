"use client";

import { useEffect } from "react";
import styles from "./GlowCard.module.css";

/**
 * GlowCard initializer
 * Attaches glow pointer behavior to any element with class "glow-card"
 */
export default function GlowCard() {
  useEffect(() => {
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduceMotion) return;

    const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
    const angleFrom = (dx, dy) => {
      if (!dx && !dy) return 0;
      let a = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      return a < 0 ? a + 360 : a;
    };

    const cards = document.querySelectorAll(".glow-card");
    const cleanups = [];

    cards.forEach((card) => {
      // inject glow span once
      if (!card.querySelector(`.${styles.glow}`)) {
        const glow = document.createElement("span");
        glow.className = styles.glow;
        glow.setAttribute("aria-hidden", "true");
        card.appendChild(glow);
      }

      let rect, cx, cy;
      let raf = 0;
      let lastEvent = null;

      const measure = () => {
        rect = card.getBoundingClientRect();
        cx = rect.width / 2;
        cy = rect.height / 2;
      };

      measure();

      const ro = new ResizeObserver(measure);
      ro.observe(card);

      const frame = () => {
        raf = 0;
        if (!lastEvent || !rect) return;

        const e =
          typeof lastEvent.getCoalescedEvents === "function"
            ? lastEvent.getCoalescedEvents().at(-1)
            : lastEvent;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - cx;
        const dy = y - cy;

        let kx = dx ? cx / Math.abs(dx) : Infinity;
        let ky = dy ? cy / Math.abs(dy) : Infinity;

        card.style.setProperty("--pointer-x", `${clamp((100 / rect.width) * x)}%`);
        card.style.setProperty("--pointer-y", `${clamp((100 / rect.height) * y)}%`);
        card.style.setProperty(
          "--pointer-d",
          `${clamp(1 / Math.min(kx, ky), 0, 1) * 100}`
        );
        card.style.setProperty("--pointer-°", `${angleFrom(dx, dy)}deg`);
      };

      const onMove = (e) => {
        lastEvent = e;
        if (!raf) raf = requestAnimationFrame(frame);
      };

      const onEnter = () => {
        measure();
        card.addEventListener("pointermove", onMove, { passive: true });
      };

      const onLeave = () => {
        card.removeEventListener("pointermove", onMove);
        lastEvent = null;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };

      card.addEventListener("pointerenter", onEnter, { passive: true });
      card.addEventListener("pointerleave", onLeave, { passive: true });

      cleanups.push(() => {
        ro.disconnect();
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("pointerleave", onLeave);
        card.removeEventListener("pointermove", onMove);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null; // nothing rendered
}