"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  FaArrowUpRightFromSquare,
  FaCalendarDays,
  FaCodepen,
  FaDownload,
  FaEnvelope,
  FaFilePdf,
  FaLinkedin,
  FaPhone,
} from "react-icons/fa6";
import {
  SiGithub,
  SiGravatar,
  SiTelegram,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import styles from "./RainbowGlowLink.module.css";

export type RainbowGlowLinkIconName =
  | "arrow"
  | "external"
  | "download"
  | "mail"
  | "phone"
  | "calendar"
  | "telegram"
  | "whatsapp"
  | "github"
  | "codepen"
  | "linkedin"
  | "gravatar"
  | "youtube"
  | "pdf";

type ArrowDirection = "up" | "right" | "down" | "left";
type IconKind = "custom-arrow" | "ui" | "brand";

type IconDefinition = {
  glyph: ReactNode;
  kind: IconKind;
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 10l5 5 5-5" />
    </svg>
  );
}

function getIconDefinition(name: RainbowGlowLinkIconName): IconDefinition {
  switch (name) {
    case "external":
      return { glyph: <FaArrowUpRightFromSquare />, kind: "ui" };
    case "download":
      return { glyph: <FaDownload />, kind: "ui" };
    case "mail":
      return { glyph: <FaEnvelope />, kind: "ui" };
    case "phone":
      return { glyph: <FaPhone />, kind: "ui" };
    case "calendar":
      return { glyph: <FaCalendarDays />, kind: "ui" };
    case "telegram":
      return { glyph: <SiTelegram />, kind: "brand" };
    case "whatsapp":
      return { glyph: <SiWhatsapp />, kind: "brand" };
    case "github":
      return { glyph: <SiGithub />, kind: "brand" };
    case "codepen":
      return { glyph: <FaCodepen />, kind: "brand" };
    case "linkedin":
      return { glyph: <FaLinkedin />, kind: "brand" };
    case "gravatar":
      return { glyph: <SiGravatar />, kind: "brand" };
    case "youtube":
      return { glyph: <SiYoutube />, kind: "brand" };
    case "pdf":
      return { glyph: <FaFilePdf />, kind: "ui" };
    case "arrow":
    default:
      return { glyph: <ArrowIcon />, kind: "custom-arrow" };
  }
}

