import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  SavedRecipesLibrary,
  type SavedRecipeListItem,
} from "@/components/saved-recipes-library";
import { auth } from "@/lib/auth";
import {
  languageCookieName,
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { Recipe } from "@/lib/recipe-types";

export const dynamic = "force-dynamic";

const savedRecipesCopy: Record<
  AppLanguage,
  { title: string; description: string; history: string; back: string }
> = {
  pl: {
    title: "Zapisane przepisy",
    description: "Wyszukuj, filtruj i zarządzaj swoimi ulubionymi przepisami.",
    history: "Historia",
    back: "← Wróć do aplikacji",
  },
  en: {
    title: "Saved recipes",
    description: "Search, filter and manage your favorite recipes.",
    history: "History",
    back: "← Back to app",
  },
};

export default async function SavedRecipesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");
  const language = normalizeLanguage(
    (await cookies()).get(languageCookieName)?.value,
  );
  const copy = savedRecipesCopy[language];

  const records = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      isPublic: true,
      createdAt: true,
      recipe: true,
    },
  });
  const recipes: SavedRecipeListItem[] = records.map((record) => ({
    id: record.id,
    isPublic: record.isPublic,
    createdAt: record.createdAt.toISOString(),
    recipe: record.recipe as Recipe,
  }));

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              SmartRecipe
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#748078]">
              {copy.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/recipes/history"
              className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              {copy.history}
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              {copy.back}
            </Link>
          </div>
        </header>

        <SavedRecipesLibrary initialItems={recipes} language={language} />
      </div>
    </main>
  );
}
