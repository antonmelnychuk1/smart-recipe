import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SmartRecipe — AI recipe generator",
    short_name: "SmartRecipe",
    description:
      "Create recipes from ingredients you already have, plan meals, build shopping lists and reduce food waste with AI.",
    start_url: "/",
    scope: "/",
    lang: "en",
    dir: "ltr",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f4ed",
    theme_color: "#2f684f",
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
