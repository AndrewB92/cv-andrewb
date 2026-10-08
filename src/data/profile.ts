import { Db, MongoNetworkError, MongoServerSelectionError } from "mongodb";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { cache } from "react";
import { identity } from "@/config/site";
import { getDatabase } from "@/lib/mongodb";

export type SkillGroup = {
  title: string;
  items: string[];
};

export type Experience = {
  company: string;
  role: string;
  start: string;
  end: string;
  achievements: string[];
};

export type ProjectCategory =
  | "ecommerce"
  | "corporate"
  | "content-platform"
  | "education";

export type ProjectStatus =
  | "production"
  | "maintenance"
  | "archived"
  | "offline"
  | "private";

export type ProjectImage = {
  url: string;
  variant?: string;
  alt?: string;
  caption?: string;
};

export type Project = {
  id: string;
  name: string;
  year?: number;
  category: ProjectCategory;
  status: ProjectStatus;
  summary: string;
  contribution?: string;
  outcome?: string;
  role?: string;
  cms?: string;
  pageBuilder?: string;
  stack: string[];
  link?: string;
  github?: string;
  codepen?: string;
  img?: ProjectImage[];
  spotlight?: boolean;
  priority?: number;

  /** Temporary compatibility fields for the current homepage component. */
  description: string;
  details?: string;
};

const PROFILE_COLLECTIONS = ["_profile", "profiles", "profile"];
const PROFILE_MAIN_DOCS = ["main", "_main"];
const PROFILE_SKILLS_DOCS = ["skills", "_skills"];
const EXPERIENCE_COLLECTIONS = [
  "_profile_experiences",
  "_experiences",
  "experiences",
];
const PROJECT_COLLECTIONS = ["_portfolio", "portfolio", "projects"];

const PROJECT_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  "production",
  "maintenance",
  "archived",
  "offline",
  "private",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
};

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const items: string[] = [];

  for (const item of value) {
    const normalized = sanitizeString(item);
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    items.push(normalized);
  }

  return items;
};

const sanitizeProjectImages = (value: unknown): ProjectImage[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const images: ProjectImage[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;

    const url = sanitizeString(item.url);
    if (!url || seen.has(url)) continue;

    seen.add(url);

    const variant = sanitizeString(item.variant) ?? sanitizeString(item.name);
    const alt = sanitizeString(item.alt);
    const caption = sanitizeString(item.caption);

    images.push({
      url,
      ...(variant ? { variant } : {}),
      ...(alt ? { alt } : {}),
      ...(caption ? { caption } : {}),
    });
  }

  return images;
};

const toTitleCase = (value: string) =>
  value
    .split(/[_-]/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ") || value;

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";

const normalizeCategoryValue = (
  value: unknown,
): ProjectCategory | undefined => {
  const normalized = sanitizeString(value)?.toLowerCase();

  if (!normalized) {
    return undefined;
  }

  const aliases: Record<string, ProjectCategory> = {
    ecommerce: "ecommerce",
    "e-commerce": "ecommerce",
    woocommerce: "ecommerce",

    corporate: "corporate",
    wordpress: "corporate",
    frontend: "corporate",
    interactive: "corporate",
    other: "corporate",

    content: "content-platform",
    "content platform": "content-platform",
    content_platform: "content-platform",
    "content-platform": "content-platform",

    education: "education",
    educational: "education",
  };

  return aliases[normalized];
};

const normalizeStatusValue = (
  value: unknown,
): ProjectStatus | undefined => {
  const normalized = sanitizeString(value)?.toLowerCase();
  if (!normalized) return undefined;

  const aliases: Record<string, ProjectStatus> = {
    active: "production",
    live: "production",
    ongoing: "maintenance",
    maintained: "maintenance",
    unavailable: "offline",
    nda: "private",
  };

  const resolved = aliases[normalized] ?? normalized;

  return PROJECT_STATUSES.has(resolved as ProjectStatus)
    ? (resolved as ProjectStatus)
    : undefined;
};

const inferProjectCategory = (
  stack: string[],
  name: string,
): ProjectCategory => {
  const normalizedStack = new Set(
    stack.map((item) => item.trim().toLowerCase()),
  );

  const normalizedName = name.toLowerCase();

  if (
    normalizedStack.has("woocommerce") ||
    normalizedStack.has("e-commerce") ||
    normalizedStack.has("ecommerce")
  ) {
    return "ecommerce";
  }

  if (
    normalizedName.includes("news") ||
    normalizedName.includes("bible") ||
    normalizedName.includes("faithlead") ||
    normalizedName.includes("making waves") ||
    normalizedName.includes("association")
  ) {
    return "content-platform";
  }

  if (
    normalizedName.includes("education") ||
    normalizedName.includes("school") ||
    normalizedName.includes("course")
  ) {
    return "education";
  }

  return "corporate";
};

const normalizeYear = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : undefined;
  }

  const normalized = sanitizeString(value);
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const normalizeFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const normalized = sanitizeString(value);
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;

  const normalized = sanitizeString(value)?.toLowerCase();

  if (["true", "1", "yes"].includes(normalized ?? "")) return true;
  if (["false", "0", "no"].includes(normalized ?? "")) return false;

  return undefined;
};

