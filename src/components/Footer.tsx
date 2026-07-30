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
            <Link className={styles.brand} href="/" aria-label="Go to homepage">
              <span className={styles.brandMark} aria-hidden="true">
                &lt;/&gt;
              </span>
              <span>{siteMetadata.siteName}</span>
            </Link>

            <h2 id="footer-heading" className={styles.heading}>
              Let&apos;s build something useful.
            </h2>

            <p className={styles.description}>
              Frontend-focused web development with an emphasis on performance,
              accessibility, maintainability, and polished interaction.
            </p>

            <Link className={styles.contactCta} href="/contact">
              Start a conversation
              <span aria-hidden="true">↗</span>
            </Link>
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