import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./RainbowGlowLink.module.css";

type RainbowGlowLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function RainbowGlowLink({
  href,
  children,
  className = "",
}: RainbowGlowLinkProps) {
  return (
    <span className={`${styles.wrapper} ${className}`}>
      <Link href={href} className={styles.link}>
        {children}
      </Link>
      <span className={styles.glow} aria-hidden="true" />
    </span>
  );
}