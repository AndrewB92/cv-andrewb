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

const HOVER_OFFSET = 6;
const EXIT_OFFSET = 40;
const ACTIVE_CLASS = styles.isActive;

export function SkillsHoverList({ skills }: SkillsHoverListProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const root = rootRef.current;

        if (!root) return;

        return initSkillsHover(root);
    }, []);

    return (
        <div ref={rootRef}>
            <span className={styles.skillsHoverBg} aria-hidden="true" />

            {skills.map((group) => (
                <article key={group.title}>
                    <h3>{group.title}</h3>

                    <ul className={styles.skillsList}>
                        {group.items.map((skill) => (
                            <li key={skill} className={styles.skillPill}>
                                {skill}
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </div>
    );
}

function initSkillsHover(root: HTMLDivElement): () => void {
    const hoverBg = root.querySelector<HTMLElement>(`.${styles.skillsHoverBg}`);

    if (!hoverBg) {
        return () => { };
    }

    let rootRect: DOMRect | null = null;
    let activeSkill: HTMLElement | null = null;
    let frameId = 0;

    const getRootRect = (): DOMRect => {
        rootRect ??= root.getBoundingClientRect();
        return rootRect;
    };

    const resetRootRect = (): void => {
        rootRect = null;
    };

    const setHoverBg = (
        x: number,
        y: number,
        width: number,
        height: number,
        scale = 1
    ): void => {
        cancelAnimationFrame(frameId);

        frameId = requestAnimationFrame(() => {
            hoverBg.style.width = `${width}px`;
            hoverBg.style.height = `${height}px`;
            hoverBg.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        });
    };

    const moveTo = (skill: HTMLElement): void => {
        if (skill === activeSkill) return;

        activeSkill = skill;

        const rootBox = getRootRect();
        const skillBox = skill.getBoundingClientRect();

        const x = skillBox.left - rootBox.left - HOVER_OFFSET;
        const y = skillBox.top - rootBox.top - HOVER_OFFSET;
        const width = skillBox.width + HOVER_OFFSET * 2;
        const height = skillBox.height + HOVER_OFFSET * 2;

        setHoverBg(x, y, width, height);
        root.classList.add(ACTIVE_CLASS);
    };

    const moveOut = (event: PointerEvent): void => {
        const rootBox = getRootRect();

        const width = hoverBg.offsetWidth;
        const height = hoverBg.offsetHeight;

        let x = -width - EXIT_OFFSET;
        let y = rootBox.height / 2 - height / 2;

        if (event.clientX > rootBox.right) {
            x = rootBox.width + EXIT_OFFSET;
        } else if (event.clientY < rootBox.top) {
            x = rootBox.width / 2 - width / 2;
            y = -height - EXIT_OFFSET;
        } else if (event.clientY > rootBox.bottom) {
            x = rootBox.width / 2 - width / 2;
            y = rootBox.height + EXIT_OFFSET;
        }

        setHoverBg(x, y, width, height, 0.96);

        activeSkill = null;
        root.classList.remove(ACTIVE_CLASS);
        resetRootRect();
    };

    const handlePointerOver = (event: PointerEvent): void => {
        const target = event.target;

        if (!(target instanceof HTMLElement)) return;

        const skill = target.closest<HTMLElement>(`.${styles.skillPill}`);

        if (!skill || !root.contains(skill)) return;

        moveTo(skill);
    };

    const handleResize = (): void => {
        resetRootRect();
        activeSkill = null;
        root.classList.remove(ACTIVE_CLASS);
    };

    root.addEventListener("pointerover", handlePointerOver);
    root.addEventListener("pointerleave", moveOut);
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
        cancelAnimationFrame(frameId);

        root.removeEventListener("pointerover", handlePointerOver);
        root.removeEventListener("pointerleave", moveOut);
        window.removeEventListener("resize", handleResize);
    };
}