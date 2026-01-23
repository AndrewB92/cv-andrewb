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
};

declare global {
  interface Window {
    Cal?: any;
  }
}

const CAL_SCRIPT_SRC = "https://app.cal.eu/embed/embed.js";

function loadScriptOnce(src: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${src}"]`
  );
  if (existing) {
    if ((existing as any).__loaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Cal script failed to load")), { once: true });
    });
  }

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

function ensureCalBootstrapped(origin: string) {
  // If Cal is already there and looks initialized, do nothing.
  if (window.Cal) return;

  // Cal's recommended bootstrap wrapper:
  (function (C: any, A: string, L: string) {
    let p = function (a: any, ar: any) {
      a.q.push(ar);
    };
    let d = C.document;
    C.Cal =
      C.Cal ||
      function () {
        let cal = C.Cal;
        let ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () {
            p(api, arguments);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
  })(window, CAL_SCRIPT_SRC, "init");

  // Optional: keep origin consistent
  // (we pass origin later too, but harmless here)
  // window.Cal("init", "global", { origin });
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

export function CalPopup({
  paramKey = "meet",
  linksByKey,
  defaultConfig = { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
  ui = { hideEventTypeDetails: false, layout: "month_view" },
  origin = "https://app.cal.eu",
}: CalPopupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const mountId = useMemo(
    () => `cal-inline-${Math.random().toString(16).slice(2)}`,
    []
  );

  const activeCalLink = activeKey ? linksByKey[activeKey] : undefined;

  const close = useCallback(() => {
    setOpen(false);
    setActiveKey(null);

    // remove param from URL (without hard reload)
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

      // keep URL in sync (nice for shareable links)
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
    // if param removed externally
    if (!key) {
      setOpen(false);
      setActiveKey(null);
    }
  }, [linksByKey, paramKey, searchParams]);

  // 2) Open from special links/buttons: .js-cal-open[data-cal-key="hour-meeting"]
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

    // focus modal for accessibility-ish baseline
    setTimeout(() => modalRef.current?.focus(), 0);

    return () => {
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
      // Ensure Cal global exists + script is ready
      ensureCalBootstrapped(origin);
      await loadScriptOnce(CAL_SCRIPT_SRC);
      if (cancelled) return;

      // wipe mount node first (important when switching keys)
      const mountEl = document.getElementById(mountId);
      if (!mountEl) return;
      mountEl.innerHTML = "";

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
    };

    run().catch(() => {
      // If needed, you can surface a toast/error state here
    });

    return () => {
      cancelled = true;
      // we intentionally don't remove the script; we just unmount the container
      const mountEl = document.getElementById(mountId);
      if (mountEl) mountEl.innerHTML = "";
    };
  }, [open, activeKey, activeCalLink, defaultConfig, ui, origin, mountId]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a meeting"
      onMouseDown={(e) => {
        // close only if clicking the backdrop (not inside panel)
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={styles.panel}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.title}>
            {activeKey === "hour-meeting" ? "Schedule a call" : "Schedule"}
          </div>

          <button type="button" className={styles.close} onClick={close} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.calWrap} id={mountId} />
        </div>
      </div>
    </div>
  );
}