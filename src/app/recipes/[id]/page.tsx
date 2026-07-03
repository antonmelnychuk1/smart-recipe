import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CopyRecipeLink } from "@/components/copy-recipe-link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Recipe } from "@/lib/recipe-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Udostępniony przepis · SmartRecipe",
  description: "Przepis przygotowany w aplikacji SmartRecipe.",
};

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [savedRecipe, session] = await Promise.all([
    prisma.favorite.findUnique({
      where: { id },
      select: {
        recipe: true,
        isPublic: true,
        userId: true,
        user: { select: { name: true } },
      },
    }),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (
    !savedRecipe ||
    (!savedRecipe.isPublic && savedRecipe.userId !== session?.user.id)
  ) {
    notFound();
  }

  const recipe = savedRecipe.recipe as Recipe;

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-10">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-[1.7rem] border border-[#dedbd2] bg-[#fffdf8] shadow-xl">
        {recipe.image ? (
          <div className="relative h-64 sm:h-96">
            <Image
              src={recipe.image.url}
              alt={recipe.image.alt}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            <a
              href={recipe.image.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 left-5 text-xs font-medium text-white hover:underline"
            >
              Zdjęcie: {recipe.image.photographer} · Pexels
            </a>
          </div>
        ) : (
          <div className="grid h-52 place-items-center bg-[#edf2ed] text-7xl">
            {recipe.emoji}
          </div>
        )}

        <div className="p-4 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
                Przepis SmartRecipe
              </p>
              <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                {recipe.title}
              </h1>
              <p className="mt-3 leading-7 text-[#748078]">
                {recipe.description}
              </p>
              <p className="mt-2 text-xs text-[#929a94]">
                Udostępnia: {savedRecipe.user.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedRecipe.isPublic && <CopyRecipeLink />}
              <Link
                href="/"
                className="rounded-xl border border-[#ccd7cf] px-5 py-3 text-sm font-semibold text-[#356248]"
              >
                Otwórz aplikację
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#edf2ed] p-4 text-sm sm:grid-cols-5">
            <span>{recipe.time} min</span>
            <span>{recipe.calories} kcal</span>
            <span>B: {recipe.protein} g</span>
            <span>W: {recipe.carbs} g</span>
            <span>T: {recipe.fat} g</span>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="font-serif text-2xl font-semibold">Składniki</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#59675f]">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient} className="flex gap-2">
                    <span className="text-[#d26849]">•</span>
                    {ingredient}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-serif text-2xl font-semibold">
                Przygotowanie
              </h2>
              <ol className="mt-4 space-y-4 text-sm leading-6 text-[#59675f]">
                {recipe.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#dce9df] text-xs font-bold text-[#356248]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
