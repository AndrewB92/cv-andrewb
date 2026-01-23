"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./RainbowGlowButton.module.css";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  children: ReactNode;
  className?: string;
};

export function RainbowGlowButton({
  children,
  className,
  type = "button",
  ...rest
}: Props) {
  const wrapperClass = className
    ? `${styles.wrapper} ${className}`
    : styles.wrapper;

  return (
    <span className={wrapperClass}>
      <button type={type} className={styles.button} {...rest}>
        {children}
      </button>
      <span className={styles.bg} aria-hidden="true" />
    </span>
  );
}