import Link from "next/link";
import styles from "./page.module.css";
import { Section } from "@/components/Section";
import { getPortfolioContent } from "@/data/profile";
import { siteMetadata } from "@/config/site";

// import GlowCard from "@/components/GlowCard/GlowCard";
import GlowPointerProvider from "@/components/GlowPointerProvider";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { profile, skills, experiences, projects } =
    await getPortfolioContent();
  const featuredProjects = projects.slice(0, 3);


  return (
    <main>
      {/* <GlowCard> */}
        <article className={styles.hero}>
          <div className={styles.heroContent}>
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
          </div>
          <div className={styles.heroMeta}>
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
        </article>
      {/* </GlowCard> */}

      <div className={styles.grid}>
        <Section
          id="skills"
          eyebrow="Toolkit"
          title="Skills & focus areas"
          description="Tools I keep close to ship resilient, maintainable interfaces."
          data-glow-card
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

        <Section
          id="experience"
          eyebrow="Journey"
          title="Recent experience"
          description="Selected roles that shaped my approach to product engineering."
        >
          <ol className={styles.experienceList}>
            {experiences.map((experience) => (
              <li key={`${experience.company}-${experience.role}`} className={styles.experienceItem}>
                <div className={styles.experienceHeader}>
                  <span>{experience.company}</span>
                  <span>
                    {experience.start} — {experience.end}
                  </span>
                </div>
                <p>{experience.role}</p>
                <ul className={styles.experienceAchievements}>
                  {experience.achievements.map((achievement) => (
                    <li key={achievement}>{achievement}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section
        id="highlights"
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
                  <span key={`${project.name}-${item}`} className={styles.stackTag}>
                    {item}
                  </span>
                ))}
              </div>
              <a href={project.link} className={styles.sectionLink} target="_blank" rel="noreferrer">
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
