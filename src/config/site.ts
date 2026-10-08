import type { RainbowGlowLinkIconName } from "@/components/RainbowGlowLink/RainbowGlowLink";

type Identity = {
  name: string;
  title: string;
  summary: string;
  email: string;
  location: string;
  timezone: string;
  resumeUrl: string;
  stack: string[];
  status: string;
  socials: Record<"github" | "linkedin" | "codepen" | "telegram" | "whatsapp" | "gravatar", string>;
  scheduling: { cal: string };
};

/** Public deployment configuration. Update identity/contact values only here. */
export const identity: Identity = {
  name: "Andrew Bielous",
  title: "Frontend Developer",
  summary: "Frontend-focused engineer building thoughtful WordPress & React experiences with a focus on performance and storytelling.",
  email: "work@andrew-b.is-a.dev",
  location: "Remote",
  timezone: "Europe/Kyiv (EET/EEST)",
  resumeUrl: "https://drive.google.com/file/d/1dJCK8rjvaY-1shKXnndvIjn9-5irKb6P/view?usp=drive_link",
  stack: ["Next.js", "React", "TypeScript", "WordPress"],
  status: "available for opportunities",
  socials: {
    github: "https://github.com/AndrewB92",
    linkedin: "https://linkedin.com/in/bielousandrew",
    codepen: "https://codepen.io/bielous-andrew",
    telegram: "https://t.me/pm4life",
    whatsapp: "https://wa.me/380681025393",
    gravatar: "https://gravatar.com/babujioh",
  },
  scheduling: { cal: "https://cal.com/andrew-bielous" },
};

const baseUrl = "https://andrew-b.is-a.dev";
export const siteMetadata = {
  baseUrl,
  domain: new URL(baseUrl).hostname,
  siteName: `<${new URL(baseUrl).hostname}/>`,
  tagline: "Product-focused web developer",
  description: identity.summary,
};

const calPath = new URL(identity.scheduling.cal).pathname.slice(1);
export const schedulingTabs = [
  {
    key: "intro-call",
    label: "Intro call",
    description: "A short call to discuss your project and requirements.",
    calLink: `${calPath}/intro-call`,
  },
  {
    key: "career-conversation",
    label: "Career conversation",
    description: "A focused conversation about roles, experience, and fit.",
    calLink: `${calPath}/career-conversation`,
  },
] as const;

export const primaryNavigation = [
  { label: "About", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Contact", href: "/contact" },
];

export const footerNavigation: { label: string; href: string; external?: boolean }[] = [
  ...primaryNavigation,
  { label: "Download CV", href: identity.resumeUrl, external: true },
];

type SocialLink = {
  label: string;
  description: string;
  href: string;
  icon: RainbowGlowLinkIconName;
  external: boolean;
};

export const socialLinks = [
  { label: "GitHub", description: "Repositories and source code", href: identity.socials.github, icon: "github", external: true },
  { label: "CodePen", description: "Frontend concepts and experiments", href: identity.socials.codepen, icon: "codepen", external: true },
  { label: "LinkedIn", description: "Experience and professional profile", href: identity.socials.linkedin, icon: "linkedin", external: true },
  { label: "Email", description: identity.email, href: `mailto:${identity.email}`, icon: "mail", external: false },
  { label: "Telegram", description: "Direct message", href: identity.socials.telegram, icon: "telegram", external: true },
  { label: "Cal.com", description: "Schedule an introductory call", href: identity.scheduling.cal, icon: "calendar", external: true },
  { label: "WhatsApp", description: "Quick conversation", href: identity.socials.whatsapp, icon: "whatsapp", external: true },
] satisfies readonly SocialLink[];
