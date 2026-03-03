"use client";

import { useId, useMemo, useState } from "react";
import styles from "./ProjectImageSlider.module.css";

type ProjectImage = { name?: string; url: string };

type Props = {
  images: ProjectImage[];
  altBase: string;
  showArrows?: boolean; // default: false
};

export function ProjectImageSlider({ images, altBase, showArrows = false }: Props) {
  const id = useId();

  const slides = useMemo(() => {
    // sanitize + dedupe by url
    const cleaned = (Array.isArray(images) ? images : [])
      .filter((i): i is ProjectImage => Boolean(i?.url && typeof i.url === "string"))
      .map((i, idx) => ({
        url: i.url.trim(),
        name: (typeof i.name === "string" ? i.name.trim() : "") || `img-${idx}`,
      }))
      .filter((i) => i.url.length > 0);

    const deduped: { url: string; name: string }[] = [];
    const seen = new Set<string>();
    for (const item of cleaned) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      deduped.push(item);
    }

    // stable ordering: featured -> secondary -> rest in original order
    const pick = (n: string) => deduped.find((i) => i.name === n);
    const featured = pick("featured");
    const secondary = pick("secondary");
    const rest = deduped.filter((i) => i !== featured && i !== secondary);

    return [featured, secondary, ...rest].filter(Boolean) as { url: string; name: string }[];
  }, [images]);

  const [index, setIndex] = useState(0);

  // keep index valid if slides count changes (e.g. DB update / hydration)
  if (index >= slides.length && slides.length > 0) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    setIndex(0);
  }

  if (!slides.length) return null;

  const go = (delta: number) => {
    setIndex((cur) => (cur + delta + slides.length) % slides.length);
  };

  return (
    <div className={styles.root} aria-roledescription="carousel" aria-label={`${altBase} screenshots`}>
      <div className={styles.frame}>
        <div
          className={styles.track}
          style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}
          aria-live="polite"
          id={id}
        >
          {slides.map((s, i) => (
            <div className={styles.slide} key={`${s.url}-${i}`}>
              <img
                className={styles.img}
                src={s.url}
                alt={`${altBase} screenshot ${i + 1}`}
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {showArrows && slides.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.nav} ${styles.prev}`}
              onClick={() => go(-1)}
              aria-controls={id}
              aria-label="Previous screenshot"
            >
              ‹
            </button>

            <button
              type="button"
              className={`${styles.nav} ${styles.next}`}
              onClick={() => go(1)}
              aria-controls={id}
              aria-label="Next screenshot"
            >
              ›
            </button>
          </>
        )}

        {slides.length > 1 && (
          <div className={styles.dots} role="tablist" aria-label="Screenshots">
            {slides.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Show screenshot ${i + 1}`}
                aria-pressed={i === index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}