"use client";

import { useEffect } from "react";
import type {
  ConsoleIntroConfig,
  DeveloperConsole,
} from "./types";

declare global {
  interface Window {
    __ANDREW_CONSOLE_INIT__?: boolean;
    andrew?: DeveloperConsole;
  }
}

type Props = {
  config?: Partial<ConsoleIntroConfig>;
};

const DEFAULT_CONFIG: ConsoleIntroConfig = {
  name: "Andrew",
  role: "Frontend Developer",
  status: "available for opportunities",
  email: "babujjioh@gmail.com",

  stack: [
    "Next.js",
    "React",
    "TypeScript",
    "WordPress",
  ],

  githubUrl: "https://github.com/AndrewB92",
  linkedinUrl: "https://www.linkedin.com/in/bielousandrew",

  version: "1.0.0",

  deployment: {
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? null,
    region: process.env.NEXT_PUBLIC_VERCEL_REGION ?? null,
    commit: process.env.NEXT_PUBLIC_COMMIT_SHA ?? null,
  },
};

const SIGNATURE = String.raw`
 ___         _                  
| . |._ _  _| | _ _  ___  _ _ _ 
|   || ' |/ . || '_>/ ._>| | | |
|_|_||_|_|\___||_|  \___.|__/_/ 
                                
`;

function openExternalUrl(url?: string | null): void {
  if (!url) {
    console.warn("URL is not configured.");
    return;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer",
  );
}

function inspect(config: ConsoleIntroConfig): void {
  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;

  const data: Record<string, string> = {
    route: window.location.pathname,
  };

  if (config.deployment?.environment) {
    data.environment =
      config.deployment.environment;
  }

  if (config.deployment?.region) {
    data.region =
      config.deployment.region;
  }

  if (config.deployment?.commit) {
    data.commit =
      config.deployment.commit.slice(0, 7);
  }

  if (navigation) {
    const ttfb =
      navigation.responseStart -
      navigation.requestStart;

    if (ttfb >= 0) {
      data.ttfb = `${Math.round(ttfb)} ms`;
    }

    if (navigation.domInteractive > 0) {
      data.domInteractive =
        `${Math.round(
          navigation.domInteractive,
        )} ms`;
    }
  }

  console.table(data);
}

export default function ConsoleIntro({
  config,
}: Props) {
  useEffect(() => {
    if (window.__ANDREW_CONSOLE_INIT__) {
      return;
    }

    window.__ANDREW_CONSOLE_INIT__ = true;

    const settings: ConsoleIntroConfig = {
      ...DEFAULT_CONFIG,
      ...config,

      deployment: {
        ...DEFAULT_CONFIG.deployment,
        ...config?.deployment,
      },
    };

    const prompt = "andrew@portfolio:~$";

    const help = (): void => {
      console.log(`
Available commands

  andrew.stack()     show development stack
  andrew.github()    open GitHub
  andrew.linkedin()  open LinkedIn
  andrew.email()     start an email
  andrew.inspect()   inspect current page
`);
    };

    window.andrew = Object.freeze({
      help,

      stack(): void {
        console.log(
          settings.stack.join(" · "),
        );
      },

      github(): void {
        openExternalUrl(
          settings.githubUrl,
        );
      },

      linkedin(): void {
        openExternalUrl(
          settings.linkedinUrl,
        );
      },

      email(): void {
        window.location.href =
          `mailto:${settings.email}`;
      },

      inspect(): void {
        inspect(settings);
      },
    });

    console.log(SIGNATURE);

    console.log(
      `${prompt} whoami`,
    );

    console.log(
      `${settings.name} · ${settings.role}\n${settings.stack
        .slice(0, 4)
        .join(" · ")}`,
    );

    console.log(
      `\n${prompt} status`,
    );

    console.log(
      `✓ ${settings.status}`,
    );

    console.log(
      `\n${prompt} help`,
    );

    console.log(
      "Try: andrew.help()",
    );
  }, [config]);

  return null;
}