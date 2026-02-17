import Link from "next/link";
import Script from "next/script";
import styles from "./page.module.css";
import { Section } from "@/components/Section";
import { getPortfolioContent } from "@/data/profile";
import { siteMetadata } from "@/config/site";
import { MagicText } from "@/components/MagicText/MagicText";
import { HeroMetaPopover } from "@/components/HeroMetaPopover";
import { ExperienceSection } from "./ExperienceSection";
import TypedRotator from "@/components/TypedRotator";
// import { Terminal } from "@/components/Terminal/Terminal";
import { Terminal, TerminalCode } from "@/components/Terminal/Terminal";
import { RainbowGlowLink } from "@/components/RainbowGlowLink/RainbowGlowLink";
import { CalPopup } from "@/components/CalPopup/CalPopup";
import { StatusBadge } from "@/components/StatusBadge";
import { ProjectImageSlider } from "@/components/ProjectImageSlider";
import { DescriptionToggle } from "@/components/DescriptionToggle";


const welcomeCode = `type UseCase =
  | "explore new tech"
  | "show my skills"
  | "find freelance work"
  | "land a full-time role";

export type Welcome = {
  title: string;
  uses: UseCase;
};

export function formatWelcome({ title, uses }: Welcome): string {
  return \`\${title} — I use this site to \${uses}.\`;
}`;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { profile, skills, projects } = await getPortfolioContent();
  const featuredProjects = projects.slice(0, 3);
  const { experiences } = await getPortfolioContent();

  return (
    <main>

      <article className={`${styles.hero} glow-border`}>
        <Terminal path="~/andrew.dev/welcome.tsx">
          <TerminalCode code={welcomeCode} language="tsx" />
        </Terminal>
        <div className={styles.heroContent}>
          <div className={styles.heroContentBG}>
            {/* <div className={styles.heroContentBGinner}></div> */}
          </div>
          <p className={styles.welcome}>Welcome to my website</p>
          <h1 className={styles.title}>I&apos;m {profile.name}, your<br />
            <MagicText stars={0} intervalMs={2200}>
              product focused
            </MagicText><br />
            web developer
          </h1>

          <p>{profile.summary}</p>
          <div className={styles.heroActions}>
            <RainbowGlowLink href="/?meet=hour-meeting" glow blob iconPosition="end" iconName="mail" iconDirection="up">
              Write a message
            </RainbowGlowLink>
            <RainbowGlowLink href="#" blob variant="flat" className={styles.flatButton} iconPosition="end" iconName="download" iconDirection="up">
              Check my CV
            </RainbowGlowLink>
          </div>

          <HeroMetaPopover className={styles.heroMetaPopover}>
            <div className={styles.heroMeta}>
              <strong>Short facts:</strong>
              <p>
                {/* <strong>Role:</strong> {profile.title} */}
                <strong>Preferred roles:</strong> Frontend / WordPress / Web developer
              </p>
              <p>
                <strong>Current Location:</strong> {profile.location}
              </p>
              <p>
                <strong>Languages:</strong> English, Ukrainian, Russian
              </p>
              <p>
                <strong>Engagement:</strong> Remote • Full-time or Contract • Project-based OK
              </p>
              <p>
                <strong>Timezone:</strong> EET (UTC+2)
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </p>
            </div>
          </HeroMetaPopover>

          <StatusBadge
            text="Available"
            color="#2ecc71"
          />
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
        title="My last works"
        description="Several samplings of recent launches. If you want to see them all - browse the full archive on the projects page."
      >
        <div className={styles.projectsPreview}>
          {featuredProjects.map((project) => {
            const featuredImg =
              project.img?.find((i) => i.name === "featured")?.url;
            
            const secondaryImg = project.img?.find(
              (i) => i.name === "secondary"
            )?.url;

            return (
              <article key={project.name} className={styles.projectCard}>
                {!!project.img?.length && (
                  <ProjectImageSlider
                    images={project.img}
                    altBase={project.name}
                    showArrows={false}
                  />
                )}

                  <div className={styles.projectContent}>
                    <div className={styles.projectTitle}>
                      <h3>{project.name}</h3>
                    </div>

                    <div className={styles.projectStack}>
                      {project.stack.map((item) => (
                        <span key={`${project.name}-${item}`} className={styles.stackTag}>
                          {item}
                        </span>
                      ))}
                    </div>

                    {/* <a className={styles.projectDividerUp}>Open Description</a>
                    <div className={styles.projectDescription}>
                      <p>{project.description}</p>
                    </div> */}

                    <DescriptionToggle
                      targetName={styles.projectCard}
                      buttonClassName={styles.projectDescriptionButton}
                      panelClassName={styles.projectDescription}
                    >
                      <p>{project.description}</p>
                    </DescriptionToggle>

                    <div className={styles.projectLink}>
                    {project.year && (
                      <span className={styles.projectYear}>{project.year}</span>
                    )}
                    <a
                      href={project.link}
                      className={styles.sectionLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M14 5h5v5" />
                        <path d="M10 14L19 5" />
                        <path d="M19 14v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>



        <div className={styles.projectsPreview + " " + styles.projectsPreviewAlt}>
          {featuredProjects.map((project) => {
            const featuredImg =
              project.img?.find((i) => i.name === "featured")?.url;
            
            const secondaryImg = project.img?.find(
              (i) => i.name === "secondary"
            )?.url;

            return (
              <article key={project.name} className={styles.projectCard}>
                {!!project.img?.length && (
                  <ProjectImageSlider
                    images={project.img}
                    altBase={project.name}
                    showArrows={false}
                  />
                )}

                  <div className={styles.projectContent}>
                    <div className={styles.projectTitle}>
                      <h3>{project.name}</h3>
                    </div>

                    <div className={styles.projectStack}>
                      {project.stack.map((item) => (
                        <span key={`${project.name}-${item}`} className={styles.stackTag}>
                          {item}
                        </span>
                      ))}
                    </div>

                    {/* <a className={styles.projectDividerUp}>Open Description</a>
                    <div className={styles.projectDescription}>
                      <p>{project.description}</p>
                    </div> */}

                    <DescriptionToggle
                      targetName={styles.projectCard}
                      buttonClassName={styles.projectDescriptionButton}
                      panelClassName={styles.projectDescription}
                    >
                      <p>{project.description}</p>
                    </DescriptionToggle>

                    <div className={styles.projectLink}>
                    {project.year && (
                      <span className={styles.projectYear}>{project.year}</span>
                    )}
                    <a
                      href={project.link}
                      className={styles.sectionLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M14 5h5v5" />
                        <path d="M10 14L19 5" />
                        <path d="M19 14v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>



        <Link href="/projects" className={styles.sectionLink}>
          View all projects →
        </Link>
        <RainbowGlowLink href="/projects" blob variant="flat" className={styles.flatButton} iconPosition="end" iconName="arrow" iconDirection="right">
          View all projects
        </RainbowGlowLink>
      </Section>
      <CalPopup
        paramKey="meet"
        linksByKey={{
          "hour-meeting": "andrew-bielous-iyuwdo/hour-meeting",
          // add more if you want:
          // "quick-chat": "andrew-bielous-iyuwdo/quick-chat",
        }}
      />
    </main>
  );
}