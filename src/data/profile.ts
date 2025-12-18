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

export type Project = {
  name: string;
  description: string;
  stack: string[];
  link: string;
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

const fallbackProfile: Profile = {
  name: "Andrew B.",
  title: "Full-Stack Engineer",
  summary:
    "I enjoy building resilient, accessible web experiences that stay fast even when product requirements grow. My current focus is on React, TypeScript, and serverless backends.",
  location: "Remote • Open to onsite in the Bay Area",
  email: "hello@andrewb.dev",
  resumeUrl: "https://example.com/resume.pdf",
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
    name: "Creator Portfolio",
    description:
      "Dynamic Next.js site that syncs case studies, writing, and talks from a Firebase collection. Includes admin tooling to publish drafts from mobile.",
    stack: ["Next.js", "Firebase", "Vercel", "Tailwind CSS"],
    link: "https://example.com/portfolio",
  },
  {
    name: "Climate Impact Tracker",
    description:
      "Serverless dashboard that aggregates IoT sensor data, highlights anomalies, and sends alerts through Firebase Cloud Messaging.",
    stack: ["Next.js", "Cloud Functions", "Firestore"],
    link: "https://example.com/climate",
  },
  {
    name: "Design System Starter",
    description:
      "Documented UI kit built on Radix primitives and Tailwind. Ships with linting, Storybook, and CI recipes developers can copy-paste.",
    stack: ["React", "Radix UI", "Storybook"],
    link: "https://example.com/design-system",
  },
];

const sanitizeStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];

const toTitleCase = (value: string) =>
  value
    .split(/[_-]/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ") || value;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeSocials = (value: unknown): SocialLink[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return undefined;
      }

      const label =
        typeof item.label === "string" ? (item.label as string) : undefined;
      const url = typeof item.url === "string" ? (item.url as string) : undefined;

      if (!label || !url) {
        return undefined;
      }

      return { label, url };
    })
    .filter((social): social is SocialLink => Boolean(social));
};

const mapExperience = (payload: Record<string, unknown>): Experience | undefined => {
  const company =
    typeof payload.company === "string" ? (payload.company as string) : undefined;
  const role =
    typeof payload.role === "string" ? (payload.role as string) : undefined;
  const start =
    typeof payload.start === "string" ? (payload.start as string) : undefined;
  const end = typeof payload.end === "string" ? (payload.end as string) : undefined;
  const achievements = sanitizeStringArray(payload.achievements);

  if (!company || !role || !start || !end) {
    return undefined;
  }

  return {
    company,
    role,
    start,
    end,
    achievements,
  };
};

const mapProject = (payload: Record<string, unknown>): Project | undefined => {
  const name =
    typeof payload.name === "string"
      ? payload.name
      : typeof payload.title === "string"
        ? payload.title
        : typeof payload._id === "string"
          ? payload._id
          : undefined;
  const link =
    typeof payload.link === "string"
      ? payload.link
      : typeof payload.url === "string"
        ? payload.url
        : undefined;

  if (!name || !link) {
    return undefined;
  }

  const description =
    typeof payload.description === "string" ? payload.description : "";
  const stack = sanitizeStringArray(payload.stack);

  return {
    name,
    description,
    stack,
    link,
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
      if (document) {
        return document;
      }
    }
  }

  return null;
};

const parseDateValue = (value: string | undefined) => {
  if (!value) {
    return 0;
  }

  if (/^\d{4}$/.test(value)) {
    return new Date(`${value}-01-01`).getTime();
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Date(`${value}-01`).getTime();
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const fetchCollectionItems = async (db: Db, collectionNames: string[]) => {
  for (const name of collectionNames) {
    const documents = (await db
      .collection(name)
      .find({})
      .sort({ order: 1, _id: 1 })
      .toArray()) as Record<string, unknown>[];

    if (documents.length) {
      return documents;
    }
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
      name:
        typeof profileDoc?.name === "string"
          ? (profileDoc.name as string)
          : fallbackProfile.name,
      title:
        typeof profileDoc?.job_title === "string"
          ? (profileDoc.job_title as string)
          : typeof profileDoc?.title === "string"
            ? (profileDoc.title as string)
            : fallbackProfile.title,
      summary:
        typeof profileDoc?.summary === "string"
          ? (profileDoc.summary as string)
          : fallbackProfile.summary,
      location:
        typeof profileDoc?.location === "string"
          ? (profileDoc.location as string)
          : fallbackProfile.location,
      email:
        typeof profileDoc?.email === "string"
          ? (profileDoc.email as string)
          : fallbackProfile.email,
      resumeUrl:
        typeof profileDoc?.resume_url === "string"
          ? (profileDoc.resume_url as string)
          : typeof profileDoc?.resumeUrl === "string"
            ? (profileDoc.resumeUrl as string)
            : fallbackProfile.resumeUrl,
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

    if (!skillsDoc) {
      return fallbackSkills;
    }

    const groups = Object.entries(skillsDoc)
      .map(([key, value]) => {
        if (key.startsWith("_")) {
          return undefined;
        }

        const items = sanitizeStringArray(value);
        if (!items.length) {
          return undefined;
        }

        return {
          title: toTitleCase(key),
          items,
        };
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
    const experienceDocs = await fetchCollectionItems(db, EXPERIENCE_COLLECTIONS);

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
        if (startDiff !== 0) {
          return startDiff;
        }
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
        if (Array.isArray(record.items)) {
          return record.items as unknown[];
        }
        return [record];
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
