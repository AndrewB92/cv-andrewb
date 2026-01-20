"use client";

import { useEffect } from "react";

function isHTMLElement(v: unknown): v is HTMLElement {
  return v instanceof HTMLElement;
}

type CacheItem = {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  rect: DOMRect;
  r: number;
  bw: number;
  glowSize: number;
  blur: number;
  color: string;
  opacity: number;
};

export default function GlowBorderCanvasProvider() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".glow-border"));
    if (!targets.length) return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    // If reduced motion, you might skip entirely or render a static border highlight.
    if (prefersReducedMotion) return;

    const cache = new Map<HTMLElement, CacheItem>();

    const getVar = (el: HTMLElement, name: string, fallback = "") => {
      const v = getComputedStyle(el).getPropertyValue(name).trim();
      return v || fallback;
    };

    const parsePx = (v: string, fallback: number) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const ensureCanvas = (el: HTMLElement) => {
      let item = cache.get(el);
      if (item) return item;

      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "1"; // ensure it's above background but below content if needed
      canvas.style.opacity = "0";
      canvas.style.transition = "opacity 200ms ease";
      // isolate paint for this element
      el.style.position ||= "relative";
      el.style.overflow = "hidden";

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) throw new Error("Canvas 2D ctx not available");

      el.appendChild(canvas);

      // Read style knobs from CSS vars (so you still control it from CSS, but rendering is JS)
      const r = parsePx(getVar(el, "--r", "16px"), 16);
      const bw = parsePx(getVar(el, "--bw", "1px"), 1);
      const glowSize = parsePx(getVar(el, "--glowSize", "420px"), 420);
      const blur = parsePx(getVar(el, "--blur", "18px"), 18);
      const color = getVar(el, "--glowColor", "rgba(186, 37, 209, 1)");

      item = {
        el,
        canvas,
        ctx,
        dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)), // cap DPR for perf
        rect: el.getBoundingClientRect(),
        r,
        bw,
        glowSize,
        blur,
        color,
        opacity: 0,
      };

      cache.set(el, item);
      resizeItem(item);

      return item;
    };

    const resizeItem = (item: CacheItem) => {
      item.rect = item.el.getBoundingClientRect();

      const w = Math.max(1, Math.round(item.rect.width));
      const h = Math.max(1, Math.round(item.rect.height));

      item.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      item.canvas.width = Math.round(w * item.dpr);
      item.canvas.height = Math.round(h * item.dpr);
      item.canvas.style.width = `${w}px`;
      item.canvas.style.height = `${h}px`;

      item.ctx.setTransform(item.dpr, 0, 0, item.dpr, 0, 0);
      item.ctx.clearRect(0, 0, w, h);
    };

    const roundRectPath = (ctx: CanvasRenderingContext2D, w: number, h: number, r: number) => {
      const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
      ctx.beginPath();
      ctx.moveTo(rr, 0);
      ctx.arcTo(w, 0, w, h, rr);
      ctx.arcTo(w, h, 0, h, rr);
      ctx.arcTo(0, h, 0, 0, rr);
      ctx.arcTo(0, 0, w, 0, rr);
      ctx.closePath();
    };

    const draw = (item: CacheItem, localX: number, localY: number) => {
      const { ctx, rect, r, bw, glowSize, blur, color } = item;
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      ctx.clearRect(0, 0, w, h);

      // Clip to rounded rect (element bounds)
      ctx.save();
      roundRectPath(ctx, w, h, r);
      ctx.clip();

      // Soft radial glow
      const radius = glowSize / 2;
      const g = ctx.createRadialGradient(localX, localY, 0, localX, localY, radius);
      g.addColorStop(0, color);
      g.addColorStop(0.6, "rgba(0,0,0,0)");

      // Blur: applied to drawing operations
      ctx.filter = `blur(${blur}px)`;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g;
      ctx.fillRect(localX - radius, localY - radius, radius * 2, radius * 2);

      // Punch hole to keep only border ring:
      // 1) Remove inner content area (rounded rect inset by border width)
      ctx.filter = "none";
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.save();
      ctx.translate(bw, bw);
      roundRectPath(ctx, w - bw * 2, h - bw * 2, Math.max(0, r - bw));
      ctx.fill();
      ctx.restore();

      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    };

    // Active tracking: only render for hovered element
    let active: CacheItem | null = null;
    let raf: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const tick = () => {
      raf = null;
      if (!active) return;

      const localX = lastX - active.rect.left;
      const localY = lastY - active.rect.top;

      draw(active, localX, localY);
    };

    const setActive = (el: HTMLElement | null, clientX?: number, clientY?: number) => {
      if (active && active.el !== el) {
        active.opacity = 0;
        active.canvas.style.opacity = "0";
      }

      if (!el) {
        active = null;
        return;
      }

      const item = ensureCanvas(el);
      item.opacity = 1;
      item.canvas.style.opacity = "1";
      item.rect = el.getBoundingClientRect(); // refresh on enter
      active = item;

      if (clientX != null) lastX = clientX;
      if (clientY != null) lastY = clientY;

      if (raf == null) raf = requestAnimationFrame(tick);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!active) return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (raf == null) raf = requestAnimationFrame(tick);
    };

    const onOver = (e: PointerEvent) => {
      if (!isHTMLElement(e.target)) return;
      const host = e.target.closest(".glow-border");
      if (!(host instanceof HTMLElement)) return;
      setActive(host, e.clientX, e.clientY);
    };

    const onOut = (e: PointerEvent) => {
      if (!isHTMLElement(e.target)) return;
      const host = e.target.closest(".glow-border");
      if (!(host instanceof HTMLElement)) return;

      // If moving to another element still inside the same glow-border, ignore
      const rel = e.relatedTarget as Element | null;
      if (rel && host.contains(rel)) return;

      setActive(null);
    };

    const onResizeOrScroll = () => {
      if (!active) return;
      resizeItem(active);
    };

    // Pre-init canvases only when needed; but you can also create upfront:
    // targets.forEach(ensureCanvas);

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true, capture: true });
    document.addEventListener("pointerout", onOut, { passive: true, capture: true });
    window.addEventListener("resize", onResizeOrScroll, { passive: true });
    window.addEventListener("scroll", onResizeOrScroll, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onOver, true as any);
      document.removeEventListener("pointerout", onOut, true as any);
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll);
      if (raf != null) cancelAnimationFrame(raf);

      // cleanup canvases
      cache.forEach((item) => {
        item.canvas.remove();
      });
      cache.clear();
    };
  }, []);

  return null;
}