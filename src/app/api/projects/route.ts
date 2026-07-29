import { NextResponse } from "next/server";
import { PROJECTS_PAGE_SIZE } from "@/config/ui";
import {
  getProjects,
  type Project,
  type ProjectCategory,
} from "@/data/profile";

type CategoryCount = {
  name: ProjectCategory;
  count: number;
};

const PROJECT_CATEGORIES: ReadonlySet<ProjectCategory> = new Set([
  "wordpress",
  "ecommerce",
  "frontend",
  "content-platform",
  "interactive",
  "corporate",
  "education",
  "other",
]);

const normalizeCategory = (
  value: string | null,
): ProjectCategory | undefined => {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return PROJECT_CATEGORIES.has(normalized as ProjectCategory)
    ? (normalized as ProjectCategory)
    : undefined;
};

const getCategoryCounts = (projects: Project[]): CategoryCount[] => {
  const counts = new Map<ProjectCategory, number>();

  for (const project of projects) {
    counts.set(
      project.category,
      (counts.get(project.category) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.name.localeCompare(b.name);
    });
};

const getSafePage = (
  value: string | null,
  totalPages: number,
): number => {
  const parsed = Number(value ?? "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(Math.floor(parsed), totalPages);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = normalizeCategory(
      searchParams.get("category"),
    );

    const projects = await getProjects();
    const categoryCounts = getCategoryCounts(projects);

    const filteredProjects = category
      ? projects.filter(
          (project) => project.category === category,
        )
      : projects;

    const totalItems = filteredProjects.length;
    const totalPages = Math.max(
      1,
      Math.ceil(totalItems / PROJECTS_PAGE_SIZE),
    );
    const currentPage = getSafePage(
      searchParams.get("page"),
      totalPages,
    );

    const start =
      (currentPage - 1) * PROJECTS_PAGE_SIZE;
    const pagedProjects = filteredProjects.slice(
      start,
      start + PROJECTS_PAGE_SIZE,
    );

    return NextResponse.json({
      projects: pagedProjects,
      totalPages,
      totalItems,
      currentPage,
      activeCategory: category ?? null,
      categoryCounts,
    });
  } catch (error) {
    console.error("Failed to load projects", error);

    return NextResponse.json(
      {
        projects: [],
        totalPages: 1,
        totalItems: 0,
        currentPage: 1,
        activeCategory: null,
        categoryCounts: [],
        error: "Failed to load projects",
      },
      {
        status: 500,
      },
    );
  }
}