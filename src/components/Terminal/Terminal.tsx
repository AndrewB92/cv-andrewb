import type { ReactNode } from "react";
import styles from "./Terminal.module.css";

type TerminalProps = {
  /** Value for data-content shown in the title bar */
  path?: string;
  /** Terminal body */
  children: ReactNode;
  /** Optional extra class for layout overrides */
  className?: string;
};

export function Terminal({ path = "~/macos/single-div/terminal", children, className }: TerminalProps) {
  return (
    <div
      className={[styles.terminal, className].filter(Boolean).join(" ")}
      data-content={path}
    >
      {children}
    </div>
  );
}