import styles from "./contact.module.css";
import { Section } from "@/components/Section";
import { getProfile } from "@/data/profile";
import { contactDefaults } from "@/config/site";

export const dynamic = "force-dynamic";

type ContactProfile = Awaited<ReturnType<typeof getProfile>> & {
  phone?: string;
};

type ContactLink = {
  label: string;
  url: string;
};

const getContactLinks = (profile: ContactProfile, email: string): ContactLink[] => {
  const phone = profile.phone?.replace(/[^\d+]/g, "");

  const defaults: ContactLink[] = [
    {
      label: "Email",
      url: `mailto:${email}`,
    },
  ];

  if (!phone) return defaults;

  return [
    ...defaults,
    {
      label: "Phone",
      url: `tel:${phone}`,
    },
    {
      label: "WhatsApp",
      url: `https://wa.me/${phone.replace("+", "")}`,
    },
    {
      label: "Telegram",
      url: "https://t.me/pm4life",
    },
  ];
};

const getSocialLinks = (profile: ContactProfile): ContactLink[] => {
  const socials = profile.socials.length ? profile.socials : contactDefaults.socials;

  const requiredLinks: ContactLink[] = [
    {
      label: "Cal.com",
      url: "https://cal.com/andrew-bielous",
    },
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

  const merged = [...requiredLinks, ...socials];

  return merged.filter(
    (link, index, self) =>
      link.url &&
      link.url !== "#" &&
      index === self.findIndex((item) => item.label === link.label || item.url === link.url),
  );
};

export default async function ContactPage() {
  const profile = (await getProfile()) as ContactProfile;

  const email = profile.email ?? contactDefaults.email;
  const location = profile.location ?? contactDefaults.location;

  const contactLinks = getContactLinks(profile, email);
  const socialLinks = getSocialLinks(profile);

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
            <span className={styles.label}>Location</span>
            <p>{location}</p>
          </div>

          <div className={styles.infoGroup}>
            <span className={styles.label}>Direct contact</span>

            <ul className={styles.links}>
              {contactLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target={link.url.startsWith("http") ? "_blank" : undefined}
                    rel={link.url.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.infoGroup}>
            <span className={styles.label}>Socials & profiles</span>

            <ul className={styles.links}>
              {socialLinks.map((social) => (
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