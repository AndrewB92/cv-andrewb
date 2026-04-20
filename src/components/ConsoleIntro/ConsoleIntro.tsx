"use client";

import { useEffect } from "react";
import type { ConsoleIntroConfig, ConsoleReply } from "./types";

declare global {
  interface Window {
    __ANDREW_DEV_CONSOLE_INIT__?: boolean;
    andrewConsole?: {
      reply: (answer: ConsoleReply | string) => boolean | null;
      email: () => boolean;
      emailWithMessage: () => boolean;
      config: Readonly<{
        brand: string;
        version: string;
        email: string;
      }>;
    };
  }

  interface Navigator {
    deviceMemory?: number;
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
    mozConnection?: Navigator["connection"];
    webkitConnection?: Navigator["connection"];
  }

  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

type Props = {
  config?: Partial<ConsoleIntroConfig>;
};

const DEFAULT_CONFIG: ConsoleIntroConfig = {
  brand: "Andrew.dev",
  tagline: "Frontend / WordPress / Product-minded development",
  version: "1.0.0",
  environment: process.env.NODE_ENV ?? "production",
  contactEmail: "babujjioh@gmail.com",
  techStack: ["Next.js", "React", "TypeScript", "Vercel"],
  githubUrl: "",
  linkedinUrl: "",
  enableContactPrompt: true,
  vercel: {
    enabled: true,
    env: process.env.NEXT_PUBLIC_VERCEL_ENV ?? null,
    url: process.env.NEXT_PUBLIC_VERCEL_URL ?? null,
    region: process.env.NEXT_PUBLIC_VERCEL_REGION ?? null,
    commit: process.env.NEXT_PUBLIC_COMMIT_SHA ?? null,
  },
};

const ASCII = String.raw`
    ___              __                    __
   /   |  ____  ____/ /________ _      __ / /____ _   __
  / /| | / __ \/ __  / ___/ _ \ | /| / // __/ _ \ | / /
 / ___ |/ / / / /_/ / /  /  __/ |/ |/ // /_/  __/ |/ /
/_/  |_/_/ /_/\__,_/_/   \___/|__/|__/ \__/\___/|___/
                                Andrew.dev
`;

function safeGet<T>(getter: () => T, fallback: T): T {
  try {
    const value = getter();
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "n/a";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const precision = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[index]}`;
}

function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "n/a";
  return `${Math.round(ms)} ms`;
}

function getNavigationTiming() {
  const nav = performance.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return null;

  return {
    type: nav.type || "n/a",
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    download: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive,
    domComplete: nav.domComplete,
    loadEvent: nav.loadEventEnd,
  };
}

function getConnectionInfo() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) {
    return {
      effectiveType: "unsupported",
      downlink: "unsupported",
      rtt: "unsupported",
      saveData: "unsupported",
    };
  }

  return {
    effectiveType: connection.effectiveType || "n/a",
    downlink: typeof connection.downlink === "number" ? `${connection.downlink} Mb/s` : "n/a",
    rtt: typeof connection.rtt === "number" ? `${connection.rtt} ms` : "n/a",
    saveData: String(Boolean(connection.saveData)),
  };
}

function getMemoryInfo() {
  const perfMemory = performance.memory;

  return {
    deviceMemory: safeGet(() => (navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "unsupported"), "unsupported"),
    jsHeapLimit: perfMemory ? formatBytes(perfMemory.jsHeapSizeLimit) : "unsupported",
    totalJSHeap: perfMemory ? formatBytes(perfMemory.totalJSHeapSize) : "unsupported",
    usedJSHeap: perfMemory ? formatBytes(perfMemory.usedJSHeapSize) : "unsupported",
  };
}

function getSystemInfo() {
  return {
    platform: safeGet(() => navigator.platform || "n/a", "n/a"),
    language: safeGet(() => navigator.language || "n/a", "n/a"),
    timezone: safeGet(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "n/a", "n/a"),
    online: String(navigator.onLine),
    cores: safeGet(() => String(navigator.hardwareConcurrency || "unsupported"), "unsupported"),
    touchPoints: safeGet(() => String(navigator.maxTouchPoints ?? "n/a"), "n/a"),
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: safeGet(() => String(window.devicePixelRatio || 1), "1"),
  };
}

function getPageInfo() {
  return {
    title: document.title || "n/a",
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || "direct / none",
    colorScheme: safeGet(
      () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
      "n/a",
    ),
  };
}

function buildMailto(contactEmail: string, withPromptBody = false): string | null {
  const appName = document.title?.trim() || window.location.hostname || "your website";
  const subject = `Hello Andrew, it's ${appName}`;

  let body = "";
  if (withPromptBody) {
    const message = window.prompt("Write a short message for Andrew:", "");
    if (message === null) return null;

    body = message.trim();
  }

  const params = new URLSearchParams({
    subject,
    ...(body ? { body } : {}),
  });

  return `mailto:${contactEmail}?${params.toString()}`;
}

function openEmailClient(contactEmail: string, withPromptBody = false): boolean {
  const mailto = buildMailto(contactEmail, withPromptBody);
  if (!mailto) return false;

  window.location.href = mailto;
  return true;
}

export default function ConsoleIntro({ config }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__ANDREW_DEV_CONSOLE_INIT__) return;

    window.__ANDREW_DEV_CONSOLE_INIT__ = true;

    const mergedConfig: ConsoleIntroConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      vercel: {
        ...DEFAULT_CONFIG.vercel,
        ...config?.vercel,
      },
    };

    const styles = {
      block: `
        background:#1e1f29;
        color:#f8f8f2;
        padding:8px 12px;
        border-radius:8px;
        font-family:Menlo,Consolas,monospace;
        line-height:1.35;
      `,
      title: "color:#8be9fd;font-weight:bold;font-size:14px;",
      label: "color:#bd93f9;font-weight:bold;",
      value: "color:#f8f8f2;",
      ok: "color:#50fa7b;font-weight:bold;",
      warn: "color:#ffb86c;font-weight:bold;",
      link: "color:#1e1f29;background:#50fa7b;padding:3px 8px;border-radius:999px;font-weight:bold;",
    };

    const printGroup = (title: string, data: Record<string, string>) => {
      console.groupCollapsed(`%c${title}`, styles.title);
      Object.entries(data).forEach(([key, value]) => {
        console.log(`%c${key}: %c${value}`, styles.label, styles.value);
      });
      console.groupEnd();
    };

    const vercelInfo =
      mergedConfig.vercel?.enabled
        ? {
            env: mergedConfig.vercel.env || "not exposed",
            region: mergedConfig.vercel.region || "not exposed",
            deploymentUrl: mergedConfig.vercel.url || "not exposed",
            commit: mergedConfig.vercel.commit || "not exposed",
          }
        : null;

    const reply = (answer: string): boolean | null => {
      const normalized = String(answer).trim().toUpperCase();

      if (normalized === "Y" || normalized === "YES") {
        console.log("%cOpening your default email app…", styles.ok);
        return openEmailClient(mergedConfig.contactEmail);
      }

      if (normalized === "N" || normalized === "NO") {
        console.log("%cNo problem. Maybe another time.", styles.warn);
        return false;
      }

      console.log("%cUse andrewConsole.reply('Y') or andrewConsole.reply('N')", styles.label);
      return null;
    };

    window.andrewConsole = {
      reply,
      email: () => openEmailClient(mergedConfig.contactEmail),
      emailWithMessage: () => openEmailClient(mergedConfig.contactEmail, true),
      config: Object.freeze({
        brand: mergedConfig.brand,
        version: mergedConfig.version || "1.0.0",
        email: mergedConfig.contactEmail,
      }),
    };

    const pageInfo = getPageInfo();
    const systemInfo = getSystemInfo();
    const connectionInfo = getConnectionInfo();
    const memoryInfo = getMemoryInfo();
    const navTiming = getNavigationTiming();

    console.log(`%c${ASCII}`, `${styles.block}color:#8be9fd;`);
    console.log(
      `%c${mergedConfig.brand}%c  ${mergedConfig.tagline || ""}`,
      "color:#bd93f9;font-size:16px;font-weight:800;",
      "color:#f8f8f2;font-size:12px;",
    );
    console.log(
      `%cVersion:%c ${mergedConfig.version || "1.0.0"}   %cEnvironment:%c ${mergedConfig.environment || "production"}`,
      styles.label,
      styles.value,
      styles.label,
      styles.value,
    );

    if (mergedConfig.techStack?.length) {
      console.log(`%cTech Stack:%c ${mergedConfig.techStack.join(" • ")}`, styles.label, styles.ok);
    }

    printGroup("Page", pageInfo);
    printGroup("System", systemInfo);
    printGroup("Connection", connectionInfo);
    printGroup("Memory", memoryInfo);

    if (navTiming) {
      printGroup("Performance", {
        navigationType: navTiming.type,
        dnsLookup: formatMs(navTiming.dns),
        tcpConnect: formatMs(navTiming.tcp),
        ttfb: formatMs(navTiming.ttfb),
        responseDownload: formatMs(navTiming.download),
        domInteractive: formatMs(navTiming.domInteractive),
        domComplete: formatMs(navTiming.domComplete),
        loadEventEnd: formatMs(navTiming.loadEvent),
      });
    }

    if (vercelInfo) {
      printGroup("Deployment", vercelInfo);
    }

    if (mergedConfig.githubUrl) {
      console.log(`%cGitHub:%c ${mergedConfig.githubUrl}`, styles.label, styles.value);
    }

    if (mergedConfig.linkedinUrl) {
      console.log(`%cLinkedIn:%c ${mergedConfig.linkedinUrl}`, styles.label, styles.value);
    }

    if (mergedConfig.enableContactPrompt) {
      console.log(
        "%cWant to get in touch?%c  Use %candrewConsole.reply('Y')%c or %candrewConsole.reply('N')",
        styles.label,
        styles.value,
        styles.ok,
        styles.value,
      );

      console.log("%cQuick email:%c andrewConsole.email()", styles.label, styles.link);
      console.log("%cEmail with message:%c andrewConsole.emailWithMessage()", styles.label, styles.link);
    }
  }, [config]);

  return null;
}