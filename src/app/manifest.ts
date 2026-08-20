import type { MetadataRoute } from "next";
import { siteDescription, siteName, siteTitle } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteTitle,
    short_name: siteName,
    description: siteDescription,
    start_url: "/",
    scope: "/",
    lang: "en",
    dir: "ltr",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f4ed",
    theme_color: "#025026",
    categories: ["food", "lifestyle", "productivity", "health"],
    shortcuts: [
      {
        name: "Generate recipes",
        short_name: "Generate",
        description: "Create recipes from your ingredients.",
        url: "/?source=pwa-shortcut",
        icons: [
          {
            src: "/smart-recipe-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      {
        name: "Saved recipes",
        short_name: "Recipes",
        description: "Open your saved recipe library.",
        url: "/recipes?source=pwa-shortcut",
        icons: [
          {
            src: "/smart-recipe-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
    ],
    icons: [
      {
        src: "/smart-recipe-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/smart-recipe-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
