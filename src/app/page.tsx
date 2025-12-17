import Link from "next/link";
import { Section } from "@/components/Section";
import { getPortfolioContent } from "@/data/profile";

export default async function Home() {
  const { profile, skills, experiences, projects } =
    await getPortfolioContent();

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_50%),linear-gradient(180deg,_#f1f5f9_0%,_#ffffff_40%)] px-4 py-14 text-zinc-900 dark:bg-black dark:text-white sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 p-8 shadow-xl shadow-blue-100/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.4em] text-blue-500">
                Portfolio
              </p>
              <h1 className="text-4xl font-bold sm:text-5xl">
                {profile.name}
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-300">
                {profile.title}
              </p>
              <p className="max-w-3xl text-base text-zinc-600 dark:text-zinc-300">
                {profile.summary}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300">
              <p>{profile.location}</p>
              <p>
                Available for contract & fractional roles focused on product
                velocity.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`mailto:${profile.email}`}
                  className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
                >
                  Say hello
                </Link>
                <Link
                  href={profile.resumeUrl}
                  target="_blank"
                  className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-white dark:hover:border-white"
                >
                  Download resume
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500 dark:text-zinc-400">
            <p>
              Email{" "}
              <Link
                href={`mailto:${profile.email}`}
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                {profile.email}
              </Link>
            </p>
            {profile.socials.map((social) => (
              <Link
                key={social.label}
                href={social.url}
                target="_blank"
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                {social.label}
              </Link>
            ))}
          </div>
        </header>

        <nav className="sticky top-4 z-10 flex flex-wrap gap-3 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-medium shadow-md shadow-blue-100/50 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          {[
            { href: "#about", label: "About" },
            { href: "#skills", label: "Skills" },
            { href: "#experience", label: "Experience" },
            { href: "#projects", label: "Work" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <main className="grid gap-6 pb-16">
          <Section
            id="about"
            eyebrow="Overview"
            title="About Andrew"
            description="A concise snapshot of how I approach work and collaboration."
          >
            <div className="space-y-4 text-base text-zinc-600 dark:text-zinc-300">
              <p>
                My sweet spot is shipping product experiments fast, then hardening
                them into reliable experiences. I lean on modern tooling—Next.js,
                Firebase, and Vercel—to stay focused on customer value instead of
                infrastructure.
              </p>
              <p>
                I collaborate best with founders and small product teams who need
                momentum without compromising craft. I obsess over accessible
                interfaces, maintainable design systems, and observability that
                gives us confidence during launches.
              </p>
            </div>
          </Section>

          <Section
            id="skills"
            eyebrow="Toolkit"
            title="Skills & focus areas"
            description="The platforms and practices I rely on to deliver product increments quickly."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {skills.map((group) => (
                <div
                  key={group.title}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <p className="text-sm font-semibold text-zinc-500">
                    {group.title}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="experience"
            eyebrow="Journey"
            title="Recent experience"
            description="Highlights that show how I work across engineering, design, and product."
          >
            <ul className="space-y-4">
              {experiences.map((experience) => (
                <li
                  key={`${experience.company}-${experience.role}`}
                  className="rounded-2xl border border-zinc-100 bg-gradient-to-br from-white to-zinc-50/60 p-5 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/20"
                >
                  <div className="flex flex-wrap items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                    <p className="font-semibold text-zinc-800 dark:text-white">
                      {experience.company}
                    </p>
                    <p>
                      {experience.start} — {experience.end}
                    </p>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                    {experience.role}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {experience.achievements.map((achievement) => (
                      <li key={achievement} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            id="projects"
            eyebrow="Portfolio"
            title="Projects & experiments"
            description="Selected work that shows how I approach UX polish, performance, and reliability."
          >
            <div className="grid gap-5 md:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.name}
                  className="flex h-full flex-col rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-200/60 transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {project.name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {project.description}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.stack.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={project.link}
                    target="_blank"
                    className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View case study →
                  </Link>
                </article>
              ))}
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
