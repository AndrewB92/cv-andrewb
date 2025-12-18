import { NextResponse } from "next/server";
import { getProjects } from "@/data/profile";
import { PROJECTS_PAGE_SIZE } from "@/config/ui";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stackFilter = searchParams.get("stack");
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const projects = await getProjects();
  const filtered =
    stackFilter && stackFilter !== "All"
      ? projects.filter((project) =>
          project.stack.some(
            (item) => item.toLowerCase() === stackFilter.toLowerCase(),
          ),
        )
      : projects;

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PROJECTS_PAGE_SIZE));
  const start = (page - 1) * PROJECTS_PAGE_SIZE;
  const paged = filtered.slice(start, start + PROJECTS_PAGE_SIZE);

  return NextResponse.json({
    projects: paged,
    totalPages,
    totalItems,
  });
}
