"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import styles from "./CalPopup.module.css";

const Cal = dynamic(
  () => import("@calcom/embed-react").then((module) => module.default),
  {
    ssr: false,
    loading: () => <CalSkeleton />,
  }
);

const CAL_TABS = [
  {
    key: "intro-call",
    label: "Intro call",
    description: "A short call to discuss your project and requirements.",
    calLink: "andrew-bielous/intro-call",
  },
  {
    key: "career-conversation",
    label: "Career conversation",
    description: "A focused conversation about roles, experience, and fit.",
    calLink: "andrew-bielous/career-conversation",
  },
] as const;

type CalTabKey = (typeof CAL_TABS)[number]["key"];

type CalPopupProps = {
  /** URL parameter used to open and select the popup tab. */
  paramKey?: string;

  /** Accessible label for the dialog. */
  ariaLabel?: string;

  /** Tab selected when no supported URL value is provided. */
  initialTab?: CalTabKey;

  /**
   * Kept for compatibility with the previous component API.
   * The two supported Cal links are now defined by CAL_TABS above.
   */
  linksByKey?: Record<string, string>;
};

const TAB_ALIASES: Readonly<Record<string, CalTabKey>> = {
  "intro-call": "intro-call",
  "hour-meeting": "intro-call",
  "career-conversation": "career-conversation",
};

const CAL_CONFIG = {
  layout: "month_view",
  useSlotsViewOnSmallScreen: "true",
} as const;

const CAL_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  overflow: "auto",
};

function isCalTabKey(value: string): value is CalTabKey {
  return CAL_TABS.some((tab) => tab.key === value);
}

function resolveTabKey(value: string | null): CalTabKey | null {
  if (!value) return null;
  return TAB_ALIASES[value] ?? (isCalTabKey(value) ? value : null);
}

function CalSkeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-live="polite">
      <span className={styles.skeletonSpinner} aria-hidden="true" />
      <span>Loading calendar…</span>
    </div>
  );
}

function lockPageScroll() {
  const html = document.documentElement;
  const previousOverflow = html.style.overflow;
  const previousPaddingRight = html.style.paddingRight;
  const scrollbarWidth = window.innerWidth - html.clientWidth;

  html.style.overflow = "hidden";

  if (scrollbarWidth > 0) {
    html.style.paddingRight = `${scrollbarWidth}px`;
  }

  return () => {
    html.style.overflow = previousOverflow;
    html.style.paddingRight = previousPaddingRight;
  };
}

export function CalPopup({
  paramKey = "meet",
  ariaLabel = "Schedule a meeting",
  initialTab = "intro-call",
}: CalPopupProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CalTabKey>(initialTab);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const activeTabData =
    CAL_TABS.find((tab) => tab.key === activeTab) ?? CAL_TABS[0];

  const updateUrl = useCallback(
    (key: CalTabKey | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (key) {
        params.set(paramKey, key);
      } else {
        params.delete(paramKey);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [paramKey, pathname, router, searchParams]
  );

  const openWithTab = useCallback(
    (key: CalTabKey) => {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setActiveTab(key);
      setIsOpen(true);
      updateUrl(key);
    },
    [updateUrl]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    updateUrl(null);

    window.requestAnimationFrame(() => {
      previouslyFocusedRef.current?.focus({ preventScroll: true });
    });
  }, [updateUrl]);

  const selectTab = useCallback(
    (key: CalTabKey) => {
      if (key === activeTab) return;
      setActiveTab(key);
      updateUrl(key);
    },
    [activeTab, updateUrl]
  );

  useEffect(() => {
    const requestedTab = resolveTabKey(searchParams.get(paramKey));

    if (requestedTab) {
      setActiveTab(requestedTab);
      setIsOpen(true);
      return;
    }

    setIsOpen(false);
  }, [paramKey, searchParams]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest<HTMLElement>(".js-cal-open");

      if (!trigger) return;

      const requestedTab = resolveTabKey(trigger.dataset.calKey ?? null);
      if (!requestedTab) return;

      event.preventDefault();
      openWithTab(requestedTab);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [openWithTab]);

  useEffect(() => {
    if (!isOpen) return;

    const unlockPageScroll = lockPageScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])'
      );

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      unlockPageScroll();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    void import("@calcom/embed-react").then(async ({ getCalApi }) => {
      if (cancelled) return;

      const cal = await getCalApi({ namespace: activeTab });
      if (cancelled) return;

      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#292929" },
          dark: { "cal-brand": "#d357e6" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, isOpen]);

  const handleTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + CAL_TABS.length) % CAL_TABS.length;
    const nextTab = CAL_TABS[nextIndex];

    selectTab(nextTab.key);

    document
      .getElementById(`cal-tab-${nextTab.key}`)
      ?.focus({ preventScroll: true });
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Schedule</p>
            <h2 className={styles.title}>Choose a conversation</h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Close scheduling dialog"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Meeting type">
          {CAL_TABS.map((tab, index) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                id={`cal-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="cal-tab-panel"
                tabIndex={isActive ? 0 : -1}
                className={styles.tab}
                data-active={isActive ? "true" : "false"}
                onClick={() => selectTab(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span className={styles.tabLabel}>{tab.label}</span>
                <span className={styles.tabDescription}>{tab.description}</span>
              </button>
            );
          })}
        </div>

        <div
          id="cal-tab-panel"
          className={styles.body}
          role="tabpanel"
          aria-labelledby={`cal-tab-${activeTab}`}
        >
          <div className={styles.calWrap} key={activeTabData.key}>
            <Cal
              namespace={activeTabData.key}
              calLink={activeTabData.calLink}
              style={CAL_STYLE}
              config={CAL_CONFIG}
            />
          </div>
        </div>
      </div>
    </div>
  );
}