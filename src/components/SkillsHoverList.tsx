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
    const wrappersRef = useRef<Array<HTMLUListElement | null>>([]);

    useEffect(() => {
        const cleanups = wrappersRef.current
            .filter(Boolean)
            .map((wrapper) => initSkillsHover(wrapper));

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
                        <span className={styles.skillsHoverBg} aria-hidden="true" />

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

function initSkillsHover(wrapper: HTMLUListElement) {
    const hoverBg = wrapper.querySelector<HTMLElement>(
        `.${styles.skillsHoverBg}`
    );

    if (!hoverBg) {
        return () => { };
    }

    let wrapperRect: DOMRect | null = null;

    const getWrapperRect = () => {
        wrapperRect ??= wrapper.getBoundingClientRect();
        return wrapperRect;
    };

    const resetWrapperRect = () => {
        wrapperRect = null;
    };

    const moveTo = (target: HTMLElement) => {
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

    const moveOut = (event: PointerEvent) => {
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

        wrapper.classList.remove(styles.isActive);
        resetWrapperRect();
    };

    const handlePointerEnter = (event: PointerEvent) => {
        const target = event.target;

        if (!(target instanceof HTMLElement)) return;

        const skill = target.closest<HTMLElement>(`.${styles.skillPill}`);

        if (!skill || !wrapper.contains(skill)) return;

        moveTo(skill);
    };

    wrapper.addEventListener("pointerover", handlePointerEnter);
    wrapper.addEventListener("pointerenter", getWrapperRect);
    wrapper.addEventListener("pointerleave", moveOut);
    window.addEventListener("resize", resetWrapperRect, { passive: true });

    return () => {
        wrapper.removeEventListener("pointerover", handlePointerEnter);
        wrapper.removeEventListener("pointerenter", getWrapperRect);
        wrapper.removeEventListener("pointerleave", moveOut);
        window.removeEventListener("resize", resetWrapperRect);
    };
}