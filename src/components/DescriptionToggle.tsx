"use client";

import { useState } from "react";

type DescriptionToggleProps = {
  className?: string; // wrapper extra classes (optional)
  buttonClassName?: string; // optional
  labelOpen?: string;
  labelClose?: string;
  children: React.ReactNode;
};

export function DescriptionToggle({
  className = "",
  buttonClassName = "",
  labelOpen = "Open Description",
  labelClose = "Close Description",
  children,
}: DescriptionToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className + (isOpen ? " open" : "")}>
      <a
        href="#"
        className={buttonClassName || "description-btn"}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen((v) => !v);
        }}
        aria-expanded={isOpen}
      >
        {isOpen ? labelClose : labelOpen}
      </a>

      <div className="projectDescription">{children}</div>
    </div>
  );
}