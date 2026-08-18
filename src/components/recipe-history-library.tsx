"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getUiLanguage, type AppLanguage } from "@/lib/i18n";
import type { SearchHistoryEntry } from "@/lib/recipe-types";

type RecipeHistoryLibraryProps = {
  initialEntries: SearchHistoryEntry[];
  language?: AppLanguage;
};

const historyLibraryCopy = {
  pl: {
    locale: "pl-PL",
    search: "Szukaj po daniu, składniku albo opisie",
    allTypes: "Wszystkie typy",
    fromIngredients: "Ze składników",
    byDish: "Po nazwie dania",
    allDiets: "Każda dieta",
    anyTime: "Dowolny czas",
    newest: "Najnowsze",
    oldest: "Najstarsze",
    mostRecipes: "Najwięcej przepisów",
    entries: "wpisów historii",
    dish: "Danie",
    ingredients: "Składniki",
    dishPrefix: "Danie:",
    upTo: "do",
    openResults: "Otwórz wyniki",
    noHistory: "Brak pasującej historii",
    noHistoryHint: "Zmień filtry albo wygeneruj nowe przepisy w aplikacji.",
  },
  en: {
    locale: "en-US",
    search: "Search by dish, ingredient or description",
    allTypes: "All types",
    fromIngredients: "From ingredients",
    byDish: "By dish name",
    allDiets: "Any diet",
    anyTime: "Any time",
    newest: "Newest",
    oldest: "Oldest",
    mostRecipes: "Most recipes",
    entries: "history entries",
    dish: "Dish",
    ingredients: "Ingredients",
    dishPrefix: "Dish:",
    upTo: "up to",
    openResults: "Open results",
    noHistory: "No matching history",
    noHistoryHint: "Change filters or generate new recipes in the app.",
  },
} as const;

function formatDate(date: string, language: AppLanguage) {
  return new Intl.DateTimeFormat(historyLibraryCopy[getUiLanguage(language)].locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function entryTitle(entry: SearchHistoryEntry, language: AppLanguage) {
  const copy = historyLibraryCopy[getUiLanguage(language)];

  return entry.mode === "dish" && entry.query
    ? `${copy.dishPrefix} ${entry.query}`
    : entry.ingredients.join(", ");
}

export function RecipeHistoryLibrary({
  initialEntries,
  language = "pl",
}: RecipeHistoryLibraryProps) {
  const copy = historyLibraryCopy[getUiLanguage(language)];
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("all");
  const [diet, setDiet] = useState("all");
  const [maxTime, setMaxTime] = useState("all");
  const [sort, setSort] = useState("newest");

  const diets = useMemo(
    () => [...new Set(initialEntries.map((entry) => entry.diet))].sort(),
    [initialEntries],
  );

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pl");
    const timeLimit = maxTime === "all" ? null : Number(maxTime);

    return initialEntries
      .filter((entry) => {
        const recipesText = entry.recipes
          .flatMap((recipe) => [
            recipe.title,
            recipe.description,
            ...recipe.ingredients,
            ...recipe.missing,
          ])
          .join(" ")
          .toLocaleLowerCase("pl");

        return (
          (!query ||
            entryTitle(entry, language).toLocaleLowerCase("pl").includes(query) ||
            recipesText.includes(query)) &&
          (mode === "all" || entry.mode === mode) &&
          (diet === "all" || entry.diet === diet) &&
          (timeLimit === null || entry.maxTime === 0 || entry.maxTime <= timeLimit)
        );
      })
      .sort((first, second) => {
        if (sort === "oldest") {
          return (
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime()
          );
        }
        if (sort === "recipes") {
          return second.recipes.length - first.recipes.length;
        }
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      });
  }, [diet, initialEntries, language, maxTime, mode, search, sort]);

  function resetFilters() {
    setSearch("");
    setMode("all");
    setDiet("all");
    setMaxTime("all");
    setSort("newest");
  }

  function restore(entry: SearchHistoryEntry) {
    window.localStorage.setItem(
      "smart-recipe:restore-history",
      JSON.stringify(entry),
    );
    window.location.assign("/#results");
  }

  return (
    <>
      <div className="mt-7 grid gap-3 rounded-2xl border border-[#dedbd2] bg-white p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={copy.search}
          className="h-11 rounded-xl border border-[#dedfd9] px-3 text-sm outline-none focus:border-[#71927e] sm:col-span-2"
        />
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
        >
          <option value="all">{copy.allTypes}</option>
          <option value="ingredients">{copy.fromIngredients}</option>
          <option value="dish">{copy.byDish}</option>
        </select>
        <select
          value={diet}
          onChange={(event) => setDiet(event.target.value)}
          className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
        >
          <option value="all">{copy.allDiets}</option>
          {diets.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          value={maxTime}
          onChange={(event) => setMaxTime(event.target.value)}
          className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
        >
          <option value="all">{copy.anyTime}</option>
          <option value="15">{copy.upTo} 15 min</option>
          <option value="30">{copy.upTo} 30 min</option>
          <option value="45">{copy.upTo} 45 min</option>
          <option value="60">{copy.upTo} 60 min</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
        >
          <option value="newest">{copy.newest}</option>
          <option value="oldest">{copy.oldest}</option>
          <option value="recipes">{copy.mostRecipes}</option>
        </select>
        <button
          onClick={resetFilters}
          className="h-11 rounded-xl border border-[#d8d7d0] px-3 text-sm font-semibold text-[#59675f] transition hover:bg-[#f6f3ec]"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 text-xs text-[#7a857e]">
        {visibleEntries.length} / {initialEntries.length} {copy.entries}
      </div>

      {visibleEntries.length > 0 ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {visibleEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="rounded-full bg-[#eef2ec] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#356248]">
                    {entry.mode === "dish" ? copy.dish : copy.ingredients}
                  </span>
                  <h2 className="mt-3 break-anywhere font-serif text-2xl font-semibold">
                    {entryTitle(entry, language)}
                  </h2>
                  <p className="mt-1 text-xs text-[#7a857e]">
                    {formatDate(entry.createdAt, language)} · {entry.diet}
                    {entry.maxTime > 0
                      ? ` · ${copy.upTo} ${entry.maxTime} min`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => restore(entry)}
                  className="rounded-xl bg-[#2f684f] px-3 py-2 text-xs font-semibold text-white"
                >
                  {copy.openResults}
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {entry.recipes.map((recipe) => (
                  <div
                    key={recipe.title}
                    className="overflow-hidden rounded-2xl border border-[#eeeae2] bg-[#fffdf8]"
                  >
                    <div className="relative grid h-24 place-items-center bg-[#edf2ed]">
                      {recipe.image ? (
                        <Image
                          src={recipe.image.url}
                          alt={recipe.image.alt}
                          fill
                          sizes="(max-width: 768px) 33vw, 220px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-4xl">{recipe.emoji}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold">
                        {recipe.title}
                      </p>
                      <p className="mt-1 text-xs text-[#7a857e]">
                        {recipe.time} min · {recipe.calories} kcal
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.7rem] border border-dashed border-[#cfcec7] bg-white/60 p-10 text-center">
          <p className="font-serif text-2xl font-semibold">
            {copy.noHistory}
          </p>
          <p className="mt-2 text-sm text-[#7a857e]">
            {copy.noHistoryHint}
          </p>
        </div>
      )}
    </>
  );
}
