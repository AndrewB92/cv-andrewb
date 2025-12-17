/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "cv-andrewb";

if (!uri) {
  console.error(
    "Missing MONGODB_URI. Add it to your environment before running the seed script.",
  );
  process.exit(1);
}

const profileDoc = {
  _id: "main",
  name: "Andrew B.",
  job_title: "Product-Focused Full-Stack Engineer",
  summary:
    "I build resilient web experiences that stay fast as product requirements grow. My toolkit centers on React, TypeScript, and serverless platforms like Vercel and Atlas.",
  location: "San Francisco Bay Area • Remote friendly",
  email: "hello@andrewb.dev",
  resume_url: "https://example.com/resume.pdf",
  socials: [
    { label: "GitHub", url: "https://github.com/andrewb" },
    { label: "LinkedIn", url: "https://linkedin.com/in/andrewb" },
    { label: "X/Twitter", url: "https://x.com/andrewb" },
  ],
};

const skillsDoc = {
  _id: "skills",
  frontend: [
    "Next.js",
    "React Server Components",
    "TypeScript",
    "Tailwind CSS",
    "Storybook",
  ],
  backend: ["Node.js", "Edge Functions", "MongoDB Atlas", "Firebase", "REST"],
  workflow: ["Vercel", "GitHub Actions", "UX Research", "Design Systems"],
};

const experiences = [
  {
    company: "Momentum Labs",
    role: "Lead Frontend Engineer",
    start: "2022",
    end: "Present",
    location: "Remote",
    achievements: [
      "Architected a component library powering 7 product teams and reducing duplicated UI by 60%.",
      "Migrated marketing and app surfaces to Next.js 15 + RSC, cutting TTFB by 45%.",
      "Partnered with design and product to define accessibility acceptance criteria across all projects.",
    ],
    order: 1,
  },
  {
    company: "Acme Robotics",
    role: "Full-Stack Engineer",
    start: "2019",
    end: "2022",
    location: "San Francisco, CA",
    achievements: [
      "Built a telemetry dashboard that streamed 200k events/min with realtime alerts via Firebase + Atlas.",
      "Led the move from monolithic deploys to Vercel edge infrastructure, improving release cadence by 4x.",
      "Mentored 6 engineers on TypeScript, testing culture, and performance budgets.",
    ],
    order: 2,
  },
];

const projects = [
  {
    title: "Creator Portfolio",
    url: "https://example.com/portfolio",
    description:
      "Dynamic Next.js site that syncs case studies, writing, and speaking engagements directly from a headless CMS.",
    stack: ["Next.js", "Tailwind CSS", "Notion API", "Vercel"],
    order: 1,
  },
  {
    title: "Climate Impact Tracker",
    url: "https://example.com/climate",
    description:
      "Serverless dashboard aggregating IoT sensor data, detecting anomalies, and broadcasting alerts in under 30 seconds.",
    stack: ["Next.js", "Edge Functions", "MongoDB Atlas", "Firebase Cloud Messaging"],
    order: 2,
  },
  {
    title: "Design System Starter",
    url: "https://example.com/design-system",
    description:
      "Radix-based UI starter with testing, linting, and GitHub Actions baked in for fast product teams.",
    stack: ["React", "Radix UI", "Storybook", "Vitest"],
    order: 3,
  },
];

async function seed() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    await db.collection("_profile").updateOne(
      { _id: profileDoc._id },
      { $set: profileDoc },
      { upsert: true },
    );

    await db.collection("_profile").updateOne(
      { _id: skillsDoc._id },
      { $set: skillsDoc },
      { upsert: true },
    );

    const experiencesCol = db.collection("experiences");
    await experiencesCol.deleteMany({});
    await experiencesCol.insertMany(experiences);

    const portfolioCol = db.collection("_portfolio");
    await portfolioCol.deleteMany({});
    await portfolioCol.insertMany(projects);

    console.log("✅ MongoDB seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed MongoDB", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

seed();
