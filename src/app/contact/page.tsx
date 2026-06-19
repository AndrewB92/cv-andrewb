import styles from "./contact.module.css";
import { Section } from "@/components/Section";
import { getProfile } from "@/data/profile";
import { contactDefaults } from "@/config/site";

export const dynamic = "force-dynamic";

const PROFILE_IMAGE_URL =
  "https://res.cloudinary.com/dnefeqtp4/image/upload/v1781864794/IMG_7666_mc2hk3.webp";

const socialMeta: Record<string, { icon: string; hint: string }> = {
  GitHub: {
    icon: "GH",
    hint: "Code, repos, experiments",
  },
  LinkedIn: {
    icon: "IN",
    hint: "Work history and contact",
  },
  Mastodon: {
    icon: "M",
    hint: "Social updates",
  },
};

export default async function ContactPage() {
  const profile = await getProfile();

  const socials = profile.socials.length
    ? profile.socials
    : contactDefaults.socials;

  const email = profile.email || contactDefaults.email;
  const location = profile.location || contactDefaults.location;
  const name = profile.name || "Andrew Bielous";
  const jobTitle = profile.title || "Web Developer";
  const summary = profile.summary;
  const resumeUrl = profile.resumeUrl;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.kicker}>Available for selected work</span>

          <h1>Let&apos;s build something reliable, fast, and polished.</h1>

          <p className={styles.lead}>
            I partner with founders, agencies, and product teams to build
            advanced WordPress solutions, frontend interfaces, and interactive
            web experiences.
          </p>

          <div className={styles.actions}>
            <a className={styles.primaryButton} href={`mailto:${email}`}>
              Email me
              <span aria-hidden="true">→</span>
            </a>

            <a className={styles.secondaryButton} href="#contact">
              View channels
            </a>
          </div>
        </div>

        <aside className={styles.profileCard} aria-label={`${name} profile`}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarRings} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>

            <img className={styles.avatar} src={PROFILE_IMAGE_URL} alt={name} />
          </div>

          <div className={styles.profileInfo}>
            <h2>{name}</h2>
            <p>{jobTitle}</p>
          </div>
        </aside>
      </header>

      <Section
        id="contact"
        eyebrow="Contact"
        title="Ways to connect"
        description="Email gets the fastest response, but I’ll see messages across these channels."
      >
        <div className={styles.contactGrid}>
          <a className={styles.contactTile} href={`mailto:${email}`}>
            <span className={styles.tileIcon}>@</span>
            <span className={styles.tileLabel}>Email</span>
            <strong>{email}</strong>
            <small>Best for project requests and direct communication.</small>
          </a>

          <div className={styles.contactTile}>
            <span className={styles.tileIcon}>⌖</span>
            <span className={styles.tileLabel}>Location</span>
            <strong>{location}</strong>
            <small>Remote-first collaboration across international teams.</small>
          </div>

          {resumeUrl && resumeUrl !== "#" ? (
            <a
              className={styles.contactTile}
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span className={styles.tileIcon}>CV</span>
              <span className={styles.tileLabel}>Resume</span>
              <strong>Open resume</strong>
              <small>
                Downloadable profile, experience, and project background.
              </small>
            </a>
          ) : (
            <div className={styles.contactTile}>
              <span className={styles.tileIcon}>CV</span>
              <span className={styles.tileLabel}>Resume</span>
              <strong>Available on request</strong>
              <small>
                I can share a focused CV depending on the role or project.
              </small>
            </div>
          )}
        </div>

        <div className={styles.socialPanel}>
          <div>
            <span className={styles.panelEyebrow}>Profiles</span>
            <h3>More places to verify my work</h3>
            {summary ? <p>{summary}</p> : null}
          </div>

          <ul className={styles.socialList}>
            {socials.map((social) => {
              const meta = socialMeta[social.label] ?? {
                icon: social.label.slice(0, 2).toUpperCase(),
                hint: "External profile",
              };

              const isValidLink = social.url && social.url !== "#";

              return (
                <li key={social.label}>
                  {isValidLink ? (
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.socialLink}
                    >
                      <span className={styles.socialIcon}>{meta.icon}</span>

                      <span>
                        <strong>{social.label}</strong>
                        <small>{meta.hint}</small>
                      </span>

                      <span className={styles.arrow} aria-hidden="true">
                        →
                      </span>
                    </a>
                  ) : (
                    <div
                      className={`${styles.socialLink} ${styles.disabledLink}`}
                    >
                      <span className={styles.socialIcon}>{meta.icon}</span>

                      <span>
                        <strong>{social.label}</strong>
                        <small>Link will be added later</small>
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Section>
    </main>
  );
}