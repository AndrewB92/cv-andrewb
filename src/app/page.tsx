// src/app/page.tsx
import { Suspense } from "react";
import { identity, siteMetadata } from "@/config/site";
import styles from "./page.module.css";
import { Section } from "@/components/Section";
import {
  getPortfolioContent,
  type Project,
} from "@/data/profile";
import { MagicText } from "@/components/MagicText/MagicText";
import { HeroMetaPopover } from "@/components/HeroMetaPopover";
import { SkillsHoverList } from "@/components/SkillsHoverList";
import { ExperienceSection } from "./ExperienceSection";
import { Terminal, TerminalCode } from "@/components/Terminal/Terminal";
import { RainbowGlowLink } from "@/components/RainbowGlowLink/RainbowGlowLink";
import { CalPopup } from "@/components/CalPopup/CalPopup";
import { StatusBadge } from "@/components/StatusBadge";
// import { ProjectImageSlider } from "@/components/portfolio/ProjectImageSlider";
// import { DescriptionToggle } from "@/components/DescriptionToggle";
import PortfolioSection from "@/components/portfolio/PortfolioSection";

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

type HomepageFeaturedProject = Project & {
  link: string;
};

const isHomepageFeaturedProject = (
  project: Project,
): project is HomepageFeaturedProject =>
  typeof project.link === "string" &&
  project.link.trim().length > 0 &&
  (project.status === "production" ||
    project.status === "maintenance");


export default async function HomePage() {
  // Single fetch: avoid calling getPortfolioContent() more than once.
  const { profile, skills, projects, experiences, available } =
    await getPortfolioContent();

  /**
   * Homepage cards always include a "Live Site" action, so only projects
   * with a valid public link can be passed to PortfolioSection.
   *
   * Archived, offline, and private projects remain available in the
   * complete project archive but are excluded from homepage highlights.
   */
  const featuredProjects = projects
    .filter(isHomepageFeaturedProject)
    .slice(0, 3);

  return (
    <div>
      <article className={`${styles.hero} glow-border`}>
        <Terminal path={`~/${siteMetadata.domain}/welcome.tsx`}>
          <TerminalCode code={welcomeCode} language="tsx" />
        </Terminal>

        <div className={styles.heroContent}>
          <div className={styles.heroContentBG} />

          <p className={styles.welcome}>Welcome to my website</p>

          <h1 className={styles.title}>
            I&apos;m {profile.name}, your
            <br />
            <MagicText stars={0} intervalMs={2200}>
              product focused
            </MagicText>
            <br />
            web developer
          </h1>

          <p>{profile.summary}</p>

          <div className={styles.heroActions}>
            <RainbowGlowLink
              href="/?meet=hour-meeting"
              glow
              blob
              iconPosition="end"
              iconName="calendar"
              iconDirection="up"
            >
              Schedule a meeting
            </RainbowGlowLink>

            <RainbowGlowLink
              href={identity.resumeUrl}
              blob
              variant="flat"
              className={styles.flatButton}
              iconPosition="end"
              iconName="download"
              iconDirection="up"
            >
              Check my CV
            </RainbowGlowLink>
          </div>

          <HeroMetaPopover className={styles.heroMetaPopover}>
            <div className={styles.heroMeta}>
              <strong>Short facts:</strong>

              <p>
                <strong>Preferred roles:</strong> Frontend / WordPress / Web
                developer
              </p>

              <p>
                <strong>Current Location:</strong> {profile.location}
              </p>

              <p>
                <strong>Languages:</strong> English, Ukrainian, Russian
              </p>

              <p>
                <strong>Engagement:</strong> Remote • Full-time or Contract •
                Project-based OK
              </p>

              <p>
                <strong>Timezone:</strong> {identity.timezone}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </p>
            </div>
          </HeroMetaPopover>

          <StatusBadge text="Available" />
        </div>
      </article>

      <div className={styles.grid}>
        <Section
          id="skills"
          className="glow-border"
          eyebrow="Toolkit"
          title="Skills"
          description="My tech stack and tools I know how to use."
        >
          {available ? <SkillsHoverList skills={skills} /> : <p>Skills are temporarily unavailable.</p>}
        </Section>

        {available ? <ExperienceSection experiences={experiences} /> : (
          <Section id="experience" className="glow-border" eyebrow="Journey" title="Experience">
            <p>Experience is temporarily unavailable.</p>
          </Section>
        )}
      </div>

      <Section
        id="highlights"
        className="glow-border"
        eyebrow="Highlights"
        title="My last works"
        description="Several samples of recent launches. Browse the full archive on the projects page to see the complete selection."
      >
        {featuredProjects.length > 0 ? (
          <PortfolioSection featuredProjects={featuredProjects} />
        ) : (
          <p>{available ? "No public featured projects are currently available." : "Project information is temporarily unavailable. Please try again later or contact me."}</p>
        )}

        <RainbowGlowLink
          href="/projects"
          blob
          variant="flat"
          className={styles.flatButton}
          iconPosition="end"
          iconName="arrow"
          iconDirection="right"
        >
          View all projects
        </RainbowGlowLink>
      </Section>

      <Suspense fallback={null}>
        <CalPopup paramKey="meet" />
      </Suspense>
    </div>
  );
}