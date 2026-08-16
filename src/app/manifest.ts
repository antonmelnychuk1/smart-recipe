import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartRecipe — gotuj z tego, co masz",
    short_name: "SmartRecipe",
    description:
      "Generator przepisów, planer posiłków i lista zakupów z produktów, które masz w domu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f4ed",
    theme_color: "#2f684f",
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
