import Link from "next/link";
import styles from "./Footer.module.css";
import { footerNavigation, siteMetadata } from "@/config/site";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.credit}>
          © {new Date().getFullYear()} {siteMetadata.siteName}. Made with{" "}
          <span className={styles.heart} aria-hidden="true">
            ♥
          </span>
          by Andrew.
        </p>
        <nav aria-label="Footer" role="navigation">
          <ul className={styles.navigation}>
            {footerNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
