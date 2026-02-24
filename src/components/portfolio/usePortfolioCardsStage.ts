import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Phase = "idle" | "opening" | "expanded" | "closing";

type Opts = {
  openExpandDelay?: number;
  closeResetDelay?: number;
};

const DEFAULTS: Required<Opts> = {
  openExpandDelay: 320,
  closeResetDelay: 420,
};

export function usePortfolioCardsStage(count: number, opts: Opts = {}) {
  const { openExpandDelay, closeResetDelay } = { ...DEFAULTS, ...opts };

  const stageRef = useRef<HTMLDivElement | null>(null);

  // Use HTMLElement to avoid depending on lib.dom-specific interfaces (HTMLArticleElement).
  const cardRefs = useRef<Array<HTMLElement | null>>(
    Array.from({ length: count }, () => null)
  );

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
    return {
      gap: parseFloat(cs.getPropertyValue("--gap")) || 20,
      sideGap: parseFloat(cs.getPropertyValue("--side-gap")) || 20,
    };
  };

  const clearActiveVars = (card: HTMLElement | null) => {
    if (!card) return;
    card.style.removeProperty("--shift-x");
    card.style.removeProperty("--expand-w");
  };

  const measureCompactHeightsOnly = () => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.setAttribute("data-measuring", "true");

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
      if (card) card.style.height = hPx;
    }
    stage.style.setProperty("--cards-h", hPx);

    stage.removeAttribute("data-measuring");
  };

  const layoutBasePositions = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const { gap } = getStageVars();
    const n = Math.max(1, count);
    const totalGaps = gap * (n - 1);
    const cardW = (stage.clientWidth - totalGaps) / n;

    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const x = i * (cardW + gap);
      card.style.setProperty("--w", `${Math.round(cardW)}px`);
      card.style.setProperty("--x", `${Math.round(x)}px`);
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

    card.style.setProperty("--shift-x", `${Math.round(shiftX)}px`);
    card.style.setProperty("--expand-w", `${Math.round(newW)}px`);
  };

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

  const openCard = (index: number) => {
    clearTimers();
    setPhase("opening");
    setActiveIndex(index);
    activeIndexRef.current = index;

    setExpandedA11y(index, false);

    timers.current.t1 = window.setTimeout(() => {
      computeShiftAndWidth(index);
      setPhase("expanded");
      setExpandedA11y(index, true);

      const card = cardRefs.current[index];
      const close = card?.querySelector<HTMLButtonElement>("[data-role='close']");
      close?.focus({ preventScroll: true });
    }, openExpandDelay);
  };

  const closeCard = () => {
    const index = activeIndexRef.current;
    if (index == null) return;

    clearTimers();
    setPhase("closing");
    setExpandedA11y(index, false);

    timers.current.t2 = window.setTimeout(() => {
      const card = cardRefs.current[index];
      clearActiveVars(card);

      setPhase("idle");
      setActiveIndex(null);
      activeIndexRef.current = null;

      const toggle = card?.querySelector<HTMLButtonElement>("[data-role='toggle']");
      toggle?.focus({ preventScroll: true });
    }, closeResetDelay);
  };

  const onToggle = (index: number) => {
    const current = activeIndexRef.current;

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

  useLayoutEffect(() => {
    if (!count) return;

    if (cardRefs.current.length !== count) {
      cardRefs.current = Array.from({ length: count }, (_, i) => cardRefs.current[i] ?? null);
    }

    layoutBasePositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let raf = 0;

    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        layoutBasePositions();
        const idx = activeIndexRef.current;
        if (idx != null) computeShiftAndWidth(idx);
      });
    };

    const ro = new ResizeObserver(bump);
    ro.observe(stage);

    window.addEventListener("resize", bump, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", bump);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const imgs = Array.from(stage.querySelectorAll("img"));
    if (!imgs.length) return;

    const bump = () => {
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
      imgs.forEach((img) => {
        img.removeEventListener("load", bump);
        img.removeEventListener("error", bump);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeIndexRef.current != null) closeCard();
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
    onToggle,
    onClose,
  };
}