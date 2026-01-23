"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import styles from "./RainbowGlowLink.module.css";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 4l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
type RainbowGlowLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;

  /** quick preset */
  variant?: "glow" | "flat";

  /** layers */
  glow?: boolean; // default true (unless flat)
  blob?: boolean; // default true (unless flat)

  /** optional icon (svg/react node) */
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  iconAriaLabel?: string; // if icon is meaningful
};

export function RainbowGlowLink({
  href,
  children,
  className = "",
  variant = "glow",
  glow,
  blob,
  icon,
  iconPosition = "end",
  iconAriaLabel,
}: RainbowGlowLinkProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  const flags = useMemo(() => {
    const isFlat = variant === "flat";
    return {
      glow: glow ?? !isFlat,
      blob: blob ?? !isFlat,
      hasIcon: Boolean(icon),
      iconPosition,
    };
  }, [variant, glow, blob, icon, iconPosition]);

  useEffect(() => {
    // If blob disabled, don't attach listeners at all (cheapest)
    if (!flags.blob) return;

    const el = wrapRef.current;
    if (!el) return;

    let rect: DOMRect | null = null;
    let raf = 0;

    let tx = 0, ty = 0;
    let x = 0, y = 0;

    const SMOOTH = 0.22;

    const recache = () => {
      rect = el.getBoundingClientRect();
      tx = rect.width * 0.5;
      ty = rect.height * 0.5;
      x = tx;
      y = ty;

      el.style.setProperty("--pointer-x", `${x.toFixed(2)}px`);
      el.style.setProperty("--pointer-y", `${y.toFixed(2)}px`);
      el.style.setProperty("--blob-mix", "0.5");
    };

    const loop = () => {
      raf = 0;

      x += (tx - x) * SMOOTH;
      y += (ty - y) * SMOOTH;

      // quantize a bit to reduce style churn
      const qx = Math.round(x);
      const qy = Math.round(y);

      el.style.setProperty("--pointer-x", `${qx}px`);
      el.style.setProperty("--pointer-y", `${qy}px`);

      if (Math.abs(tx - x) > 0.6 || Math.abs(ty - y) > 0.6) {
        raf = requestAnimationFrame(loop);
      }
    };

    const requestLoop = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onEnter = () => {
      recache();
      requestLoop();
    };

    const onMove = (e: PointerEvent) => {
      if (!rect) return;

      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;

      // clamp first
      tx = nx < 0 ? 0 : nx > rect.width ? rect.width : nx;
      ty = ny < 0 ? 0 : ny > rect.height ? rect.height : ny;

      // mix based on X ratio (purple->blue)
      const mix = rect.width ? tx / rect.width : 0.5;
      el.style.setProperty("--blob-mix", mix.toFixed(3));

      requestLoop();
    };

    const onLeave = () => {
      if (!rect) return;
      tx = rect.width * 0.5;
      ty = rect.height * 0.5;
      el.style.setProperty("--blob-mix", "0.5");
      requestLoop();
    };

    el.addEventListener("pointerenter", onEnter, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });

    const onResize = () => { rect = null; };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [flags.blob]);

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

  return (
    <span ref={wrapRef} className={wrapperClass}>
      <Link href={href} className={styles.link}>
        {flags.hasIcon && flags.iconPosition === "start" ? (
          <span className={styles.icon} aria-label={iconAriaLabel}>
            {icon}
          </span>
        ) : null}

        <span className={styles.text}>{children}</span>

        {flags.hasIcon && flags.iconPosition === "end" ? (
          <span className={styles.icon} aria-label={iconAriaLabel}>
            {icon}
          </span>
        ) : null}
      </Link>

      <span className={styles.bg} aria-hidden="true" />
      {flags.glow ? <span className={styles.glow} aria-hidden="true" /> : null}
    </span>
  );
}