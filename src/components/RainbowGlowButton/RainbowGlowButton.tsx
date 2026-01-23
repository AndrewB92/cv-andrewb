import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./RainbowGlowButton.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export function RainbowGlowButton({
  children,
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <span className={`${styles.wrapper} ${className}`}>
      <button type={type} className={styles.button} {...rest}>
        {children}
      </button>
      <span className={styles.bg} aria-hidden="true" />
    </span>
  );
}
