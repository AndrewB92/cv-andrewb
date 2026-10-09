import { PROJECT_CATEGORIES } from "@/data/projects";

/** Site metadata only. Never add URLs, user input, or booking payload fields here. */
const VALUES = {
  source: ["home_hero", "home_meta", "home_highlights", "home_featured", "projects_archive", "projects_spotlight", "projects_bottom", "contact_hero", "contact_grid", "header", "footer"],
  destination: ["live_site", "github", "codepen"],
  channel: ["email", "telegram", "whatsapp"],
  platform: ["github", "linkedin", "codepen", "gravatar"],
  cta: ["view_all_projects", "discuss_project"],
  category: ["all", ...PROJECT_CATEGORIES],
  direction: ["next", "previous"],
  meeting_type: ["intro_call", "career_conversation", "general"],
} as const;

type ParameterValues = {
  [K in keyof typeof VALUES]: (typeof VALUES)[K][number];
} & { project: string; page: number };

export type MeetingType = Exclude<ParameterValues["meeting_type"], "general">;

/** The taxonomy, parameter allowlist, and provider policy live together. */
export const ANALYTICS_EVENTS = {
  resume_click: { parameters: ["source"], clarity: true },
  project_details_open: { parameters: ["project", "source"], clarity: true },
  project_link_click: { parameters: ["project", "destination", "source"], clarity: true },
  contact_click: { parameters: ["channel", "source"], clarity: true },
  profile_click: { parameters: ["platform", "source"], clarity: true },
  schedule_click: { parameters: ["source", "meeting_type"], clarity: true },
  schedule_tab_change: { parameters: ["meeting_type"], clarity: false },
  booking_complete: { parameters: ["meeting_type"], clarity: true },
  projects_filter: { parameters: ["category"], clarity: false },
  projects_pagination: { parameters: ["page", "direction", "category"], clarity: false },
  cta_click: { parameters: ["cta", "source"], clarity: false },
} as const satisfies Record<string, { parameters: readonly (keyof ParameterValues)[]; clarity: boolean }>;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;
export type AnalyticsParameters<E extends AnalyticsEventName> = Pick<
  ParameterValues, (typeof ANALYTICS_EVENTS)[E]["parameters"][number]
>;
export type AnalyticsEvent = {
  [E in AnalyticsEventName]: [name: E, parameters: AnalyticsParameters<E>];
}[AnalyticsEventName];

type ParameterAttribute = `data-analytics-${Exclude<keyof ParameterValues, "meeting_type"> | "meeting-type"}`;
export type AnalyticsAttributes = {
  "data-analytics-event"?: AnalyticsEventName;
} & Partial<Record<ParameterAttribute, string | number>>;

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return Object.prototype.hasOwnProperty.call(ANALYTICS_EVENTS, value);
}

function attributeName(parameter: keyof ParameterValues): ParameterAttribute {
  return `data-analytics-${parameter.replaceAll("_", "-")}` as ParameterAttribute;
}

/** Safe to use from Server Components; puts metadata on the actual clickable element. */
export function analyticsAttributes(...[name, parameters]: AnalyticsEvent): AnalyticsAttributes {
  const attributes: AnalyticsAttributes = { "data-analytics-event": name };
  const values: Partial<ParameterValues> = parameters;
  for (const key of ANALYTICS_EVENTS[name].parameters) {
    attributes[attributeName(key)] = values[key];
  }
  return attributes;
}

/** Reads only known fields; rejects invalid values and drops every extra property. */
export function readAnalyticsEvent(
  name: string,
  read: (key: keyof ParameterValues) => unknown,
): AnalyticsEvent | null {
  if (!isAnalyticsEventName(name)) return null;
  const parameters: Record<string, string | number> = {};
  for (const key of ANALYTICS_EVENTS[name].parameters) {
    const value = read(key);
    if (key === "page") {
      const page = typeof value === "number" ? value : Number(value);
      if (!Number.isSafeInteger(page) || page < 1) return null;
      parameters[key] = page;
    } else if (key === "project") {
      // This value comes only from public portfolio content, never a URL or form.
      if (typeof value !== "string" || !value.trim()) return null;
      parameters[key] = value;
    } else {
      if (typeof value !== "string" || !(VALUES[key] as readonly string[]).includes(value)) return null;
      parameters[key] = value;
    }
  }
  // Every required field was validated against the event's schema above.
  return [name, parameters] as AnalyticsEvent;
}

export function analyticsEventFromElement(element: Element): AnalyticsEvent | null {
  return readAnalyticsEvent(element.getAttribute("data-analytics-event") ?? "", (key) =>
    element.getAttribute(attributeName(key)),
  );
}
