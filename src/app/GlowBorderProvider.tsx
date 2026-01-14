'use client';

import { useEffect } from 'react';

function isHTMLElement(node: Element | null): node is HTMLElement {
  return !!node && node instanceof HTMLElement;
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
      const els = getTargets();

      for (const el of els) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', `${clientX - rect.left}px`);
        el.style.setProperty('--mouse-y', `${clientY - rect.top}px`);
      }
    };

    const onMove = (e: PointerEvent) => {
      lastEvent = e;
      if (raf == null) raf = requestAnimationFrame(update);
    };

    const onEnter = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest('.glow-border');
      if (isHTMLElement(el)) el.style.setProperty('--glow-opacity', '1');
    };

    const onLeave = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest('.glow-border');
      if (isHTMLElement(el)) el.style.setProperty('--glow-opacity', '0');
    };

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