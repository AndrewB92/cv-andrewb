import type { Project, ProjectCategory } from "./profile";
import { PROJECTS_PAGE_SIZE } from "@/config/ui";

export const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  "ecommerce", "corporate", "content-platform", "education",
];
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  ecommerce: "E-commerce",
  corporate: "Corporate",
  "content-platform": "Content platforms",
  education: "Education",
};
export const STATUS_LABELS: Record<Project["status"], string> = {
  production: "Production", maintenance: "Ongoing maintenance", archived: "Archived", offline: "Offline", private: "Private",
};

export type ProjectSearchParams = {
  category?: string | string[];
  page?: string | string[];
};

/** Uses the first occurrence of a repeated URL parameter, or undefined for an empty array. */
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

/**
 * Filters by an exact category key, then paginates in input order without mutating projects.
 * Repeated parameters use their first value; unknown categories leave the archive unfiltered.
 * Pages are one-based: invalid or sub-one values use 1, fractions round down, and values
 * above the last page are clamped. Even an empty result has one page.
 * Returns the page, filtered totals, active category, and nonzero category counts for
 * the whole archive in configured category order.
 */
export function projectArchive(projects: Project[], params: ProjectSearchParams) {
  const category = first(params.category);
  const activeCategory = PROJECT_CATEGORIES.includes(category as ProjectCategory)
    ? category as ProjectCategory : null;
  const categories = PROJECT_CATEGORIES.map((name) => ({
    name, count: projects.filter((project) => project.category === name).length,
  })).filter(({ count }) => count > 0);
  const filtered = activeCategory ? projects.filter((project) => project.category === activeCategory) : projects;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PROJECTS_PAGE_SIZE));
  const requestedPage = Number(first(params.page) ?? 1);
  const currentPage = Number.isFinite(requestedPage) && requestedPage >= 1
    ? Math.min(Math.floor(requestedPage), totalPages) : 1;
  const start = (currentPage - 1) * PROJECTS_PAGE_SIZE;

  return { categories, projects: filtered.slice(start, start + PROJECTS_PAGE_SIZE), totalItems, totalPages, currentPage, activeCategory };
}

/**
 * Builds an archive URL, omitting a null category and pages not greater than 1.
 * The caller supplies the page; values above 1 are serialized without rounding or clamping.
 */
export function projectsHref(category: ProjectCategory | null, page = 1) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}
