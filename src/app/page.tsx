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

                  {/* Smooth expandable area (collapsed by default) */}
                  <div
                    id={achievementsId}
                    data-achievements
                    aria-hidden="true"
                    // style={{
                    //   overflow: "hidden",
                    //   maxHeight: 0,
                    //   transition: "max-height 280ms ease",
                    // }}
                    className={styles.expPanel}
                  >
                    <ul className={styles.experienceAchievements} style={{ marginTop: 0 }}>
                      {experience.achievements.map((achievement, i) => (
                        <li key={`${experience.company}-${index}-${i}`}>{achievement}</li>
                      ))}
                    </ul>
                  </div>

                  {/* <button
                    type="button"
                    data-exp-toggle
                    data-target={achievementsId}
                    aria-expanded="false"
                    aria-controls={achievementsId}
                  >
                    Show more
                  </button> */}

                  <button
                    type="button"
                    className={styles.expToggle}
                    data-exp-toggle
                    data-target={achievementsId}
                    aria-expanded="false"
                    aria-controls={achievementsId}
                  >
                    <span className={styles.expToggleText}>Show details</span>

                    <span className={styles.expToggleIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M7 10l5 5 5-5" />
                      </svg>
                    </span>
                  </button>

                </li>
              );
            })}
          </ol>

          <Script id="experience-toggle-smooth" strategy="afterInteractive">
            {`
              (() => {
                const toggles = document.querySelectorAll('[data-exp-toggle]');
                if (!toggles.length) return;

                const getLabelEl = (btn) => btn.querySelector('[class*="expToggleText"]') || btn.querySelector('span');
                const getIconEl  = (btn) => btn.querySelector('[class*="expToggleIcon"]');

                const setOpen = (btn, panel) => {
                  panel.style.maxHeight = '0px';
                  panel.setAttribute('aria-hidden', 'false');
                  panel.getBoundingClientRect(); // reflow

                  panel.style.maxHeight = panel.scrollHeight + 'px';

                  btn.setAttribute('aria-expanded', 'true');

                  const label = getLabelEl(btn);
                  if (label) label.textContent = 'Hide details';

                  const icon = getIconEl(btn);
                  if (icon) icon.style.transform = 'rotate(180deg)';
                };

                const setClosed = (btn, panel) => {
                  panel.style.maxHeight = panel.scrollHeight + 'px';
                  panel.getBoundingClientRect(); // reflow

                  panel.style.maxHeight = '0px';
                  btn.setAttribute('aria-expanded', 'false');

                  const label = getLabelEl(btn);
                  if (label) label.textContent = 'Show details';

                  const icon = getIconEl(btn);
                  if (icon) icon.style.transform = 'rotate(0deg)';

                  const onEnd = (e) => {
                    if (e.propertyName !== 'max-height') return;
                    panel.setAttribute('aria-hidden', 'true');
                    panel.removeEventListener('transitionend', onEnd);
                  };
                  panel.addEventListener('transitionend', onEnd);
                };

                toggles.forEach((btn) => {
                  const targetId = btn.getAttribute('data-target');
                  if (!targetId) return;

                  const panel = document.getElementById(targetId);
                  if (!panel) return;

                  // Init: collapsed
                  btn.setAttribute('aria-expanded', 'false');
                  panel.setAttribute('aria-hidden', 'true');
                  panel.style.maxHeight = '0px';

                  const icon = getIconEl(btn);
                  if (icon) icon.style.transform = 'rotate(0deg)';

                  btn.addEventListener('click', () => {
                    const isOpen = btn.getAttribute('aria-expanded') === 'true';
                    if (isOpen) setClosed(btn, panel);
                    else setOpen(btn, panel);
                  });
                });

                const refreshOpenHeights = () => {
                  toggles.forEach((btn) => {
                    const isOpen = btn.getAttribute('aria-expanded') === 'true';
                    if (!isOpen) return;

                    const targetId = btn.getAttribute('data-target');
                    const panel = targetId ? document.getElementById(targetId) : null;
                    if (!panel) return;

                    panel.style.maxHeight = panel.scrollHeight + 'px';
                  });
                };

                window.addEventListener('resize', refreshOpenHeights);

                if (document.fonts && document.fonts.ready) {
                  document.fonts.ready.then(refreshOpenHeights).catch(() => {});
                }
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