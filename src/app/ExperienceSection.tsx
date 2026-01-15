"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./page.module.css"; // adjust import
import { Section } from "@/components/Section";

type Experience = {
  company: string;
  role: string;
  start: string;
  end: string;
  achievements: string[];
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

function ExperiencePanel({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: React.ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<number>(0);

  const measure = () => {
    const el = panelRef.current;
    if (!el) return;
    setMaxHeight(open ? el.scrollHeight : 0);
  };

  // Measure right when open changes (before paint)
  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Re-measure on resize/fonts (content reflow)
  useEffect(() => {
    if (!open) return;

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    // In case fonts load and change height
    const fonts = (document as any).fonts;
    const fontsReady =
      fonts && typeof fonts.ready?.then === "function" ? fonts.ready : null;

    if (fontsReady) {
      fontsReady.then(onResize).catch(() => {});
    }

    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div
      id={id}
      ref={panelRef}
      className={styles.expPanel}
      aria-hidden={!open}
      style={{
        overflow: "hidden",
        maxHeight: reducedMotion ? "none" : `${maxHeight}px`,
        transition: reducedMotion ? "none" : "max-height 280ms ease",
      }}
    >
      {children}
    </div>
  );
}

export function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  const uid = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section
      id="experience"
      className="glow-border"
      eyebrow="Journey"
      title="Recent experience"
      description="Selected roles that shaped my approach to product engineering."
    >
      <ol className={styles.experienceList}>
        {experiences.map((experience, index) => {
          const achievementsId = `exp-achievements-${uid}-${index}`;
          const isOpen = openIndex === index;

          return (
            <li
              key={`${experience.company}-${experience.role}`}
              className={styles.experienceItem}
            >
              <div className={styles.experienceHeader}>
                <span>{experience.company}</span>
                <span>
                  {experience.start} — {experience.end}
                </span>
              </div>

              <p>{experience.role}</p>

              <ExperiencePanel id={achievementsId} open={isOpen}>
                <ul className={styles.experienceAchievements} style={{ marginTop: 0 }}>
                  {experience.achievements.map((achievement, i) => (
                    <li key={`${experience.company}-${index}-${i}`}>{achievement}</li>
                  ))}
                </ul>
              </ExperiencePanel>

              <button
                type="button"
                className={styles.expToggle}
                aria-expanded={isOpen}
                aria-controls={achievementsId}
                onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              >
                <span className={styles.expToggleText}>
                  {isOpen ? "Hide details" : "Show details"}
                </span>

                <span
                  className={styles.expToggleIcon}
                  aria-hidden="true"
                  style={{ transform: `rotate(${isOpen ? 180 : 0}deg)` }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M7 10l5 5 5-5" />
                  </svg>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}