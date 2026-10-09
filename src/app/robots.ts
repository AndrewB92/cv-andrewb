import type { MetadataRoute } from "next";
import { siteMetadata } from "@/config/site";

/** Allows all crawlers and advertises the configured site host and sitemap URL. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteMetadata.baseUrl).href,
    host: siteMetadata.baseUrl,
  };
}
