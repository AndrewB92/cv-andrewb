"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./CalPopup.module.css";

type CalPopupProps = {
  /**
   * URL param that triggers the modal.
   * Example: ?meet=hour-meeting
   */
  paramKey?: string;

  /**
   * Map param value -> calLink
   * Example: { "hour-meeting": "andrew-bielous-iyuwdo/hour-meeting" }
   */
  linksByKey: Record<string, string>;

  /**
   * Optional default config passed to Cal inline embed
   */
  defaultConfig?: Record<string, unknown>;

  /**
   * Optional ui options
   */
  ui?: Record<string, unknown>;

  /**
   * Cal origin (usually https://app.cal.eu)
   */
  origin?: string;

  /**
   * Optional label for aria
   */
  ariaLabel?: string;
};

declare global {
  interface Window {
    Cal?: any;
  }
}

const CAL_SCRIPT_SRC = "https://app.cal.eu/embed/embed.js";

type CalCommand = unknown[];

function loadScriptOnce(src: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${src}"]`
  );

  // If script already exists and loaded, done.
  if (existing && (existing as any).__loaded) return Promise.resolve();

  // If script exists but not marked loaded, attach listeners.
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Cal script failed to load")),
        { once: true }
      );
    });
  }

  // Create script
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    (s as any).__loaded = false;

    s.addEventListener(
      "load",
      () => {
        (s as any).__loaded = true;
        resolve();
      },
      { once: true }
    );

    s.addEventListener(
      "error",
      () => reject(new Error("Cal script failed to load")),
      { once: true }
    );

    document.head.appendChild(s);
  });
}

/**
 * Provide a typed queueing stub for window.Cal so calls are safe
 * before embed.js finishes loading. embed.js will replace Cal and
 * drain Cal.q in most embed implementations.
 */
function ensureCalQueue() {
  if (typeof window === "undefined") return;
  if (window.Cal) return;

  const q: CalCommand[] = [];
  const Cal = (...args: unknown[]) => {
    q.push(args);
  };

  (Cal as any).q = q;
  window.Cal = Cal as any;
}

function lockBodyScroll(lock: boolean) {
  const html = document.documentElement;

  if (lock) {
    const scrollBarCompensation = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (scrollBarCompensation > 0) {
      html.style.paddingRight = `${scrollBarCompensation}px`;
    }
  } else {
    html.style.overflow = "";
    html.style.paddingRight = "";
  }
}

function safeSetInnerHTML(el: HTMLElement | null, html: string) {
  if (!el) return;
  el.innerHTML = html;
}

export function CalPopup({
  paramKey = "meet",
  linksByKey,
  defaultConfig = { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
  ui = { hideEventTypeDetails: false, layout: "month_view" },
  origin = "https://app.cal.eu",
  ariaLabel = "Schedule a meeting",
}: CalPopupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Stable mount id per component instance
  const mountId = useMemo(
    () => `cal-inline-${Math.random().toString(16).slice(2)}`,
    []
  );

  const activeCalLink = activeKey ? linksByKey[activeKey] : undefined;

  const close = useCallback(() => {
    setOpen(false);
    setActiveKey(null);

    // Remove param from URL (no hard reload)
    const sp = new URLSearchParams(searchParams?.toString());
    sp.delete(paramKey);
    const next = sp.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [paramKey, pathname, router, searchParams]);

  const openWithKey = useCallback(
    (key: string) => {
      if (!linksByKey[key]) return;

      setActiveKey(key);
      setOpen(true);

      // Keep URL in sync (shareable deep links)
      const sp = new URLSearchParams(searchParams?.toString());
      sp.set(paramKey, key);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [linksByKey, paramKey, pathname, router, searchParams]
  );

  // 1) Open from URL param
  useEffect(() => {
    const key = searchParams?.get(paramKey);

    if (key && linksByKey[key]) {
      setActiveKey(key);
      setOpen(true);
      return;
    }

    // If param removed externally, close.
    if (!key) {
      setOpen(false);
      setActiveKey(null);
    }
  }, [linksByKey, paramKey, searchParams]);

  // 2) Open from special links/buttons:
  // <a className="js-cal-open" data-cal-key="hour-meeting" href="/contact?meet=hour-meeting">
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const el = target.closest<HTMLElement>(".js-cal-open");
      if (!el) return;

      const key = el.getAttribute("data-cal-key");
      if (!key) return;

      e.preventDefault();
      openWithKey(key);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openWithKey]);

  // 3) ESC to close + body scroll lock
  useEffect(() => {
    if (!open) return;

    lockBodyScroll(true);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);

    // focus modal for keyboard users
    const t = window.setTimeout(() => {
      modalRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      lockBodyScroll(false);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  // 4) Mount Cal inline embed when open + have a calLink
  useEffect(() => {
    if (!open || !activeKey || !activeCalLink) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      // Make calls safe before embed.js loads
      ensureCalQueue();

      // Load embed script once
      await loadScriptOnce(CAL_SCRIPT_SRC);
      if (cancelled) return;

      // Ensure mount exists and empty it (important when switching keys)
      const mountEl = document.getElementById(mountId);
      if (!mountEl) return;

      safeSetInnerHTML(mountEl, "");

      // If embed.js hasn't populated window.Cal namespaces yet, wait a microtask.
      // This helps in edge cases where the script "load" fires but the library
      // hasn't finished setting up ns.
      await Promise.resolve();
      if (cancelled) return;

      // init namespace for this key
      window.Cal("init", activeKey, { origin });

      // inline embed
      window.Cal.ns[activeKey]("inline", {
        elementOrSelector: `#${mountId}`,
        config: defaultConfig,
        calLink: activeCalLink,
      });

      // UI options
      window.Cal.ns[activeKey]("ui", ui);

      setIsLoading(false);
    };

    run().catch(() => {
      if (!cancelled) setIsLoading(false);
      // Optional: show an error state
    });

    return () => {
      cancelled = true;
      const mountEl = document.getElementById(mountId);
      safeSetInnerHTML(mountEl, "");
    };
  }, [open, activeKey, activeCalLink, defaultConfig, ui, origin, mountId]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        // close only if clicking the backdrop (not inside panel)
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.panel} ref={modalRef} tabIndex={-1}>
        <div className={styles.header}>
          <div className={styles.title}>Schedule</div>

          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.loading} aria-live="polite">
              Loading…
            </div>
          ) : null}
          <div className={styles.calWrap} id={mountId} />
        </div>
      </div>
    </div>
  );
}