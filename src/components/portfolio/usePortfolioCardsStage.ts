import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Phase = "idle" | "opening" | "expanded" | "closing";

type Opts = {
  openExpandDelay?: number; // time for other cards to slide away before expand
  closeResetDelay?: number; // time for shrink to finish before restoring
};

const DEFAULTS: Required<Opts> = {
  openExpandDelay: 320,
  closeResetDelay: 420,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function usePortfolioCardsStage(count: number, opts: Opts = {}) {
  const { openExpandDelay, closeResetDelay } = { ...DEFAULTS, ...opts };

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const activeIndexRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const timers = useRef<{ t1?: number; t2?: number }>({});

  const isOpen = phase === "opening" || phase === "expanded" || phase === "closing";
  const isExpanded = phase === "expanded";

  const clearTimers = () => {
    if (timers.current.t1) window.clearTimeout(timers.current.t1);
    if (timers.current.t2) window.clearTimeout(timers.current.t2);
    timers.current = {};
  };

  const getStageVars = () => {
    const stage = stageRef.current;
    if (!stage) return { gap: 20, sideGap: 20 };

    const cs = getComputedStyle(stage);
    const gap = parseFloat(cs.getPropertyValue("--gap")) || 20;
    const sideGap = parseFloat(cs.getPropertyValue("--side-gap")) || 20;

    return { gap, sideGap };
  };

  const setCSSVar = (el: HTMLElement, name: string, value: string) => {
    el.style.setProperty(name, value);
  };

  const clearActiveVars = (card: HTMLElement | null) => {
    if (!card) return;
    card.style.removeProperty("--shift-x");
    card.style.removeProperty("--expand-w");
  };

  const measureCompactHeightsOnly = () => {
    const stage = stageRef.current;
    if (!stage) return;

    // Put stage into "measuring" mode via data attr (CSS Modules-friendly).
    stage.setAttribute("data-measuring", "true");

    // Ensure no expanded layout affects scrollHeight.
    // We just measure each absolute card’s scrollHeight with compact content visible.
    let maxH = 0;

    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const prev = card.style.height;
      card.style.height = "auto";
      maxH = Math.max(maxH, Math.ceil(card.scrollHeight));
      card.style.height = prev;
    }

    const hPx = `${maxH}px`;
    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      card.style.height = hPx;
    }
    stage.style.setProperty("--cards-h", hPx);

    stage.removeAttribute("data-measuring");
  };

  const layoutBasePositions = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const { gap } = getStageVars();

    const stageW = stage.clientWidth;
    const n = Math.max(1, count);
    const totalGaps = gap * (n - 1);
    const cardW = (stageW - totalGaps) / n;

    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const x = i * (cardW + gap);
      setCSSVar(card, "--w", `${Math.round(cardW)}px`);
      setCSSVar(card, "--x", `${Math.round(x)}px`);
    }

    measureCompactHeightsOnly();
  };

  const computeShiftAndWidth = (index: number) => {
    const stage = stageRef.current;
    const card = cardRefs.current[index];
    if (!stage || !card) return;

    const { sideGap } = getStageVars();

    const baseX = parseFloat(getComputedStyle(card).getPropertyValue("--x")) || 0;
    const newW = Math.max(0, stage.clientWidth - sideGap * 2);
    const shiftX = sideGap - baseX;

    setCSSVar(card, "--shift-x", `${Math.round(shiftX)}px`);
    setCSSVar(card, "--expand-w", `${Math.round(newW)}px`);
  };

  const setA11y = (expandedIndex: number | null, expanded: boolean) => {
    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const toggle = card.querySelector<HTMLButtonElement>("[data-role='toggle']") ?? null;
      const close = card.querySelector<HTMLButtonElement>("[data-role='close']") ?? null;

      // In our TSX we didn’t add data-role to buttons; keep this future-proof.
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      if (close) close.tabIndex = -1;
      card.removeAttribute("data-expanded");
    }

    if (expandedIndex == null) return;

    const activeCard = cardRefs.current[expandedIndex];
    if (!activeCard) return;

    const toggleBtn = activeCard.querySelector<HTMLButtonElement>("button[aria-expanded]") ?? null;
    const closeBtn = activeCard.querySelector<HTMLButtonElement>("button[aria-label='Close details']") ?? null;

    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", String(expanded));
    if (closeBtn) closeBtn.tabIndex = expanded ? 0 : -1;
    if (expanded) activeCard.setAttribute("data-expanded", "true");
  };

  const openCard = (index: number) => {
    clearTimers();

    const stage = stageRef.current;
    const card = cardRefs.current[index];
    if (!stage || !card) return;

    // Reset any closing flags.
    setPhase("opening");
    setActiveIndex(index);
    activeIndexRef.current = index;

    // Remove old active vars from any previous card.
    for (let i = 0; i < count; i++) {
      if (i !== index) clearActiveVars(cardRefs.current[i]);
    }

    // During "opening" the compact view fades out and others slide away via CSS.
    setA11y(index, false);

    timers.current.t1 = window.setTimeout(() => {
      computeShiftAndWidth(index);
      setPhase("expanded");
      setA11y(index, true);

      const closeBtn = card.querySelector<HTMLButtonElement>("button[aria-label='Close details']");
      closeBtn?.focus({ preventScroll: true });
    }, openExpandDelay);
  };

  const closeCard = () => {
    clearTimers();

    const index = activeIndexRef.current;
    if (index == null) return;

    const card = cardRefs.current[index];
    if (!card) return;

    setPhase("closing");
    setA11y(index, false);

    timers.current.t2 = window.setTimeout(() => {
      setPhase("idle");
      setActiveIndex(null);
      activeIndexRef.current = null;
      clearActiveVars(card);

      const toggleBtn = card.querySelector<HTMLButtonElement>("button[aria-expanded]");
      toggleBtn?.focus({ preventScroll: true });
    }, closeResetDelay);
  };

  const onToggle = (index: number) => {
    const current = activeIndexRef.current;

    // Switching from one active card to another:
    if (current != null && current !== index) {
      closeCard();
      clearTimers();
      timers.current.t1 = window.setTimeout(() => openCard(index), closeResetDelay);
      return;
    }

    if (current === index) closeCard();
    else openCard(index);
  };

  const onClose = () => closeCard();

  // Initial layout: positions + equal heights.
  useLayoutEffect(() => {
    if (!count) return;
    layoutBasePositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Resize handling: recompute base positions and expanded shift.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        layoutBasePositions();
        const idx = activeIndexRef.current;
        if (idx != null) computeShiftAndWidth(idx);
      });
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(stage);

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Re-measure when images load (lazy images can change heights).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const imgs = Array.from(stage.querySelectorAll("img"));
    if (!imgs.length) return;

    let cancelled = false;

    const bump = () => {
      if (cancelled) return;
      layoutBasePositions();
      const idx = activeIndexRef.current;
      if (idx != null) computeShiftAndWidth(idx);
    };

    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", bump, { once: true });
      img.addEventListener("error", bump, { once: true });
    });

    return () => {
      cancelled = true;
      imgs.forEach((img) => {
        img.removeEventListener("load", bump);
        img.removeEventListener("error", bump);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Escape to close.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeIndexRef.current != null) closeCard();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep refs array sized.
  useMemo(() => {
    cardRefs.current = Array.from({ length: count }, (_, i) => cardRefs.current[i] ?? null);
  }, [count]);

  return {
    stageRef,
    cardRefs,
    activeIndex,
    phase,
    isOpen,
    isExpanded,
    onToggle,
    onClose,
  };
}