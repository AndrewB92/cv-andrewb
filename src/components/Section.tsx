import { ReactNode } from "react";

type SectionProps = {
  id: string;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
};

export function Section({
  id,
  title,
  eyebrow,
  description,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border border-zinc-200/60 bg-white/80 p-6 shadow-sm shadow-zinc-100/60 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:shadow-none sm:rounded-2xl"
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
