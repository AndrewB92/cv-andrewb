<div align="center">

# Andrew Bielous — Developer Portfolio

A production-focused personal portfolio built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and **MongoDB**.

It presents professional experience, technical expertise, selected projects, and direct contact options through a responsive, accessible, and performance-oriented interface.

[![Live Website](https://img.shields.io/badge/Live%20Website-cv--andrewb.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cv-andrewb.vercel.app/)

[![Deployment](https://img.shields.io/github/deployments/AndrewB92/cv-andrewb/Production?style=flat-square&logo=vercel&label=deployment)](https://github.com/AndrewB92/cv-andrewb/deployments)
[![Last Commit](https://img.shields.io/github/last-commit/AndrewB92/cv-andrewb?style=flat-square&logo=github)](https://github.com/AndrewB92/cv-andrewb/commits/main)
[![Repository Size](https://img.shields.io/github/repo-size/AndrewB92/cv-andrewb?style=flat-square)](https://github.com/AndrewB92/cv-andrewb)
[![Open Issues](https://img.shields.io/github/issues/AndrewB92/cv-andrewb?style=flat-square)](https://github.com/AndrewB92/cv-andrewb/issues)
[![License](https://img.shields.io/github/license/AndrewB92/cv-andrewb?style=flat-square)](LICENSE)

</div>

---

## Overview

This repository contains the source code for my professional developer portfolio. The project is designed as more than a static résumé: it is a full-stack portfolio platform with database-backed project content, filtering, pagination, reusable UI architecture, responsive interaction patterns, and production deployment through Vercel.

The website focuses on the areas most relevant to my work as a frontend and WordPress developer transitioning toward modern React and Next.js engineering:

- Production frontend architecture
- Responsive and accessible interfaces
- Performance-conscious interaction design
- Structured project presentation
- WordPress and WooCommerce experience
- React, Next.js, TypeScript, and API development

## Live Demo

**Production:** [https://cv-andrewb.vercel.app](https://cv-andrewb.vercel.app/)

## Core Features

- Next.js App Router architecture
- React Server Components by default
- Type-safe implementation with TypeScript
- MongoDB-backed portfolio and project data
- Local fallback data when MongoDB is unavailable
- Filterable and paginated project archive
- Technology usage counts and stack-based filtering
- Responsive featured-project interactions
- Desktop staged card expansion
- Mobile-friendly accordion behavior
- Lazy-loaded Cal.com scheduling integration
- Responsive contact and professional-profile sections
- Canvas-based interactive portrait effect
- SEO metadata and social sharing configuration
- Keyboard-accessible navigation and dialogs
- Reduced-motion support
- Vercel production and preview deployments

## Technology Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

### Application

- Next.js 16
- React 19
- TypeScript 5
- Next.js App Router
- React Server Components
- REST-style API routes

### Interface

- Tailwind CSS 4
- CSS Modules
- React Icons
- Canvas API
- Responsive CSS layouts
- Centralized design tokens

### Data and Integrations

- MongoDB
- Cal.com React Embed
- Cloudinary-hosted media
- Vercel deployments

## Architecture

```text
src/
├── app/
│   ├── contact/
│   ├── projects/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── contact/
│   ├── portfolio/
│   ├── CalPopup/
│   ├── Header/
│   └── shared UI
├── config/
├── data/
├── lib/
└── styles/
```

The application separates routing, reusable interface components, configuration, data normalization, and infrastructure concerns. Database documents are normalized before reaching presentation components, while local fallback data keeps supported pages available when the external data source cannot be reached.

## Project Data API

The project archive is powered by:

```http
GET /api/projects
```

The obsolete `/api/projects` endpoint has been removed; the site had no API consumers.

## Metadata and styles

Example response:

`src/styles/tokens.css` contains shared colors, typography, spacing, radii, layout dimensions,
shadows, motion and layers. Component-specific geometry and runtime animation variables stay
local. Responsive breakpoint exceptions are documented in the token file to preserve layouts.

The endpoint supports paginated results, technology filtering, total project counts, and stack usage statistics.

## Performance Strategy

The project applies several performance-oriented implementation decisions:

- Server Components are used unless client-side interactivity is required.
- External scheduling embeds are loaded only when opened.
- Only the active Cal.com tab mounts an iframe.
- Project media and third-party resources are lazy-loaded.
- Mobile layouts avoid unnecessary desktop measurements and animation calculations.
- UI animations primarily use transforms and opacity.
- Obsolete animation frames are cancelled during rapid interaction changes.
- MongoDB-backed content has resilient local fallbacks.
- Responsive behavior is handled primarily through CSS rather than runtime JavaScript.

## Accessibility

Accessibility considerations include:

- Semantic document landmarks
- Logical heading structure
- Keyboard-accessible navigation
- Visible focus indicators
- Accessible dialog and tab semantics
- `aria-current` for active navigation
- Descriptive labels for controls and external links
- Alternative text for portfolio media
- Escape-key handling for overlays and navigation
- `prefers-reduced-motion` support

## Local Development

### Requirements

- Node.js 22.12 or newer
- npm
- MongoDB connection credentials for database-backed content

### Installation

```bash
git clone https://github.com/AndrewB92/cv-andrewb.git
cd cv-andrewb
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

When `.env.example` is unavailable, create `.env.local` manually:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/
MONGODB_DB=cv-andrewb
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the local development server |
| `npm run build` | Creates an optimized production build and validates the application |
| `npm run start` | Runs the production server after a successful build |
| `npm run lint` | Runs ESLint across the project |

## Quality Checks

Run the following checks before submitting changes:

```bash
npm run lint
npm run build
```

When dependencies change, commit both `package.json` and `package-lock.json`.

## Interaction analytics

The root layout keeps the existing `GoogleAnalytics` integration. Set `GA_ID` for GA4
and `NEXT_PUBLIC_CLARITY_PROJECT_ID` for Clarity in the preview/production environment.
Clarity is already installed; its public ID is embedded at build time, so rebuild after
changing it. Leave both unset locally to avoid analytics traffic.

`src/lib/analytics/events.ts` defines the typed event taxonomy, allowed metadata, and
Clarity policy. Server Components call `analyticsAttributes(event, parameters)` on links;
one root `AnalyticsEventListener` delegates their clicks. Existing Client Components call
`trackEvent` from `src/lib/analytics/client.ts` for state-dependent actions. Add future
events to the central taxonomy; do not import provider SDKs in individual UI components.

| Event | GA4 | Clarity | Parameters | Locations |
| --- | --- | --- | --- | --- |
| `resume_click` | Yes | Yes | `source` | Home hero, both footer CV links |
| `project_details_open` | Yes | Yes | `project`, `source` | Home featured projects, opening only |
| `project_link_click` | Yes | Yes | `project`, `destination`, `source` | Featured projects, archive, spotlights |
| `contact_click` | Yes | Yes | `channel`, `source` | Home facts, contact hero/grid, footer |
| `profile_click` | Yes | Yes | `platform`, `source` | Contact grid, footer |
| `schedule_click` | Yes | Yes | `source`, `meeting_type` | Home hero, header, contact grid, footer |
| `schedule_tab_change` | Yes | No | `meeting_type` | Intentional Cal tab changes |
| `booking_complete` | Yes | Yes | `meeting_type` | Successful embedded Cal booking |
| `projects_filter` | Yes | No | `category` | Project archive |
| `projects_pagination` | Yes | No | `page`, `direction`, `category` | Project archive |
| `cta_click` | Yes | No | `cta`, `source` | View all projects, Discuss a project |

Custom parameters contain only site metadata, never addresses, phone numbers, identities,
form input, URLs, or booking attendee data. Clarity receives only the event name; no
`identify` calls or custom tags are used. Project names come from public portfolio content.
Ordinary navigation, pageviews, scrolling, carousel controls, and menu toggles have no custom
events. Provider failures are silent, and tracking never waits for delivery or cancels navigation.

The installed `@calcom/embed-react` 1.5.3 supports `bookingSuccessfulV2` and `off` through
`getCalApi`. The active tab owns its listener, with cleanup on tab changes, close, or unmount.
The callback ignores the entire payload and records the first completion per mounted embed;
repeat callbacks are suppressed. The `hour-meeting` alias reports `intro_call`.
External Cal.com links record scheduling intent only: the portfolio cannot observe bookings
made on a separate Cal.com page. See [Cal's embed events](https://cal.com/help/embedding/embed-events).

Run `node --test tests/*.test.mjs` alongside lint, a clean build, TypeScript, and
`git diff --check`. Tests use in-memory provider doubles and do not send analytics.

Before considering delivery verified, use a deployment with real provider IDs:

1. In GA4 Realtime (or DebugView when configured), click each action above once and check
   the event name and allowed parameters. Test nested icons, keyboard activation, compact
   and expanded cards, browser back/forward, tab switches, and popup reopen. Closing details
   or opening a default Cal tab must not create another engagement event.
2. In Clarity, check high-value events under Recordings / Filters / Smart Events; archive
   filters, pagination, tab changes, and CTA clicks should not appear as custom API events.
   See [Clarity smart events](https://learn.microsoft.com/en-us/clarity/setup-and-installation/smart-events).
3. Complete one booking using an appropriate test event/attendee. Inspect the outgoing GA
   request and provider dashboards: exactly one `booking_complete`, with only `meeting_type`
   as its custom parameter, and no attendee data. Close/reopen and repeat for the other tab.

Local automated checks do not establish GA4/Clarity delivery or verify a real booking.

## Deployment

The production website is deployed with Vercel.

1. Import the GitHub repository into Vercel.
2. Configure `MONGODB_URI` and `MONGODB_DB`.
3. Use the standard Next.js framework preset.
4. Deploy the production branch.

Connected branches and pull requests can generate isolated preview deployments for validation before production release.

## Branches

- `main` — production-ready code
- `stage` — active development and preview validation

## Author

**Andrew Bielous**

Frontend and WordPress developer focused on responsive interfaces, maintainable architecture, practical performance optimization, and modern JavaScript development.

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-000000?style=flat-square&logo=vercel)](https://cv-andrewb.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-AndrewB92-181717?style=flat-square&logo=github)](https://github.com/AndrewB92)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Andrew_Bielous-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/bielousandrew)

## License and Content Usage

The implementation is available for review and educational reference. Third-party dependencies remain subject to their respective licenses.

Personal text, branding, project data, screenshots, and portrait media are not provided as reusable public assets without permission.
