"use client";

import { useEffect } from "react";
import { configureAnalytics, trackEvent } from "@/lib/analytics/client";
import { analyticsEventFromElement } from "@/lib/analytics/events";

export function AnalyticsEventListener({ gaEnabled }: { gaEnabled: boolean }) {
  useEffect(() => {
    configureAnalytics(gaEnabled);

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest("[data-analytics-event]");
      if (!element) return;
      const analyticsEvent = analyticsEventFromElement(element);
      if (analyticsEvent) trackEvent(...analyticsEvent);
    };

    // Capture sees Next Link clicks before navigation or mobile-menu state changes.
    document.addEventListener("click", handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", handleClick, true);
      configureAnalytics(false);
    };
  }, [gaEnabled]);

  return null;
}
