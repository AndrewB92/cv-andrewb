# Andrew B. — Portfolio

Personal portfolio website for Andrew Bielous, built with Next.js, React, TypeScript, MongoDB, and Vercel.

The site presents professional experience, technical skills, selected projects, and direct contact options through a responsive, performance-focused interface.

## Live website

[cv-andrewb.vercel.app](https://cv-andrewb.vercel.app/)

## Repository

[github.com/AndrewB92/cv-andrewb](https://github.com/AndrewB92/cv-andrewb)

## Features

- Responsive portfolio built with the Next.js App Router
- Server-rendered profile, skills, experience, and project data
- MongoDB-backed portfolio content with local fallback data
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
│   ├── api/
│   │   └── projects/
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

- Node.js 20 or newer
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

The application contains fallback profile, skills, experience, and project data. This allows supported pages to render when MongoDB is unavailable, while database-backed features should still be tested with a valid local environment.

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

The data layer normalizes database documents and falls back to local values when a query fails.

Supported content includes:

- Profile information
- Skills
- Work experience
- Portfolio projects
- Project screenshots
- Technology stacks
- Live-site, GitHub, and CodePen links

## Project API

The project archive uses:

```text
GET /api/projects
```

Supported query parameters include:

```text
?page=1
?stack=Next.js
```

The response contains:

```json
{
  "projects": [],
  "totalPages": 1,
  "totalItems": 0,
  "currentPage": 1,
  "stackCounts": []
}
```

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
- Fallback content when external services are unavailable
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