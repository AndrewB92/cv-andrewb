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
  HiOutlinePhone,
} from "react-icons/hi2";
import { SiGravatar } from "react-icons/si";

import { PixelPortrait } from "@/components/contact/PixelPortrait";
import { getProfile } from "@/data/profile";
import { contactDefaults } from "@/config/site";
import styles from "./contact.module.css";
import { RainbowGlowLink } from "@/components/RainbowGlowLink/RainbowGlowLink";

export const dynamic = "force-dynamic";

const PHONE = "+380681025393";
const PORTRAIT_URL =
  "https://res.cloudinary.com/dnefeqtp4/image/upload/v1785161524/avatar-3_hyb5me.webp";

type ContactLink = {
  label: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  external?: boolean;
  featured?: boolean;
};

type ContactGroup = {
  title: string;
  description: string;
  links: ContactLink[];
};

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
      target={link.external ? "_blank" : undefined}
      rel={link.external ? "noreferrer" : undefined}
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

export default async function ContactPage() {
  const profile = await getProfile();

  const email = profile.email ?? contactDefaults.email;
  const location = profile.location ?? contactDefaults.location;

  const groups: ContactGroup[] = [
    {
      title: "Contact",
      description: "ways to discuss a project or arrange a call:",
      links: [
        {
          label: "Email",
          description: email,
          url: `mailto:${email}`,
          icon: <HiOutlineEnvelope />,
          featured: true,
        },
        // {
        //   label: "Phone",
        //   description: PHONE,
        //   url: `tel:${PHONE}`,
        //   icon: <HiOutlinePhone />,
        // },
        {
          label: "Schedule a call",
          description: "on Cal.com",
          url: "https://cal.com/andrew-bielous",
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
          description: "",
          url: "https://t.me/pm4life",
          icon: <FaTelegramPlane />,
          external: true,
        },
        {
          label: "WhatsApp",
          description: "",
          url: "https://wa.me/380681025393",
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
          description: "Repositories and work",
          url: "https://github.com/AndrewB92",
          icon: <FaGithub />,
          external: true,
        },
        {
          label: "LinkedIn",
          description: "Background and experience",
          url: "https://linkedin.com/in/bielousandrew",
          icon: <FaLinkedinIn />,
          external: true,
        },
        {
          label: "CodePen",
          description: "Concepts & experiments",
          url: "https://codepen.io/bielous-andrew",
          icon: <FaCodepen />,
          external: true,
        },
        {
          label: "Gravatar",
          description: "Public profile",
          url: "https://gravatar.com/babujioh",
          icon: <SiGravatar />,
          external: true,
        },
      ],
    },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="contact-title">
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
              href="mailto:${email}"
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
              href="https://t.me/pm4life"
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
            alt="Andrew Bielous"
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
        className={styles.connections}
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
    </main>
  );
}