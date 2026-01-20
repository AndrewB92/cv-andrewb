"use client";

import { useEffect } from "react";

type GlowItem = {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  rect: DOMRect;

  r: number;        // border radius (px)
  bw: number;       // border width (px)
  glowSize: number; // diameter-like size in px (we use radius = glowSize/2)
  blur: number;     // blur px
  color: string;    // rgba(...)
};

function isElement(v: unknown): v is Element {
  return v instanceof Element;
}

function cssVar(el: HTMLElement, name: string, fallback = "") {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

function px(v: string, fallback: number) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampDpr(dpr: number) {
  // cap DPR for perf, still sharp enough
  return Math.max(1, Math.min(2, dpr || 1));
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export default function GlowBorderCanvasProvider() {
  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReducedMotion) return;

    const cache = new Map<HTMLElement, GlowItem>();

    let active: GlowItem | null = null;
    let raf: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const ensure = (el: HTMLElement): GlowItem => {
      const existing = cache.get(el);
      if (existing) return existing;

      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.pointerEvents = "none";
      canvas.style.opacity = "0";
      canvas.style.transition = "opacity 200ms ease";
      canvas.style.zIndex = "1";

      // Ensure overlay positioning works
      const cs = getComputedStyle(el);
      if (cs.position === "static") el.style.position = "relative";
      // IMPORTANT: do NOT rely on overflow for clipping, the ring mask does it.
      // Keep your layout intact; no need for overflow: hidden here.

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) throw new Error("Canvas 2D context not available");

      el.appendChild(canvas);

      const item: GlowItem = {
        el,
        canvas,
        ctx,
        dpr: clampDpr(window.devicePixelRatio),
        rect: el.getBoundingClientRect(),
        r: px(cssVar(el, "--r", "24px"), 24), // 1.5rem ~ 24px default
        bw: px(cssVar(el, "--bw", "1px"), 1),
        glowSize: px(cssVar(el, "--glowSize", "420px"), 420),
        blur: px(cssVar(el, "--blur", "18px"), 18),
        color: cssVar(el, "--glowColor", "rgba(186, 37, 209, 1)"),
      };

      resize(item);
      cache.set(el, item);
      return item;
    };

    const resize = (item: GlowItem) => {
      item.rect = item.el.getBoundingClientRect();
      item.dpr = clampDpr(window.devicePixelRatio);

      // Use floats for CSS size; ceil for backing store to avoid missing edges
      const w = Math.max(1, item.rect.width);
      const h = Math.max(1, item.rect.height);

      item.canvas.style.width = `${w}px`;
      item.canvas.style.height = `${h}px`;

      item.canvas.width = Math.ceil(w * item.dpr);
      item.canvas.height = Math.ceil(h * item.dpr);

      // Map 1 unit in canvas space = 1 CSS px
      item.ctx.setTransform(item.dpr, 0, 0, item.dpr, 0, 0);
      item.ctx.clearRect(0, 0, w, h);
    };

    const drawAt = (item: GlowItem, clientX: number, clientY: number) => {
      const { ctx, rect, r, bw, glowSize, blur, color } = item;

      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const radius = glowSize / 2;

      ctx.clearRect(0, 0, w, h);

      // 1) Draw blurred glow (no clip yet -> prevents corner cutoff)
      ctx.save();
      ctx.filter = `blur(${blur}px)`;
      ctx.globalCompositeOperation = "source-over";

      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, color);
      g.addColorStop(0.6, "rgba(0,0,0,0)");
      ctx.fillStyle = g;

      // draw a box around the glow area
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();

      // 2) Keep ONLY the outer rounded-rect area (destination-in)
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = "rgba(0,0,0,1)";
      roundRectPath(ctx, 0, 0, w, h, r);
      ctx.fill();
      ctx.restore();

      // 3) Remove inner rounded rect to make it a ring (destination-out)
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";

      const inset = bw; // ring thickness = bw
      roundRectPath(
        ctx,
        inset,
        inset,
        Math.max(0, w - inset * 2),
        Math.max(0, h - inset * 2),
        Math.max(0, r - inset)
      );
      ctx.fill();
      ctx.restore();

      ctx.globalCompositeOperation = "source-over";
    };

    const tick = () => {
      raf = null;
      if (!active) return;
      drawAt(active, lastX, lastY);
    };

    const setActive = (el: HTMLElement | null, e?: PointerEvent) => {
      if (active && (!el || active.el !== el)) {
        active.canvas.style.opacity = "0";
      }

      if (!el) {
        active = null;
        return;
      }

      const item = ensure(el);
      active = item;
      resize(item); // refresh rect on enter
      item.canvas.style.opacity = "1";

      if (e) {
        lastX = e.clientX;
        lastY = e.clientY;
        if (raf == null) raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!active) return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (raf == null) raf = requestAnimationFrame(tick);
    };

    const onOver = (e: PointerEvent) => {
      if (!isElement(e.target)) return;
      const host = (e.target as Element).closest(".glow-border");
      if (!(host instanceof HTMLElement)) return;
      setActive(host, e);
    };

    const onOut = (e: PointerEvent) => {
      if (!isElement(e.target)) return;
      const host = (e.target as Element).closest(".glow-border");
      if (!(host instanceof HTMLElement)) return;

      // Ignore "outs" that are still inside the same host
      const rel = e.relatedTarget as Element | null;
      if (rel && host.contains(rel)) return;

      if (active?.el === host) setActive(null);
    };

    let resizeRaf: number | null = null;
    const onResizeOrScroll = () => {
      if (!active) return;
      if (resizeRaf != null) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        resize(active);
        if (raf == null) raf = requestAnimationFrame(tick);
      });
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true, capture: true });
    document.addEventListener("pointerout", onOut, { passive: true, capture: true });
    window.addEventListener("resize", onResizeOrScroll, { passive: true });
    window.addEventListener("scroll", onResizeOrScroll, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true as any);
      document.removeEventListener("pointerout", onOut, true as any);
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll);
      if (raf != null) cancelAnimationFrame(raf);
      if (resizeRaf != null) cancelAnimationFrame(resizeRaf);

      cache.forEach((item) => item.canvas.remove());
      cache.clear();
      active = null;
    };
  }, []);

  return null;
}