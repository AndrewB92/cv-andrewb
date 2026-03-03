"use client";

import { useEffect, useId, useMemo, useState } from "react";
import styles from "./ProjectImageSlider.module.css";

export type ProjectImage = {
  url: string;
  variant?: string;
  alt?: string;
  caption?: string;
};

type Props = {
  images: ProjectImage[];
  altBase: string;
  showArrows?: boolean; // default: false
};

const normalize = (s?: string) => (typeof s === "string" ? s.trim() : "");
const isNonEmpty = (s?: string) => normalize(s).length > 0;

// Optional ordering: prioritize likely "hero/featured" variants.
// Tune this list to your DB naming style.
const variantRank = (v?: string) => {
  const key = normalize(v).toLowerCase();
  if (!key) return 999;

  if (["featured", "hero", "main", "homepage"].includes(key)) return 0;
  if (["shop", "product", "catalog"].includes(key)) return 1;
  if (["mobile", "responsive"].includes(key)) return 2;

  return 50;
};

export function ProjectImageSlider({ images, altBase, showArrows = false }: Props) {
  const id = useId();

  const slides = useMemo(() => {
    const cleaned = (Array.isArray(images) ? images : [])
      .filter((i): i is ProjectImage => Boolean(i && typeof i.url === "string" && i.url.trim()))
      .map((i) => ({
        url: i.url.trim(),
        variant: isNonEmpty(i.variant) ? normalize(i.variant) : undefined,
        alt: isNonEmpty(i.alt) ? normalize(i.alt) : undefined,
        caption: isNonEmpty(i.caption) ? normalize(i.caption) : undefined,
      }));

    // dedupe by URL (keep first)
    const seen = new Set<string>();
    const deduped: typeof cleaned = [];
    for (const item of cleaned) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      deduped.push(item);
    }

    // stable ordering: rank by variant priority, preserve original order inside same rank
    return deduped
      .map((s, idx) => ({ ...s, __idx: idx }))
      .sort((a, b) => {
        const r = variantRank(a.variant) - variantRank(b.variant);
        return r !== 0 ? r : a.__idx - b.__idx;
      })
      .map(({ __idx, ...s }) => s);
  }, [images]);

  const [index, setIndex] = useState(0);

  // Keep index valid when slides count changes (e.g. different project opened / DB updates)
  useEffect(() => {
    setIndex((cur) => (slides.length ? Math.min(cur, slides.length - 1) : 0));
  }, [slides.length]);

  if (!slides.length) return null;

  const go = (delta: number) => {
    setIndex((cur) => (cur + delta + slides.length) % slides.length);
  };

  const canNavigate = slides.length > 1;

  return (
    <div
      className={styles.root}
      aria-roledescription="carousel"
      aria-label={`${altBase} screenshots`}
    >
      <div className={styles.frame}>
        <div
          className={styles.track}
          style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}
          aria-live="polite"
          id={id}
        >
          {slides.map((s, i) => {
            const altText = s.alt || `${altBase} screenshot ${i + 1}`;
            const caption = s.caption || s.variant;

            return (
              <div className={styles.slide} key={`${s.url}-${i}`}>
                <img
                  className={styles.img}
                  src={s.url}
                  alt={altText}
                  loading="lazy"
                  draggable={false}
                />
                {caption ? <div className={styles.caption}>{caption}</div> : null}
              </div>
            );
          })}
        </div>

        {showArrows && canNavigate && (
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

        {canNavigate && (
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