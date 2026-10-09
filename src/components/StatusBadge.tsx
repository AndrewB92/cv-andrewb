"use client";

import type { CSSProperties } from "react";

import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
  text: string;
  color?: string;          // base color (e.g. "#2ecc71")
  ping?: boolean;          // enable / disable ping animation
};

/** Announces status text with a CSS-colored indicator and an optional ping animation. */
export function StatusBadge({
  text,
  color = "var(--color-success)",
  ping = true,
}: StatusBadgeProps) {
  return (
    <div
      className={styles.badge}
      style={{ "--status-color": color } as CSSProperties}
      role="status"
      aria-live="polite"
    >
      <span className={styles.indicator}>
        <span className={styles.dotWrap} aria-hidden="true">
          {ping && <span className={styles.ping} />}
          <span className={styles.dot} />
        </span>
        <span className={styles.text}>{text}</span>
      </span>
    </div>
  );
}