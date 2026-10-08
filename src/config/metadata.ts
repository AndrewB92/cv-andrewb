import type { Metadata } from "next";
import { identity, siteMetadata } from "./site";

/**
 * Builds canonical and social metadata using the shared site identity and preview image.
 * path is the canonical/Open Graph URL, resolved by Next.js against the site base URL.
 * A nonempty page label prefixes the name; otherwise the title uses the person's role.
 */
export function pageMetadata(path: string, page?: string): Metadata {
  const title = page
    ? `${page} • ${identity.name}`
    : `${identity.name} • ${identity.title}`;
  const description = siteMetadata.description;

  return {
    metadataBase: new URL(siteMetadata.baseUrl),
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: identity.name,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${identity.name} — ${identity.title}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}
