"use client";

import { useRef } from "react";
import styles from "@/app/page.module.css";

type SkillGroup = {
    title: string;
    items: string[];
};

type SkillsHoverListProps = {
    skills: SkillGroup[];
};

export function SkillsHoverList({ skills }: SkillsHoverListProps) {
    const activeRefs = useRef<Record<string, HTMLElement | null>>({});

    return (
        <>
            {skills.map((group) => (
                <article key={group.title}>
                    <h3>{group.title}</h3>

                    <ul className={styles.skillsList}>
                        {group.items.map((skill) => (
                            <li
                                key={skill}
                                ref={(node) => {
                                    activeRefs.current[skill] = node;
                                }}
                                className={styles.skillPill}
                            >
                                <span className={styles.skillPillBg} aria-hidden="true" />
                                <span className={styles.skillPillText}>{skill}</span>
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </>
    );
}