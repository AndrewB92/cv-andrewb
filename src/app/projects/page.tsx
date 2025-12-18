import styles from "./projects.module.css";
import { getProjects } from "@/data/profile";
import { ProjectsGallery } from "@/components/ProjectsGallery";
import { PROJECTS_PAGE_SIZE } from "@/config/ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();
  const uniqueStacks = Array.from(
    new Set(projects.flatMap((project) => project.stack)),
  ).sort((a, b) => a.localeCompare(b));

  const initialProjects = projects.slice(0, PROJECTS_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(projects.length / PROJECTS_PAGE_SIZE));

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <h1>Project archive</h1>
        <p>
          Case studies and marketing sites built for founders, agencies, and product teams.
          Filter by focus area and browse six at a time.
        </p>
      </header>

      <ProjectsGallery
        filters={["All", ...uniqueStacks]}
        initialData={{
          projects: initialProjects,
          totalPages,
          totalItems: projects.length,
        }}
      />
    </main>
  );
}
