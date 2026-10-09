import Link from "next/link";
import { analyticsAttributes } from "@/lib/analytics/events";
import { CATEGORY_LABELS, STATUS_LABELS, projectsHref } from "@/data/projects";
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

const STACK_LIMIT = 4;

/**
 * Renders an already filtered and paginated archive with counts for the whole archive.
 * Category links reset the page; pagination links retain the selected category.
 */
export function ProjectsGallery({ categories, initialData }: Props) {
  const totalArchiveItems = categories.reduce((total, item) => total + item.count, 0);

  const activeLabel = initialData.activeCategory
    ? CATEGORY_LABELS[initialData.activeCategory]
    : "All projects";

  return (
    <section className={styles.archive} aria-labelledby="projects-archive-title">
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
            <Link href={projectsHref(null)} {...analyticsAttributes("projects_filter", { category: "all" })} scroll={false} className={styles.filterButton} aria-current={initialData.activeCategory === null ? "page" : undefined}>
              <span>All</span><small>{totalArchiveItems}</small>
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.name}>
              <Link href={projectsHref(category.name)} {...analyticsAttributes("projects_filter", { category: category.name })} scroll={false} className={styles.filterButton} aria-current={initialData.activeCategory === category.name ? "page" : undefined}>
                <span>{CATEGORY_LABELS[category.name]}</span><small>{category.count}</small>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.projectsStage}>
        {initialData.projects.length === 0 ? (
          <div className={styles.emptyState}>No projects are assigned to this category yet.</div>
        ) : (
          <div className={styles.projectsGrid}>
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
                            {...analyticsAttributes("project_link_click", { project: project.name, destination: "live_site", source: "projects_archive" })}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visit site
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}

                        {project.github ? (
                          <a
                            href={project.github}
                            {...analyticsAttributes("project_link_click", { project: project.name, destination: "github", source: "projects_archive" })}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            GitHub
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}

                        {project.codepen ? (
                          <a
                            href={project.codepen}
                            {...analyticsAttributes("project_link_click", { project: project.name, destination: "codepen", source: "projects_archive" })}
                            target="_blank"
                            rel="noopener noreferrer"
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
      </div>

      {initialData.totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Projects pagination">
          {initialData.currentPage > 1 ? (
            <Link className={styles.pageLink} href={projectsHref(initialData.activeCategory, initialData.currentPage - 1)} {...analyticsAttributes("projects_pagination", { page: initialData.currentPage - 1, direction: "previous", category: initialData.activeCategory ?? "all" })} scroll={false} rel="prev">Previous</Link>
          ) : <span className={styles.pageLink} aria-disabled="true">Previous</span>}
          <p className={styles.status}>Page {initialData.currentPage} of {initialData.totalPages}</p>
          {initialData.currentPage < initialData.totalPages ? (
            <Link className={styles.pageLink} href={projectsHref(initialData.activeCategory, initialData.currentPage + 1)} {...analyticsAttributes("projects_pagination", { page: initialData.currentPage + 1, direction: "next", category: initialData.activeCategory ?? "all" })} scroll={false} rel="next">Next</Link>
          ) : <span className={styles.pageLink} aria-disabled="true">Next</span>}
        </nav>
      ) : null}
    </section>
  );
}
