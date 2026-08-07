export type ConsoleIntroConfig = {
  name: string;
  role: string;
  status: string;
  email: string;

  version?: string;
  stack: string[];

  githubUrl?: string;
  linkedinUrl?: string;

  deployment?: {
    environment?: string | null;
    region?: string | null;
    commit?: string | null;
  };
};

export type DeveloperConsole = Readonly<{
  help: () => void;
  stack: () => void;
  github: () => void;
  linkedin: () => void;
  email: () => void;
  inspect: () => void;
}>;