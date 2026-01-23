"use client";

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
    <span
      className={`${styles.wrapper} ${className}`}
      onPointerMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();

        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;

        el.style.setProperty("--px", `${Math.max(0, Math.min(100, x))}%`);
        el.style.setProperty("--py", `${Math.max(0, Math.min(100, y))}%`);
      }}
      onPointerLeave={(e) => {
        const el = e.currentTarget;
        el.style.setProperty("--px", "50%");
        el.style.setProperty("--py", "50%");
      }}
    >
      <Link href={href} className={styles.link}>
        {children}
      </Link>

      <span className={styles.bg} aria-hidden="true" />
      <span className={styles.glow} aria-hidden="true" />
    </span>
  );
}