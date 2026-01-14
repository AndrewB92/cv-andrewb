"use client";

import { useEffect } from "react";

type Options = {
  selector?: string;
  activeOpacity?: number; // 0..1
  rafThrottle?: boolean;
};

export default function GlowPointerProvider({
  selector = "[data-glow-card]",
  activeOpacity = 1,
  rafThrottle = true,
}: Options) {
  useEffect(() => {
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    if (reduceMotion) return;

    let activeEl: HTMLElement | null = null;
    let raf = 0;
    let lastEvent: PointerEvent | null = null;

    const setActive = (el: HTMLElement | null) => {
      // Turn off previous
      if (activeEl && activeEl !== el) {
        activeEl.style.setProperty("--glow-opacity", "0");
      }
      activeEl = el;

      // Turn on new
      if (activeEl) {
        activeEl.style.setProperty("--glow-opacity", String(activeOpacity));
      }
    };

    const updateFromEvent = (e: PointerEvent) => {
      if (!activeEl) return;

      // Use coalesced events if available (smoother, still one RAF)
      const events =
        typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
      const ev = events[events.length - 1];

      const r = activeEl.getBoundingClientRect();
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;

      // Store as px to match CodePen behavior
      activeEl.style.setProperty("--glow-x", `${x.toFixed(2)}px`);
      activeEl.style.setProperty("--glow-y", `${y.toFixed(2)}px`);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!activeEl) return;

      if (!rafThrottle) {
        updateFromEvent(e);
        return;
      }

      lastEvent = e;
      if (raf) return;

      raf = requestAnimationFrame(() => {
        raf = 0;
        if (lastEvent) updateFromEvent(lastEvent);
        lastEvent = null;
      });
    };

    // Delegated enter/leave using capture to catch events early
    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.(selector) as HTMLElement | null;
      if (!el) return;

      // Only activate if we're actually entering a new card
      if (activeEl !== el) setActive(el);
    };

    const onPointerOut = (e: PointerEvent) => {
      if (!activeEl) return;

      // If leaving the active element to something outside it, deactivate
      const related = (e.relatedTarget as Element | null) ?? null;
      if (related && activeEl.contains(related)) return;

      setActive(null);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("pointerout", onPointerOut, true);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastEvent = null;

      if (activeEl) activeEl.style.setProperty("--glow-opacity", "0");
      activeEl = null;

      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver, true);
      document.removeEventListener("pointerout", onPointerOut, true);
    };
  }, [selector, activeOpacity, rafThrottle]);

  return null;
}