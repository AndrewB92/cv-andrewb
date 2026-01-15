"use client";

import React, { useEffect, useId, useMemo, useRef } from "react";

declare global {
  interface Window {
    Gradient?: new (opts: { canvas: string | HTMLCanvasElement; colors: string[] }) => any;
  }
}

type StripeGradientCanvasProps = {
  className?: string;
  style?: React.CSSProperties;

  /**
   * Remote script URL.
   * Uses jsDelivr GitHub CDN by default (no install).
   *
   * If this ever 404s (repo path changes), see notes below for alternatives.
   */
  scriptSrc?: string;

  /**
   * Gradient colors (hex strings). Defaults match the README example.
   */
  colors?: string[];

  /**
   * Canvas sizing:
   * - "cover": canvas fills its parent (typical hero background)
   * - "fixed": uses width/height props
   */
  mode?: "cover" | "fixed";
  width?: number;
  height?: number;

  /**
   * If true, won't animate for prefers-reduced-motion users (keeps canvas empty).
   */
  respectReducedMotion?: boolean;
};

const DEFAULT_COLORS = ["#a960ee", "#ff333d", "#90e0ff", "#ffcb57"];

// Default CDN path (no npm install).
// Based on the repo usage and the common dist layout referenced in docs/articles. :contentReference[oaicite:2]{index=2}
const DEFAULT_SCRIPT =
  "https://cdn.jsdelivr.net/gh/thelevicole/stripe-gradient@main/dist/stripe-gradient.js";

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded?
    const existing = document.querySelector<HTMLScriptElement>(`script[data-stripe-gradient="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.dataset.stripeGradient = src;

    s.addEventListener("load", () => {
      s.dataset.loaded = "true";
      resolve();
    });
    s.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));

    document.head.appendChild(s);
  });
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function StripeGradientCanvas({
  className,
  style,
  scriptSrc = DEFAULT_SCRIPT,
  colors = DEFAULT_COLORS,
  mode = "cover",
  width = 1200,
  height = 600,
  respectReducedMotion = true,
}: StripeGradientCanvasProps) {
  const reactId = useId();
  const canvasId = useMemo(() => `stripe-gradient-${reactId.replace(/:/g, "")}`, [reactId]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (respectReducedMotion && prefersReducedMotion()) return;
      if (!canvasRef.current) return;

      // Load remote lib if needed
      if (!window.Gradient) {
        await loadScriptOnce(scriptSrc);
      }
      if (cancelled) return;

      // Defensive: check lib is actually available
      if (!window.Gradient) {
        // eslint-disable-next-line no-console
        console.warn("[StripeGradientCanvas] Gradient constructor not found after loading script:", scriptSrc);
        return;
      }

      // The README shows: new Gradient({ canvas: '#id', colors: [...] }) :contentReference[oaicite:3]{index=3}
      instanceRef.current = new window.Gradient({
        canvas: `#${canvasId}`,
        colors,
      });
    }

    init().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[StripeGradientCanvas] Failed to init:", err);
    });

    return () => {
      cancelled = true;

      // Best-effort cleanup (API not documented in the repo README)
      const inst = instanceRef.current;
      instanceRef.current = null;

      if (inst?.destroy) inst.destroy();
      else if (inst?.dispose) inst.dispose();
      else if (inst?.pause) inst.pause();
    };
  }, [canvasId, colors, scriptSrc, respectReducedMotion]);

  const canvasStyle: React.CSSProperties =
    mode === "cover"
      ? {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }
      : {
          width,
          height,
          display: "block",
        };

  const wrapperStyle: React.CSSProperties =
    mode === "cover"
      ? {
          position: "relative",
          overflow: "hidden",
          ...style,
        }
      : style ?? {};

  return (
    <div className={className} style={wrapperStyle}>
      <canvas id={canvasId} ref={canvasRef} style={canvasStyle} width={mode === "fixed" ? width : undefined} height={mode === "fixed" ? height : undefined} />
    </div>
  );
}