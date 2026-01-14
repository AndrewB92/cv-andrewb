'use client';

import React, { useCallback, useRef } from 'react';

type GlowCardProps = {
  children: React.ReactNode;
  className?: string;

  radius?: number;
  borderWidth?: number;
  glowSize?: number;
  glowColor?: string;
  background?: string;
  borderColor?: string;
  blur?: number;
};

export default function GlowCard({
  children,
  className,
  radius = 12,
  borderWidth = 1,
  glowSize = 420,
  glowColor = 'rgba(255,255,255,0.9)',
  background = 'rgb(20,20,20)',
  borderColor = 'rgba(245,245,245,0.18)',
  blur = 2,
}: GlowCardProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const applyVars = useCallback(() => {
    rafRef.current = null;
    const el = elRef.current;
    const pt = lastPointRef.current;
    if (!el || !pt) return;

    el.style.setProperty('--mouse-x', `${pt.x}px`);
    el.style.setProperty('--mouse-y', `${pt.y}px`);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = elRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      lastPointRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      if (rafRef.current == null) rafRef.current = window.requestAnimationFrame(applyVars);
    },
    [applyVars]
  );

  const onPointerEnter = useCallback(() => {
    elRef.current?.style.setProperty('--glow-opacity', '1');
  }, []);

  const onPointerLeave = useCallback(() => {
    elRef.current?.style.setProperty('--glow-opacity', '0');
  }, []);

  return (
    <>
      <div
        ref={elRef}
        className={`glowCard ${className ?? ''}`}
        onPointerMove={onPointerMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        style={
          {
            '--r': `${radius}px`,
            '--bw': `${borderWidth}px`,
            '--glowSize': `${glowSize}px`,
            '--glowColor': glowColor,
            '--cardBg': background,
            '--borderColor': borderColor,
            '--blur': `${blur}px`,
            '--glow-opacity': '0',
          } as React.CSSProperties
        }
      >
        {children}
      </div>

      <style jsx>{`
        .glowCard {
          position: relative;
          border-radius: var(--r);
          background: var(--cardBg);
          border: var(--bw) solid var(--borderColor);
          padding: 24px;
          touch-action: none;
        }

        .glowCard::before {
          content: '';
          position: absolute;
          inset: calc(-1 * var(--bw));
          border-radius: calc(var(--r) + var(--bw));
          pointer-events: none;

          background: radial-gradient(
            var(--glowSize) circle at var(--mouse-x) var(--mouse-y),
            var(--glowColor),
            transparent 60%
          );

          opacity: var(--glow-opacity);
          transition: opacity 200ms ease;
          filter: blur(var(--blur));

          /* border-only mask */
          padding: var(--bw);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
      `}</style>
    </>
  );
}