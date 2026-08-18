"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatPrice, type AppLanguage } from "@/lib/i18n";
import type { Recipe } from "@/lib/recipe-types";

export type SavedRecipeListItem = {
  id: string;
  isPublic: boolean;
  createdAt: string;
  recipe: Recipe;
};

const dietFilterOptions = [
  "Bez mięsa",
  "Wegańskie",
  "Bezglutenowe",
  "Wysokobiałkowe",
];

const meatAndFishKeywords = [
  "kurcz",
  "wołow",
  "wieprz",
  "boczek",
  "szynk",
  "kiełbas",
  "indyk",
  "ryb",
  "łosoś",
  "tuńczyk",
  "dorsz",
  "krewet",
  "mięso",
];

const animalProductKeywords = [
  ...meatAndFishKeywords,
  "jaj",
  "mleko",
  "ser",
  "parmezan",
  "cheddar",
  "mozzarella",
  "jogurt",
  "śmietan",
  "masło",
  "miód",
];

const glutenKeywords = [
  "makaron",
  "mąka",
  "pszen",
  "chleb",
  "bułk",
  "tortilla",
  "kasza manna",
  "seitan",
  "panier",
];

const difficultyOrder: Record<string, number> = {
  łatwy: 1,
  łatwa: 1,
  proste: 1,
  prosty: 1,
  easy: 1,
  "very easy": 1,
  średni: 2,
  średnia: 2,
  medium: 2,
  trudny: 3,
  trudna: 3,
  hard: 3,
};

const savedCopy = {
  pl: {
    search: "Szukaj po nazwie, składniku, opisie albo brakującym produkcie",
    allStatuses: "Wszystkie statusy",
    private: "Prywatne",
    public: "Publiczne",
    allDifficulties: "Każda trudność",
    allTypes: "Każdy typ",
    anyTime: "Dowolny czas",
    anyCalories: "Dowolne kcal",
    anyCost: "Dowolny koszt",
    maxCost: (value: string) => `do ${value} zł`,
    newest: "Najnowsze",
    fastest: "Najszybsze",
    easiest: "Najłatwiejsze",
    leastCalories: "Najmniej kalorii",
    cheapest: "Najtańsze",
    recipes: "przepisów",
    open: "Otwórz",
    copyLink: "Kopiuj link",
    hide: "Ukryj",
    share: "Udostępnij",
    delete: "Usuń",
    approx: "ok.",
    visibilityFailed: "Nie udało się zmienić widoczności.",
    isPublic: "Przepis jest publiczny.",
    isPrivate: "Przepis jest prywatny.",
    deleteConfirm: "Usunąć zapisany przepis",
    deleteFailed: "Nie udało się usunąć przepisu.",
    deleted: "Przepis został usunięty.",
    copied: "Link został skopiowany.",
    empty: "Nie masz jeszcze zapisanych przepisów",
    noMatches: "Brak pasujących przepisów",
    emptyHint:
      "Wygeneruj przepis i kliknij serduszko, żeby pojawił się w bibliotece.",
    noMatchesHint: "Zmień filtry albo zapisz nowy przepis w aplikacji.",
    backToGenerator: "Wróć do generatora",
    copyPublicAria: "Kopiuj publiczny link do",
    hideAria: "Ukryj przepis",
    shareAria: "Udostępnij przepis",
    deleteAria: "Usuń zapisany przepis",
    tags: {
      "Bez mięsa": "Bez mięsa",
      Wegańskie: "Wegańskie",
      Bezglutenowe: "Bezglutenowe",
      Wysokobiałkowe: "Wysokobiałkowe",
    },
  },
  en: {
    search: "Search by name, ingredient, description or missing product",
    allStatuses: "All statuses",
    private: "Private",
    public: "Public",
    allDifficulties: "Any difficulty",
    allTypes: "Any type",
    anyTime: "Any time",
    anyCalories: "Any kcal",
    anyCost: "Any cost",
    maxCost: (value: string) => `up to ${value} PLN`,
    newest: "Newest",
    fastest: "Fastest",
    easiest: "Easiest",
    leastCalories: "Lowest calories",
    cheapest: "Cheapest",
    recipes: "recipes",
    open: "Open",
    copyLink: "Copy link",
    hide: "Hide",
    share: "Share",
    delete: "Delete",
    approx: "approx.",
    visibilityFailed: "Could not change visibility.",
    isPublic: "Recipe is public.",
    isPrivate: "Recipe is private.",
    deleteConfirm: "Delete saved recipe",
    deleteFailed: "Could not delete recipe.",
    deleted: "Recipe deleted.",
    copied: "Link copied.",
    empty: "You do not have saved recipes yet",
    noMatches: "No matching recipes",
    emptyHint:
      "Generate a recipe and click the heart so it appears in your library.",
    noMatchesHint: "Change filters or save a new recipe in the app.",
    backToGenerator: "Back to generator",
    copyPublicAria: "Copy public link to",
    hideAria: "Hide recipe",
    shareAria: "Share recipe",
    deleteAria: "Delete saved recipe",
    tags: {
      "Bez mięsa": "Meat-free",
      Wegańskie: "Vegan",
      Bezglutenowe: "Gluten-free",
      Wysokobiałkowe: "High-protein",
    },
  },
} as const;

