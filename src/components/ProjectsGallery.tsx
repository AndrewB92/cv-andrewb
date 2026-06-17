'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ProjectsGallery.module.css";
import type { Project } from "@/data/profile";

type StackCount = {
  name: string;
  count: number;
};

type ProjectsResponse = {
  projects: Project[];
  totalPages: number;
  totalItems: number;
  stackCounts: StackCount[];
};

type ProjectsGalleryProps = {
  filters: string[];
  initialData: ProjectsResponse;
};

const TOP_TAGS_LIMIT = 5;

export function ProjectsGallery({ filters, initialData }: ProjectsGalleryProps) {
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? "All");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProjectsResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isFirstLoad = useRef(true);

  const stackCountMap = useMemo(() => {
    return new Map(data.stackCounts.map((item) => [item.name, item.count]));
  }, [data.stackCounts]);

  const topTags = useMemo(() => {
    const totalTagUsage = data.stackCounts.reduce((sum, item) => sum + item.count, 0);

    return [...data.stackCounts]
      .filter((item) => item.name !== "All")
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_TAGS_LIMIT)
      .map((item) => ({
        ...item,
        percentage: totalTagUsage > 0 ? Math.round((item.count / totalTagUsage) * 100) : 0,
      }));
  }, [data.stackCounts]);

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
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      controller.abort();
    };
  }, [activeFilter, page]);

  const handleFilterChange = (filter: string) => {
    if (filter === activeFilter) return;

    setActiveFilter(filter);
    setPage(1);
  };

  return (
    <section className={styles.panel} aria-live="polite">
      <div className={styles.summary}>
        <p>
          Total projects: <strong>{data.totalItems}</strong>
        </p>

        <p>
          Most used tags:
        </p>
        {topTags.length > 0 && (
          <div className={styles.topTags} aria-label="Most used tags">
            {topTags.map((tag) => (
              <span key={tag.name}>
                {tag.name} — {tag.percentage}%
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.filtersToggle}
        aria-expanded={filtersOpen}
        aria-controls="project-filters"
        onClick={() => setFiltersOpen((prev) => !prev)}
      >
        Filter by tags
        <span>{filtersOpen ? "−" : "+"}</span>
      </button>

      {filtersOpen && (
        <ul
          id="project-filters"
          className={styles.filters}
          aria-label="Filter projects by stack"
        >
          {filters.map((filter) => {
            const count =
              filter === "All" ? data.totalItems : stackCountMap.get(filter) ?? 0;

            return (
              <li key={filter}>
                <button
                  type="button"
                  className={styles.filterButton}
                  aria-pressed={activeFilter === filter}
                  onClick={() => handleFilterChange(filter)}
                  disabled={loading}
                >
                  {filter}
                  <span>{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.projectsStage} aria-busy={loading}>
        {error ? (
          <div className={styles.emptyState}>{error}</div>
        ) : data.projects.length === 0 ? (
          <div className={styles.emptyState}>No projects match that filter yet.</div>
        ) : (
          <div className={`${styles.projectsGrid} ${loading ? styles.projectsGridLoading : ""}`}>
            {data.projects.map((project) => (
              <article key={project.name} className={styles.project}>
                <div className={styles.wrapper}>
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>

                  <div className={styles.stack}>
                    {project.stack.map((item) => (
                      <span key={`${project.name}-${item}`}>{item}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.projectLinks}>
                  <a href={project.link} target="_blank" rel="noreferrer">
                    Visit site →
                  </a>

                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer">
                      Check GitHub →
                    </a>
                  )}

                  {project.codepen && (
                    <a href={project.codepen} target="_blank" rel="noreferrer">
                      View CodePen →
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {loading && (
          <div className={styles.loaderOverlay} role="status" aria-label="Loading projects">
            <span className={styles.spinner} />
          </div>
        )}
      </div>

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