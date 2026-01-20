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

export default function GlowBorderProvider() {
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

      const cs = getComputedStyle(el);
      if (cs.position === "static") el.style.position = "relative";

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) throw new Error("Canvas 2D context not available");

      el.appendChild(canvas);

      const item: GlowItem = {
        el,
        canvas,
        ctx,
        dpr: clampDpr(window.devicePixelRatio),
        rect: el.getBoundingClientRect(),
        r: px(cssVar(el, "--r", "24px"), 24), // 1.5rem ~ 24px
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

      const w = Math.max(1, item.rect.width);
      const h = Math.max(1, item.rect.height);

      item.canvas.style.width = `${w}px`;
      item.canvas.style.height = `${h}px`;

      // ceil to avoid missing right/bottom edge pixels
      item.canvas.width = Math.ceil(w * item.dpr);
      item.canvas.height = Math.ceil(h * item.dpr);

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

      // 1) Draw blurred glow first (no clip) so corners can glow
      ctx.save();
      ctx.filter = `blur(${blur}px)`;
      ctx.globalCompositeOperation = "source-over";

      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, color);
      g.addColorStop(0.6, "rgba(0,0,0,0)");
      ctx.fillStyle = g;

      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();

      // 2) Keep only the outer rounded rect
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = "rgba(0,0,0,1)";
      roundRectPath(ctx, 0, 0, w, h, r);
      ctx.fill();
      ctx.restore();

      // 3) Punch out inner rounded rect to create a ring
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";

      const inset = bw;
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

      // refresh rect on enter
      resize(item);
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

      // ignore outs that are still inside the same host
      const rel = e.relatedTarget as Element | null;
      if (rel && host.contains(rel)) return;

      if (active?.el === host) setActive(null);
    };

    let resizeRaf: number | null = null;

    const onResizeOrScroll = () => {
      const item = active; // ✅ capture to satisfy TS + avoid null later
      if (!item) return;

      if (resizeRaf != null) return;

      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        resize(item);
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
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
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