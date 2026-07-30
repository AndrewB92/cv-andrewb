export const siteMetadata = {
  siteName: "<Andrew_Dev/>",
  tagline: "Product-focused web developer",
  description:
    "Frontend-focused engineer building thoughtful WordPress & React experiences with a focus on performance and storytelling.",
  baseUrl: "https://cv-andrewb.vercel.app",
};

export const primaryNavigation = [
  { label: "About", href: "/" },
  { label: "My works", href: "/projects" },
  { label: "Ways to contact", href: "/contact" },
];

export const footerNavigation = [
  { label: "About", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Contact", href: "/contact" },
  { label: "Download CV", href: "/resume.pdf", external: true },
];

export const contactDefaults = {
  // Confirm the local part before publishing if this is not your current address.
  email: "babujoh@gmail.com",
  location: "Remote",
  socials: [
    { label: "GitHub", url: "https://github.com/AndrewB92" },
    { label: "LinkedIn", url: "https://linkedin.com/in/bielousandrew" },
  ],
};

export const socialLinks = [
  {
    label: "GitHub",
    description: "Repositories and source code",
    href: "https://github.com/AndrewB92",
    icon: "github",
    external: true,
  },
  {
    label: "CodePen",
    description: "Frontend concepts and experiments",
    href: "https://codepen.io/bielous-andrew",
    icon: "codepen",
    external: true,
  },
  {
    label: "LinkedIn",
    description: "Experience and professional profile",
    href: "https://linkedin.com/in/bielousandrew",
    icon: "linkedin",
    external: true,
  },
  {
    label: "Email",
    description: contactDefaults.email,
    href: `mailto:${contactDefaults.email}`,
    icon: "email",
    external: false,
  },
  {
    label: "Telegram",
    description: "Direct message",
    href: "https://t.me/pm4life",
    icon: "telegram",
    external: true,
  },
  {
    label: "Cal.com",
    description: "Schedule an introductory call",
    href: "https://cal.com/andrew-bielous",
    icon: "cal",
    external: true,
  },
  {
    label: "WhatsApp",
    description: "Quick conversation",
    href: "https://wa.me/380681025393",
    icon: "whatsapp",
    external: true,
  },
] as const;
