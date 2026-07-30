import Link from "next/link";

import {
  RainbowGlowLink,
  type RainbowGlowLinkIconName,
} from "@/components/RainbowGlowLink/RainbowGlowLink";
import {
  footerNavigation,
  siteMetadata,
  socialLinks,
} from "@/config/site";

import styles from "./Footer.module.css";

type FooterSocialLink = {
  label: string;
  description: string;
  href: string;
  icon: RainbowGlowLinkIconName;
  external: boolean;
};

export function Footer() {
  const currentYear = new Date().getFullYear();
  const footerSocialLinks = socialLinks satisfies readonly FooterSocialLink[];

  return (
    <footer className={styles.footer}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.main}>
          <section className={styles.intro} aria-labelledby="footer-heading">

            <p className={styles.description}>
              Frontend-focused web development with an emphasis on performance,
              accessibility, maintainability, and polished interaction.
            </p>
            <br />
            <RainbowGlowLink
              href="https://drive.google.com/file/d/1dJCK8rjvaY-1shKXnndvIjn9-5irKb6P/view?usp=drive_link"
              blob
              variant="flat"
              className={styles.flatButton}
              iconPosition="end"
              iconName="download"
              iconDirection="up"
            >
              Check my CV
            </RainbowGlowLink>
          </section>

          <section
            className={styles.linksSection}
            aria-label="Contact and professional profiles"
          >
            <p className={styles.sectionLabel}>Connect</p>

            <ul className={styles.socialGrid}>
              {footerSocialLinks.map((item) => (
                <li key={item.label}>
                  <RainbowGlowLink
                    href={item.href}
                    className={styles.socialLink}
                    variant="flat"
                    glow={false}
                    blob={false}
                    iconName={item.icon}
                    iconPosition="start"
                    target={item.external ? "_blank" : undefined}
                    rel={
                      item.external ? "noopener noreferrer" : undefined
                    }
                    aria-label={`${item.label}${
                      item.external ? " — opens in a new tab" : ""
                    }`}
                  >
                    <span className={styles.socialText}>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </RainbowGlowLink>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className={styles.bottom}>
          <nav aria-label="Footer navigation">
            <ul className={styles.navigation}>
              {footerNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={
                      item.external ? "noopener noreferrer" : undefined
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className={styles.credit}>
            <span>© {currentYear} Andrew Bielous.</span>

            <span className={styles.madeBy}>
              Made with
              <span className={styles.heartWrap} aria-label="love">
                <span className={styles.heart} aria-hidden="true">
                  ♥
                </span>
                <span className={styles.heartPulse} aria-hidden="true" />
              </span>
              by me
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}