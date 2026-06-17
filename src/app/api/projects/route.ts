import { NextResponse } from "next/server";
import { PROJECTS_PAGE_SIZE } from "@/config/ui";
import { getProjects } from "@/data/profile";

type StackCount = {
  name: string;
  count: number;
};

const normalizeStack = (value: string) => value.trim().toLowerCase();

const getStackCounts = (projects: Awaited<ReturnType<typeof getProjects>>): StackCount[] => {
  const counts = new Map<string, StackCount>();

  for (const project of projects) {
    for (const stackItem of project.stack) {
      const name = stackItem.trim();

      if (!name) {
        continue;
      }

      const key = normalizeStack(name);
      const current = counts.get(key);

      counts.set(key, {
        name: current?.name ?? name,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return [...counts.values()].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.name.localeCompare(b.name);
  });
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const stackFilter = searchParams.get("stack")?.trim();
    const pageParam = Number(searchParams.get("page") ?? "1");
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

    const projects = await getProjects();
    const stackCounts = getStackCounts(projects);

    const filtered =
      stackFilter && stackFilter !== "All"
        ? projects.filter((project) =>
            project.stack.some(
              (item) => normalizeStack(item) === normalizeStack(stackFilter),
            ),
          )
        : projects;

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PROJECTS_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PROJECTS_PAGE_SIZE;
    const paged = filtered.slice(start, start + PROJECTS_PAGE_SIZE);

    return NextResponse.json({
      projects: paged,
      totalPages,
      totalItems,
      currentPage: safePage,
      stackCounts,
    });
  } catch {
    return NextResponse.json(
      {
        projects: [],
        totalPages: 1,
        totalItems: 0,
        currentPage: 1,
        stackCounts: [],
        error: "Failed to load projects",
      },
      { status: 500 },
    );
  }
}