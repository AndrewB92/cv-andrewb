'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";
import { primaryNavigation, siteMetadata } from "@/config/site";

function getActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {siteMetadata.siteName}
        </Link>
        <nav aria-label="Primary">
          <ul className={styles.navList}>
            {primaryNavigation.map((item) => (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  aria-current={getActivePath(pathname, item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/contact" className={styles.cta}>
          Let&apos;s talk →
        </Link>
      </div>
    </header>
  );
}
