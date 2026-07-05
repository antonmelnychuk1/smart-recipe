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

export function SavedRecipesLibrary({
  initialItems,
}: {
  initialItems: SavedRecipeListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
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
    return items
      .filter(
        (item) =>
          (!query ||
            item.recipe.title.toLocaleLowerCase("pl").includes(query) ||
            item.recipe.ingredients.some((ingredient) =>
              ingredient.toLocaleLowerCase("pl").includes(query),
            )) &&
          (visibility === "all" ||
            (visibility === "public" && item.isPublic) ||
            (visibility === "private" && !item.isPublic)) &&
          (difficulty === "all" || item.recipe.difficulty === difficulty),
      )
      .sort((first, second) => {
        if (sort === "fastest") return first.recipe.time - second.recipe.time;
        if (sort === "calories")
          return first.recipe.calories - second.recipe.calories;
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      });
  }, [difficulty, items, search, sort, visibility]);

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
      <div className="mt-7 grid gap-3 rounded-2xl border border-[#dedbd2] bg-white p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Szukaj po nazwie lub składniku"
          className="h-11 rounded-xl border border-[#dedfd9] px-3 text-sm outline-none focus:border-[#71927e] lg:col-span-2"
        />
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
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
        >
          <option value="newest">Najnowsze</option>
          <option value="fastest">Najszybsze</option>
          <option value="calories">Najmniej kalorii</option>
        </select>
      </div>

      <div className="mt-4 flex min-h-6 items-center justify-between gap-3 text-xs text-[#7a857e]">
        <span>
          {visibleItems.length} z {items.length} przepisów
        </span>
        {message && <span className="font-semibold text-[#356248]">{message}</span>}
      </div>

      {visibleItems.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[1.7rem] border border-[#dedbd2] bg-white shadow-sm"
            >
              <div className="relative grid h-44 place-items-center bg-[#edf2ed]">
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

              <div className="p-4 sm:p-5">
                <h2 className="font-serif text-2xl font-semibold">
                  {item.recipe.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#748078]">
                  {item.recipe.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#7a857e]">
                  <span>{item.recipe.time} min</span>
                  <span>{item.recipe.difficulty}</span>
                  <span>{item.recipe.calories} kcal</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#eeeae2] pt-4">
                  <Link
                    href={`/recipes/${item.id}`}
                    className="rounded-xl bg-[#2f684f] px-3 py-2 text-xs font-semibold text-white"
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
            Brak pasujących przepisów
          </p>
          <p className="mt-2 text-sm text-[#7a857e]">
            Zmień filtry albo zapisz nowy przepis w aplikacji.
          </p>
        </div>
      )}
    </>
  );
}
