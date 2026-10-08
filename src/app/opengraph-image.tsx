import { ImageResponse } from "next/og";
import { identity, siteMetadata } from "@/config/site";

export const alt = `${identity.name} — ${identity.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  // ImageResponse renders standalone artwork, without the site's CSS cascade.
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: 80, background: "#020617", color: "#f8fafc", fontFamily: "sans-serif", borderLeft: "16px solid #ba25d1" }}>
      <div style={{ display: "flex", fontSize: 28, color: "#94a3b8", marginBottom: 40 }}>{siteMetadata.siteName}</div>
      <div style={{ display: "flex", fontSize: 76, fontWeight: 700 }}>{identity.name}</div>
      <div style={{ display: "flex", fontSize: 40, marginTop: 18 }}>{identity.title}</div>
      <div style={{ display: "flex", fontSize: 26, color: "#cbd5f5", marginTop: 48 }}>{identity.stack.join(" · ")}</div>
    </div>,
    size,
  );
}
