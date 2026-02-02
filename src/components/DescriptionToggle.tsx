"use client";

import { useCallback } from "react";

type DescriptionToggleProps = {
  targetClass: string;
  labelOpen?: string;
  labelClose?: string;
  children: React.ReactNode;
};

export function DescriptionToggle({
  targetClass,
  labelOpen = "Open Description",
  labelClose = "Close Description",
  children,
}: DescriptionToggleProps) {
  const handleToggle = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const target = 
    // document.querySelector<HTMLElement>(`.${targetClass}`);
    document.querySelector(`.${targetClass}`);
    if (!target) return;

    target.classList.toggle("open");

    const isOpen = target.classList.contains("open");
    e.currentTarget.textContent = isOpen ? labelClose : labelOpen;
  }, [targetClass, labelOpen, labelClose]);

  return (
    <>
      <a href="#" className="description-btn" onClick={handleToggle}>
        {labelOpen}
      </a>

      <div className={`projectDescription`}>
        {children}
      </div>
    </>
  );
}