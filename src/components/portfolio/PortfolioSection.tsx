"use client";

import React from "react";
import styles from "./PortfolioSection.module.css";
import { usePortfolioCardsStage } from "./usePortfolioCardsStage";

type ProjectImg = { url: string; name?: string };

export type FeaturedProject = {
  name: string;
  year?: string | number;
  stack: string[];
  link: string;
  github?: string;
  caseStudy?: string;
  description: string; // compact text
  details?: React.ReactNode; // expanded content (optional)
  img?: ProjectImg[];
};

type Props = {
  featuredProjects: FeaturedProject[];
  title?: string;
  kicker?: string;
  subtitle?: string;
};

function getPrimaryImage(project: FeaturedProject) {
  const byName = (n: string) => project.img?.find((i) => i.name === n)?.url;
  return byName("featured") || byName("secondary") || project.img?.[0]?.url || "";
}

export default function PortfolioSection({
  featuredProjects,
  title = "Selected Projects",
  kicker = "Portfolio",
  subtitle = "Short descriptions and technologies used.",
}: Props) {
  const {
    stageRef,
    cardRefs,
    activeIndex,
    phase,
    onToggle,
    onClose,
    isOpen,
    isExpanded,
  } = usePortfolioCardsStage(featuredProjects.length);

  return (
    <section id="portfolio" className={styles.portfolio}>
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>{kicker}</p>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
        </header>

        <div
          ref={stageRef}
          className={[
            styles.cards,
            isOpen ? styles.isOpen : "",
            isExpanded ? styles.phaseExpand : "",
            phase === "closing" ? styles.isClosing : "",
          ].join(" ")}
        >
          {featuredProjects.map((project, i) => {
            const img = getPrimaryImage(project);

            const expandedContent =
              project.details ?? (
                <>
                  <p>{project.description}</p>
                  <p>
                    Add outcomes: performance, Core Web Vitals, a11y, SEO, architecture, migrations,
                    etc.
                  </p>
                  <p>Extra paragraphs to test scroll…</p>
                </>
              );

            const isActive = activeIndex === i;

            return (
              <article
                key={project.name}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={[styles.card, isActive ? styles.isActive : ""].join(" ")}
                data-away={isOpen && !isActive ? (i % 2 === 0 ? "down" : "up") : "none"}
              >
                <div className={styles.cardLayout}>
                  <div className={styles.cardMedia}>
                    {img ? (
                      <img src={img} alt={`${project.name} screenshot`} loading="lazy" />
                    ) : (
                      <div className={styles.mediaPlaceholder} aria-hidden="true" />
                    )}
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardHead}>
                        <h3 className={styles.cardTitle}>{project.name}</h3>
                        {project.year != null && (
                          <span className={styles.cardYear}>{project.year}</span>
                        )}
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

                    {/* COMPACT (used for measurement) */}
                    <div
                      className={[styles.cardText, styles.cardTextCompact].join(" ")}
                      data-role="compact"
                    >
                      <p className={styles.cardDescription}>{project.description}</p>
                    </div>

                    {/* EXPANDED (force-hidden inline during measurement) */}
                    <div
                      className={[styles.cardText, styles.cardTextExpanded].join(" ")}
                      data-role="expanded"
                    >
                      <div className={styles.expandedScroll}>{expandedContent}</div>
                    </div>

                    <div className={styles.cardActions}>
                      <a
                        href={project.link}
                        className={styles.btn}
                        target="_blank"
                        rel="noreferrer"
                      >
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
                      ) : project.caseStudy ? (
                        <a
                          href={project.caseStudy}
                          className={[styles.btn, styles.btnOutline].join(" ")}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Case Study
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