"use client";

import { sendGAEvent } from "@next/third-parties/google";
import Clarity from "@microsoft/clarity";
import { ANALYTICS_EVENTS, readAnalyticsEvent, type AnalyticsEvent } from "./events";

let gaEnabled = false;

/** Root layout passes availability because GA_ID is intentionally server-only. */
export function configureAnalytics(googleAnalyticsEnabled: boolean) {
  gaEnabled = googleAnalyticsEnabled;
}

/** Synchronous, best-effort dispatch. Provider failures never escape into UI handlers. */
export function trackEvent(...[name, parameters]: AnalyticsEvent) {
  if (typeof window === "undefined") return;

  const event = readAnalyticsEvent(name, (key) => parameters[key as keyof typeof parameters]);
  if (!event) return;
  const analyticsWindow = window as Window & { dataLayer?: unknown[]; clarity?: unknown };

  if (gaEnabled && Array.isArray(analyticsWindow.dataLayer)) {
    try {
      sendGAEvent("event", event[0], event[1]);
    } catch {
      // Analytics must not interrupt the visitor's action.
    }
  }

  if (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID &&
      typeof analyticsWindow.clarity === "function" && ANALYTICS_EVENTS[name].clarity) {
    try {
      Clarity.event(name);
    } catch {
      // Each provider is independent; blocked scripts are expected.
    }
  }
}
