"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./CalPopup.module.css";

type CalPopupProps = {
  /** URL param that triggers the modal. Example: ?meet=hour-meeting */
  paramKey?: string;

  /** Map param value -> calLink */
  linksByKey: Record<string, string>;

  /** Default inline config */
  defaultConfig?: Record<string, unknown>;

  /** Default UI config */
  ui?: Record<string, unknown>;

  /** Cal origin */
  origin?: string;

  /** Optional label for aria */
  ariaLabel?: string;
};

declare global {
  interface Window {
    Cal?: any;
  }
}

const CAL_SCRIPT_SRC = "https://app.cal.eu/embed/embed.js";

/**
 * Type-safe Cal bootstrap.
 * This mirrors Cal’s embed snippet behavior, but avoids TS self-referential `api.q` issues.
 * It also avoids re-bootstrapping if already done.
 */
function ensureCalBootstrapped() {
  if (typeof window === "undefined") return;

  const w = window as any;

  // If already bootstrapped (or embed.js already set it up), do nothing.
  if (w.Cal && w.Cal.loaded) return;

  (function bootstrap(C: any, A: string, L: string) {
    const d: Document = C.document;

    const push = (fn: any, args: IArguments | unknown[]) => {
      fn.q = fn.q || [];
      fn.q.push(args);
    };

    C.Cal =
      C.Cal ||
      function calFn() {
        const cal = C.Cal;
        const ar = arguments;

        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];

          const s = d.createElement("script");
          s.src = A;
          s.async = true;
          d.head.appendChild(s);

          cal.loaded = true;
        }

        if (ar[0] === L) {
          // namespace init
          const api: any = function apiFn() {
            push(api, arguments);
          };

          const namespace = ar[1];

          // TS-safe: avoid `api.q = api.q || []` on itself
          if (!api.q) api.q = [];

          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            push(cal.ns[namespace], ar);
            push(cal, ["initNamespace", namespace]);
          } else {
            push(cal, ar);
          }
          return;
        }

        push(cal, ar);
      };
  })(w, CAL_SCRIPT_SRC, "init");
}

/** Wait until Cal namespace exists (embed.js might take a tick to attach ns/api). */
async function waitForNamespace(key: string, timeoutMs = 8000): Promise<void> {
  const start = performance.now();

  while (performance.now() - start < timeoutMs) {
    const Cal: any = window.Cal;
    if (Cal?.ns && Cal.ns[key]) return;

    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }

  throw new Error(`Cal namespace "${key}" not ready after ${timeoutMs}ms`);
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
  ariaLabel = "Schedule a meeting",
}: CalPopupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);

  // stable mount id per component instance
  const mountId = useMemo(
    () => `cal-inline-${Math.random().toString(16).slice(2)}`,
    []
  );

  const activeCalLink = activeKey ? linksByKey[activeKey] : undefined;

  const close = useCallback(() => {
    setOpen(false);
    setActiveKey(null);

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

      const sp = new URLSearchParams(searchParams?.toString());
      sp.set(paramKey, key);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [linksByKey, paramKey, pathname, router, searchParams]
  );

  // Open from URL param
  useEffect(() => {
    const key = searchParams?.get(paramKey);

    if (key && linksByKey[key]) {
      setActiveKey(key);
      setOpen(true);
      return;
    }

    if (!key) {
      setOpen(false);
      setActiveKey(null);
    }
  }, [linksByKey, paramKey, searchParams]);

  // Open from special links/buttons:
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

  // ESC + scroll lock
  useEffect(() => {
    if (!open) return;

    lockBodyScroll(true);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);

    const t = window.setTimeout(() => {
      modalRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      lockBodyScroll(false);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  // Mount Cal inline when open
  useEffect(() => {
    if (!open || !activeKey || !activeCalLink) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      // Official bootstrap (loads embed.js once and sets up Cal.ns/queue)
      ensureCalBootstrapped();

      // init namespace
      window.Cal("init", activeKey, { origin });

      // Wait until namespace api exists
      await waitForNamespace(activeKey);
      if (cancelled) return;

      const mountEl = document.getElementById(mountId);
      if (!mountEl) return;

      // reset mount (important when switching keys)
      mountEl.innerHTML = "";

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
    });

    return () => {
      cancelled = true;
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
      aria-label={ariaLabel}
      onMouseDown={(e) => {
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