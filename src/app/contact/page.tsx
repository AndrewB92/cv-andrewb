import styles from "./contact.module.css";
import { Section } from "@/components/Section";
import { getProfile } from "@/data/profile";
import { contactDefaults } from "@/config/site";

export const dynamic = "force-dynamic";

type ContactLink = {
  label: string;
  url: string;
};

const phone = "+380681025393";
const telegramUrl = "https://t.me/pm4life";
const whatsappUrl = "https://wa.me/380681025393";

export default async function ContactPage() {
  const profile = await getProfile();

  const email = profile.email ?? contactDefaults.email;
  const location = profile.location ?? contactDefaults.location;

  const directLinks: ContactLink[] = [
    {
      label: email,
      url: `mailto:${email}`,
    },
    {
      label: phone,
      url: `tel:${phone}`,
    },
  ];

  const messengerLinks: ContactLink[] = [
    {
      label: "Telegram",
      url: telegramUrl,
    },
    {
      label: "WhatsApp",
      url: whatsappUrl,
    },
    {
      label: "Book a call",
      url: "https://cal.com/andrew-bielous",
    },
  ];

  const profileLinks: ContactLink[] = [
    {
      label: "GitHub",
      url: "https://github.com/AndrewB92",
    },
    {
      label: "CodePen",
      url: "https://codepen.io/bielous-andrew",
    },
    {
      label: "Gravatar",
      url: "https://gravatar.com/babujioh",
    },
  ];

  const socialLinks: ContactLink[] = [
    {
      label: "LinkedIn",
      url: "https://linkedin.com/in/yourname",
    },
  ];

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
          {/* <div className={styles.infoGroup}>
            <span className={styles.label}>Location</span>
            <p>{location}</p>
          </div> */}

          <div className={styles.infoGroup}>
            <span className={styles.label}>Direct</span>
            <ul className={styles.links}>
              {directLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.url}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.infoGroup}>
            <span className={styles.label}>Messengers</span>
            <ul className={styles.links}>
              {messengerLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.infoGroup}>
            <span className={styles.label}>Profiles</span>
            <ul className={styles.links}>
              {profileLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.infoGroup}>
            <span className={styles.label}>Socials</span>
            <ul className={styles.links}>
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
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