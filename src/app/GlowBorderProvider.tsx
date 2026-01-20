"use client";

import { useEffect } from "react";

function isElement(v: unknown): v is Element {
  return v instanceof Element;
}

export default function GlowBorderProvider() {
  useEffect(() => {
    let active: HTMLElement | null = null;
    let activeRect: DOMRect | null = null;

    let raf: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const updateRect = () => {
      if (!active) return;
      activeRect = active.getBoundingClientRect();
    };

    const update = () => {
      raf = null;
      if (!active || !activeRect) return;

      active.style.setProperty("--mouse-x", `${lastX - activeRect.left}px`);
      active.style.setProperty("--mouse-y", `${lastY - activeRect.top}px`);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!active) return; // key: don't do anything unless hovering a glow element
      lastX = e.clientX;
      lastY = e.clientY;

      if (raf == null) raf = requestAnimationFrame(update);
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (!isElement(e.target)) return;

      const host = (e.target as Element).closest(".glow-border");
      if (!(host instanceof HTMLElement)) return;

      active = host;
      active.style.setProperty("--glow-opacity", "1");
      updateRect();

      // Set initial position immediately (no 1-frame lag)
      lastX = e.clientX;
      lastY = e.clientY;
      if (raf == null) raf = requestAnimationFrame(update);
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (!isElement(e.target)) return;

      const host = (e.target as Element).closest(".glow-border");
      if (host instanceof HTMLElement) host.style.setProperty("--glow-opacity", "0");

      // Only clear if we left the currently active one
      if (active === host) {
        active = null;
        activeRect = null;
      }
    };

    // Keep rect correct when page moves
    const onScrollOrResize = () => {
      if (!active) return;
      updateRect();
    };

    // Use capturing so we catch enters/leaves even with nested elements
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerEnter, { passive: true, capture: true });
    document.addEventListener("pointerout", onPointerLeave, { passive: true, capture: true });

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerEnter, true as any);
      document.removeEventListener("pointerout", onPointerLeave, true as any);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}