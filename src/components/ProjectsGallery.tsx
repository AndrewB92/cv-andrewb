'use client';

import { useEffect, useRef, useState } from "react";
import styles from "./ProjectsGallery.module.css";
import type { Project } from "@/data/profile";

type ProjectsResponse = {
  projects: Project[];
  totalPages: number;
  totalItems: number;
};

type ProjectsGalleryProps = {
  filters: string[];
  initialData: ProjectsResponse;
};

export function ProjectsGallery({ filters, initialData }: ProjectsGalleryProps) {
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? "All");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProjectsResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    const controller = new AbortController();
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set("page", String(page));
        if (activeFilter !== "All") {
          params.set("stack", activeFilter);
        }

        const response = await fetch(`/api/projects?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load projects");
        }
        const payload = (await response.json()) as ProjectsResponse;
        setData(payload);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      controller.abort();
    };
  }, [activeFilter, page]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  return (
    <section className={styles.panel} aria-live="polite">
      <ul className={styles.filters} aria-label="Filter projects by stack">
        {filters.map((filter) => (
          <li key={filter}>
            <button
              type="button"
              className={styles.filterButton}
              aria-pressed={activeFilter === filter}
              onClick={() => handleFilterChange(filter)}
            >
              {filter}
            </button>
          </li>
        ))}
      </ul>

      {error ? (
        <div className={styles.emptyState}>{error}</div>
      ) : data.projects.length === 0 ? (
        <div className={styles.emptyState}>No projects match that filter yet.</div>
      ) : (
        <div className={styles.projectsGrid}>
          {data.projects.map((project) => (
            <article key={project.name} className={styles.project}>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className={styles.stack}>
                {project.stack.map((item) => (
                  <span key={`${project.name}-${item}`}>{item}</span>
                ))}
              </div>
              <a href={project.link} target="_blank" rel="noreferrer">
                Visit site →
              </a>
            </article>
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>
        <p className={styles.status}>
          Page {page} of {Math.max(1, data.totalPages)}
        </p>
        <button
          type="button"
          onClick={() =>
            setPage((prev) => (prev < data.totalPages ? prev + 1 : prev))
          }
          disabled={page >= data.totalPages || loading}
        >
          Next
        </button>
      </div>
    </section>
  );
}
