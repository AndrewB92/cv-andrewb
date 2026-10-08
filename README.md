# Andrew B. — Portfolio

Personal portfolio website for Andrew Bielous, built with Next.js, React, TypeScript, MongoDB, and Vercel.

The site presents professional experience, technical skills, selected projects, and direct contact options through a responsive, performance-focused interface.

## Live website

The canonical origin is configured in `src/config/site.ts` (`siteMetadata.baseUrl`).

## Repository

[github.com/AndrewB92/cv-andrewb](https://github.com/AndrewB92/cv-andrewb)

## Features

- Responsive portfolio built with the Next.js App Router
- Shared static identity configuration and cached skills, experience, and project data
- MongoDB-backed content with cached last-known-good results and explicit unavailable states
- Filterable and paginated project archive
- Responsive featured-project cards
- Animated desktop project-card expansion
- Lightweight accordion behavior for tablets and mobile devices
- Responsive desktop, tablet, and mobile navigation
- Inline Cal.com scheduling popup with separate event tabs
- Professional contact page with real service and brand icons
- Canvas-based portrait effect with selective face pixelation
- Accessible keyboard interactions and focus states
- Reduced-motion support
- SEO metadata and deploy-ready Vercel configuration

## Technology stack

### Core

- [Next.js 16](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/)

### Interface

- CSS Modules
- Tailwind CSS 4
- [React Icons](https://react-icons.github.io/react-icons/)
- Custom canvas animations
- Responsive CSS layouts and design tokens

### Integrations

- [Cal.com React Embed](https://cal.com/docs/platform/embeds/embed-react)
- [Cloudinary](https://cloudinary.com/) for hosted media
- [Vercel](https://vercel.com/) for deployment

## Project structure

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
│   └── ...
├── config/
├── data/
├── lib/
└── styles/
```

The exact component paths may evolve as the project is refactored, but the main responsibilities remain separated between application routes, reusable components, configuration, data mapping, and infrastructure helpers.

## Local development

### Requirements

- Node.js 20.9 or newer
- npm
- A MongoDB connection string for live portfolio data

### Installation

```bash
git clone https://github.com/AndrewB92/cv-andrewb.git
cd cv-andrewb
npm install
```

Create a local environment file:

```bash
touch .env.local
```

Add the required variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/
MONGODB_DB=cv-andrewb
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Recommended | MongoDB connection string used to load portfolio data |
| `MONGODB_DB` | Optional | Database name; defaults to `cv-andrewb` |

Public identity, contact details, CV and scheduling links live only in `src/config/site.ts`. Successful MongoDB content is cached for 24 hours in the Next.js Data Cache. Failed revalidation retains the previous successful value. With no cached value, missing configuration or a network outage displays an explicit unavailable state, never demo CV content; that response is not statically cached. Invalid documents and permanent database errors fail visibly. A valid MongoDB environment is required to verify production content.

Do not commit `.env.local` or production credentials.

## Available scripts

```bash
npm run dev
```

Starts the local Next.js development server.

```bash
npm run build
```

Creates an optimized production build and runs TypeScript validation.

```bash
npm run start
```

Runs the production server after a successful build.

```bash
npm run lint
```

Runs ESLint across the project.

## Quality checks

Before pushing changes:

```bash
npm run lint
npm run build
```

When dependencies change, commit both files:

```text
package.json
package-lock.json
```

Avoid using `npm audit fix --force` without reviewing the proposed dependency changes, because it may install incompatible major versions.

## MongoDB data

Portfolio data is loaded through the data layer in:

```text
src/data/profile.ts
```

MongoDB access is handled through:

```text
src/lib/mongodb.ts
```

The shared portfolio loader normalizes skills, experience and projects once per cache refresh. It performs no identity query. Cache hits perform no MongoDB reads. The `portfolio` cache tag identifies the data; the 24-hour lifetime is defined in the data layer. Connection failures are logged centrally without credentials or driver messages.

Current production document samples are not included in this repository. Until they are confirmed, the existing collection/field compatibility remains: `_profile` / `profiles` / `profile` with `skills` / `_skills`, `_profile_experiences` / `_experiences` / `experiences` (or embedded experiences in `main` / `_main`), and `_portfolio` / `portfolio` / `projects` (individual documents or `items` arrays). This compatibility must not be mistaken for a confirmed canonical schema.

Supported content includes:

- Skills
- Work experience
- Portfolio projects
- Project screenshots
- Technology stacks
- Live-site, GitHub, and CodePen links

## Project archive

The `/projects` Server Component reads the shared cached portfolio data. Category filtering,
counts and pagination are implemented once in `src/data/projects.ts`. Filters and pagination
use Next.js links, including native new-tab and browser history behavior:

```text
/projects
/projects?category=corporate
/projects?page=2
/projects?category=corporate&page=2
```

The obsolete `/api/projects` endpoint has been removed; the site had no API consumers.

## Metadata and styles

`src/config/metadata.ts` derives route metadata from the canonical origin and identity in
`src/config/site.ts`. `/opengraph-image` generates a 1200×630 PNG for Open Graph and Twitter.
`/sitemap.xml` lists the three public routes; `/robots.txt` allows indexing.

`src/styles/tokens.css` contains shared colors, typography, spacing, radii, layout dimensions,
shadows, motion and layers. Component-specific geometry and runtime animation variables stay
local. Responsive breakpoint exceptions are documented in the token file to preserve layouts.

## Cal.com scheduling

The scheduling popup uses `@calcom/embed-react` and currently supports:

- Intro call
- Career conversation

The embed package is loaded only when the scheduling interface is opened. Only the active tab's embed is mounted, reducing unnecessary iframe and memory usage.

Example URLs:

```text
/?meet=intro-call
/?meet=career-conversation
```

## Responsive behavior

### Header

- Desktop navigation with an animated active indicator
- Compact menu for tablets and mobile devices
- Keyboard and Escape-key support
- Reduced-motion support

### Featured portfolio

Above the desktop breakpoint, project cards use the interactive staged expansion layout.

At tablet and mobile widths:

- Cards switch to one column
- Expansion reveals text inside the current card
- Other cards remain in normal document flow
- Expensive desktop measurements and movement animations are disabled
- The page uses natural scrolling rather than nested card scrolling

### Contact page

The contact page includes:

- Clear primary actions for email and scheduling
- Direct, messenger, and professional-profile groups
- Real icons for services and platforms
- LinkedIn inside the Profiles group
- Responsive contact cards
- Cloudinary-hosted portrait media
- Canvas-based selective face pixelation
- Configurable face mask and animation duration

## Canvas portrait effect

The portrait component:

```text
src/components/contact/PixelPortrait.tsx
```

uses the Canvas API to:

1. Draw the complete portrait.
2. Calculate average colors for blocks inside a configurable elliptical face mask.
3. Pixelate only the masked face area.
4. Reveal or restore blocks through `requestAnimationFrame`.
5. Cancel obsolete animation frames when pointer direction changes.
6. Cap canvas resolution to control CPU and memory usage.

The face region, block size, reveal duration, and reverse-animation duration can be configured from the contact page.

## Deployment

The project is configured for Vercel.

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add `MONGODB_URI` and, when needed, `MONGODB_DB`.
4. Select the branch to deploy.
5. Deploy with the standard Next.js preset.

Vercel automatically creates preview deployments for connected branches and pull requests.

## Performance principles

The project favors:

- Server Components by default
- Client Components only where interaction requires them
- Lazy loading for external embeds and project images
- One active Cal.com iframe at a time
- Responsive layouts that avoid unnecessary JavaScript measurements
- Transform- and opacity-based UI animation
- Cancelled animation frames when interactions change
- Reduced-motion support
- Cached last-known-good content and honest unavailable states during service failures
- Reusable configuration and centralized data normalization

## Accessibility

The interface includes:

- Semantic landmarks and headings
- Keyboard-accessible navigation
- Visible focus states
- `aria-current` for active navigation links
- Accessible dialog and tab semantics
- Descriptive labels for external links and controls
- Alternative text for project screenshots and portrait media
- `prefers-reduced-motion` handling

## Branches

- `main` — stable production work
- `stage` — active development and preview testing

## License

This repository contains a personal portfolio and its associated content. Reuse of the implementation should preserve third-party package licenses. Personal text, images, branding, and project data are not provided as reusable public assets.