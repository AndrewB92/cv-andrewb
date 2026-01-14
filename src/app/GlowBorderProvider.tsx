'use client';

import { useEffect } from 'react';

export default function GlowBorderProvider() {
  useEffect(() => {
    const targets = () =>
      Array.from(document.querySelectorAll<HTMLElement>('.glow-border'));

    let raf: number | null = null;
    let lastEvent: PointerEvent | null = null;

    const update = () => {
      raf = null;
      if (!lastEvent) return;

      for (const el of targets()) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', `${lastEvent.clientX - rect.left}px`);
        el.style.setProperty('--mouse-y', `${lastEvent.clientY - rect.top}px`);
      }
    };

    const onMove = (e: PointerEvent) => {
      lastEvent = e;
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onEnter = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest('.glow-border');
      if (el) el.style.setProperty('--glow-opacity', '1');
    };

    const onLeave = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest('.glow-border');
      if (el) el.style.setProperty('--glow-opacity', '0');
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onEnter);
    document.addEventListener('pointerout', onLeave);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onEnter);
      document.removeEventListener('pointerout', onLeave);
    };
  }, []);

  return null;
}