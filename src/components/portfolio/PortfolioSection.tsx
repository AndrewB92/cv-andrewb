"use client";

import React from "react";
import styles from "./PortfolioSection.module.css";
import { ProjectImageSlider } from "./ProjectImageSlider";
import { usePortfolioCardsStage } from "./usePortfolioCardsStage";

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
  description: string;
  details?: string;
  img?: ProjectImg[];
};

type Props = {
  featuredProjects: FeaturedProject[];
  title?: string;
  kicker?: string;
  subtitle?: string;
};

const normalize = (value?: string) =>
  typeof value === "string" ? value.trim() : "";

function getPrimaryImage(project: FeaturedProject) {
  const images = project.img ?? [];
  if (!images.length) return "";

  const findVariant = (variants: string[]) =>
    images.find((image) =>
      variants.includes(normalize(image.variant).toLowerCase()),
    )?.url;

  return (
    findVariant(["featured", "hero", "main", "homepage"]) ||
    findVariant(["shop", "product", "catalog"]) ||
    findVariant(["mobile", "responsive"]) ||
    images[0]?.url ||
    ""
  );
}

export default function PortfolioSection({
  featuredProjects,
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
    isCompactLayout,
  } = usePortfolioCardsStage(featuredProjects.length);

  return (
    <section id="portfolio" className={styles.portfolio}>
      <div className={styles.container}>
        <div
          ref={stageRef}
          className={[
            styles.cards,
            isCompactLayout ? styles.isCompact : "",
            isOpen ? styles.isOpen : "",
            isExpanded ? styles.phaseExpand : "",
            phase === "closing" ? styles.isClosing : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {featuredProjects.map((project, index) => {
            const primaryImage = getPrimaryImage(project);
            const isActive = activeIndex === index;
            const showDesktopSlider =
              !isCompactLayout &&
              isActive &&
              isExpanded &&
              (project.img?.length ?? 0) > 0;
            const detailsId = `project-details-${index}`;

            return (
              <article
                key={project.name}
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                className={[
                  styles.card,
                  isActive ? styles.isActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-away={
                  !isCompactLayout && isOpen && !isActive
                    ? index % 2 === 0
                      ? "down"
                      : "up"
                    : "none"
                }
              >
                <div className={styles.cardLayout}>
                  <div className={styles.cardMedia}>
                    {showDesktopSlider ? (
                      <ProjectImageSlider
                        images={project.img ?? []}
                        altBase={project.name}
                        showArrows
                      />
                    ) : primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={`${project.name} screenshot`}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className={styles.mediaPlaceholder}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardHead}>
                        <h3 className={styles.cardTitle}>{project.name}</h3>
                        {project.year != null ? (
                          <span className={styles.cardYear}>{project.year}</span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className={styles.cardClose}
                        aria-label={`Close ${project.name} details`}
                        onClick={onClose}
                        tabIndex={
                          !isCompactLayout && isActive && isExpanded ? 0 : -1
                        }
                        data-role="close"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>

                    <ul className={styles.cardStack} aria-label="Tech stack">
                      {project.stack.map((item) => (
                        <li key={`${project.name}-${item}`}>{item}</li>
                      ))}
                    </ul>

                    <div
                      className={[styles.cardText, styles.cardTextCompact].join(
                        " ",
                      )}
                      data-role="compact"
                    >
                      <p className={styles.cardDescription}>
                        {project.description}
                      </p>
                    </div>

                    <div
                      id={detailsId}
                      className={[
                        styles.cardText,
                        styles.cardTextExpanded,
                      ].join(" ")}
                      data-role="expanded"
                      aria-hidden={!isActive || !isExpanded}
                    >
                      <div className={styles.expandedInner}>
                        <div className={styles.expandedScroll}>
                          <p>{project.details || project.description}</p>
                        </div>

                        <div className={styles.cardActionsExpanded}>
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
                              className={[styles.btn, styles.btnOutline].join(
                                " ",
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              GitHub
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
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
                    ) : null}

                    <button
                      type="button"
                      className={styles.cardToggle}
                      aria-expanded={isActive && isExpanded}
                      aria-controls={detailsId}
                      onClick={() => onToggle(index)}
                      data-role="toggle"
                    >
                      {isCompactLayout && isActive && isExpanded
                        ? "Collapse details"
                        : "Expand details"}
                    </button>
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