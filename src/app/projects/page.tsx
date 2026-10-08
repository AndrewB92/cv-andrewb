import styles from "./projects.module.css";
import { getPortfolioContent } from "@/data/profile";
import { projectArchive, CATEGORY_LABELS, STATUS_LABELS, type ProjectSearchParams } from "@/data/projects";
import { pageMetadata } from "@/config/metadata";
import { ProjectsGallery } from "@/components/ProjectsGallery";
import { ProjectImageSlider } from "@/components/portfolio/ProjectImageSlider";
import { RainbowGlowLink } from "@/components/RainbowGlowLink/RainbowGlowLink";

export const metadata = pageMetadata("/projects", "Projects");

type Props = { searchParams: Promise<ProjectSearchParams> };

/**
 * Renders spotlights and a category-filtered archive page from URL search parameters.
 * Shows an unavailable notice for temporary outages; other loading errors propagate.
 */
export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { projects, available } = await getPortfolioContent();
  const { categories, ...archive } = projectArchive(projects, params);

  const spotlightProjects = projects
    .filter((project) => project.spotlight)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const productionCount = projects.filter((project) => project.status === "production").length;
  const technologiesCount = new Set(projects.flatMap((project) => project.stack)).size;

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <div className={styles.introContent}>
          {/* <p className={styles.eyebrow}>Project archive</p> */}
          <h1>Project archive</h1>
          <p className={styles.description}>Commercial websites, content platforms, interactive interfaces, and modernization projects built across WordPress, WooCommerce, React, Next.js, and custom frontend architecture.</p>
        </div>
        {available ? <dl className={styles.stats} aria-label="Project archive statistics">
          <div><dt>Projects</dt><dd>{projects.length}</dd></div>
          <div><dt>In production</dt><dd>{productionCount}</dd></div>
          <div><dt>Technologies</dt><dd>{technologiesCount}</dd></div>
        </dl> : null}
      </header>

      {spotlightProjects.length ? (
        <section className={styles.spotlights} aria-labelledby="project-spotlights-title">
          <div className={styles.spotlightsHeader}>
            <p className={styles.eyebrow}>Selected depth</p>
            <h2 id="project-spotlights-title">Project spotlights</h2>
          </div>

          <div className={styles.spotlightsList}>
            {spotlightProjects.map((project, index) => (
              <article className={styles.spotlight} key={project.id}>
                <div className={styles.spotlightMedia}>
                  {project.img?.length ? (
                    <ProjectImageSlider images={project.img} altBase={project.name} showArrows fit="contain" />
                  ) : (
                    <div className={styles.spotlightPlaceholder} aria-hidden="true">
                      <span>{CATEGORY_LABELS[project.category]}</span>
                      <strong>{project.name.slice(0, 2).toUpperCase()}</strong>
                    </div>
                  )}
                </div>

                <div className={styles.spotlightContent}>
                  <div className={styles.spotlightTopline}>
                    <p>Spotlight {String(index + 1).padStart(2, "0")}</p>
                    <div><span>{STATUS_LABELS[project.status]}</span>{project.year ? <time dateTime={String(project.year)}>{project.year}</time> : null}</div>
                  </div>

                  <div className={styles.spotlightCopy}>
                    <p className={styles.spotlightCategory}>{CATEGORY_LABELS[project.category]}</p>
                    <h3>{project.name}</h3>
                    <p>{project.summary}</p>
                  </div>

                  {project.contribution ? <div className={styles.spotlightContribution}><span>My contribution</span><p>{project.contribution}</p></div> : null}

                  {project.cms || project.pageBuilder ? (
                    <dl className={styles.spotlightPlatform}>
                      {project.cms ? <div><dt>CMS</dt><dd>{project.cms}</dd></div> : null}
                      {project.pageBuilder ? <div><dt>Page builder</dt><dd>{project.pageBuilder}</dd></div> : null}
                    </dl>
                  ) : null}

                  <div className={styles.spotlightBottom}>
                    <ul className={styles.spotlightStack} aria-label={`${project.name} technology stack`}>
                      {project.stack.map((item) => <li key={`${project.id}-${item}`}>{item}</li>)}
                    </ul>
                    <div className={styles.spotlightLinks}>
                      {project.link ? <a href={project.link} target="_blank" rel="noopener noreferrer">Visit website <span aria-hidden="true">↗</span></a> : null}
                      {project.github ? <a href={project.github} target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a> : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {available ? <ProjectsGallery categories={categories} initialData={archive} /> : (
        <p role="status">Project information is temporarily unavailable. Please try again later or contact me.</p>
      )}

      <section className={`${styles.contactCta} glow-border`} aria-labelledby="projects-contact-title">
        <div>
          {/* <p className={styles.eyebrow}>Work together</p> */}
          <h2 id="projects-contact-title">Need some help?</h2>
          <p>Working on production interfaces, legacy refactoring, performance improvements, and content-driven websites.</p>
        </div>
        {/* <Link href="/contact" className={styles.contactLink}>Discuss a project <span aria-hidden="true">→</span></Link> */}
        <RainbowGlowLink
          href="/contact"
          blob
          variant="flat"
          className={styles.flatButton}
          iconPosition="end"
          iconName="arrow"
          iconDirection="right"
        >
          Discuss a project
        </RainbowGlowLink>
      </section>
    </div>
  );
}