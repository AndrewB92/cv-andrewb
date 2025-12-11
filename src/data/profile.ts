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

export const profile = {
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

export const skills: SkillGroup[] = [
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

export const experiences: Experience[] = [
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

export const projects: Project[] = [
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
