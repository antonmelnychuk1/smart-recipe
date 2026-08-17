import { attachRecipePhotos } from "@/lib/pexels";
import { getSampleRecipes } from "@/lib/sample-recipes";
import type { AppLanguage } from "@/lib/i18n";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLanguage = url.searchParams.get("language");
  const language: AppLanguage = requestedLanguage === "en" ? "en" : "pl";
  const recipes = await attachRecipePhotos(getSampleRecipes(language));

  return Response.json(
    { recipes },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=2592000, stale-while-revalidate=86400",
      },
    },
  );
}
