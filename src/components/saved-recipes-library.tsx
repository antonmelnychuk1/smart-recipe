"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  średni: 2,
  średnia: 2,
  trudny: 3,
  trudna: 3,
};

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
}: {
  initialItems: SavedRecipeListItem[];
}) {
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
      setMessage(data.error ?? "Nie udało się zmienić widoczności.");
      return;
    }

    setItems((current) =>
      current.map((saved) =>
        saved.id === item.id ? { ...saved, isPublic } : saved,
      ),
    );
    setMessage(isPublic ? "Przepis jest publiczny." : "Przepis jest prywatny.");
  }

  async function remove(item: SavedRecipeListItem) {
    if (!window.confirm(`Usunąć zapisany przepis „${item.recipe.title}”?`)) {
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
      setMessage(data.error ?? "Nie udało się usunąć przepisu.");
      return;
    }

    setItems((current) => current.filter((saved) => saved.id !== item.id));
    setMessage("Przepis został usunięty.");
  }

  async function copyLink(item: SavedRecipeListItem) {
    await navigator.clipboard.writeText(
      `${window.location.origin}/recipes/${item.id}`,
    );
    setMessage("Link został skopiowany.");
  }

  return (
    <>
      <div className="mt-7 rounded-2xl border border-[#dedbd2] bg-white p-3 shadow-sm sm:p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Szukaj po nazwie, składniku, opisie albo brakującym produkcie"
          className="h-11 w-full rounded-xl border border-[#dedfd9] px-3 text-sm outline-none focus:border-[#71927e]"
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="private">Prywatne</option>
            <option value="public">Publiczne</option>
          </select>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">Każda trudność</option>
            {difficulties.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={dietTag}
            onChange={(event) => setDietTag(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">Każdy typ</option>
            {dietFilterOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={maxTime}
            onChange={(event) => setMaxTime(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">Dowolny czas</option>
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
            <option value="all">Dowolne kcal</option>
            <option value="400">do 400 kcal</option>
            <option value="600">do 600 kcal</option>
            <option value="800">do 800 kcal</option>
          </select>
          <select
            value={maxCost}
            onChange={(event) => setMaxCost(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="all">Dowolny koszt</option>
            <option value="20">do 20 zł</option>
            <option value="40">do 40 zł</option>
            <option value="60">do 60 zł</option>
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
          >
            <option value="newest">Najnowsze</option>
            <option value="fastest">Najszybsze</option>
            <option value="difficulty">Najłatwiejsze</option>
            <option value="calories">Najmniej kalorii</option>
            <option value="cost">Najtańsze</option>
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
          {visibleItems.length} z {items.length} przepisów
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
                  {item.isPublic ? "Publiczny" : "Prywatny"}
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
                      ok. {item.recipe.estimatedCost} zł
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
                        {tag}
                      </span>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eeeae2] pt-3">
                  <Link
                    href={`/recipes/${item.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#2f684f] px-3 text-xs font-semibold text-white"
                  >
                    Otwórz
                  </Link>
                  {item.isPublic && (
                    <button
                      onClick={() => copyLink(item)}
                      className="rounded-xl bg-[#edf1ec] px-3 py-2 text-xs font-semibold text-[#356248]"
                    >
                      Kopiuj link
                    </button>
                  )}
                  <button
                    disabled={pendingId === item.id}
                    onClick={() => setPublic(item, !item.isPublic)}
                    className="rounded-xl border border-[#d8d7d0] px-3 py-2 text-xs font-semibold disabled:opacity-40"
                  >
                    {item.isPublic ? "Ukryj" : "Udostępnij"}
                  </button>
                  <button
                    disabled={pendingId === item.id}
                    onClick={() => remove(item)}
                    className="ml-auto px-2 py-2 text-xs font-semibold text-[#a45c45] disabled:opacity-40"
                  >
                    Usuń
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
              ? "Nie masz jeszcze zapisanych przepisów"
              : "Brak pasujących przepisów"}
          </p>
          <p className="mt-2 text-sm text-[#7a857e]">
            {items.length === 0
              ? "Wygeneruj przepis i kliknij serduszko, żeby pojawił się w bibliotece."
              : "Zmień filtry albo zapisz nowy przepis w aplikacji."}
          </p>
          {items.length === 0 && (
            <Link
              href="/#generator"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#2f684f] px-4 text-sm font-semibold text-white"
            >
              Wróć do generatora
            </Link>
          )}
        </div>
      )}
    </>
  );
}
