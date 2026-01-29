"use client";

import { useId, useMemo, useState } from "react";
import styles from "./ProjectImageSlider.module.css";

type ProjectImage = { name: string; url: string };

type Props = {
  images: ProjectImage[];
  altBase: string;
  showArrows?: boolean; // default: false
};

export function ProjectImageSlider({ images, altBase, showArrows = false }: Props) {
  const id = useId();

  // deterministic order for your 2-image case; still works if only one exists
  const slides = useMemo(() => {
    const byName = (n: string) => images.find((i) => i.name === n);
    const ordered = [byName("featured"), byName("secondary")].filter(Boolean) as ProjectImage[];

    // fallback: if names differ, just use whatever is there
    return ordered.length ? ordered : images;
  }, [images]);

  const [index, setIndex] = useState(0);

  if (!slides.length) return null;

  const go = (next: number) => {
    setIndex((cur) => (cur + next + slides.length) % slides.length);
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
            <div className={styles.slide} key={`${s.name}-${i}`}>
              <img
                className={styles.img}
                src={s.url}
                alt={`${altBase} ${s.name} screenshot`}
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
            {slides.map((slide, i) => {
              const label =
                slide.name === "featured"
                  ? "Featured"
                  : slide.name === "secondary"
                  ? "Secondary"
                  : slide.name;

              return (
                <button
                  key={slide.name}
                  type="button"
                  className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${label} image`}
                  aria-pressed={i === index}
                >
                  <span className={styles.dotLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}