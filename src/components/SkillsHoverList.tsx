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

export function SkillsHoverList({ skills }: SkillsHoverListProps) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!wrapperRef.current) return;

        return initSkillsHover(wrapperRef.current);
    }, []);

    return (
        <div ref={wrapperRef} className={styles.skillsHoverArea}>
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

function initSkillsHover(wrapper: HTMLDivElement): () => void {
    const hoverBg = wrapper.querySelector<HTMLElement>(
        `.${styles.skillsHoverBg}`
    );

    if (!hoverBg) return () => { };

    let wrapperRect: DOMRect | null = null;
    let activeSkill: HTMLElement | null = null;

    const getWrapperRect = (): DOMRect => {
        wrapperRect ??= wrapper.getBoundingClientRect();
        return wrapperRect;
    };

    const resetWrapperRect = (): void => {
        wrapperRect = null;
    };

    const moveTo = (target: HTMLElement): void => {
        if (target === activeSkill) return;

        activeSkill = target;

        const wrapperBox = getWrapperRect();
        const targetBox = target.getBoundingClientRect();

        const x = targetBox.left - wrapperBox.left - HOVER_OFFSET;
        const y = targetBox.top - wrapperBox.top - HOVER_OFFSET;
        const width = targetBox.width + HOVER_OFFSET * 2;
        const height = targetBox.height + HOVER_OFFSET * 2;

        hoverBg.style.width = `${width}px`;
        hoverBg.style.height = `${height}px`;
        hoverBg.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;

        wrapper.classList.add(styles.isActive);
    };

    const moveOut = (event: PointerEvent): void => {
        const wrapperBox = getWrapperRect();

        const width = hoverBg.offsetWidth;
        const height = hoverBg.offsetHeight;

        let x = -width - EXIT_OFFSET;
        let y = wrapperBox.height / 2 - height / 2;

        if (event.clientX > wrapperBox.right) {
            x = wrapperBox.width + EXIT_OFFSET;
        } else if (event.clientY < wrapperBox.top) {
            x = wrapperBox.width / 2 - width / 2;
            y = -height - EXIT_OFFSET;
        } else if (event.clientY > wrapperBox.bottom) {
            x = wrapperBox.width / 2 - width / 2;
            y = wrapperBox.height + EXIT_OFFSET;
        }

        hoverBg.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.96)`;

        activeSkill = null;
        wrapper.classList.remove(styles.isActive);
        resetWrapperRect();
    };

    const handlePointerOver = (event: PointerEvent): void => {
        const target = event.target;

        if (!(target instanceof HTMLElement)) return;

        const skill = target.closest<HTMLElement>(`.${styles.skillPill}`);

        if (!skill || !wrapper.contains(skill)) return;

        moveTo(skill);
    };

    wrapper.addEventListener("pointerover", handlePointerOver);
    wrapper.addEventListener("pointerenter", getWrapperRect);
    wrapper.addEventListener("pointerleave", moveOut);
    window.addEventListener("resize", resetWrapperRect, { passive: true });

    return () => {
        wrapper.removeEventListener("pointerover", handlePointerOver);
        wrapper.removeEventListener("pointerenter", getWrapperRect);
        wrapper.removeEventListener("pointerleave", moveOut);
        window.removeEventListener("resize", resetWrapperRect);
    };
}