function directionToDeg(direction: ArrowDirection): number {
  switch (direction) {
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

type RainbowGlowLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "glow" | "flat";
  glow?: boolean;
  blob?: boolean;
  icon?: ReactNode | false;
  iconName?: RainbowGlowLinkIconName;
  iconDirection?: ArrowDirection;
  iconPosition?: "start" | "end";
  iconAriaLabel?: string;
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
    const definition = getIconDefinition(iconName);
    const resolvedIcon = icon === false ? null : (icon ?? definition.glyph);

    return {
      glow: enableGlow,
      blob: enableBlob,
      icon: resolvedIcon,
      hasIcon: Boolean(resolvedIcon),
      iconPosition,
      iconAriaLabel,
      iconRotate: iconName === "arrow" ? directionToDeg(iconDirection) : 0,
      iconName,
      iconKind: icon === undefined ? definition.kind : "ui" as IconKind,
    };
  }, [variant, glow, blob, icon, iconName, iconDirection, iconPosition, iconAriaLabel]);

  useEffect(() => {
    reduceMotionRef.current = prefersReducedMotion();
    const element = wrapRef.current;
    if (!element) return;

    if (reduceMotionRef.current) {
      setInView(false);
      element.dataset.paused = "1";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (!flags.blob) return;
    const element = wrapRef.current;
    if (!element) return;

    element.dataset.paused = inView ? "0" : "1";
    if (!inView || reduceMotionRef.current) return;

    let rect: DOMRect | null = null;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const smooth = 0.22;

    const readRect = () => {
      rect = element.getBoundingClientRect();
    };

    const resetPosition = () => {
      if (!rect) readRect();
      if (!rect) return;

      targetX = rect.width * 0.5;
      targetY = rect.height * 0.5;
      currentX = targetX;
      currentY = targetY;

      element.style.setProperty("--pointer-x", `${Math.round(currentX)}px`);
      element.style.setProperty("--pointer-y", `${Math.round(currentY)}px`);
      element.style.setProperty("--blob-mix", "0.5");
    };

    const loop = () => {
      raf = 0;
      currentX += (targetX - currentX) * smooth;
      currentY += (targetY - currentY) * smooth;

      element.style.setProperty("--pointer-x", `${Math.round(currentX)}px`);
      element.style.setProperty("--pointer-y", `${Math.round(currentY)}px`);

      if (Math.abs(targetX - currentX) > 0.6 || Math.abs(targetY - currentY) > 0.6) {
        raf = requestAnimationFrame(loop);
      }
    };

    const requestLoop = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const clamp = (value: number, min: number, max: number) =>
      value < min ? min : value > max ? max : value;

    const onEnter = () => {
      readRect();
      resetPosition();
      requestLoop();
    };

    const onMove = (event: PointerEvent) => {
      if (!rect) readRect();
      if (!rect) return;

      targetX = clamp(event.clientX - rect.left, 0, rect.width);
      targetY = clamp(event.clientY - rect.top, 0, rect.height);
      element.style.setProperty("--blob-mix", (rect.width ? targetX / rect.width : 0.5).toFixed(3));
      requestLoop();
    };

    const onLeave = () => {
      if (!rect) readRect();
      if (!rect) return;

      targetX = rect.width * 0.5;
      targetY = rect.height * 0.5;
      element.style.setProperty("--blob-mix", "0.5");
      requestLoop();
    };

    const resizeObserver = new ResizeObserver(() => {
      rect = null;
    });

    resizeObserver.observe(element);
    element.addEventListener("pointerenter", onEnter, { passive: true });
    element.addEventListener("pointermove", onMove, { passive: true });
    element.addEventListener("pointerleave", onLeave, { passive: true });

    readRect();
    resetPosition();

    return () => {
      resizeObserver.disconnect();
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [flags.blob, inView]);

  useEffect(() => {
    const element = wrapRef.current;
    if (element) element.dataset.paused = inView ? "0" : "1";
  }, [inView]);

  const wrapperClass = [
    styles.wrapper,
    flags.glow ? styles.withGlow : styles.noGlow,
    flags.blob ? styles.withBlob : styles.noBlob,
    flags.hasIcon ? styles.withIcon : "",
    flags.hasIcon && flags.iconPosition === "start" ? styles.iconStart : styles.iconEnd,
    className,
  ].filter(Boolean).join(" ");

  const iconClass = [
    styles.icon,
    flags.iconKind === "brand" ? styles.brandIcon : "",
    flags.iconKind === "ui" ? styles.uiIcon : "",
    flags.iconKind === "custom-arrow" ? styles.customArrowIcon : "",
  ].filter(Boolean).join(" ");

  const iconStyle = flags.iconName === "arrow"
    ? ({ "--icon-rotate": `${flags.iconRotate}deg` } as CSSProperties)
    : undefined;

  const iconElement = flags.hasIcon ? (
    <span
      className={iconClass}
      aria-hidden={iconAriaLabel ? undefined : true}
      aria-label={iconAriaLabel}
      style={iconStyle}
    >
      {flags.icon}
    </span>
  ) : null;

  return (
    <span ref={wrapRef} className={wrapperClass} data-paused={inView ? "0" : "1"}>
      <Link href={href} className={styles.link}>
        {flags.iconPosition === "start" ? iconElement : null}
        <span className={styles.text}>{children}</span>
        {flags.iconPosition === "end" ? iconElement : null}
      </Link>

      <span className={styles.bg} aria-hidden="true" />
      {flags.glow ? <span className={styles.glow} aria-hidden="true" /> : null}
    </span>
  );
}