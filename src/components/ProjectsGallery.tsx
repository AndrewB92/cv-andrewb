"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./ProjectsGallery.module.css";
import type { Project, ProjectCategory } from "@/data/profile";

type CategoryCount = { name: ProjectCategory; count: number };
type ProjectsData = {
  projects: Project[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
  activeCategory: ProjectCategory | null;
};

type Props = {
  categories: CategoryCount[];
  initialData: ProjectsData;
};

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  ecommerce: "E-commerce",
  corporate: "Corporate",
  "content-platform": "Content platforms",
  education: "Education",
};

const STATUS_LABELS: Record<Project["status"], string> = {
  production: "Production",
  maintenance: "Ongoing maintenance",
  archived: "Archived",
  offline: "Offline",
  private: "Private",
};

const STACK_LIMIT = 4;

export function ProjectsGallery({ categories, initialData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalArchiveItems = useMemo(
    () => categories.reduce((total, item) => total + item.count, 0),
    [categories],
  );

  const navigate = (category: ProjectCategory | null, page: number) => {
    const params = new URLSearchParams(searchParams.toString());

    category ? params.set("category", category) : params.delete("category");
    page > 1 ? params.set("page", String(page)) : params.delete("page");

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const activeLabel = initialData.activeCategory
    ? CATEGORY_LABELS[initialData.activeCategory]
    : "All projects";

  return (
    <section className={styles.archive} aria-labelledby="projects-archive-title" aria-busy={isPending}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarIntro}>
          <p className={styles.toolbarEyebrow}>Browse the archive</p>
          <div className={styles.toolbarHeading}>
            <h2 id="projects-archive-title">{activeLabel}</h2>
            <span>{initialData.totalItems} {initialData.totalItems === 1 ? "project" : "projects"}</span>
          </div>
        </div>

        <ul className={styles.filters} aria-label="Filter projects by category">
          <li>
            <button type="button" className={styles.filterButton} aria-pressed={initialData.activeCategory === null} onClick={() => navigate(null, 1)} disabled={isPending}>
              <span>All</span><small>{totalArchiveItems}</small>
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.name}>
              <button type="button" className={styles.filterButton} aria-pressed={initialData.activeCategory === category.name} onClick={() => navigate(category.name, 1)} disabled={isPending}>
                <span>{CATEGORY_LABELS[category.name]}</span><small>{category.count}</small>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.projectsStage}>
        {initialData.projects.length === 0 ? (
          <div className={styles.emptyState}>No projects are assigned to this category yet.</div>
        ) : (
          <div className={`${styles.projectsGrid} ${isPending ? styles.projectsGridLoading : ""}`}>
            {initialData.projects.map((project) => {
              const visibleStack = project.stack.slice(0, STACK_LIMIT);
              const remainingStack = project.stack.length - visibleStack.length;

              return (
                <article key={project.id} className={styles.project}>
                  <div className={styles.projectIdentity} aria-hidden="true">
                    <span>{CATEGORY_LABELS[project.category]}</span>
                    <strong>{project.name.slice(0, 2).toUpperCase()}</strong>
                  </div>

                  <div className={styles.projectBody}>
                    <div className={styles.projectMeta}>
                      <span>{STATUS_LABELS[project.status]}</span>
                      {project.year ? <time dateTime={String(project.year)}>{project.year}</time> : null}
                    </div>

                    <div className={styles.projectCopy}>
                      <h3>{project.name}</h3>
                      <p>{project.summary}</p>
                    </div>

                    {project.contribution ? (
                      <div className={styles.projectContribution}>
                        <span>Contribution</span>
                        <p>{project.contribution}</p>
                      </div>
                    ) : null}

                    {project.cms || project.pageBuilder ? (
                      <dl className={styles.projectPlatform}>
                        {project.cms ? <div><dt>CMS</dt><dd>{project.cms}</dd></div> : null}
                        {project.pageBuilder ? <div><dt>Page builder</dt><dd>{project.pageBuilder}</dd></div> : null}
                      </dl>
                    ) : null}

                    {visibleStack.length ? (
                      <ul className={styles.stack} aria-label={`${project.name} technology stack`}>
                        {visibleStack.map((item) => <li key={`${project.id}-${item}`}>{item}</li>)}
                        {remainingStack > 0 ? <li aria-label={`${remainingStack} more technologies`}>+{remainingStack}</li> : null}
                      </ul>
                    ) : null}

                    <div className={styles.projectFooter}>
                      <div className={styles.projectLinks}>
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Visit site
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}

                        {project.github ? (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noreferrer"
                          >
                            GitHub
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}

                        {project.codepen ? (
                          <a
                            href={project.codepen}
                            target="_blank"
                            rel="noreferrer"
                          >
                            CodePen
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}

                        {!project.link &&
                        !project.github &&
                        !project.codepen ? (
                          <span className={styles.noPublicLink}>
                            No public version available
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {isPending ? <div className={styles.loaderOverlay} role="status" aria-label="Loading projects"><span className={styles.spinner} /></div> : null}
      </div>

      {initialData.totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Projects pagination">
          <button type="button" onClick={() => navigate(initialData.activeCategory, initialData.currentPage - 1)} disabled={initialData.currentPage === 1 || isPending}>Previous</button>
          <p className={styles.status}>Page {initialData.currentPage} of {initialData.totalPages}</p>
          <button type="button" onClick={() => navigate(initialData.activeCategory, initialData.currentPage + 1)} disabled={initialData.currentPage === initialData.totalPages || isPending}>Next</button>
        </nav>
      ) : null}
    </section>
  );
}