const mapExperience = (
  payload: Record<string, unknown>,
): Experience | undefined => {
  const company = sanitizeString(payload.company);
  const role = sanitizeString(payload.role);
  const start = sanitizeString(payload.start);
  const end = sanitizeString(payload.end);
  const achievements = sanitizeStringArray(payload.achievements);

  if (!company || !role || !start || !end) return undefined;

  return { company, role, start, end, achievements };
};

/**
 * Normalizes a project and legacy field aliases, or returns undefined without a nonblank
 * name or summary. Infers missing categories, defaults unrecognized statuses to production,
 * and derives a slug ID from the explicit ID or name; uniqueness is checked by the loader.
 */
const mapProject = (
  payload: Record<string, unknown>,
): Project | undefined => {
  const name =
    sanitizeString(payload.name) ??
    sanitizeString(payload.title) ??
    sanitizeString(payload._id);

  const link = sanitizeString(payload.link) ?? sanitizeString(payload.url);

  if (!name) return undefined;

  const stack = sanitizeStringArray(payload.stack);
  const year = normalizeYear(payload.year);
  const img = sanitizeProjectImages(payload.img);

  const summary =
    sanitizeString(payload.summary) ??
    sanitizeString(payload.description);
  if (!summary) return undefined;

  const contribution =
    sanitizeString(payload.contribution) ?? sanitizeString(payload.details);
  const outcome = sanitizeString(payload.outcome);
  const role = sanitizeString(payload.role);
  const cms = sanitizeString(payload.cms) ?? sanitizeString(payload.CMS);
  const pageBuilder =
    sanitizeString(payload.pageBuilder) ??
    sanitizeString(payload.page_builder) ??
    sanitizeString(payload.PageBuilder);

  const category =
    normalizeCategoryValue(payload.category) ?? inferProjectCategory(stack, name);
  const status = normalizeStatusValue(payload.status) ?? "production";

  const explicitId =
    sanitizeString(payload.id) ??
    sanitizeString(payload.slug) ??
    sanitizeString(payload._id);

  const id = slugify(explicitId ?? name);
  const github = sanitizeString(payload.github);
  const codepen = sanitizeString(payload.codepen);
  const spotlight = normalizeBoolean(payload.spotlight);
  const priority = normalizeFiniteNumber(payload.priority);

  const description = summary;
  const details = sanitizeString(payload.details) ?? contribution ?? outcome;

  return {
    id,
    name,
    ...(year !== undefined ? { year } : {}),
    category,
    status,
    summary,
    ...(contribution ? { contribution } : {}),
    ...(outcome ? { outcome } : {}),
    ...(role ? { role } : {}),
    ...(cms ? { cms } : {}),
    ...(pageBuilder ? { pageBuilder } : {}),
    stack,
    ...(link ? { link } : {}),
    ...(github ? { github } : {}),
    ...(codepen ? { codepen } : {}),
    ...(img.length ? { img } : {}),
    ...(spotlight !== undefined ? { spotlight } : {}),
    ...(priority !== undefined ? { priority } : {}),
    description,
    ...(details ? { details } : {}),
  };
};

const findDocInCollections = async (
  db: Db,
  collectionNames: string[],
  docIds: string[],
) => {
  for (const name of collectionNames) {
    const collection =
      db.collection<Record<string, unknown> & { _id: string }>(name);

    for (const docId of docIds) {
      const document = (await collection.findOne({
        _id: docId,
      })) as Record<string, unknown> | null;

      if (document) return document;
    }
  }

  return null;
};

