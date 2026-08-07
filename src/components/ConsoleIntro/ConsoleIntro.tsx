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
  stack: ["Next.js", "React", "TypeScript", "WordPress"],
  email: "babujjioh@gmail.com",
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
   ___            __
  / _ | ___  ___/ /______ _    __
 / __ |/ _ \/ _  / __/ -_) |/|/ /
/_/ |_/ .__/\_,_/_/  \__/|__,__/
     /_/
`;

function open(url?: string | null) {
  if (!url) {
    console.warn("Not configured.");
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function inspect(config: ConsoleIntroConfig) {
  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;

  console.table({
    route: window.location.pathname,
    environment: config.deployment?.environment ?? "unknown",
    region: config.deployment?.region ?? "unknown",
    commit: config.deployment?.commit?.slice(0, 7) ?? "unknown",
    ttfb: navigation
      ? `${Math.round(
          navigation.responseStart - navigation.requestStart,
        )} ms`
      : "unknown",
    domInteractive: navigation
      ? `${Math.round(navigation.domInteractive)} ms`
      : "unknown",
  });
}

export default function ConsoleIntro({ config }: Props) {
  useEffect(() => {
    if (window.__ANDREW_CONSOLE_INIT__) return;

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

    const help = () => {
      console.log(`
Available commands

  andrew.help()      show available commands
  andrew.stack()     show development stack
  andrew.github()    open GitHub
  andrew.linkedin()  open LinkedIn
  andrew.email()     start an email
  andrew.inspect()   inspect this deployment
`);
    };

    window.andrew = Object.freeze({
      help,

      stack() {
        console.log(settings.stack.join(" · "));
      },

      github() {
        open(settings.githubUrl);
      },

      linkedin() {
        open(settings.linkedinUrl);
      },

      email() {
        window.location.href = `mailto:${settings.email}`;
      },

      inspect() {
        inspect(settings);
      },
    });

    console.log(SIGNATURE);

    console.log(`${prompt} whoami`);
    console.log(
      `${settings.name} · ${settings.role}\n${settings.stack
        .slice(0, 4)
        .join(" · ")}`,
    );

    console.log(`\n${prompt} status`);
    console.log(`✓ ${settings.status}`);

    console.log(`\n${prompt} help`);
    console.log("Run andrew.help()");
  }, [config]);

  return null;
}