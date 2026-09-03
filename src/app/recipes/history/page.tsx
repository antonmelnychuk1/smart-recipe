import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RecipeHistoryLibrary } from "@/components/recipe-history-library";
import { auth } from "@/lib/auth";
import {
  getUiLanguage,
  languageCookieName,
  normalizeLanguage,
  type UiLanguage,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { Recipe, SearchHistoryEntry } from "@/lib/recipe-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recipe history",
  description:
    "Browse your previous SmartRecipe AI recipe generations and restore results.",
  robots: {
    index: false,
    follow: false,
  },
};

const historyCopy: Record<
  UiLanguage,
  { title: string; description: string; saved: string; back: string }
> = {
  pl: {
    title: "Historia przepisów",
    description:
      "Przeglądaj wcześniejsze generowania, filtruj wyniki i wracaj do przepisów jednym kliknięciem.",
    saved: "Zapisane",
    back: "← Wróć do aplikacji",
  },
  en: {
    title: "Recipe history",
    description:
      "Browse previous generations, filter results and return to recipes with one click.",
    saved: "Saved",
    back: "← Back to app",
  },
  uk: {
    title: "Історія рецептів",
    description:
      "Переглядай попередні генерації, фільтруй результати та повертайся до рецептів одним кліком.",
    saved: "Збережені",
    back: "← Назад до застосунку",
  },
};

export default async function RecipeHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");
  const language = normalizeLanguage(
    (await cookies()).get(languageCookieName)?.value,
  );
  const copy = historyCopy[getUiLanguage(language)];

  const records = await prisma.searchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      mode: true,
      query: true,
      ingredients: true,
      diet: true,
      maxTime: true,
      recipes: true,
      createdAt: true,
    },
  });

  const entries: SearchHistoryEntry[] = records.map((record) => ({
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    mode: record.mode === "dish" ? "dish" : "ingredients",
    query: record.query,
    ingredients: record.ingredients,
    diet: record.diet,
    maxTime: record.maxTime,
    recipes: record.recipes as Recipe[],
  }));

  return (
    <main className="app-shell bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
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
              href="/recipes"
              className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              {copy.saved}
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              {copy.back}
            </Link>
          </div>
        </header>

        <RecipeHistoryLibrary initialEntries={entries} language={language} />
      </div>
    </main>
  );
}
