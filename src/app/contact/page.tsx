import styles from "./contact.module.css";
import { Section } from "@/components/Section";
import { getProfile } from "@/data/profile";
import { contactDefaults } from "@/config/site";

export const dynamic = "force-dynamic";

type ContactLink = {
  label: string;
  url: string;
  icon: string;
  external?: boolean;
};

const phone = "+380681025393";

const contactGroups: {
  title: string;
  links: ContactLink[];
}[] = [
  {
    title: "Messengers",
    links: [
      {
        label: "Telegram",
        url: "https://t.me/pm4life",
        icon: "↗",
        external: true,
      },
      {
        label: "WhatsApp",
        url: "https://wa.me/380681025393",
        icon: "◌",
        external: true,
      },
      {
        label: "Cal.com",
        url: "https://cal.com/andrew-bielous",
        icon: "◷",
        external: true,
      },
    ],
  },
  {
    title: "Profiles",
    links: [
      {
        label: "GitHub",
        url: "https://github.com/AndrewB92",
        icon: "{}",
        external: true,
      },
      {
        label: "CodePen",
        url: "https://codepen.io/bielous-andrew",
        icon: "</>",
        external: true,
      },
      {
        label: "Gravatar",
        url: "https://gravatar.com/babujioh",
        icon: "◎",
        external: true,
      },
    ],
  },
  {
    title: "Socials",
    links: [
      {
        label: "LinkedIn",
        url: "https://linkedin.com/in/yourname",
        icon: "in",
        external: true,
      },
    ],
  },
];

export default async function ContactPage() {
  const profile = await getProfile();

  const email = profile.email ?? contactDefaults.email;
  const location = profile.location ?? contactDefaults.location;

  const directLinks: ContactLink[] = [
    {
      label: email,
      url: `mailto:${email}`,
      icon: "@",
    },
    {
      label: phone,
      url: `tel:${phone}`,
      icon: "☎",
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
                  <a className={styles.contactButton} href={link.url}>
                    <span className={styles.contactIcon} aria-hidden="true">
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {contactGroups.map((group) => (
            <div className={styles.infoGroup} key={group.title}>
              <span className={styles.label}>{group.title}</span>

              <ul className={styles.links}>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      className={styles.contactButton}
                      href={link.url}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                    >
                      <span className={styles.contactIcon} aria-hidden="true">
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}