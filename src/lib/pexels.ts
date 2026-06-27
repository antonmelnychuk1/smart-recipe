import type { Recipe } from "@/lib/recipe-types";

type PexelsSearchResponse = {
  photos?: Array<{
    url: string;
    photographer: string;
    photographer_url: string;
    alt: string;
    src: {
      landscape: string;
      large: string;
    };
  }>;
};

export async function attachRecipePhotos(
  recipes: Recipe[],
): Promise<Recipe[]> {
  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (!apiKey) return recipes;

  return Promise.all(
    recipes.map(async (recipe) => {
      const query = recipe.imageQuery?.trim() || recipe.title;

      try {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&locale=en-US`,
          {
            headers: { Authorization: apiKey },
            next: { revalidate: 60 * 60 * 24 * 30 },
          },
        );

        if (!response.ok) {
          console.error("Pexels search failed", {
            status: response.status,
            query,
          });
          return recipe;
        }

        const data = (await response.json()) as PexelsSearchResponse;
        const photo = data.photos?.[0];
        if (!photo) return recipe;

        return {
          ...recipe,
          image: {
            url: photo.src.landscape || photo.src.large,
            alt: photo.alt || recipe.title,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            sourceUrl: photo.url,
          },
        };
      } catch (error) {
        console.error("Pexels request failed", error);
        return recipe;
      }
    }),
  );
}
