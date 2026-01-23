"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import styles from "./RainbowGlowLink.module.css";

/* ---------- Icons ---------- */

type IconName = "arrow" | "download" | "mail" | "phone";
type ArrowDirection = "up" | "right" | "down" | "left";

function ArrowIcon() {
  // base arrow points "down"
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
  // our base arrow points DOWN (0deg)
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

/* ---------- Component ---------- */

type RainbowGlowLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;

  variant?: "glow" | "flat";

  glow?: boolean;
  blob?: boolean;

  /**
   * icon options:
   * - icon (ReactNode) overrides everything
   * - icon === false disables icon
   * - iconName chooses built-in icon set
   */
  icon?: ReactNode | false;
  iconName?: IconName; // default "arrow"
  iconDirection?: ArrowDirection; // only for arrow
  iconPosition?: "start" | "end";
  iconAriaLabel?: string;
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
}: RainbowGlowLinkProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  const flags = useMemo(() => {
    const isFlat = variant === "flat";
    const enableGlow = glow ?? !isFlat;
    const enableBlob = blob ?? !isFlat;

    const resolvedIcon =
      icon === false ? null : (icon ?? <IconGlyph name={iconName} />);

    const iconRotate =
      iconName === "arrow" ? directionToDeg(iconDirection) : 0;

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
  }, [
    variant,
    glow,
    blob,
    icon,
    iconName,
    iconDirection,
    iconPosition,
    iconAriaLabel,
  ]);

  useEffect(() => {
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

      tx = nx < 0 ? 0 : nx > rect.width ? rect.width : nx;
      ty = ny < 0 ? 0 : ny > rect.height ? rect.height : ny;

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
    flags.hasIcon && flags.iconPosition === "start"
      ? styles.iconStart
      : styles.iconEnd,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span ref={wrapRef} className={wrapperClass}>
      <Link href={href} className={styles.link}>
        {flags.hasIcon && flags.iconPosition === "start" ? (
          <span
            className={styles.icon}
            aria-label={flags.iconAriaLabel}
            style={
              flags.iconName === "arrow"
                ? ({ ["--icon-rotate" as any]: `${flags.iconRotate}deg` } as React.CSSProperties)
                : undefined
            }
          >
            {flags.icon}
          </span>
        ) : null}

        <span className={styles.text}>{children}</span>

        {flags.hasIcon && flags.iconPosition === "end" ? (
          <span
            className={styles.icon}
            aria-label={flags.iconAriaLabel}
            style={
              flags.iconName === "arrow"
                ? ({ ["--icon-rotate" as any]: `${flags.iconRotate}deg` } as React.CSSProperties)
                : undefined
            }
          >
            {flags.icon}
          </span>
        ) : null}
      </Link>

      <span className={styles.bg} aria-hidden="true" />
      {flags.glow ? <span className={styles.glow} aria-hidden="true" /> : null}
    </span>
  );
}