function recipeText(recipe: Recipe) {
  return [
    recipe.title,
    recipe.description,
    ...recipe.ingredients,
    ...recipe.missing,
  ]
    .join(" ")
    .toLocaleLowerCase("pl");
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function recipeDietTags(recipe: Recipe) {
  const text = recipeText(recipe);
  const tags: string[] = [];

  if (!includesAny(text, meatAndFishKeywords)) tags.push("Bez mięsa");
  if (!includesAny(text, animalProductKeywords)) tags.push("Wegańskie");
  if (!includesAny(text, glutenKeywords)) tags.push("Bezglutenowe");
  if (recipe.protein >= 25) tags.push("Wysokobiałkowe");

  return tags;
}

function difficultyRank(difficulty: string) {
  return difficultyOrder[difficulty.toLocaleLowerCase("pl")] ?? 99;
}

export function SavedRecipesLibrary({
  initialItems,
  language = "pl",
}: {
  initialItems: SavedRecipeListItem[];
  language?: AppLanguage;
}) {
  const copy = savedCopy[language];
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [dietTag, setDietTag] = useState("all");
  const [maxTime, setMaxTime] = useState("all");
  const [maxCalories, setMaxCalories] = useState("all");
  const [maxCost, setMaxCost] = useState("all");
  const [sort, setSort] = useState("newest");
  const [pendingId, setPendingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    window.localStorage.setItem(
      "smart-recipe:favorites",
      JSON.stringify(
        items.map((item) => ({
          ...item.recipe,
          savedId: item.id,
          isPublic: item.isPublic,
        })),
      ),
    );
  }, [items]);

  const difficulties = useMemo(
    () => [...new Set(items.map((item) => item.recipe.difficulty))].sort(),
    [items],
  );

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pl");
    const timeLimit = maxTime === "all" ? null : Number(maxTime);
    const calorieLimit = maxCalories === "all" ? null : Number(maxCalories);
    const costLimit = maxCost === "all" ? null : Number(maxCost);

    return items
      .filter(
        (item) =>
          (!query ||
            recipeText(item.recipe).includes(query)) &&
          (visibility === "all" ||
            (visibility === "public" && item.isPublic) ||
            (visibility === "private" && !item.isPublic)) &&
          (difficulty === "all" || item.recipe.difficulty === difficulty) &&
          (dietTag === "all" || recipeDietTags(item.recipe).includes(dietTag)) &&
          (timeLimit === null || item.recipe.time <= timeLimit) &&
          (calorieLimit === null || item.recipe.calories <= calorieLimit) &&
          (costLimit === null ||
            (item.recipe.estimatedCost !== undefined &&
              item.recipe.estimatedCost <= costLimit)),
      )
      .sort((first, second) => {
        if (sort === "fastest") return first.recipe.time - second.recipe.time;
        if (sort === "difficulty") {
          return (
            difficultyRank(first.recipe.difficulty) -
            difficultyRank(second.recipe.difficulty)
          );
        }
        if (sort === "title") {
          return first.recipe.title.localeCompare(second.recipe.title, "pl");
        }
        if (sort === "calories")
          return first.recipe.calories - second.recipe.calories;
        if (sort === "cost") {
          return (
            (first.recipe.estimatedCost ?? Number.MAX_SAFE_INTEGER) -
            (second.recipe.estimatedCost ?? Number.MAX_SAFE_INTEGER)
          );
        }
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      });
  }, [
    dietTag,
    difficulty,
    items,
    maxCalories,
    maxCost,
    maxTime,
    search,
    sort,
    visibility,
  ]);

  function resetFilters() {
    setSearch("");
    setVisibility("all");
    setDifficulty("all");
    setDietTag("all");
    setMaxTime("all");
    setMaxCalories("all");
    setMaxCost("all");
    setSort("newest");
  }

  async function setPublic(item: SavedRecipeListItem, isPublic: boolean) {
    setPendingId(item.id);
    setMessage("");
    const response = await fetch("/api/saved-recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isPublic }),
    });
    const data = (await response.json()) as { error?: string };
    setPendingId("");

    if (!response.ok) {
      setMessage(data.error ?? copy.visibilityFailed);
      return;
    }

    setItems((current) =>
      current.map((saved) =>
        saved.id === item.id ? { ...saved, isPublic } : saved,
      ),
    );
    setMessage(isPublic ? copy.isPublic : copy.isPrivate);
  }

  async function remove(item: SavedRecipeListItem) {
    if (!window.confirm(`${copy.deleteConfirm} “${item.recipe.title}”?`)) {
      return;
    }

    setPendingId(item.id);
    setMessage("");
    const response = await fetch("/api/saved-recipes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const data = (await response.json()) as { error?: string };
    setPendingId("");

    if (!response.ok) {
      setMessage(data.error ?? copy.deleteFailed);
      return;
    }

    setItems((current) => current.filter((saved) => saved.id !== item.id));
    setMessage(copy.deleted);
  }

  async function copyLink(item: SavedRecipeListItem) {
    await navigator.clipboard.writeText(
      `${window.location.origin}/recipes/${item.id}`,
    );
    setMessage(copy.copied);
  }

  return (
    <>
      <div className="mt-7 rounded-2xl border border-[#dedbd2] bg-white p-3 shadow-sm sm:p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={copy.search}
          className="h-11 w-full rounded-xl border border-[#dedfd9] px-3 text-sm outline-none focus:border-[#71927e]"
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">{copy.allStatuses}</option>
            <option value="private">{copy.private}</option>
            <option value="public">{copy.public}</option>
          </select>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">{copy.allDifficulties}</option>
            {difficulties.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={dietTag}
            onChange={(event) => setDietTag(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">{copy.allTypes}</option>
            {dietFilterOptions.map((option) => (
              <option key={option} value={option}>
                {copy.tags[option as keyof typeof copy.tags]}
              </option>
            ))}
          </select>
          <select
            value={maxTime}
            onChange={(event) => setMaxTime(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">{copy.anyTime}</option>
            <option value="15">do 15 min</option>
            <option value="30">do 30 min</option>
            <option value="45">do 45 min</option>
            <option value="60">do 60 min</option>
          </select>
          <select
            value={maxCalories}
            onChange={(event) => setMaxCalories(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">{copy.anyCalories}</option>
            <option value="400">do 400 kcal</option>
            <option value="600">do 600 kcal</option>
            <option value="800">do 800 kcal</option>
          </select>
          <select
            value={maxCost}
            onChange={(event) => setMaxCost(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">{copy.anyCost}</option>
            <option value="20">{copy.maxCost("20")}</option>
            <option value="40">{copy.maxCost("40")}</option>
            <option value="60">{copy.maxCost("60")}</option>
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="newest">{copy.newest}</option>
            <option value="fastest">{copy.fastest}</option>
            <option value="difficulty">{copy.easiest}</option>
            <option value="calories">{copy.leastCalories}</option>
            <option value="cost">{copy.cheapest}</option>
            <option value="title">A-Z</option>
          </select>
          <button
            onClick={resetFilters}
            className="h-11 rounded-xl border border-[#d8d7d0] px-3 text-sm font-semibold text-[#59675f] transition hover:bg-[#f6f3ec]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 flex min-h-6 items-center justify-between gap-3 text-xs text-[#7a857e]">
        <span>
          {visibleItems.length} / {items.length} {copy.recipes}
        </span>
        {message && <span className="font-semibold text-[#356248]">{message}</span>}
      </div>

      {visibleItems.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[1.4rem] border border-[#dedbd2] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative grid h-36 place-items-center bg-[#edf2ed] sm:h-40">
                {item.recipe.image ? (
                  <Image
                    src={item.recipe.image.url}
                    alt={item.recipe.image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-6xl">{item.recipe.emoji}</span>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur ${
                    item.isPublic
                      ? "bg-[#dfeae1]/95 text-[#356248]"
                      : "bg-white/95 text-[#68736b]"
                  }`}
                >
                  {item.isPublic ? copy.public : copy.private}
                </span>
              </div>

              <div className="p-4">
                <h2 className="break-anywhere font-serif text-xl font-semibold sm:text-2xl">
                  {item.recipe.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#748078]">
                  {item.recipe.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#7a857e]">
                  <span className="rounded-full bg-[#f6f3ec] px-2.5 py-1">
                    {item.recipe.time} min
                  </span>
                  <span className="rounded-full bg-[#f6f3ec] px-2.5 py-1">
                    {item.recipe.difficulty}
                  </span>
                  <span className="rounded-full bg-[#f6f3ec] px-2.5 py-1">
                    {item.recipe.calories} kcal
                  </span>
                  {item.recipe.estimatedCost && (
                    <span className="rounded-full bg-[#f6f3ec] px-2.5 py-1">
                      {copy.approx}{" "}
                      {formatPrice(language, item.recipe.estimatedCost)}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recipeDietTags(item.recipe)
                    .slice(0, 3)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#eef6ef] px-2.5 py-1 text-[0.68rem] font-semibold text-[#356248]"
                      >
                        {copy.tags[tag as keyof typeof copy.tags]}
                      </span>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eeeae2] pt-3">
                  <Link
                    href={`/recipes/${item.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#2f684f] px-3 text-xs font-semibold text-white"
                  >
                    {copy.open}
                  </Link>
                  {item.isPublic && (
                    <button
                      onClick={() => copyLink(item)}
                      aria-label={`${copy.copyPublicAria} ${item.recipe.title}`}
                      className="rounded-xl bg-[#edf1ec] px-3 py-2 text-xs font-semibold text-[#356248]"
                    >
                      {copy.copyLink}
                    </button>
                  )}
                  <button
                    disabled={pendingId === item.id}
                    onClick={() => setPublic(item, !item.isPublic)}
                    aria-label={
                      item.isPublic
                        ? `${copy.hideAria} ${item.recipe.title}`
                        : `${copy.shareAria} ${item.recipe.title}`
                    }
                    className="rounded-xl border border-[#d8d7d0] px-3 py-2 text-xs font-semibold disabled:opacity-40"
                  >
                    {item.isPublic ? copy.hide : copy.share}
                  </button>
                  <button
                    disabled={pendingId === item.id}
                    onClick={() => remove(item)}
                    aria-label={`${copy.deleteAria} ${item.recipe.title}`}
                    className="ml-auto px-2 py-2 text-xs font-semibold text-[#a45c45] disabled:opacity-40"
                  >
                    {copy.delete}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.7rem] border border-dashed border-[#cfcec7] bg-white/60 p-10 text-center">
          <p className="font-serif text-2xl font-semibold">
            {items.length === 0
              ? copy.empty
              : copy.noMatches}
          </p>
          <p className="mt-2 text-sm text-[#7a857e]">
            {items.length === 0
              ? copy.emptyHint
              : copy.noMatchesHint}
          </p>
          {items.length === 0 && (
            <Link
              href="/#generator"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#2f684f] px-4 text-sm font-semibold text-white"
            >
              {copy.backToGenerator}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
