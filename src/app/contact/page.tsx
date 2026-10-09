import {
  FaCalendarAlt,
  FaCodepen,
  FaGithub,
  FaLinkedinIn,
  FaTelegramPlane,
  FaWhatsapp,
} from "react-icons/fa";
import {
  HiArrowUpRight,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineMapPin,
} from "react-icons/hi2";
import { SiGravatar } from "react-icons/si";

import { PixelPortrait } from "@/components/contact/PixelPortrait";
import { analyticsAttributes, type AnalyticsAttributes } from "@/lib/analytics/events";
import { identity } from "@/config/site";
import { pageMetadata } from "@/config/metadata";
import styles from "./contact.module.css";
import { RainbowGlowLink } from "@/components/RainbowGlowLink/RainbowGlowLink";

export const metadata = pageMetadata("/contact", "Contact");

const PORTRAIT_URL =
  "https://res.cloudinary.com/dnefeqtp4/image/upload/v1785161524/avatar-3_hyb5me.webp";

type ContactLink = {
  label: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  external?: boolean;
  featured?: boolean;
  analytics: AnalyticsAttributes;
};

type ContactGroup = {
  title: string;
  description: string;
  links: ContactLink[];
};

/** Renders a contact link, opening links marked external in a new tab. */
function ContactLinkCard({ link }: { link: ContactLink }) {
  return (
    <a
      className={[
        styles.contactLink,
        link.featured ? styles.contactLinkFeatured : "",
      ]
        .filter(Boolean)
        .join(" ")}
      href={link.url}
      {...link.analytics}
      target={link.external ? "_blank" : undefined}
      rel={link.external ? "noopener noreferrer" : undefined}
    >
      <span className={styles.contactIcon} aria-hidden="true">
        {link.icon}
      </span>

      <span className={styles.contactLinkText}>
        <strong>{link.label}</strong>
        <small>{link.description}</small>
      </span>

      <HiArrowUpRight className={styles.contactArrow} aria-hidden="true" />
    </a>
  );
}

/** Renders contact channels and an interactive portrait using the configured identity. */
export default function ContactPage() {
  const { email, location } = identity;

  const groups: ContactGroup[] = [
    {
      title: "Contact",
      description: "ways to discuss a project or arrange a call:",
      links: [
        {
          label: "Email",
          analytics: analyticsAttributes("contact_click", { channel: "email", source: "contact_grid" }),
          description: email,
          url: `mailto:${email}`,
          icon: <HiOutlineEnvelope />,
          featured: true,
        },
        {
          label: "Schedule a call",
          analytics: analyticsAttributes("schedule_click", { source: "contact_grid", meeting_type: "general" }),
          description: "on Cal.com",
          url: identity.scheduling.cal,
          icon: <FaCalendarAlt />,
          featured: true,
        },
      ],
    },
    {
      title: "Messengers",
      description: "fastest direct communication:",
      links: [
        {
          label: "Telegram",
          analytics: analyticsAttributes("contact_click", { channel: "telegram", source: "contact_grid" }),
          description: "",
          url: identity.socials.telegram,
          icon: <FaTelegramPlane />,
          external: true,
        },
        {
          label: "WhatsApp",
          analytics: analyticsAttributes("contact_click", { channel: "whatsapp", source: "contact_grid" }),
          description: "",
          url: identity.socials.whatsapp,
          icon: <FaWhatsapp />,
          external: true,
        },
      ],
    },
    {
      title: "Profiles",
      description: "more info about me and my work:",
      links: [
        {
          label: "GitHub",
          analytics: analyticsAttributes("profile_click", { platform: "github", source: "contact_grid" }),
          description: "Repositories and work",
          url: identity.socials.github,
          icon: <FaGithub />,
          external: true,
        },
        {
          label: "LinkedIn",
          analytics: analyticsAttributes("profile_click", { platform: "linkedin", source: "contact_grid" }),
          description: "Background and experience",
          url: identity.socials.linkedin,
          icon: <FaLinkedinIn />,
          external: true,
        },
        {
          label: "CodePen",
          analytics: analyticsAttributes("profile_click", { platform: "codepen", source: "contact_grid" }),
          description: "Concepts & experiments",
          url: identity.socials.codepen,
          icon: <FaCodepen />,
          external: true,
        },
        {
          label: "Gravatar",
          analytics: analyticsAttributes("profile_click", { platform: "gravatar", source: "contact_grid" }),
          description: "Public profile",
          url: identity.socials.gravatar,
          icon: <SiGravatar />,
          external: true,
        },
      ],
    },
  ];

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} glow-border`} aria-labelledby="contact-title">
        <div className={styles.heroContent}>
          {/* <p className={styles.eyebrow}>Contact</p> */}

          <h1 id="contact-title">Ready to talk</h1>

          <p className={styles.intro}>
            I work with founders, agencies, and product teams on dependable,
            high-performance web experiences. Send the project context by email
            or reserve a time for a focused conversation.
          </p>

          <div className={styles.primaryActions}>
            <RainbowGlowLink
              href={`mailto:${email}`}
              {...analyticsAttributes("contact_click", { channel: "email", source: "contact_hero" })}
              blob
              variant="flat"
              className={styles.flatButton}
              iconPosition="end"
              iconName="mail"
              iconDirection="right"
            >
              Email me
            </RainbowGlowLink>

            <RainbowGlowLink
              href={identity.socials.telegram}
              {...analyticsAttributes("contact_click", { channel: "telegram", source: "contact_hero" })}
              blob
              variant="glow"
              className={styles.flatButton}
              iconPosition="end"
              iconName="telegram"
              iconDirection="right"
            >
              Write me
            </RainbowGlowLink>
          </div>

          <dl className={styles.meta}>
            <div>
              <dt>
                <HiOutlineMapPin aria-hidden="true" />
                Location
              </dt>
              <dd>{location}</dd>
            </div>

            <div>
              <dt>
                <HiOutlineClock aria-hidden="true" />
                Response
              </dt>
              <dd>Usually within one business day</dd>
            </div>
          </dl>
        </div>

        <div className={styles.portraitColumn}>
          <PixelPortrait
            src={PORTRAIT_URL}
            alt={identity.name}
            blockSize={60}
            faceMask={{
              centerX: 0.5,
              centerY: 0.305,
              radiusX: 0.35,
              radiusY: 0.55,
              rotation: 0,
            }}
            revealDurationMs={2100}
            pixelateDurationMs={1650}
          />

          <div className={styles.availability}>
            <span aria-hidden="true" />
            Available for selected projects
          </div>
        </div>
      </section>

      <section
        className={`${styles.connections} glow-border`}
        aria-labelledby="ways-to-connect"
      >
        <header className={styles.sectionHeader}>
          {/* <p className={styles.eyebrow}>Ways to connect</p> */}
          <h2 id="ways-to-connect">Choose the channel that fits</h2>
          <p>
            Email is best for detailed project enquiries. Messenger and profile
            links are available for everything else.
          </p>
        </header>

        <div className={styles.groups}>
          {groups.map((group) => (
            <article className={styles.group} key={group.title}>
              <header className={styles.groupHeader}>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </header>

              <div className={styles.links}>
                {group.links.map((link) => (
                  <ContactLinkCard
                    key={`${group.title}-${link.label}`}
                    link={link}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