const parseDateValue = (value: string | undefined) => {
  if (!value) return 0;

  if (/^\d{4}$/.test(value)) {
    return new Date(`${value}-01-01`).getTime();
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Date(`${value}-01`).getTime();
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const fetchCollectionItems = async (
  db: Db,
  collectionNames: string[],
) => {
  for (const name of collectionNames) {
    const documents = (await db
      .collection(name)
      .find({})
      .sort({ order: 1, _id: 1 })
      .toArray()) as Record<string, unknown>[];

    if (documents.length) return documents;
  }

  return [];
};

type PortfolioData = {
  skills: SkillGroup[];
  experiences: Experience[];
  projects: Project[];
};

class PortfolioUnavailableError extends Error {
  /** Creates the recoverable error used to distinguish missing configuration from database outages. */
  constructor(readonly code: "missing_configuration" | "database_unavailable") {
    super(`Portfolio data is temporarily unavailable (${code}).`);
    this.name = "PortfolioUnavailableError";
  }
}

let lastFailure: { code: string; at: number } | undefined;
/** Emits a failure summary, suppressing repeats of the last code for one minute per process. */
function logDataFailure(code: string) {
  const now = Date.now();
  // One outage summary per minute per process, never driver messages or URIs.
  if (lastFailure?.code === code && now - lastFailure.at < 60_000) return;
  lastFailure = { code, at: now };
  console.error(JSON.stringify({ event: "portfolio.load_failed", code, action: code === "missing_configuration" ? "Configure MONGODB_URI" : "Check MongoDB availability and document schema" }));
}

/**
 * Loads and normalizes MongoDB portfolio content, retaining legacy collection/field aliases.
 * Returns experiences ordered by descending start date, then end date, and projects in
 * database order. Missing skills, malformed records, and duplicate project IDs fail the load.
 *
 * @throws {PortfolioUnavailableError} For a missing URI or a network/server-selection failure.
 * @throws {Error} For other database or content failures, with a sanitized configuration/schema message.
 */
async function loadPortfolio(): Promise<PortfolioData> {
  if (!process.env.MONGODB_URI?.trim()) {
    throw new PortfolioUnavailableError("missing_configuration");
  }

  try {
    const db = await getDatabase();
    // Collection compatibility is retained until the current production schema is confirmed.
    const [skillsDoc, experienceDocs, projectDocs] = await Promise.all([
      findDocInCollections(db, PROFILE_COLLECTIONS, PROFILE_SKILLS_DOCS),
      fetchCollectionItems(db, EXPERIENCE_COLLECTIONS),
      fetchCollectionItems(db, PROJECT_COLLECTIONS),
    ]);
    if (!skillsDoc) throw new Error("Missing skills document");
    const skills = Object.entries(skillsDoc)
      .filter(([key]) => !key.startsWith("_"))
      .map(([key, value]) => ({ title: toTitleCase(key), items: sanitizeStringArray(value) }))
      .filter(({ items }) => items.length > 0);

    const rawExperiences = experienceDocs.length ? experienceDocs
      : (await findDocInCollections(db, PROFILE_COLLECTIONS, PROFILE_MAIN_DOCS))?.experiences;
    if (!Array.isArray(rawExperiences)) throw new Error("Invalid experience documents");
    const experiences = rawExperiences.map((value) => isRecord(value) ? mapExperience(value) : undefined);
    if (experiences.some((value) => !value)) throw new Error("Invalid experience document");

    const rawProjects = projectDocs.flatMap((document) => Array.isArray(document.items) ? document.items : [document]);
    const projects = rawProjects.map((value) => isRecord(value) ? mapProject(value) : undefined);
    if (projects.some((value) => !value)) throw new Error("Invalid project document");
    if (new Set(projects.map((project) => project?.id)).size !== projects.length) throw new Error("Duplicate project IDs");

    lastFailure = undefined;
    return {
      skills,
      experiences: (experiences as Experience[]).sort((a, b) => parseDateValue(b.start) - parseDateValue(a.start) || parseDateValue(b.end) - parseDateValue(a.end)),
      projects: projects as Project[],
    };
  } catch (error) {
    if (error instanceof MongoNetworkError || error instanceof MongoServerSelectionError) {
      throw new PortfolioUnavailableError("database_unavailable");
    }
    logDataFailure("invalid_configuration_or_content");
    // Permanent errors must fail visibly, without leaking driver diagnostics.
    throw new Error("Portfolio content could not be loaded. Check database configuration and schema.");
  }
}

const getCachedPortfolio = unstable_cache(loadPortfolio, ["portfolio-content-v2"], {
  revalidate: 86_400,
  tags: ["portfolio"],
});

/**
 * Returns the configured profile with normalized portfolio content and an availability flag.
 * Successful data uses Next.js caching with a 24-hour revalidation interval; stale data may
 * remain available if background revalidation fails. Calls are also memoized by React.
 * Missing configuration or a database outage without cached data opts into request-time
 * rendering and returns empty collections with available=false, outside the persistent cache.
 * Other loading/cache errors and errors from connection() propagate to the caller.
 */
export const getPortfolioContent = cache(async (): Promise<PortfolioData & { profile: typeof identity; available: boolean }> => {
  try {
    return { profile: identity, ...await getCachedPortfolio(), available: true as const };
  } catch (error) {
    if (!(error instanceof PortfolioUnavailableError)) throw error;
    logDataFailure(error.code);
    // A cold outage must not turn an empty response into a statically cached homepage.
    await connection();
    return { profile: identity, skills: [], experiences: [], projects: [], available: false as const };
  }
});
