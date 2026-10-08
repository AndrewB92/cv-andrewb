import type { MetadataRoute } from "next";
import { primaryNavigation, siteMetadata } from "@/config/site";

/** Returns absolute sitemap URLs for the configured primary navigation entries. */
export default function sitemap(): MetadataRoute.Sitemap {
  return primaryNavigation.map(({ href }) => ({
    url: new URL(href, siteMetadata.baseUrl).href,
  }));
}
