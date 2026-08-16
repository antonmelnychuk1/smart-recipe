import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CopyButton, CopyRecipeLink } from "@/components/copy-recipe-link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Recipe } from "@/lib/recipe-types";

export const dynamic = "force-dynamic";

type RecipePageProps = {
  params: Promise<{ id: string }>;
};

const getSavedRecipe = cache(async (id: string) =>
  prisma.favorite.findUnique({
    where: { id },
    select: {
      id: true,
      recipe: true,
      isPublic: true,
      userId: true,
      user: { select: { name: true } },
    },
  }),
);

function truncate(value: string, maxLength = 155) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trim()}…`
    : value;
}

function recipeText(recipe: Recipe, section: "ingredients" | "steps") {
  if (section === "ingredients") {
    return [
      `Składniki — ${recipe.title}`,
      "",
      ...recipe.ingredients.map((ingredient) => `- ${ingredient}`),
    ].join("\n");
  }

  return [
    `Przygotowanie — ${recipe.title}`,
    "",
    ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
  ].join("\n");
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const savedRecipe = await getSavedRecipe(id);

  if (!savedRecipe?.isPublic) {
    return {
      title: "Udostępniony przepis · SmartRecipe",
      description: "Przepis przygotowany w aplikacji SmartRecipe.",
    };
  }

  const recipe = savedRecipe.recipe as Recipe;
  const description = truncate(recipe.description);

  return {
    title: `${recipe.title} · SmartRecipe`,
    description,
    openGraph: {
      title: recipe.title,
      description,
      type: "article",
      images: recipe.image
        ? [
            {
              url: recipe.image.url,
              alt: recipe.image.alt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: recipe.image ? "summary_large_image" : "summary",
      title: recipe.title,
      description,
      images: recipe.image ? [recipe.image.url] : undefined,
    },
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const [savedRecipe, session] = await Promise.all([
    getSavedRecipe(id),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (
    !savedRecipe ||
    (!savedRecipe.isPublic && savedRecipe.userId !== session?.user.id)
  ) {
    notFound();
  }

  const recipe = savedRecipe.recipe as Recipe;
  const nutrition = [
    ["Kalorie", `${recipe.calories} kcal`],
    ["Białko", `${recipe.protein} g`],
    ["Węglowodany", `${recipe.carbs} g`],
    ["Tłuszcz", `${recipe.fat} g`],
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: recipe.image?.url,
    author: {
      "@type": "Organization",
      name: "SmartRecipe",
    },
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      text: step,
    })),
    totalTime: `PT${recipe.time}M`,
    nutrition: {
      "@type": "NutritionInformation",
      calories: `${recipe.calories} calories`,
      proteinContent: `${recipe.protein} g`,
      carbohydrateContent: `${recipe.carbs} g`,
      fatContent: `${recipe.fat} g`,
    },
  };

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[#dedbd2] bg-[#fffdf8] shadow-xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-72 bg-[#edf2ed] sm:min-h-96 lg:min-h-full">
            {recipe.image ? (
              <>
                <Image
                  src={recipe.image.url}
                  alt={recipe.image.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <a
                  href={recipe.image.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-4 left-5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:underline"
                >
                  Zdjęcie: {recipe.image.photographer} · Pexels
                </a>
              </>
            ) : (
              <div className="grid min-h-72 place-items-center text-8xl sm:min-h-96">
                {recipe.emoji}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e8efe9] px-3 py-1.5 text-xs font-bold text-[#356248]">
                {savedRecipe.isPublic ? "Publiczny przepis" : "Prywatny podgląd"}
              </span>
              <span className="rounded-full bg-[#fff0e8] px-3 py-1.5 text-xs font-bold text-[#a45c45]">
                {recipe.difficulty}
              </span>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              SmartRecipe
            </p>
            <h1 className="break-anywhere mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {recipe.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-[#68736b]">
              {recipe.description}
            </p>
            <p className="mt-3 text-xs text-[#929a94]">
              Udostępnia: {savedRecipe.user.name}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Czas", `${recipe.time} min`],
                ["Koszt", recipe.estimatedCost ? `ok. ${recipe.estimatedCost} zł` : "brak danych"],
                ["Dopasowanie", `${recipe.match}%`],
                ["Porcje", "2"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#e7e2d8] bg-white p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#929a94]">
                    {label}
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {savedRecipe.isPublic && <CopyRecipeLink />}
              <CopyButton
                text={recipeText(recipe, "ingredients")}
                idleLabel="Kopiuj składniki"
                className="rounded-xl border border-[#ccd7cf] bg-white px-5 py-3 text-sm font-semibold text-[#356248] transition hover:bg-[#f4f7f3]"
              />
              <CopyButton
                text={recipeText(recipe, "steps")}
                idleLabel="Kopiuj instrukcje"
                className="rounded-xl border border-[#ccd7cf] bg-white px-5 py-3 text-sm font-semibold text-[#356248] transition hover:bg-[#f4f7f3]"
              />
              <Link
                href="/"
                className="rounded-xl border border-[#ccd7cf] bg-white px-5 py-3 text-sm font-semibold text-[#356248] transition hover:bg-[#f4f7f3]"
              >
                Otwórz aplikację
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-5 border-t border-[#e8e2d8] p-5 sm:p-8 lg:grid-cols-[1fr_1.35fr] lg:p-10">
          <aside className="space-y-5">
            <section className="rounded-[1.5rem] border border-[#e5e0d7] bg-white p-5">
              <h2 className="font-serif text-2xl font-semibold">Wartości odżywcze</h2>
              <p className="mt-1 text-xs text-[#7a857e]">Szacunek na 1 porcję</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {nutrition.map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f5f7f2] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#929a94]">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#365a46]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[#e5e0d7] bg-white p-5">
              <h2 className="font-serif text-2xl font-semibold">Składniki</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#59675f]">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#d26849]" />
                    <span className="break-anywhere">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </section>

            {recipe.missing.length > 0 && (
              <section className="rounded-[1.5rem] border border-[#f0d8c7] bg-[#fff8f4] p-5">
                <h2 className="font-serif text-2xl font-semibold">
                  Do dokupienia
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {recipe.missing.map((item) => (
                    <span
                      key={item}
                      className="break-anywhere rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#a45c45] ring-1 ring-[#f0d8c7]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </aside>

          <div className="space-y-5">
            <section className="rounded-[1.5rem] border border-[#e5e0d7] bg-white p-5">
              <h2 className="font-serif text-2xl font-semibold">
                Przygotowanie
              </h2>
              <ol className="mt-5 space-y-4 text-sm leading-6 text-[#59675f]">
                {recipe.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#dce9df] text-xs font-bold text-[#356248]">
                      {index + 1}
                    </span>
                    <span className="break-anywhere pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {recipe.substitutions && recipe.substitutions.length > 0 && (
              <section className="rounded-[1.5rem] border border-[#e5e0d7] bg-[#f8fbf7] p-5">
                <h2 className="font-serif text-2xl font-semibold">
                  Zamienniki
                </h2>
                <div className="mt-4 space-y-3">
                  {recipe.substitutions.map((item) => (
                    <div
                      key={item.ingredient}
                      className="rounded-2xl bg-white p-4 ring-1 ring-[#e2eadf]"
                    >
                      <p className="break-anywhere text-sm font-bold text-[#365a46]">
                        {item.ingredient}
                      </p>
                      <p className="mt-2 break-anywhere text-sm leading-6 text-[#68736b]">
                        {item.substitutes.join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
