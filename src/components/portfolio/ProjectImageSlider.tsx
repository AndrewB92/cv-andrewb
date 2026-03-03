"use client";

import { useEffect, useId, useMemo, useState } from "react";
import styles from "./ProjectImageSlider.module.css";

type ProjectImage = {
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

// Optional ordering: prioritize likely “hero/featured” variants.
// You can tune this list to your naming style in DB.
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
      .filter((i) => i && typeof i.url === "string" && i.url.trim().length > 0)
      .map((i) => ({
        url: i.url.trim(),
        variant: isNonEmpty(i.variant) ? i.variant!.trim() : undefined,
        alt: isNonEmpty(i.alt) ? i.alt!.trim() : undefined,
        caption: isNonEmpty(i.caption) ? i.caption!.trim() : undefined,
      }));

    // dedupe by URL
    const seen = new Set<string>();
    const deduped: typeof cleaned = [];
    for (const item of cleaned) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      deduped.push(item);
    }

    // stable sort: rank by variant priority, but keep original order inside same rank
    return deduped
      .map((s, idx) => ({ ...s, __idx: idx }))
      .sort((a, b) => {
        const r = variantRank(a.variant) - variantRank(b.variant);
        return r !== 0 ? r : a.__idx - b.__idx;
      })
      .map(({ __idx, ...s }) => s);
  }, [images]);

  const [index, setIndex] = useState(0);

  // keep index valid if slides count changes
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

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
          {slides.map((s, i) => {
            const alt = s.alt || `${altBase} screenshot ${i + 1}`;
            const caption = s.caption || s.variant; // optional fallback to variant

            return (
              <div className={styles.slide} key={`${s.url}-${i}`}>
                <img
                  className={styles.img}
                  src={s.url}
                  alt={alt}
                  loading="lazy"
                  draggable={false}
                />

                {caption ? <div className={styles.caption}>{caption}</div> : null}
              </div>
            );
          })}
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