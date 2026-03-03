// src/components/portfolio/PortfolioSection.tsx
"use client";

import React, { useMemo } from "react";
import styles from "./PortfolioSection.module.css";
import { usePortfolioCardsStage } from "./usePortfolioCardsStage";
import { ProjectImageSlider } from "./ProjectImageSlider";

type ProjectImg = {
  url: string;
  variant?: string;
  alt?: string;
  caption?: string;
};

export type FeaturedProject = {
  name: string;
  year?: string | number;
  stack: string[];
  link: string;
  github?: string;
  description: string; // compact text
  details?: string; // expanded content (optional)
  img?: ProjectImg[];
};

type Props = {
  featuredProjects: FeaturedProject[];
  title?: string;
  kicker?: string;
  subtitle?: string;
};

const normalize = (s?: string) => (typeof s === "string" ? s.trim() : "");

function getPrimaryImage(project: FeaturedProject) {
  const imgs = project.img ?? [];
  if (!imgs.length) return "";

  const pick = (variants: string[]) =>
    imgs.find((i) => variants.includes(normalize(i.variant).toLowerCase()))?.url;

  return (
    pick(["featured", "hero", "main", "homepage"]) ||
    pick(["shop", "product", "catalog"]) ||
    pick(["mobile", "responsive"]) ||
    imgs[0]?.url ||
    ""
  );
}

export default function PortfolioSection({
  featuredProjects,
  title = "Selected Projects",
  kicker = "Portfolio",
  subtitle = "Short descriptions and technologies used.",
}: Props) {
  const count = featuredProjects.length;

  const {
    stageRef,
    cardRefs,
    activeIndex,
    phase,
    onToggle,
    onClose,
    isOpen,
    isExpanded,
    canMountSlider,
  } = usePortfolioCardsStage(count, {
    // These are only fallback timeouts if transitionend is missed.
    // Make them >= your CSS durations.
    fallbackOpenMs: 520,
    fallbackCloseMs: 520,
  });

  const stageClassName = useMemo(() => {
    const cls = [styles.cards];
    if (isOpen) cls.push(styles.isOpen);
    if (isExpanded) cls.push(styles.isExpanded);
    if (phase === "collapsing" || phase === "slidingIn") cls.push(styles.isClosing);
    return cls.join(" ");
  }, [isOpen, isExpanded, phase]);

  return (
    <section id="portfolio" className={styles.portfolio}>
      <div className={styles.container}>
        {/* Optional header */}
        {/* <header className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>{kicker}</p>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
        </header> */}

        <div ref={stageRef} className={stageClassName}>
          {featuredProjects.map((project, i) => {
            const img = getPrimaryImage(project);
            const isActive = activeIndex === i;

            const expandedContent = project.details ? (
              <p>{project.details}</p>
            ) : (
              <p>{project.description}</p>
            );

            return (
              <article
                key={project.name}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={[styles.card, isActive ? styles.isActive : ""].join(" ")}
                data-away={isOpen && !isActive ? (i % 2 === 0 ? "down" : "up") : "none"}
                data-expanded={isActive && isExpanded ? "true" : "false"}
              >
                <div className={styles.cardLayout}>
                  <div className={styles.cardMedia}>
                    {isActive && isExpanded && canMountSlider && (project.img?.length ?? 0) > 0 ? (
                      <ProjectImageSlider images={project.img ?? []} altBase={project.name} showArrows />
                    ) : img ? (
                      <img src={img} alt={`${project.name} screenshot`} loading="lazy" />
                    ) : (
                      <div className={styles.mediaPlaceholder} aria-hidden="true" />
                    )}
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardHead}>
                        <h3 className={styles.cardTitle}>{project.name}</h3>
                        {project.year != null && <span className={styles.cardYear}>{project.year}</span>}
                      </div>

                      <button
                        type="button"
                        className={styles.cardClose}
                        aria-label="Close details"
                        onClick={onClose}
                        tabIndex={isActive && isExpanded ? 0 : -1}
                        data-role="close"
                      >
                        ✕
                      </button>
                    </div>

                    <ul className={styles.cardStack} aria-label="Tech stack">
                      {project.stack.map((item) => (
                        <li key={`${project.name}-${item}`}>{item}</li>
                      ))}
                    </ul>

                    {/* SAME SPACE, NO display:none. Swap via opacity/visibility/pointer-events only */}
                    <div className={styles.cardTextZone}>
                      <div className={styles.cardTextCompact} data-role="compact">
                        <p className={styles.cardDescription}>{project.description}</p>
                      </div>

                      <div className={styles.cardTextExpanded} data-role="expanded">
                        <div className={styles.expandedScroll}>{expandedContent}</div>

                        <div className={styles.cardActionsExpanded}>
                          <a href={project.link} className={styles.btn} target="_blank" rel="noreferrer">
                            Live Site
                          </a>

                          {project.github ? (
                            <a
                              href={project.github}
                              className={[styles.btn, styles.btnOutline].join(" ")}
                              target="_blank"
                              rel="noreferrer"
                            >
                              GitHub
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <a href={project.link} className={styles.btn} target="_blank" rel="noreferrer">
                        Live Site
                      </a>

                      {project.github ? (
                        <a
                          href={project.github}
                          className={[styles.btn, styles.btnOutline].join(" ")}
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub
                        </a>
                      ) : null}

                      <button
                        type="button"
                        className={styles.cardToggle}
                        aria-expanded={isActive && isExpanded}
                        onClick={() => onToggle(i)}
                        data-role="toggle"
                      >
                        More info
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}