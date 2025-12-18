import { ElementType, ReactNode } from "react";
import styles from "./Section.module.css";

type SectionProps = {
  id?: string;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  as?: ElementType;
};

export function Section({
  id,
  title,
  eyebrow,
  description,
  children,
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag id={id} className={styles.section}>
      <div className={styles.header}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 className={styles.title}>{title}</h2>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </div>
      <div className={styles.body}>{children}</div>
    </Tag>
  );
}
