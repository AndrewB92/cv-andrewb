import { Db } from "mongodb";
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

export type SocialLink = {
  label: string;
  url: string;
};

export type Profile = {
  name: string;
  title: string;
  summary: string;
  location: string;
  email: string;
  resumeUrl: string;
  socials: SocialLink[];
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
const PROJECT_DOC_IDS = ["projects", "_projects"];

const PROJECT_CATEGORIES: ReadonlySet<ProjectCategory> = new Set([
  "ecommerce",
  "corporate",
  "content-platform",
  "education",
]);

const PROJECT_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  "production",
  "maintenance",
  "archived",
  "offline",
  "private",
]);

const fallbackProfile: Profile = {
  name: "Andrew Bielous",
  title: "Full-Stack Engineer",
  summary:
    "I enjoy building resilient, accessible web experiences that stay fast even when product requirements grow. My current focus is on React, TypeScript, and serverless backends.",
  location: "Odessa • Remote",
  email: "babujioh@gmail.com",
  resumeUrl: "https://drive.google.com/file/d/1dJCK8rjvaY-1shKXnndvIjn9-5irKb6P/view?usp=sharing",
  socials: [
    { label: "GitHub", url: "https://github.com/andrewb" },
    { label: "LinkedIn", url: "https://linkedin.com/in/andrewb" },
  ],
};

const fallbackSkills: SkillGroup[] = [
  {
    title: "Frontend",
    items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Accessibility"],
  },
  {
    title: "Backend & Cloud",
    items: ["Firebase", "Node.js", "Cloud Functions", "Prisma", "REST APIs"],
  },
  {
    title: "Workflow",
    items: ["Vercel", "GitHub Actions", "Product Discovery", "Design Systems"],
  },
];

const fallbackExperiences: Experience[] = [
  {
    company: "Freelance",
    role: "Senior Frontend Engineer",
    start: "2021",
    end: "Present",
    achievements: [
      "Built performant marketing sites and dashboards for climate-tech founders.",
      "Introduced component libraries that cut feature delivery time by 30%.",
      "Mentored junior developers on testing, accessibility, and DX improvements.",
    ],
  },
  {
    company: "Acme Robotics",
    role: "Full-Stack Engineer",
    start: "2018",
    end: "2021",
    achievements: [
      "Launched a Next.js portal that streams live telemetry for internal teams.",
      "Moved realtime event ingestion to Firebase, improving reliability by 40%.",
      "Led migration from monolith deployments to Vercel edge functions.",
    ],
  },
];

const fallbackProjects: Project[] = [
  {
    id: "project-alpha",
    name: "Project Alpha",
    summary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    category: "corporate",
    status: "production",
    stack: ["Framework A", "Service B", "Platform C"],
    link: "https://example.com/project-alpha",
    year: 1999,
  },
  {
    id: "project-beta",
    name: "Project Beta",
    summary:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    description:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    category: "corporate",
    status: "production",
    stack: ["Library X", "Backend Y", "Database Z"],
    link: "https://example.com/project-beta",
    year: 1999,
  },
  {
    id: "project-gamma",
    name: "Project Gamma",
    summary:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    category: "corporate",
    status: "production",
    stack: ["Tool One", "Tool Two", "Tool Three"],
    link: "https://example.com/project-gamma",
    year: 1999,
  },
];

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

const normalizeSocials = (value: unknown): SocialLink[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return undefined;

      const label = sanitizeString(item.label);
      const url = sanitizeString(item.url);

      if (!label || !url) return undefined;
      return { label, url };
    })
    .filter((social): social is SocialLink => Boolean(social));
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
    sanitizeString(payload.description) ??
    "Project information is being updated.";

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

