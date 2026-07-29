import Link from "next/link";
import styles from "./projects.module.css";
import {
  getProjects,
  type Project,
  type ProjectCategory,
} from "@/data/profile";
import { ProjectsGallery } from "@/components/ProjectsGallery";
import { PROJECTS_PAGE_SIZE } from "@/config/ui";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams: Promise<{
    category?: string;
    page?: string;
  }>;
};

const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  "wordpress",
  "ecommerce",
  "frontend",
  "content-platform",
  "interactive",
  "corporate",
  "education",
  "other",
];

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  wordpress: "WordPress",
  ecommerce: "E-commerce",
  frontend: "Frontend",
  "content-platform": "Content platform",
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

const isProjectCategory = (
  value: string | undefined,
): value is ProjectCategory =>
  Boolean(
    value &&
      PROJECT_CATEGORIES.includes(value as ProjectCategory),
  );

const normalizePage = (
  value: string | undefined,
  totalPages: number,
) => {
  const parsed = Number(value ?? "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(Math.floor(parsed), totalPages);
};

const getSpotlightProject = (
  projects: Project[],
): Project | null => {
  const explicitlySelected = projects
    .filter((project) => project.spotlight)
    .sort(
      (a, b) =>
        (b.priority ?? 0) - (a.priority ?? 0),
    )[0];

  return explicitlySelected ?? null;
};

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

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const params = await searchParams;
  const projects = await getProjects();

  const activeCategory = isProjectCategory(params.category)
    ? params.category
    : null;

  const categoryCounts = PROJECT_CATEGORIES.map((name) => ({
    name,
    count: projects.filter(
      (project) => project.category === name,
    ).length,
  })).filter((item) => item.count > 0);

  const filteredProjects = activeCategory
    ? projects.filter(
        (project) => project.category === activeCategory,
      )
    : projects;

  const totalItems = filteredProjects.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / PROJECTS_PAGE_SIZE),
  );
  const currentPage = normalizePage(
    params.page,
    totalPages,
  );
  const start =
    (currentPage - 1) * PROJECTS_PAGE_SIZE;
  const initialProjects = filteredProjects.slice(
    start,
    start + PROJECTS_PAGE_SIZE,
  );

  const productionCount = projects.filter(
    (project) => project.status === "production",
  ).length;
  const technologiesCount = new Set(
    projects.flatMap((project) => project.stack),
  ).size;

  const spotlightProject = getSpotlightProject(projects);
  const spotlightImage = spotlightProject
    ? getPrimaryImage(spotlightProject)
    : null;

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <div className={styles.introContent}>
          <p className={styles.eyebrow}>Project archive</p>

          <h1>Production websites and frontend systems</h1>

          <p className={styles.description}>
            Commercial websites, content platforms, interactive
            interfaces, and modernization projects built across
            WordPress, WooCommerce, React, Next.js, and custom
            frontend architecture.
          </p>
        </div>

        <dl
          className={styles.stats}
          aria-label="Project archive statistics"
        >
          <div>
            <dt>Projects</dt>
            <dd>{projects.length}</dd>
          </div>

          <div>
            <dt>In production</dt>
            <dd>{productionCount}</dd>
          </div>

          <div>
            <dt>Technologies</dt>
            <dd>{technologiesCount}</dd>
          </div>
        </dl>
      </header>

      {spotlightProject ? (
        <section
          className={styles.spotlight}
          aria-labelledby="project-spotlight-title"
        >
          <div className={styles.spotlightMedia}>
            {spotlightImage ? (
              <img
                src={spotlightImage.url}
                alt={
                  spotlightImage.alt ??
                  `${spotlightProject.name} website preview`
                }
                decoding="async"
              />
            ) : (
              <div
                className={styles.spotlightPlaceholder}
                aria-hidden="true"
              >
                <span>
                  {CATEGORY_LABELS[
                    spotlightProject.category
                  ]}
                </span>
                <strong>
                  {spotlightProject.name
                    .slice(0, 2)
                    .toUpperCase()}
                </strong>
              </div>
            )}
          </div>

          <div className={styles.spotlightContent}>
            <div className={styles.spotlightTopline}>
              <p>Project spotlight</p>

              <div>
                <span>
                  {STATUS_LABELS[
                    spotlightProject.status
                  ]}
                </span>

                {spotlightProject.year ? (
                  <time
                    dateTime={String(
                      spotlightProject.year,
                    )}
                  >
                    {spotlightProject.year}
                  </time>
                ) : null}
              </div>
            </div>

            <div className={styles.spotlightCopy}>
              <p className={styles.spotlightCategory}>
                {
                  CATEGORY_LABELS[
                    spotlightProject.category
                  ]
                }
              </p>

              <h2 id="project-spotlight-title">
                {spotlightProject.name}
              </h2>

              <p>{spotlightProject.summary}</p>
            </div>

            {spotlightProject.contribution ? (
              <div
                className={styles.spotlightContribution}
              >
                <span>My contribution</span>
                <p>{spotlightProject.contribution}</p>
              </div>
            ) : null}

            <div className={styles.spotlightBottom}>
              <ul
                className={styles.spotlightStack}
                aria-label={`${spotlightProject.name} technology stack`}
              >
                {spotlightProject.stack
                  .slice(0, 6)
                  .map((item) => (
                    <li
                      key={`${spotlightProject.id}-${item}`}
                    >
                      {item}
                    </li>
                  ))}
              </ul>

              <div className={styles.spotlightLinks}>
                <a
                  href={spotlightProject.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit website
                  <span aria-hidden="true">↗</span>
                </a>

                {spotlightProject.github ? (
                  <a
                    href={spotlightProject.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <ProjectsGallery
        categories={categoryCounts}
        initialData={{
          projects: initialProjects,
          totalPages,
          totalItems,
          currentPage,
          activeCategory,
        }}
      />

      <section
        className={styles.contactCta}
        aria-labelledby="projects-contact-title"
      >
        <div>
          <p className={styles.eyebrow}>
            Work together
          </p>

          <h2 id="projects-contact-title">
            Need help modernizing a frontend or WordPress
            project?
          </h2>

          <p>
            I work on production interfaces, legacy
            refactoring, performance improvements, and
            content-driven websites.
          </p>
        </div>

        <Link
          href="/contact"
          className={styles.contactLink}
        >
          Discuss a project
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}