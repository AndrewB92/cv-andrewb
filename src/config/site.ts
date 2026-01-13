export const siteMetadata = {
  siteName: '<div class="cv-logo" id="cvLogo" aria-label="andrew.dev logo">\n' +
    '  <span class="cv-logo__prefix">&lt;</span>\n' +
    '  <span class="cv-logo__typed" aria-hidden="true"></span>\n' +
    '  <span class="cv-logo__suffix">/&gt;</span>\n' +
    '  <span class="cv-logo__cursor" aria-hidden="true">|</span>\n' +
    '</div>',
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
  { label: "Get my CV", href: "/resume.pdf", external: true },
  { label: "My works", href: "/projects" },
  { label: "Ways to contact", href: "/contact" },
];

export const contactDefaults = {
  email: "babujoh@gmai.com",
  location: "Remote",
  socials: [
    { label: "GitHub", url: "https://github.com/andrewb" },
    { label: "LinkedIn", url: "https://linkedin.com/in/andrewb" },
  ],
};
