import Link from "next/link";
import Script from "next/script";
import styles from "./page.module.css";
import { Section } from "@/components/Section";
import { getPortfolioContent } from "@/data/profile";
import { siteMetadata } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { profile, skills, experiences, projects } = await getPortfolioContent();
  const featuredProjects = projects.slice(0, 3);

  return (
    <main>
      <article className={`${styles.hero} glow-border`}>
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

        {/* ✅ EXPERIENCE — updated structure with toggle button + working JS */}
        <Section
          id="experience"
          className="glow-border"
          eyebrow="Journey"
          title="Recent experience"
          description="Selected roles that shaped my approach to product engineering."
        >
          <ol className={styles.experienceList}>
            {experiences.map((experience, index) => {
              const achievementsId = `exp-achievements-${index}`;

              return (
                <li
                  key={`${experience.company}-${experience.role}`}
                  className={styles.experienceItem}
                >
                  <div className={styles.experienceHeader}>
                    <span>{experience.company}</span>
                    <span>
                      {experience.start} — {experience.end}
                    </span>
                  </div>

                  <p>{experience.role}</p>

                  {/* Collapsed by default */}
                  <div
                    id={achievementsId}
                    data-achievements
                    hidden
                    aria-hidden="true"
                  >
                    <ul className={styles.experienceAchievements}>
                      {experience.achievements.map((achievement, i) => (
                        <li key={`${experience.company}-${index}-${i}`}>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    data-exp-toggle
                    data-target={achievementsId}
                    aria-expanded="false"
                    aria-controls={achievementsId}
                  >
                    Show more
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Small client-side behavior, no CSS required */}
          <Script id="experience-toggle" strategy="afterInteractive">
            {`
              (() => {
                const toggles = document.querySelectorAll('[data-exp-toggle]');
                if (!toggles.length) return;

                const setState = (btn, panel, open) => {
                  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                  panel.setAttribute('aria-hidden', open ? 'false' : 'true');

                  if (open) {
                    panel.hidden = false;
                    btn.textContent = 'Show less';
                  } else {
                    panel.hidden = true;
                    btn.textContent = 'Show more';
                  }
                };

                toggles.forEach((btn) => {
                  const targetId = btn.getAttribute('data-target');
                  if (!targetId) return;

                  const panel = document.getElementById(targetId);
                  if (!panel) return;

                  // ensure closed on init
                  setState(btn, panel, false);

                  btn.addEventListener('click', () => {
                    const isOpen = btn.getAttribute('aria-expanded') === 'true';
                    setState(btn, panel, !isOpen);
                  });
                });
              })();
            `}
          </Script>
        </Section>
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