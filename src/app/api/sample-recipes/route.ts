import { attachRecipePhotos } from "@/lib/pexels";
import { sampleRecipes } from "@/lib/sample-recipes";

export async function GET() {
  const recipes = await attachRecipePhotos(sampleRecipes);

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
