'use client';

import { useEffect } from 'react';

function isElement(v: unknown): v is Element {
  return v instanceof Element;
}

export default function GlowBorderProvider() {
  useEffect(() => {
    const getTargets = () =>
      Array.from(document.querySelectorAll<HTMLElement>('.glow-border'));

    let raf: number | null = null;
    let lastEvent: PointerEvent | null = null;

    const update = () => {
      raf = null;
      if (!lastEvent) return;

      const { clientX, clientY } = lastEvent;
      for (const el of getTargets()) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', `${clientX - rect.left}px`);
        el.style.setProperty('--mouse-y', `${clientY - rect.top}px`);
      }
    };

    const onMove = (e: PointerEvent) => {
      lastEvent = e;
      if (raf == null) raf = requestAnimationFrame(update);
    };

    const setOpacityFromEventTarget = (e: PointerEvent, value: '0' | '1') => {
      if (!isElement(e.target)) return;
      const host = e.target.closest('.glow-border');
      if (host instanceof HTMLElement) host.style.setProperty('--glow-opacity', value);
    };

    const onEnter = (e: PointerEvent) => setOpacityFromEventTarget(e, '1');
    const onLeave = (e: PointerEvent) => setOpacityFromEventTarget(e, '0');

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onEnter);
    document.addEventListener('pointerout', onLeave);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onEnter);
      document.removeEventListener('pointerout', onLeave);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}