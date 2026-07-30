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
  showArrows?: boolean;
  fit?: "cover" | "contain";
};

const normalize = (value?: string) =>
  typeof value === "string" ? value.trim() : "";

const variantRank = (value?: string) => {
  const key = normalize(value).toLowerCase();
  if (["featured", "hero", "main", "homepage"].includes(key)) return 0;
  if (["shop", "product", "catalog"].includes(key)) return 1;
  if (["mobile", "responsive"].includes(key)) return 2;
  return 50;
};

export function ProjectImageSlider({
  images,
  altBase,
  showArrows = false,
  fit = "cover",
}: Props) {
  const id = useId();

  const slides = useMemo(() => {
    const cleaned = images
      .filter(
        (image): image is ProjectImage =>
          Boolean(image?.url?.trim()),
      )
      .map((image, originalIndex) => ({
        url: image.url.trim(),
        variant: normalize(image.variant) || undefined,
        alt: normalize(image.alt) || undefined,
        caption: normalize(image.caption) || undefined,
        originalIndex,
      }));

    const seen = new Set<string>();

    return cleaned
      .filter((image) => {
        if (seen.has(image.url)) return false;
        seen.add(image.url);
        return true;
      })
      .sort((a, b) => {
        const rankDifference =
          variantRank(a.variant) - variantRank(b.variant);
        return rankDifference || a.originalIndex - b.originalIndex;
      });
  }, [images]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex((current) =>
      slides.length ? Math.min(current, slides.length - 1) : 0,
    );
  }, [slides.length]);

  if (!slides.length) return null;

  const go = (delta: number) => {
    setIndex(
      (current) =>
        (current + delta + slides.length) % slides.length,
    );
  };

  const canNavigate = slides.length > 1;

  return (
    <div
      className={styles.root}
      data-fit={fit}
      aria-roledescription="carousel"
      aria-label={`${altBase} screenshots`}
    >
      <div className={styles.frame}>
        <div
          id={id}
          className={styles.track}
          style={{
            transform: `translate3d(${-index * 100}%, 0, 0)`,
          }}
          aria-live="polite"
        >
          {slides.map((slide, slideIndex) => {
            const caption = slide.caption || slide.variant;

            return (
              <figure
                className={styles.slide}
                key={slide.url}
                aria-hidden={slideIndex !== index}
              >
                <img
                  className={styles.img}
                  src={slide.url}
                  alt={
                    slide.alt ||
                    `${altBase} screenshot ${slideIndex + 1}`
                  }
                  loading={slideIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                />

                {caption ? (
                  <figcaption className={styles.caption}>
                    {caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>

        {showArrows && canNavigate ? (
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
        ) : null}

        {canNavigate ? (
          <div className={styles.dots} aria-label="Screenshot navigation">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.url}
                type="button"
                className={`${styles.dot} ${
                  slideIndex === index ? styles.dotActive : ""
                }`}
                onClick={() => setIndex(slideIndex)}
                aria-label={`Show screenshot ${slideIndex + 1}`}
                aria-current={slideIndex === index ? "true" : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}