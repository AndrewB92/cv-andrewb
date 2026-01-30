"use client";

import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
  text: string;
  color?: string;          // base color (e.g. "#2ecc71")
  ping?: boolean;          // enable / disable ping animation
};

export function StatusBadge({
  text,
  color = "#2ecc71",
  ping = true,
}: StatusBadgeProps) {
  return (
    <div
      className={styles.badge}
      style={{ ["--status-color" as any]: color }}
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