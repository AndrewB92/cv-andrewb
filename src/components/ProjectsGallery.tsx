"use client";

import {
  useMemo,
  useTransition,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import styles from "./ProjectsGallery.module.css";
import type {
  Project,
  ProjectCategory,
} from "@/data/profile";

type CategoryCount = {
  name: ProjectCategory;
  count: number;
};

type ProjectsData = {
  projects: Project[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
  activeCategory: ProjectCategory | null;
};

type ProjectsGalleryProps = {
  categories: CategoryCount[];
  initialData: ProjectsData;
};

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  wordpress: "WordPress",
  ecommerce: "E-commerce",
  frontend: "Frontend",
  "content-platform": "Content platforms",
  interactive: "Interactive",
  corporate: "Corporate",
  education: "Education",
  other: "Other",
};

const STATUS_LABELS: Record<Project["status"], string> = {
  production: "Production",
  maintenance: "Ongoing maintenance",
  archived: "Archived",
  offline: "Offline",
  private: "Private",
};

const STACK_LIMIT = 4;

const getPrimaryImage = (project: Project) => {
  const images = project.img ?? [];

  if (!images.length) {
    return null;
  }

  const preferredVariants = [
    "featured",
    "hero",
    "main",
    "homepage",
  ];

  return (
    images.find((image) =>
      preferredVariants.includes(
        image.variant?.trim().toLowerCase() ?? "",
      ),
    ) ?? images[0]
  );
};

export function ProjectsGallery({
  categories,
  initialData,
}: ProjectsGalleryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalArchiveItems = useMemo(
    () =>
      categories.reduce(
        (total, category) => total + category.count,
        0,
      ),
    [categories],
  );

  const navigate = (
    category: ProjectCategory | null,
    page: number,
  ) => {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }

    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.push(href, {
        scroll: false,
      });
    });
  };

  const handleCategoryChange = (
    category: ProjectCategory | null,
  ) => {
    if (category === initialData.activeCategory) {
      return;
    }

    navigate(category, 1);
  };

  const handlePageChange = (page: number) => {
    if (
      page < 1 ||
      page > initialData.totalPages ||
      page === initialData.currentPage
    ) {
      return;
    }

    navigate(initialData.activeCategory, page);
  };

  const activeLabel = initialData.activeCategory
    ? CATEGORY_LABELS[initialData.activeCategory]
    : "All projects";

  return (
    <section
      className={styles.archive}
      aria-labelledby="projects-archive-title"
      aria-busy={isPending}
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarIntro}>
          <p className={styles.toolbarEyebrow}>
            Browse the archive
          </p>

          <div className={styles.toolbarHeading}>
            <h2 id="projects-archive-title">
              {activeLabel}
            </h2>

            <span>
              {initialData.totalItems}{" "}
              {initialData.totalItems === 1
                ? "project"
                : "projects"}
            </span>
          </div>
        </div>

        <ul
          className={styles.filters}
          aria-label="Filter projects by category"
        >
          <li>
            <button
              type="button"
              className={styles.filterButton}
              aria-pressed={
                initialData.activeCategory === null
              }
              onClick={() =>
                handleCategoryChange(null)
              }
              disabled={isPending}
            >
              <span>All</span>
              <small>{totalArchiveItems}</small>
            </button>
          </li>

          {categories.map((category) => (
            <li key={category.name}>
              <button
                type="button"
                className={styles.filterButton}
                aria-pressed={
                  initialData.activeCategory ===
                  category.name
                }
                onClick={() =>
                  handleCategoryChange(category.name)
                }
                disabled={isPending}
              >
                <span>
                  {CATEGORY_LABELS[category.name]}
                </span>
                <small>{category.count}</small>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.projectsStage}>
        {initialData.projects.length === 0 ? (
          <div className={styles.emptyState}>
            No projects are assigned to this category yet.
          </div>
        ) : (
          <div
            className={[
              styles.projectsGrid,
              isPending ? styles.projectsGridLoading : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {initialData.projects.map((project) => {
              const image = getPrimaryImage(project);
              const visibleStack = project.stack.slice(
                0,
                STACK_LIMIT,
              );
              const remainingStack =
                project.stack.length - visibleStack.length;

              return (
                <article
                  key={project.id}
                  className={[
                    styles.project,
                    image
                      ? styles.projectWithImage
                      : styles.projectWithoutImage,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {image ? (
                    <div className={styles.projectMedia}>
                      <img
                        src={image.url}
                        alt={
                          image.alt ??
                          `${project.name} website preview`
                        }
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div
                      className={styles.projectIdentity}
                      aria-hidden="true"
                    >
                      <span>
                        {CATEGORY_LABELS[
                          project.category
                        ]}
                      </span>
                      <strong>
                        {project.name
                          .slice(0, 2)
                          .toUpperCase()}
                      </strong>
                    </div>
                  )}

                  <div className={styles.projectBody}>
                    <div className={styles.projectMeta}>
                      <span>
                        {STATUS_LABELS[project.status]}
                      </span>

                      {project.year ? (
                        <time
                          dateTime={String(project.year)}
                        >
                          {project.year}
                        </time>
                      ) : null}
                    </div>

                    <div className={styles.projectCopy}>
                      <h3>{project.name}</h3>

                      <p>{project.summary}</p>
                    </div>

                    {project.contribution ? (
                      <div
                        className={
                          styles.projectContribution
                        }
                      >
                        <span>Contribution</span>
                        <p>{project.contribution}</p>
                      </div>
                    ) : null}

                    {visibleStack.length > 0 ? (
                      <ul
                        className={styles.stack}
                        aria-label={`${project.name} technology stack`}
                      >
                        {visibleStack.map((item) => (
                          <li
                            key={`${project.id}-${item}`}
                          >
                            {item}
                          </li>
                        ))}

                        {remainingStack > 0 ? (
                          <li
                            aria-label={`${remainingStack} more technologies`}
                          >
                            +{remainingStack}
                          </li>
                        ) : null}
                      </ul>
                    ) : null}

                    <div className={styles.projectFooter}>
                      <span>
                        {CATEGORY_LABELS[
                          project.category
                        ]}
                      </span>

                      <div className={styles.projectLinks}>
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit site
                          <span aria-hidden="true">↗</span>
                        </a>

                        {project.github ? (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noreferrer"
                          >
                            GitHub
                            <span aria-hidden="true">
                              ↗
                            </span>
                          </a>
                        ) : null}

                        {project.codepen ? (
                          <a
                            href={project.codepen}
                            target="_blank"
                            rel="noreferrer"
                          >
                            CodePen
                            <span aria-hidden="true">
                              ↗
                            </span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {isPending ? (
          <div
            className={styles.loaderOverlay}
            role="status"
            aria-label="Loading projects"
          >
            <span className={styles.spinner} />
          </div>
        ) : null}
      </div>

      {initialData.totalPages > 1 ? (
        <nav
          className={styles.pagination}
          aria-label="Projects pagination"
        >
          <button
            type="button"
            onClick={() =>
              handlePageChange(
                initialData.currentPage - 1,
              )
            }
            disabled={
              initialData.currentPage === 1 || isPending
            }
          >
            Previous
          </button>

          <p className={styles.status}>
            Page {initialData.currentPage} of{" "}
            {initialData.totalPages}
          </p>

          <button
            type="button"
            onClick={() =>
              handlePageChange(
                initialData.currentPage + 1,
              )
            }
            disabled={
              initialData.currentPage ===
                initialData.totalPages || isPending
            }
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}