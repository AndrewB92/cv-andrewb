# Andrew B. — Portfolio

Personal site powered by Next.js App Router, Tailwind CSS (v4), and Firebase. The landing page surfaces “About”, “Skills”, “Experience”, and “Projects” sections so you can highlight work while keeping content editable from Firestore later on.

## Stack

- [Next.js 16](https://nextjs.org) with the App Router and TypeScript
- Tailwind CSS (v4) for design tokens/utilities
- Firebase (client SDK ready to plug into Firestore/Storage)
- Deploy-ready on [Vercel](https://vercel.com) free tier

## Local development

```bash
npm install
npm run dev
# visit http://localhost:3000
```

Lint before pushing:

```bash
npm run lint
```

## Environment variables

Create `.env.local` (not committed) and add your Firebase project keys:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

Once the values are set you can read/write Firestore inside React Server Actions or client components via `src/lib/firebase.ts`.

## Firebase hookup checklist

1. Create a Firebase project and enable Firestore + (optionally) Authentication.
2. Add a Web App in the Firebase console and copy the config into `.env.local`.
3. (Optional) Seed collections such as `projects` or `caseStudies`.
4. Update `src/data/profile.ts` to pull static data from Firestore (e.g., server action that fetches documents through `db` from `src/lib/firebase.ts`).
5. When using Firestore on the server, prefer server actions (`app` router) or Route Handlers to keep credentials off the client.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, click **New Project**, import the repo, and keep the defaults (Framework: Next.js).
3. Add the same environment variables under **Settings → Environment Variables** (use “Production” + “Preview” scopes).
4. Deploy. Every push to `main` will redeploy automatically — previews build for every PR.

Need analytics, contact form, or Firestore CMS? Add Route Handlers (API) or integrate with Firebase Hosting/Functions while keeping Vercel for the web tier.
