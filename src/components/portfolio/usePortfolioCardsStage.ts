// src/components/portfolio/usePortfolioCardsStage.ts
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Phase = "idle" | "opening" | "expanded" | "closing";

type Opts = {
  openExpandDelay?: number;
  closeResetDelay?: number;

  // kept for compatibility with your prior API (not used as a long raf loop anymore)
  stabilizeFrames?: number;
  stableRunsNeeded?: number;
};

const DEFAULTS: Required<Opts> = {
  openExpandDelay: 320,
  closeResetDelay: 420,
  stabilizeFrames: 30,
  stableRunsNeeded: 2,
};

// TS-safe: never pass resolve directly into requestAnimationFrame
const raf2 = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

export function usePortfolioCardsStage(count: number, opts: Opts = {}) {
  const { openExpandDelay, closeResetDelay } = { ...DEFAULTS, ...opts };

  const stageRef = useRef<HTMLDivElement | null>(null);

  // Avoid DOM-specific element interfaces (your TS env lacks them).
  const cardRefs = useRef<Array<HTMLElement | null>>(Array.from({ length: count }, () => null));

  const activeIndexRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const timers = useRef<{ t1?: number; t2?: number }>({});
  const rafRef = useRef<number>(0);

  const isOpen = phase === "opening" || phase === "expanded" || phase === "closing";
  const isExpanded = phase === "expanded";

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

    // IMPORTANT: due to your TS DOM types, treat as Element[] and use "any" for listeners/decode.
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

  const measureCompactHeightsBBox = () => {
    const stage = stageRef.current;
    if (!stage) return { cardsH: 0, stageW: 0, gap: 0 };

    const stageW = stage.clientWidth;
    if (stageW <= 0) return { cardsH: 0, stageW: 0, gap: 0 };

    stage.setAttribute("data-measuring", "true");

    // HARD GUARD: if any card has tiny width, abort measurement (prevents insane wrapped heights)
    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      const w = card.getBoundingClientRect().width;
      if (w < 80) {
        stage.removeAttribute("data-measuring");
        return { cardsH: 0, stageW, gap: getStageVars().gap };
      }
    }

    const expandedEls: Array<{ el: HTMLElement; prevDisplay: string; prevHeight: string }> = [];

    for (let i = 0; i < count; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const expanded = card.querySelector<HTMLElement>("[data-role='expanded']");
      if (!expanded) continue;

      expandedEls.push({
        el: expanded,
        prevDisplay: expanded.style.display,
        prevHeight: expanded.style.height,
      });

      expanded.style.display = "none";
      expanded.style.height = "0px";
    }

    let maxH = 0;

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
      const card = cardRefs.current[i];
      if (card) card.style.height = hPx;
    }

    stage.style.setProperty("--cards-h", hPx);

    for (const item of expandedEls) {
      item.el.style.display = item.prevDisplay;
      item.el.style.height = item.prevHeight;
    }

    stage.removeAttribute("data-measuring");

    const { gap } = getStageVars();
    return { cardsH: maxH, stageW, gap };
  };

  // WRITE pass only: sets --w/--x (no measuring)
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

  const layoutAndMeasure = useCallback(async () => {
    cancelRaf();

    // 1) write base vars
    layoutBasePositionsWrite();

    // 2) allow CSS vars to apply, then measure
    await raf2();

    const { cardsH } = measureCompactHeightsBBox();

    // If guard aborted measurement (cardsH=0), try again next frames
    if (!cardsH) {
      await raf2();
      measureCompactHeightsBBox();
    }

    const idx = activeIndexRef.current;
    if (idx != null) computeShiftAndWidth(idx);
  }, [count]);

  const scheduleLayoutOnce = useCallback(() => {
    cancelRaf();
    rafRef.current = requestAnimationFrame(() => {
      void layoutAndMeasure();
    });
  }, [layoutAndMeasure]);

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

    // initial layout after refs exist
    scheduleLayoutOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const bump = () => scheduleLayoutOnce();

    const ro = new ResizeObserver(bump);
    ro.observe(stage);

    // observing cards helps if internal content changes height
    for (const el of cardRefs.current) if (el) ro.observe(el);

    window.addEventListener("resize", bump, { passive: true });

    return () => {
      cancelRaf();
      ro.disconnect();
      window.removeEventListener("resize", bump);
    };
  }, [count, scheduleLayoutOnce]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await waitForFonts();
      if (cancelled) return;

      await waitForImagesInStage();
      if (cancelled) return;

      await raf2();
      if (cancelled) return;

      scheduleLayoutOnce();
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [count, scheduleLayoutOnce]);

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