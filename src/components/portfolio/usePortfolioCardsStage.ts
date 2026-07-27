import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Phase = "idle" | "opening" | "expanded" | "closing";

type Options = {
  openExpandDelay?: number;
  closeResetDelay?: number;
  compactBreakpoint?: number;
};

const DEFAULTS: Required<Options> = {
  openExpandDelay: 420,
  closeResetDelay: 420,
  compactBreakpoint: 1080,
};

const afterTwoFrames = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

export function usePortfolioCardsStage(
  count: number,
  options: Options = {},
) {
  const { openExpandDelay, closeResetDelay, compactBreakpoint } = {
    ...DEFAULTS,
    ...options,
  };

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>(
    Array.from({ length: count }, () => null),
  );
  const activeIndexRef = useRef<number | null>(null);
  const timersRef = useRef<{ open?: number; close?: number }>({});
  const frameRef = useRef<number>(0);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [isCompactLayout, setIsCompactLayout] = useState(false);

  const isCompactViewport = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${compactBreakpoint}px)`).matches;
  }, [compactBreakpoint]);

  const clearTimers = useCallback(() => {
    if (timersRef.current.open) {
      window.clearTimeout(timersRef.current.open);
    }
    if (timersRef.current.close) {
      window.clearTimeout(timersRef.current.close);
    }
    timersRef.current = {};
  }, []);

  const cancelScheduledLayout = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  }, []);

  const clearCardVariables = useCallback((card: HTMLElement | null) => {
    if (!card) return;
    card.style.removeProperty("--shift-x");
    card.style.removeProperty("--expand-w");
  }, []);

  const resetAllCardStyles = useCallback(() => {
    const stage = stageRef.current;
    stage?.style.removeProperty("--cards-h");
    stage?.removeAttribute("data-measuring");

    for (const card of cardRefs.current) {
      if (!card) continue;
      card.style.removeProperty("--w");
      card.style.removeProperty("--x");
      card.style.removeProperty("--shift-x");
      card.style.removeProperty("--expand-w");
      card.style.removeProperty("height");
    }
  }, []);

  const getStageVariables = () => {
    const stage = stageRef.current;
    if (!stage) return { gap: 20, sideGap: 0 };

    const styles = getComputedStyle(stage);
    return {
      gap: Number.parseFloat(styles.getPropertyValue("--gap")) || 0,
      sideGap:
        Number.parseFloat(styles.getPropertyValue("--side-gap")) || 0,
    };
  };

  const writeDesktopPositions = () => {
    const stage = stageRef.current;
    if (!stage || isCompactViewport()) return;

    const stageWidth = stage.clientWidth;
    if (stageWidth <= 0) return;

    const { gap } = getStageVariables();
    const safeCount = Math.max(1, count);
    const cardWidth = (stageWidth - gap * (safeCount - 1)) / safeCount;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      card.style.setProperty("--w", `${Math.round(cardWidth)}px`);
      card.style.setProperty(
        "--x",
        `${Math.round(index * (cardWidth + gap))}px`,
      );
    });
  };

  const measureDesktopHeight = () => {
    const stage = stageRef.current;
    if (!stage || isCompactViewport()) return;

    stage.setAttribute("data-measuring", "true");

    let maximumHeight = 0;
    for (const card of cardRefs.current) {
      if (!card) continue;
      card.style.height = "auto";
      maximumHeight = Math.max(
        maximumHeight,
        Math.ceil(card.getBoundingClientRect().height),
      );
    }

    if (maximumHeight > 0) {
      const height = `${maximumHeight}px`;
      stage.style.setProperty("--cards-h", height);
      for (const card of cardRefs.current) {
        if (card) card.style.height = height;
      }
    }

    stage.removeAttribute("data-measuring");
  };

  const computeExpandedGeometry = useCallback(
    (index: number) => {
      if (isCompactViewport()) return;

      const stage = stageRef.current;
      const card = cardRefs.current[index];
      if (!stage || !card) return;

      const { sideGap } = getStageVariables();
      const baseX =
        Number.parseFloat(
          getComputedStyle(card).getPropertyValue("--x"),
        ) || 0;

      card.style.setProperty(
        "--expand-w",
        `${Math.max(0, Math.round(stage.clientWidth - sideGap * 2))}px`,
      );
      card.style.setProperty(
        "--shift-x",
        `${Math.round(sideGap - baseX)}px`,
      );
    },
    [isCompactViewport],
  );

  const layoutDesktop = useCallback(async () => {
    cancelScheduledLayout();

    if (isCompactViewport()) {
      resetAllCardStyles();
      return;
    }

    writeDesktopPositions();
    await afterTwoFrames();

    if (isCompactViewport()) return;
    measureDesktopHeight();

    if (activeIndexRef.current != null) {
      computeExpandedGeometry(activeIndexRef.current);
    }
  }, [
    cancelScheduledLayout,
    computeExpandedGeometry,
    isCompactViewport,
    resetAllCardStyles,
  ]);

  const scheduleDesktopLayout = useCallback(() => {
    cancelScheduledLayout();
    frameRef.current = requestAnimationFrame(() => {
      void layoutDesktop();
    });
  }, [cancelScheduledLayout, layoutDesktop]);

  const openCard = useCallback(
    (index: number) => {
      clearTimers();
      activeIndexRef.current = index;
      setActiveIndex(index);

      if (isCompactViewport()) {
        setPhase("expanded");
        return;
      }

      setPhase("opening");
      timersRef.current.open = window.setTimeout(() => {
        computeExpandedGeometry(index);
        setPhase("expanded");

        const closeButton = cardRefs.current[index]?.querySelector<HTMLElement>(
          "[data-role='close']",
        );
        closeButton?.focus({ preventScroll: true });
      }, openExpandDelay);
    },
    [clearTimers, computeExpandedGeometry, isCompactViewport, openExpandDelay],
  );

  const closeCard = useCallback(() => {
    const index = activeIndexRef.current;
    if (index == null) return;

    clearTimers();

    if (isCompactViewport()) {
      clearCardVariables(cardRefs.current[index]);
      activeIndexRef.current = null;
      setActiveIndex(null);
      setPhase("idle");
      return;
    }

    setPhase("closing");
    timersRef.current.close = window.setTimeout(() => {
      const card = cardRefs.current[index];
      clearCardVariables(card);
      activeIndexRef.current = null;
      setActiveIndex(null);
      setPhase("idle");

      card
        ?.querySelector<HTMLElement>("[data-role='toggle']")
        ?.focus({ preventScroll: true });
    }, closeResetDelay);
  }, [
    clearCardVariables,
    clearTimers,
    closeResetDelay,
    isCompactViewport,
  ]);

  const onToggle = useCallback(
    (index: number) => {
      const currentIndex = activeIndexRef.current;

      if (currentIndex === index) {
        closeCard();
        return;
      }

      if (isCompactViewport()) {
        openCard(index);
        return;
      }

      if (currentIndex != null) {
        closeCard();
        clearTimers();
        timersRef.current.open = window.setTimeout(
          () => openCard(index),
          closeResetDelay,
        );
        return;
      }

      openCard(index);
    },
    [
      clearTimers,
      closeCard,
      closeResetDelay,
      isCompactViewport,
      openCard,
    ],
  );

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${compactBreakpoint}px)`,
    );

    const applyLayoutMode = () => {
      const compact = mediaQuery.matches;
      setIsCompactLayout(compact);
      clearTimers();
      cancelScheduledLayout();

      if (compact) {
        resetAllCardStyles();
        setPhase(activeIndexRef.current == null ? "idle" : "expanded");
      } else {
        activeIndexRef.current = null;
        setActiveIndex(null);
        setPhase("idle");
        scheduleDesktopLayout();
      }
    };

    applyLayoutMode();
    mediaQuery.addEventListener("change", applyLayoutMode);

    return () => {
      mediaQuery.removeEventListener("change", applyLayoutMode);
    };
  }, [
    cancelScheduledLayout,
    clearTimers,
    compactBreakpoint,
    resetAllCardStyles,
    scheduleDesktopLayout,
  ]);

  useLayoutEffect(() => {
    cardRefs.current = Array.from(
      { length: count },
      (_, index) => cardRefs.current[index] ?? null,
    );

    if (!isCompactViewport()) scheduleDesktopLayout();
  }, [count, isCompactViewport, scheduleDesktopLayout]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(() => {
      if (!isCompactViewport()) scheduleDesktopLayout();
    });

    observer.observe(stage);

    return () => observer.disconnect();
  }, [isCompactViewport, scheduleDesktopLayout]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && activeIndexRef.current != null) {
        closeCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCard]);

  useEffect(
    () => () => {
      clearTimers();
      cancelScheduledLayout();
    },
    [cancelScheduledLayout, clearTimers],
  );

  const isOpen = phase !== "idle";
  const isExpanded = phase === "expanded";

  return {
    stageRef,
    cardRefs,
    activeIndex,
    phase,
    isOpen,
    isExpanded,
    isCompactLayout,
    onToggle,
    onClose: closeCard,
  };
}