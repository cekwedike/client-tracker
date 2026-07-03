import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Meridian — PLNITUDE Client Ops",
    short_name: "Meridian",
    description:
      "Client tracking, team tasks, and ops tooling for PLNITUDE outbound teams.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0D0F12",
    theme_color: "#C9A227",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
