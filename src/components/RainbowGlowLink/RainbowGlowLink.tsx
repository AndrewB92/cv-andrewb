"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./RainbowGlowLink.module.css";

/* ---------- Icons ---------- */

type IconName = "arrow" | "download" | "mail" | "phone";
type ArrowDirection = "up" | "right" | "down" | "left";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M7 10l5 5 5-5" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M12 3v10" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 21h14" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M6.5 3.5l3.2 3.2-1.7 2.1c1.4 2.6 3.5 4.7 6.1 6.1l2.1-1.7 3.2 3.2-1.6 2.2c-.5.7-1.4 1.1-2.3.9-7.3-1.5-13-7.2-14.5-14.5-.2-.9.2-1.8.9-2.3z" />
    </svg>
  );
}

function IconGlyph({ name }: { name: IconName }) {
  switch (name) {
    case "download":
      return <DownloadIcon />;
    case "mail":
      return <MailIcon />;
    case "phone":
      return <PhoneIcon />;
    case "arrow":
    default:
      return <ArrowIcon />;
  }
}

function directionToDeg(dir: ArrowDirection): number {
  // base arrow points DOWN (0deg)
  switch (dir) {
    case "down":
      return 0;
    case "left":
      return 90;
    case "up":
      return 180;
    case "right":
      return -90;
    default:
      return 0;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

/* ---------- Component ---------- */

type RainbowGlowLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;

  variant?: "glow" | "flat";

  glow?: boolean;
  blob?: boolean;

  icon?: ReactNode | false;
  iconName?: IconName;
  iconDirection?: ArrowDirection;
  iconPosition?: "start" | "end";
  iconAriaLabel?: string;

  /** Viewport tuning */
  threshold?: number;
  rootMargin?: string;
};

export function RainbowGlowLink({
  href,
  children,
  className = "",
  variant = "glow",
  glow,
  blob,

  icon,
  iconName = "arrow",
  iconDirection = "right",

  iconPosition = "end",
  iconAriaLabel,

  threshold = 0.15,
  rootMargin = "120px",
}: RainbowGlowLinkProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const [inView, setInView] = useState(true);
  const reduceMotionRef = useRef(false);

  const flags = useMemo(() => {
    const isFlat = variant === "flat";
    const enableGlow = glow ?? !isFlat;
    const enableBlob = blob ?? !isFlat;

    const resolvedIcon = icon === false ? null : (icon ?? <IconGlyph name={iconName} />);
    const iconRotate = iconName === "arrow" ? directionToDeg(iconDirection) : 0;

    return {
      glow: enableGlow,
      blob: enableBlob,
      icon: resolvedIcon,
      hasIcon: Boolean(resolvedIcon),
      iconPosition,
      iconAriaLabel,
      iconRotate,
      iconName,
    };
  }, [variant, glow, blob, icon, iconName, iconDirection, iconPosition, iconAriaLabel]);

  // Observe visibility (and disable animation entirely if reduced motion)
  useEffect(() => {
    reduceMotionRef.current = prefersReducedMotion();

    const el = wrapRef.current;
    if (!el) return;

    if (reduceMotionRef.current) {
      setInView(false);
      el.dataset.paused = "1";
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(!!entry?.isIntersecting);
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold]);

  // Pointer blob logic: attach listeners ONLY when (blob enabled + in view)
  useEffect(() => {
    if (!flags.blob) return;

    const el = wrapRef.current;
    if (!el) return;

    // keep CSS in sync
    el.dataset.paused = inView ? "0" : "1";

    if (!inView || reduceMotionRef.current) {
      // when out of view, ensure we stop any pending raf and skip listeners
      return;
    }

    let rect: DOMRect | null = null;
    let raf = 0;

    let tx = 0,
      ty = 0;
    let x = 0,
      y = 0;

    const SMOOTH = 0.22;

    const readRect = () => {
      rect = el.getBoundingClientRect();
    };

    const recache = () => {
      if (!rect) readRect();
      if (!rect) return;

      tx = rect.width * 0.5;
      ty = rect.height * 0.5;
      x = tx;
      y = ty;

      el.style.setProperty("--pointer-x", `${Math.round(x)}px`);
      el.style.setProperty("--pointer-y", `${Math.round(y)}px`);
      el.style.setProperty("--blob-mix", "0.5");
    };

    const loop = () => {
      raf = 0;

      x += (tx - x) * SMOOTH;
      y += (ty - y) * SMOOTH;

      el.style.setProperty("--pointer-x", `${Math.round(x)}px`);
      el.style.setProperty("--pointer-y", `${Math.round(y)}px`);

      if (Math.abs(tx - x) > 0.6 || Math.abs(ty - y) > 0.6) {
        raf = requestAnimationFrame(loop);
      }
    };

    const requestLoop = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

    const onEnter = () => {
      readRect();
      recache();
      requestLoop();
    };

    const onMove = (e: PointerEvent) => {
      if (!rect) readRect();
      if (!rect) return;

      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;

      tx = clamp(nx, 0, rect.width);
      ty = clamp(ny, 0, rect.height);

      const mix = rect.width ? tx / rect.width : 0.5;
      el.style.setProperty("--blob-mix", mix.toFixed(3));

      requestLoop();
    };

    const onLeave = () => {
      if (!rect) readRect();
      if (!rect) return;

      tx = rect.width * 0.5;
      ty = rect.height * 0.5;
      el.style.setProperty("--blob-mix", "0.5");
      requestLoop();
    };

    // Prefer ResizeObserver over global resize
    const ro = new ResizeObserver(() => {
      rect = null;
    });
    ro.observe(el);

    el.addEventListener("pointerenter", onEnter, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });

    // init once (helps first hover feel instant)
    readRect();
    recache();

    return () => {
      ro.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [flags.blob, inView]);

  // Always set paused dataset so glow animation can freeze offscreen even if blob is off
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.dataset.paused = inView ? "0" : "1";
  }, [inView]);

  const wrapperClass = [
    styles.wrapper,
    flags.glow ? styles.withGlow : styles.noGlow,
    flags.blob ? styles.withBlob : styles.noBlob,
    flags.hasIcon ? styles.withIcon : "",
    flags.hasIcon && flags.iconPosition === "start" ? styles.iconStart : styles.iconEnd,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconStyle =
    flags.iconName === "arrow"
      ? ({ ["--icon-rotate" as any]: `${flags.iconRotate}deg` } as React.CSSProperties)
      : undefined;

  return (
    <span ref={wrapRef} className={wrapperClass} data-paused={inView ? "0" : "1"}>
      <Link href={href} className={styles.link}>
        {flags.hasIcon && flags.iconPosition === "start" ? (
          <span className={styles.icon} aria-label={flags.iconAriaLabel} style={iconStyle}>
            {flags.icon}
          </span>
        ) : null}

        <span className={styles.text}>{children}</span>

        {flags.hasIcon && flags.iconPosition === "end" ? (
          <span className={styles.icon} aria-label={flags.iconAriaLabel} style={iconStyle}>
            {flags.icon}
          </span>
        ) : null}
      </Link>

      <span className={styles.bg} aria-hidden="true" />
      {flags.glow ? <span className={styles.glow} aria-hidden="true" /> : null}
    </span>
  );
}