"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/page.module.css";

type SkillGroup = {
    title: string;
    items: string[];
};

type SkillsHoverListProps = {
    skills: SkillGroup[];
};

export function SkillsHoverList({ skills }: SkillsHoverListProps) {
    const wrappersRef = useRef<Array<HTMLUListElement | null>>([]);

    useEffect(() => {
        const cleanups: Array<() => void> = [];

        wrappersRef.current.forEach((wrapper) => {
            if (!wrapper) return;

            const hoverBg = wrapper.querySelector<HTMLElement>(
                `.${styles.skillsHoverBg}`
            );

            const skillItems = wrapper.querySelectorAll<HTMLElement>(
                `.${styles.skillPill}`
            );

            if (!hoverBg || !skillItems.length) return;

            const offset = 6;
            let wrapperRect: DOMRect | null = null;

            const getWrapperRect = () => {
                wrapperRect ||= wrapper.getBoundingClientRect();
                return wrapperRect;
            };

            const resetWrapperRect = () => {
                wrapperRect = null;
            };

            const moveTo = (target: HTMLElement) => {
                const wrapperBox = getWrapperRect();
                const targetBox = target.getBoundingClientRect();

                const x = targetBox.left - wrapperBox.left - offset;
                const y = targetBox.top - wrapperBox.top - offset;
                const width = targetBox.width + offset * 2;
                const height = targetBox.height + offset * 2;

                hoverBg.style.width = `${width}px`;
                hoverBg.style.height = `${height}px`;
                hoverBg.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;

                wrapper.classList.add(styles.isActive);
            };

            const moveOut = (event: PointerEvent) => {
                const wrapperBox = getWrapperRect();

                const width = hoverBg.offsetWidth;
                const height = hoverBg.offsetHeight;

                let x = -width - 40;
                let y = wrapperBox.height / 2 - height / 2;

                if (event.clientX > wrapperBox.right) {
                    x = wrapperBox.width + 40;
                } else if (event.clientY < wrapperBox.top) {
                    x = wrapperBox.width / 2 - width / 2;
                    y = -height - 40;
                } else if (event.clientY > wrapperBox.bottom) {
                    x = wrapperBox.width / 2 - width / 2;
                    y = wrapperBox.height + 40;
                }

                hoverBg.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.96)`;
                wrapper.classList.remove(styles.isActive);
                resetWrapperRect();
            };

            const onPointerEnterWrapper = () => getWrapperRect();
            const onResize = () => resetWrapperRect();

            wrapper.addEventListener("pointerenter", onPointerEnterWrapper);
            wrapper.addEventListener("pointerleave", moveOut);
            window.addEventListener("resize", onResize, { passive: true });

            skillItems.forEach((skill) => {
                const onPointerEnterSkill = () => moveTo(skill);
                skill.addEventListener("pointerenter", onPointerEnterSkill);

                cleanups.push(() => {
                    skill.removeEventListener("pointerenter", onPointerEnterSkill);
                });
            });

            cleanups.push(() => {
                wrapper.removeEventListener("pointerenter", onPointerEnterWrapper);
                wrapper.removeEventListener("pointerleave", moveOut);
                window.removeEventListener("resize", onResize);
            });
        });

        return () => {
            cleanups.forEach((cleanup) => cleanup());
        };
    }, [skills]);

    return (
        <>
            {skills.map((group, index) => (
                <article key={group.title}>
                    <h3>{group.title}</h3>

                    <ul
                        ref={(node) => {
                            wrappersRef.current[index] = node;
                        }}
                        className={styles.skillsList}
                    >
                        <li className={styles.skillsHoverBg} aria-hidden="true" />

                        {group.items.map((skill) => (
                            <li key={skill} className={styles.skillPill}>
                                {skill}
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </>
    );
}