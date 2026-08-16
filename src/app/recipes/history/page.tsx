import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RecipeHistoryLibrary } from "@/components/recipe-history-library";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Recipe, SearchHistoryEntry } from "@/lib/recipe-types";

export const dynamic = "force-dynamic";

export default async function RecipeHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

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
    <main className="min-h-screen bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              SmartRecipe
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Historia przepisów
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#748078]">
              Przeglądaj wcześniejsze generowania, filtruj wyniki i wracaj do
              przepisów jednym kliknięciem.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/recipes"
              className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              Zapisane
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              ← Wróć do aplikacji
            </Link>
          </div>
        </header>

        <RecipeHistoryLibrary initialEntries={entries} />
      </div>
    </main>
  );
}