export async function getProfile(): Promise<Profile> {
  try {
    const db = await getDatabase();
    const profileDoc = await findDocInCollections(
      db,
      PROFILE_COLLECTIONS,
      PROFILE_MAIN_DOCS,
    );

    const socials = normalizeSocials(profileDoc?.socials);

    return {
      ...fallbackProfile,
      name: sanitizeString(profileDoc?.name) ?? fallbackProfile.name,
      title:
        sanitizeString(profileDoc?.job_title) ??
        sanitizeString(profileDoc?.title) ??
        fallbackProfile.title,
      summary: sanitizeString(profileDoc?.summary) ?? fallbackProfile.summary,
      location: sanitizeString(profileDoc?.location) ?? fallbackProfile.location,
      email: sanitizeString(profileDoc?.email) ?? fallbackProfile.email,
      resumeUrl:
        sanitizeString(profileDoc?.resume_url) ??
        sanitizeString(profileDoc?.resumeUrl) ??
        fallbackProfile.resumeUrl,
      socials: socials.length ? socials : fallbackProfile.socials,
    };
  } catch (error) {
    console.error("Failed to fetch profile from MongoDB", error);
    return fallbackProfile;
  }
}

export async function getSkills(): Promise<SkillGroup[]> {
  try {
    const db = await getDatabase();
    const skillsDoc = await findDocInCollections(
      db,
      PROFILE_COLLECTIONS,
      PROFILE_SKILLS_DOCS,
    );

    if (!skillsDoc) return fallbackSkills;

    const groups = Object.entries(skillsDoc)
      .map(([key, value]) => {
        if (key.startsWith("_")) return undefined;

        const items = sanitizeStringArray(value);
        if (!items.length) return undefined;

        return { title: toTitleCase(key), items };
      })
      .filter((group): group is SkillGroup => Boolean(group));

    return groups.length ? groups : fallbackSkills;
  } catch (error) {
    console.error("Failed to fetch skills from MongoDB", error);
    return fallbackSkills;
  }
}

export async function getExperiences(): Promise<Experience[]> {
  try {
    const db = await getDatabase();
    const experienceDocs = await fetchCollectionItems(
      db,
      EXPERIENCE_COLLECTIONS,
    );

    const rawExperiences = experienceDocs.length
      ? experienceDocs
      : ((await findDocInCollections(
          db,
          PROFILE_COLLECTIONS,
          PROFILE_MAIN_DOCS,
        ))?.experiences as unknown[]) ?? [];

    const experiences = rawExperiences
      .filter(isRecord)
      .map((document) => mapExperience(document))
      .filter((experience): experience is Experience => Boolean(experience))
      .sort((a, b) => {
        const startDiff = parseDateValue(b.start) - parseDateValue(a.start);
        if (startDiff !== 0) return startDiff;
        return parseDateValue(b.end) - parseDateValue(a.end);
      });

    return experiences.length ? experiences : fallbackExperiences;
  } catch (error) {
    console.error("Failed to fetch experiences from MongoDB", error);
    return fallbackExperiences;
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const db = await getDatabase();
    const projectDocs = await fetchCollectionItems(db, PROJECT_COLLECTIONS);

    let rawProjects: unknown[] = [];

    if (projectDocs.length) {
      rawProjects = projectDocs.flatMap((document) => {
        const record = document as Record<string, unknown>;
        return Array.isArray(record.items) ? (record.items as unknown[]) : [record];
      });
    } else {
      const projectsDoc = await findDocInCollections(
        db,
        PROJECT_COLLECTIONS,
        PROJECT_DOC_IDS,
      );

      if (Array.isArray(projectsDoc?.items)) {
        rawProjects = projectsDoc.items as unknown[];
      }
    }

    const projects = rawProjects
      .filter(isRecord)
      .map((document) => mapProject(document))
      .filter((project): project is Project => Boolean(project));

    return projects.length ? projects : fallbackProjects;
  } catch (error) {
    console.error("Failed to fetch projects from MongoDB", error);
    return fallbackProjects;
  }
}

export async function getPortfolioContent() {
  const [profile, skills, experiences, projects] = await Promise.all([
    getProfile(),
    getSkills(),
    getExperiences(),
    getProjects(),
  ]);

  return { profile, skills, experiences, projects };
}