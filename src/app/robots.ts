import type { MetadataRoute } from "next";
import { siteMetadata } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteMetadata.baseUrl).href,
    host: siteMetadata.baseUrl,
  };
}
