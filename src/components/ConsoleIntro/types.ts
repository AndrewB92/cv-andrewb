export type ConsoleIntroConfig = {
  brand: string;
  tagline?: string;
  version?: string;
  environment?: string;
  contactEmail: string;
  techStack?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  enableContactPrompt?: boolean;
  vercel?: {
    enabled?: boolean;
    env?: string | null;
    url?: string | null;
    region?: string | null;
    commit?: string | null;
  };
};

export type ConsoleReply = "Y" | "N" | "YES" | "NO";