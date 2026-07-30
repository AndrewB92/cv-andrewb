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

Supported query parameters include:

```text
?page=1
?stack=Next.js
```

Example response:

```json
{
  "projects": [],
  "totalPages": 1,
  "totalItems": 0,
  "currentPage": 1,
  "stackCounts": []
}
```

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
