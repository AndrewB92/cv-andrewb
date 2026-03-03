// src/components/portfolio/usePortfolioCardsStage.ts
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Phase = "idle" | "expanded" | "closing"; // 'opening' removed as CSS handles timeline

type Opts = { closeResetDelay?: number };
const DEFAULTS: Required<Opts> = { closeResetDelay: 420 };

const raf2 = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

export function usePortfolioCardsStage(count: number, opts: Opts = {}) {
  const { closeResetDelay } = { ...DEFAULTS, ...opts };

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>(
    Array.from({ length: count }, () => null)
  );
  const activeIndexRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const timers = useRef<{ t1?: number; t2?: number }>({});
  const rafRef = useRef<number>(0);

  const isOpen = phase === "expanded" || phase === "closing";

  const clearTimers = () => {
    if (timers.current.t1) window.clearTimeout(timers.current.t1);
    if (timers.current.t2) window.clearTimeout(timers.current.t2);
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

  const clearActiveVars = (card: HTMLElement | null) => {
    if (!card) return;
    card.style.removeProperty("--shift-x");
    card.style.removeProperty("--expand-w");
  };

  const measureCompactHeightsBBox = () => {
    const stage = stageRef.current;
    if (!stage) return { cardsH: 0, stageW: 0, gap: 0 };

    const stageW = stage.clientWidth;
    if (stageW <= 0) return { cardsH: 0, stageW: 0, gap: 0 };

    let maxH = 0;

    // Measuring is safe because expandedView is absolute and doesn't influence layout height.
    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const prevH = card.style.height;
      card.style.height = "auto";

      const rect = card.getBoundingClientRect();
      maxH = Math.max(maxH, Math.ceil(rect.height));

      card.style.height = prevH;
    }

    const hPx = `${maxH}px`;

    for (let i = 0; i < count; i++) {
      if (cardRefs.current[i]) cardRefs.current[i]!.style.height = hPx;
    }

    stage.style.setProperty("--cards-h", hPx);
    return { cardsH: maxH, stageW, gap: getStageVars().gap };
  };

  const layoutBasePositionsWrite = () => {
    const stage = stageRef.current;
    if (!stage) return { stageW: 0, gap: 0, cardW: 0 };

    const stageW = stage.clientWidth;
    const { gap } = getStageVars();
    const n = Math.max(1, count);
    const cardW = (stageW - gap * (n - 1)) / n;

    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      card.style.setProperty("--w", `${Math.round(cardW)}px`);
      card.style.setProperty("--x", `${Math.round(i * (cardW + gap))}px`);
    }

    return { stageW, gap, cardW: Math.round(cardW) };
  };

  const computeShiftAndWidth = (index: number) => {
    const stage = stageRef.current;
    const card = cardRefs.current[index];
    if (!stage || !card) return;

    const { sideGap } = getStageVars();
    const baseX = parseFloat(getComputedStyle(card).getPropertyValue("--x")) || 0;
    const newW = Math.max(0, stage.clientWidth - sideGap * 2);

    card.style.setProperty("--shift-x", `${Math.round(sideGap - baseX)}px`);
    card.style.setProperty("--expand-w", `${Math.round(newW)}px`);
  };

  const layoutAndMeasure = useCallback(async () => {
    cancelRaf();
    layoutBasePositionsWrite();
    await raf2();
    measureCompactHeightsBBox();
    if (activeIndexRef.current != null) computeShiftAndWidth(activeIndexRef.current);
  }, [count]);

  const scheduleLayoutOnce = useCallback(() => {
    cancelRaf();
    rafRef.current = requestAnimationFrame(() => {
      void layoutAndMeasure();
    });
  }, [layoutAndMeasure]);

  const openCard = (index: number) => {
    clearTimers();
    setPhase("expanded"); // no JS opening delay; CSS handles view timing
    setActiveIndex(index);
    activeIndexRef.current = index;
    computeShiftAndWidth(index);
  };

  const closeCard = () => {
    const index = activeIndexRef.current;
    if (index == null) return;

    clearTimers();
    setPhase("closing");

    timers.current.t2 = window.setTimeout(() => {
      clearActiveVars(cardRefs.current[index]);
      setPhase("idle");
      setActiveIndex(null);
      activeIndexRef.current = null;
    }, closeResetDelay);
  };

  const onToggle = (index: number) => {
    if (activeIndexRef.current != null && activeIndexRef.current !== index) {
      closeCard();
      timers.current.t1 = window.setTimeout(() => openCard(index), closeResetDelay);
      return;
    }

    activeIndexRef.current === index ? closeCard() : openCard(index);
  };

  useLayoutEffect(() => {
    if (!count) return;

    // Keep refs array stable when count changes.
    cardRefs.current = Array.from(
      { length: count },
      (_, i) => cardRefs.current[i] ?? null
    );

    scheduleLayoutOnce();
  }, [count, scheduleLayoutOnce]);

  useEffect(() => {
    const bump = () => scheduleLayoutOnce();
    window.addEventListener("resize", bump, { passive: true });
    return () => window.removeEventListener("resize", bump);
  }, [scheduleLayoutOnce]);

  return { stageRef, cardRefs, activeIndex, phase, isOpen, onToggle, onClose: closeCard };
}