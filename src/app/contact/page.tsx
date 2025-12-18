import styles from "./contact.module.css";
import { Section } from "@/components/Section";
import { getProfile } from "@/data/profile";
import { contactDefaults } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const profile = await getProfile();
  const socials = profile.socials.length ? profile.socials : contactDefaults.socials;
  const email = profile.email ?? contactDefaults.email;
  const location = profile.location ?? contactDefaults.location;

  return (
    <main className={styles.page}>
      <header className={styles.card}>
        <h1>Let&apos;s build together</h1>
        <p>
          I partner with founders, agencies, and product teams to ship polished experiences.
          Drop me a line or pick a channel that works for you.
        </p>
      </header>

      <Section
        id="contact"
        eyebrow="Contact"
        title="Ways to connect"
        description="Email gets the fastest response, but I’ll see messages across these channels."
      >
        <div className={styles.details}>
          <div className={styles.infoGroup}>
            <span className={styles.label}>Email</span>
            <a href={`mailto:${email}`}>{email}</a>
          </div>
          <div className={styles.infoGroup}>
            <span className={styles.label}>Location</span>
            <p>{location}</p>
          </div>
          <div className={styles.infoGroup}>
            <span className={styles.label}>Socials</span>
            <ul className={styles.links}>
              {socials.map((social) => (
                <li key={social.label}>
                  <a href={social.url} target="_blank" rel="noreferrer">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </main>
  );
}
