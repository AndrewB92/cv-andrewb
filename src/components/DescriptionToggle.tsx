"use client";

type DescriptionToggleProps = {
  open: boolean;
  onToggle: () => void;
  labelOpen?: string;
  labelClose?: string;
  children: React.ReactNode;
  descriptionClassName: string; // pass styles.projectDescription
};

export function DescriptionToggle({
  open,
  onToggle,
  labelOpen = "Open Description",
  labelClose = "Close Description",
  children,
  descriptionClassName,
}: DescriptionToggleProps) {
  return (
    <>
      <a
        href="#"
        className="description-btn"
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        aria-expanded={open}
      >
        {open ? labelClose : labelOpen}
      </a>

      <div className={descriptionClassName}>
        {children}
      </div>
    </>
  );
}