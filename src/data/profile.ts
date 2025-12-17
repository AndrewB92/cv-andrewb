import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const PROFILE_COLLECTION = "_profile";
const PROFILE_MAIN_DOCS = ["main", "_main"];
const PROFILE_SKILLS_DOCS = ["skills", "_skills"];
const PORTFOLIO_COLLECTION = "_portfolio";

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

const fetchDocSnapshot = async (
  collectionPath: string,
  docIds: string[],
): Promise<{
  ref: DocumentReference<DocumentData, DocumentData>;
  snapshot?: DocumentSnapshot<DocumentData, DocumentData>;
}> => {
  for (const docId of docIds) {
    const candidateRef = doc(db, collectionPath, docId);
    const candidateSnapshot = await getDoc(candidateRef);
    if (candidateSnapshot.exists()) {
      return { ref: candidateRef, snapshot: candidateSnapshot };
    }
  }

  return {
    ref: doc(db, collectionPath, docIds[0]),
    snapshot: undefined,
  };
};

export async function getProfile(): Promise<Profile> {
  const { ref: mainRef, snapshot: mainSnapshot } = await fetchDocSnapshot(
    PROFILE_COLLECTION,
    PROFILE_MAIN_DOCS,
  );

  try {
    const data = mainSnapshot?.data();

    const socialsSnapshot = await getDocs(collection(mainRef, "socials"));
    const socials =
      socialsSnapshot.docs
        .map((snapshot) => {
          const payload = snapshot.data();
          const label =
            typeof payload.label === "string" ? payload.label : undefined;
          const url = typeof payload.url === "string" ? payload.url : undefined;
          if (!label || !url) {
            return undefined;
          }
          return { label, url };
        })
        .filter((social): social is SocialLink => Boolean(social)) ??
      fallbackProfile.socials;

    return {
      ...fallbackProfile,
      name: typeof data?.name === "string" ? data.name : fallbackProfile.name,
      title:
        typeof data?.job_title === "string"
          ? data.job_title
          : typeof data?.title === "string"
            ? data.title
            : fallbackProfile.title,
      summary:
        typeof data?.summary === "string"
          ? data.summary
          : fallbackProfile.summary,
      location:
        typeof data?.location === "string"
          ? data.location
          : fallbackProfile.location,
      email:
        typeof data?.email === "string" ? data.email : fallbackProfile.email,
      resumeUrl:
        typeof data?.resume_url === "string"
          ? data.resume_url
          : typeof data?.resumeUrl === "string"
            ? data.resumeUrl
            : fallbackProfile.resumeUrl,
      socials: socials.length ? socials : fallbackProfile.socials,
    };
  } catch (error) {
    console.error("Failed to fetch profile from Firestore", error);
    return fallbackProfile;
  }
}

export async function getSkills(): Promise<SkillGroup[]> {
  try {
    const { snapshot: skillsSnapshot } = await fetchDocSnapshot(
      PROFILE_COLLECTION,
      PROFILE_SKILLS_DOCS,
    );
    const data = skillsSnapshot?.data();

    if (!data) {
      return fallbackSkills;
    }

    const groups = Object.entries(data)
      .map(([key, value]) => {
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
    console.error("Failed to fetch skills from Firestore", error);
    return fallbackSkills;
  }
}

export async function getExperiences(): Promise<Experience[]> {
  try {
    const { ref: mainRef } = await fetchDocSnapshot(
      PROFILE_COLLECTION,
      PROFILE_MAIN_DOCS,
    );
    const experiencesRef = collection(mainRef, "experiences");
    const experiencesSnapshot = await getDocs(experiencesRef);
    const data = experiencesSnapshot.docs
      .map((snapshot) => {
        const payload = snapshot.data();
        const company =
          typeof payload.company === "string" ? payload.company : undefined;
        const role =
          typeof payload.role === "string" ? payload.role : undefined;
        const start =
          typeof payload.start === "string" ? payload.start : undefined;
        const end = typeof payload.end === "string" ? payload.end : undefined;
        const achievements = sanitizeStringArray(payload.achievements);

        if (!company || !role || !start || !end) {
          return undefined;
        }

        return {
          company,
          role,
          start,
          end,
          achievements: achievements.length ? achievements : [],
        };
      })
      .filter((experience): experience is Experience => Boolean(experience));

    return data.length ? data : fallbackExperiences;
  } catch (error) {
    console.error("Failed to fetch experiences from Firestore", error);
    return fallbackExperiences;
  }
}

export async function getProjects(): Promise<Project[]> {
  const projectsRef = collection(db, PORTFOLIO_COLLECTION);

  try {
    const projectsSnapshot = await getDocs(projectsRef);
    const data = projectsSnapshot.docs
      .map((snapshot) => {
        const payload = snapshot.data();
        const name =
          typeof payload.title === "string"
            ? payload.title
            : snapshot.id ?? undefined;
        const link =
          typeof payload.url === "string" ? payload.url : undefined;

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
      })
      .filter((project): project is Project => Boolean(project));

    return data.length ? data : fallbackProjects;
  } catch (error) {
    console.error("Failed to fetch projects from Firestore", error);
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
