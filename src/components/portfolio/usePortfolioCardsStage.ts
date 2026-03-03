// src/components/portfolio/usePortfolioCardsStage.ts
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Phase = "idle" | "slidingOut" | "expanding" | "expanded" | "collapsing" | "slidingIn";

type Opts = {
  fallbackOpenMs?: number;
  fallbackCloseMs?: number;
};

const DEFAULTS: Required<Opts> = {
  fallbackOpenMs: 520,
  fallbackCloseMs: 520,
};

const raf2 = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

function isBusy(phase: Phase) {
  return phase !== "idle";
}

export function usePortfolioCardsStage(count: number, opts: Opts = {}) {
  const { fallbackOpenMs, fallbackCloseMs } = { ...DEFAULTS, ...opts };

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>(Array.from({ length: count }, () => null));

  const activeIndexRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const timers = useRef<{ openFallback?: number; closeFallback?: number }>({});
  const rafRef = useRef<number>(0);

  // Mount heavy slider only after expand completes (reduces mid-animation layout churn)
  const [canMountSlider, setCanMountSlider] = useState(false);

  const isOpen = phase !== "idle";
  const isExpanded = phase === "expanded";

  const clearTimers = () => {
    if (timers.current.openFallback) window.clearTimeout(timers.current.openFallback);
    if (timers.current.closeFallback) window.clearTimeout(timers.current.closeFallback);
    timers.current = {};
  };

  const cancelRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };

  const getStageVars = () => {
    const stage = stageRef.current;
    if (!stage) return { gap: 20, sideGap: 0 };

    const cs = getComputedStyle(stage);
    return {
      gap: parseFloat(cs.getPropertyValue("--gap")) || 0,
      sideGap: parseFloat(cs.getPropertyValue("--side-gap")) || 0,
    };
  };

  const waitForFonts = async () => {
    const anyDoc: any = document;
    if (!anyDoc?.fonts?.ready) return;
    try {
      await Promise.resolve(anyDoc.fonts.ready);
    } catch {
      // ignore
    }
  };

  const waitForImagesInStage = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    const imgs = Array.from(stage.querySelectorAll("img")) as unknown as Element[];
    if (!imgs.length) return;

    await Promise.all(
      imgs.map((el) => {
        const img: any = el;

        if (img?.complete && img?.naturalWidth > 0) return Promise.resolve();

        if (typeof img?.decode === "function") {
          return Promise.resolve(img.decode()).catch(() => undefined);
        }

        return new Promise<void>((res) => {
          if (typeof img?.addEventListener === "function") {
            const done = () => res();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            return;
          }
          res();
        });
      })
    );
  };

  // Base positions (WRITE only)
  const layoutBasePositionsWrite = () => {
    const stage = stageRef.current;
    if (!stage) return { stageW: 0, gap: 0, cardW: 0 };

    const stageW = stage.clientWidth;
    const { gap } = getStageVars();
    const n = Math.max(1, count);
    const totalGaps = gap * (n - 1);
    const cardW = (stageW - totalGaps) / n;

    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const x = i * (cardW + gap);
      card.style.setProperty("--w", `${Math.round(cardW)}px`);
      card.style.setProperty("--x", `${Math.round(x)}px`);
    }

    return { stageW, gap, cardW: Math.round(cardW) };
  };

  // Measure compact max height ONCE (IDLE only), write stage --cards-h only (not per-card heights)
  const measureCompactMaxHeightWriteStage = () => {
    const stage = stageRef.current;
    if (!stage) return;

    let maxH = 0;
    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const rect = card.getBoundingClientRect();
      maxH = Math.max(maxH, Math.ceil(rect.height));
    }

    if (maxH > 0) stage.style.setProperty("--cards-h", `${maxH}px`);
  };

  const computeShiftAndWidthForIndex = (index: number) => {
    const stage = stageRef.current;
    const card = cardRefs.current[index];
    if (!stage || !card) return;

    const { sideGap } = getStageVars();
    const baseX = parseFloat(getComputedStyle(card).getPropertyValue("--x")) || 0;

    const newW = Math.max(0, stage.clientWidth - sideGap * 2);
    const shiftX = sideGap - baseX;

    card.style.setProperty("--shift-x", `${Math.round(shiftX)}px`);
    card.style.setProperty("--expand-w", `${Math.round(newW)}px`);
  };

  const clearActiveVars = (index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;
    card.style.removeProperty("--shift-x");
    card.style.removeProperty("--expand-w");
  };

  // Layout engine: only runs when NOT animating
  const layoutIdleOnly = useCallback(async () => {
    if (isBusy(phase)) return;

    cancelRaf();
    layoutBasePositionsWrite();
    await raf2();

    // Guard: stage width must be real to avoid wrapped-measure spikes
    const stage = stageRef.current;
    if (!stage || stage.clientWidth < 120) return;

    measureCompactMaxHeightWriteStage();

    // If there is an active index (rare in idle), keep vars consistent
    const idx = activeIndexRef.current;
    if (idx != null) computeShiftAndWidthForIndex(idx);
  }, [count, phase]);

  const scheduleIdleLayoutOnce = useCallback(() => {
    cancelRaf();
    rafRef.current = requestAnimationFrame(() => {
      void layoutIdleOnly();
    });
  }, [layoutIdleOnly]);

  // A11y sync (minimal, no layout writes)
  const setExpandedA11y = (expandedIndex: number | null, expanded: boolean) => {
    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const toggle = card.querySelector<HTMLButtonElement>("[data-role='toggle']");
      const close = card.querySelector<HTMLButtonElement>("[data-role='close']");

      if (toggle) toggle.setAttribute("aria-expanded", "false");
      if (close) close.tabIndex = -1;
      card.removeAttribute("data-expanded");
    }

    if (expandedIndex == null) return;

    const activeCard = cardRefs.current[expandedIndex];
    if (!activeCard) return;

    const toggle = activeCard.querySelector<HTMLButtonElement>("[data-role='toggle']");
    const close = activeCard.querySelector<HTMLButtonElement>("[data-role='close']");

    if (toggle) toggle.setAttribute("aria-expanded", String(expanded));
    if (close) close.tabIndex = expanded ? 0 : -1;
    if (expanded) activeCard.setAttribute("data-expanded", "true");
  };

  // Transition helper: wait for a property on active card to finish.
  const waitForActiveTransition = (prop: string) =>
    new Promise<void>((resolve) => {
      const idx = activeIndexRef.current;
      const card = idx != null ? cardRefs.current[idx] : null;
      if (!card) return resolve();

      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        card.removeEventListener("transitionend", onEnd);
        resolve();
      };

      const onEnd = (e: TransitionEvent) => {
        if (e.target !== card) return;
        if (e.propertyName !== prop) return;
        finish();
      };

      card.addEventListener("transitionend", onEnd);

      // Fallback: if transitionend is missed
      const t = window.setTimeout(() => finish(), fallbackOpenMs);
      // Ensure timeout cleared when resolved
      const originalResolve = resolve;
      resolve = () => {
        window.clearTimeout(t);
        originalResolve();
      };
    });

  const openCard = async (index: number) => {
    clearTimers();
    setCanMountSlider(false);

    activeIndexRef.current = index;
    setActiveIndex(index);

    // Ensure base layout exists and vars are ready BEFORE animation begins
    if (!isBusy(phase)) {
      layoutBasePositionsWrite();
      await raf2();
      measureCompactMaxHeightWriteStage();
      computeShiftAndWidthForIndex(index);
    } else {
      computeShiftAndWidthForIndex(index);
    }

    setExpandedA11y(index, false);

    // 1) slide others away
    setPhase("slidingOut");

    // Wait for transform end (slide out uses transform)
    await waitForActiveTransition("transform");

    // 2) expand active width/shift (CSS uses width + transform; we’ll wait on width)
    setPhase("expanding");
    await waitForActiveTransition("width");

    // 3) expanded (now we can mount heavy slider + enable close focus)
    setPhase("expanded");
    setExpandedA11y(index, true);
    setCanMountSlider(true);

    const card = cardRefs.current[index];
    const close = card?.querySelector<HTMLButtonElement>("[data-role='close']");
    close?.focus({ preventScroll: true });
  };

  const closeCard = async () => {
    const index = activeIndexRef.current;
    if (index == null) return;

    clearTimers();
    setExpandedA11y(index, false);
    setCanMountSlider(false);

    // 1) collapse active (back to compact width)
    setPhase("collapsing");
    clearActiveVars(index);
    computeShiftAndWidthForIndex(index); // keep values sane (won’t be used while collapsing)

    // Wait for width end (active shrinking)
    await waitForActiveTransition("width");

    // 2) slide others back in
    setPhase("slidingIn");
    await waitForActiveTransition("transform");

    // 3) idle cleanup
    setPhase("idle");
    setActiveIndex(null);
    activeIndexRef.current = null;

    // Re-layout once after everything is stable
    scheduleIdleLayoutOnce();

    const card = cardRefs.current[index];
    const toggle = card?.querySelector<HTMLButtonElement>("[data-role='toggle']");
    toggle?.focus({ preventScroll: true });
  };

  const onToggle = (index: number) => {
    const current = activeIndexRef.current;

    // If another card open, close first then open requested card.
    if (current != null && current !== index) {
      void (async () => {
        await closeCard();
        await openCard(index);
      })();
      return;
    }

    if (current === index) void closeCard();
    else void openCard(index);
  };

  const onClose = () => {
    void closeCard();
  };

  // Keep refs array aligned with count
  useLayoutEffect(() => {
    if (!count) return;
    if (cardRefs.current.length !== count) {
      cardRefs.current = Array.from({ length: count }, (_, i) => cardRefs.current[i] ?? null);
    }
    // Initial layout after refs exist
    scheduleIdleLayoutOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // ResizeObserver: stage only, and only schedule layout when idle
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const bump = () => {
      if (activeIndexRef.current != null) {
        // Keep expanded vars correct on resize, but do minimal work.
        const idx = activeIndexRef.current;
        if (idx != null) computeShiftAndWidthForIndex(idx);
      }
      if (!isBusy(phase)) scheduleIdleLayoutOnce();
    };

    const ro = new ResizeObserver(bump);
    ro.observe(stage);
    window.addEventListener("resize", bump, { passive: true });

    return () => {
      cancelRaf();
      ro.disconnect();
      window.removeEventListener("resize", bump);
    };
  }, [phase, scheduleIdleLayoutOnce]);

  // One-time stabilization: fonts + images, then layout (idle only)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await waitForFonts();
      if (cancelled) return;

      await waitForImagesInStage();
      if (cancelled) return;

      await raf2();
      if (cancelled) return;

      if (!isBusy(phase)) scheduleIdleLayoutOnce();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [phase, scheduleIdleLayoutOnce]);

  // Escape to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeIndexRef.current != null) void closeCard();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stageRef,
    cardRefs,
    activeIndex,
    phase,
    isOpen,
    isExpanded,
    canMountSlider,
    onToggle,
    onClose,
  };
}