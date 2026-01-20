import Link from "next/link";
import Script from "next/script";
import styles from "./page.module.css";
import { Section } from "@/components/Section";
import { getPortfolioContent } from "@/data/profile";
import { siteMetadata } from "@/config/site";
import { HeroMetaPopover } from "@/components/HeroMetaPopover";
import { ExperienceSection } from "./ExperienceSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { profile, skills, projects } = await getPortfolioContent();
  const featuredProjects = projects.slice(0, 3);
  const { experiences } = await getPortfolioContent();

  return (
    <main>
      <article className={`${styles.hero} glow-border`}>
        <div className={styles.heroContent}>
          <div className="styles.heroContentBG"></div>
          <p aria-label="Tagline">{siteMetadata.tagline}</p>
          <h1>{profile.name}</h1>
          <p>{profile.summary}</p>
          <div className={styles.heroActions}>
            <Link href="/projects" className={styles.primaryButton}>
              Explore projects
            </Link>
            <Link href="/contact" className={styles.secondaryButton}>
              Get in touch
            </Link>
          </div>

          <HeroMetaPopover className={styles.heroMetaPopover}>
            <div className={styles.heroMeta}>
              <strong>Short facts:</strong>
              <p>
                <strong>Role:</strong> {profile.title}
              </p>
              <p>
                <strong>Location:</strong> {profile.location}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </p>
            </div>
          </HeroMetaPopover>
        </div>
      </article>

      <div className={styles.grid}>
        <Section
          id="skills"
          className="glow-border"
          eyebrow="Toolkit"
          title="Skills & focus areas"
          description="Tools I keep close to ship resilient, maintainable interfaces."
        >
          {skills.map((group) => (
            <article key={group.title}>
              <h3>{group.title}</h3>
              <ul className={styles.skillsList}>
                {group.items.map((skill) => (
                  <li key={skill} className={styles.skillPill}>
                    {skill}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Section>

        <ExperienceSection experiences={experiences} />
      </div>

      <Section
        id="highlights"
        className="glow-border"
        eyebrow="Highlights"
        title="Selected collaborations"
        description="A sampling of recent launches. Browse the full archive on the projects page."
      >
        <div className={styles.projectsPreview}>
          {featuredProjects.map((project) => (
            <article key={project.name} className={styles.projectCard}>
              <div>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
              </div>
              <div className={styles.projectStack}>
                {project.stack.map((item) => (
                  <span
                    key={`${project.name}-${item}`}
                    className={styles.stackTag}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <a
                href={project.link}
                className={styles.sectionLink}
                target="_blank"
                rel="noreferrer"
              >
                Visit project →
              </a>
            </article>
          ))}
        </div>
        <Link href="/projects" className={styles.sectionLink}>
          View all projects →
        </Link>
      </Section>
    </main>
  );
}