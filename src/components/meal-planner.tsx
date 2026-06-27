"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type {
  MealPlanEntry,
  MealType,
  Recipe,
} from "@/lib/recipe-types";

const days = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];
const mealTypes: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Śniadanie" },
  { key: "lunch", label: "Obiad" },
  { key: "dinner", label: "Kolacja" },
];

type MealPlannerProps = {
  recipes: Recipe[];
  favorites: Recipe[];
  isSignedIn: boolean;
  onOpenRecipe: (recipe: Recipe) => void;
  onAddToShoppingList: (items: string[]) => void;
};

function mondayOf(date: Date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localStorageKey(weekStart: string) {
  return `smart-recipe:meal-plan:${weekStart}`;
}

export function MealPlanner({
  recipes,
  favorites,
  isSignedIn,
  onOpenRecipe,
  onAddToShoppingList,
}: MealPlannerProps) {
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [selection, setSelection] = useState<{
    day: number;
    mealType: MealType;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const weekStart = dateKey(week);

  const availableRecipes = useMemo(() => {
    const unique = new Map<string, Recipe>();
    [...recipes, ...favorites].forEach((recipe) =>
      unique.set(recipe.title, recipe),
    );
    return [...unique.values()];
  }, [favorites, recipes]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setIsLoading(true);

      if (!isSignedIn) {
        const stored = window.localStorage.getItem(
          localStorageKey(weekStart),
        );
        if (!cancelled) {
          setEntries(stored ? (JSON.parse(stored) as MealPlanEntry[]) : []);
          setIsLoading(false);
        }
        return;
      }

      const response = await fetch(
        `/api/meal-plan?weekStart=${encodeURIComponent(weekStart)}`,
      );
      if (!response.ok) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const data = (await response.json()) as { entries: MealPlanEntry[] };
      const local = window.localStorage.getItem(localStorageKey(weekStart));
      const localEntries = local ? (JSON.parse(local) as MealPlanEntry[]) : [];

      if (data.entries.length === 0 && localEntries.length > 0) {
        await Promise.all(
          localEntries.map((entry) =>
            saveRemote({
              action: "set",
              weekStart,
              day: entry.day,
              mealType: entry.mealType,
              recipe: entry.recipe,
            }),
          ),
        );
        if (!cancelled) setEntries(localEntries);
      } else if (!cancelled) {
        setEntries(data.entries);
      }

      if (!cancelled) setIsLoading(false);
    }

    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, weekStart]);

  function saveRemote(body: Record<string, unknown>) {
    return fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function persist(nextEntries: MealPlanEntry[]) {
    setEntries(nextEntries);
    window.localStorage.setItem(
      localStorageKey(weekStart),
      JSON.stringify(nextEntries),
    );
  }

  function assignRecipe(recipe: Recipe) {
    if (!selection) return;

    const entry: MealPlanEntry = {
      id: `${selection.day}-${selection.mealType}`,
      day: selection.day,
      mealType: selection.mealType,
      recipe,
    };
    const nextEntries = [
      ...entries.filter(
        (item) =>
          item.day !== selection.day || item.mealType !== selection.mealType,
      ),
      entry,
    ];

    persist(nextEntries);
    if (isSignedIn) {
      void saveRemote({
        action: "set",
        weekStart,
        day: selection.day,
        mealType: selection.mealType,
        recipe,
      });
    }
    setSelection(null);
  }

  function removeEntry(entry: MealPlanEntry) {
    persist(entries.filter((item) => item.id !== entry.id));
    if (isSignedIn) {
      void saveRemote({
        action: "remove",
        weekStart,
        day: entry.day,
        mealType: entry.mealType,
      });
    }
  }

  function shiftWeek(days: number) {
    const next = new Date(week);
    next.setDate(next.getDate() + days);
    setWeek(next);
  }

  const missingIngredients = [
    ...new Set(entries.flatMap((entry) => entry.recipe.missing)),
  ];

  return (
    <section
      id="meal-planner"
      className="scroll-mt-8 border-t border-[#e5e0d7] bg-[#faf8f3] px-5 py-20 sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              Zaplanuj z wyprzedzeniem
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Plan posiłków
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-[#748078]">
              Przypisz wygenerowane lub ulubione przepisy do wybranego dnia i
              pory posiłku.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#dedbd2] bg-white p-1.5 shadow-sm">
            <button
              onClick={() => shiftWeek(-7)}
              className="grid size-9 place-items-center rounded-full hover:bg-[#f1eee7]"
              aria-label="Poprzedni tydzień"
            >
              ←
            </button>
            <span className="min-w-44 text-center text-sm font-semibold">
              {new Intl.DateTimeFormat("pl-PL", {
                day: "numeric",
                month: "short",
              }).format(week)}
              {" – "}
              {new Intl.DateTimeFormat("pl-PL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(
                new Date(
                  week.getFullYear(),
                  week.getMonth(),
                  week.getDate() + 6,
                ),
              )}
            </span>
            <button
              onClick={() => shiftWeek(7)}
              className="grid size-9 place-items-center rounded-full hover:bg-[#f1eee7]"
              aria-label="Następny tydzień"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto pb-3">
          <div className="grid min-w-[1050px] grid-cols-7 gap-3">
            {days.map((day, dayIndex) => (
              <div key={day} className="space-y-3">
                <div className="rounded-xl bg-[#2f684f] px-3 py-3 text-center text-white">
                  <p className="text-sm font-bold">{day}</p>
                  <p className="mt-0.5 text-xs text-white/70">
                    {new Date(
                      week.getFullYear(),
                      week.getMonth(),
                      week.getDate() + dayIndex,
                    ).getDate()}
                  </p>
                </div>
                {mealTypes.map((meal) => {
                  const entry = entries.find(
                    (item) =>
                      item.day === dayIndex && item.mealType === meal.key,
                  );

                  return (
                    <div
                      key={meal.key}
                      className="min-h-36 rounded-2xl border border-[#e1ddd4] bg-white p-3 shadow-sm"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#929a94]">
                        {meal.label}
                      </p>
                      {entry ? (
                        <div className="mt-3">
                          <button
                            onClick={() => onOpenRecipe(entry.recipe)}
                            className="block w-full text-left"
                          >
                            {entry.recipe.image ? (
                              <span className="relative block h-16 overflow-hidden rounded-lg">
                                <Image
                                  src={entry.recipe.image.url}
                                  alt={entry.recipe.image.alt}
                                  fill
                                  sizes="150px"
                                  className="object-cover"
                                />
                              </span>
                            ) : (
                              <span className="text-2xl">
                                {entry.recipe.emoji}
                              </span>
                            )}
                            <span className="break-anywhere mt-2 block text-sm font-semibold leading-5">
                              {entry.recipe.title}
                            </span>
                            <span className="mt-1 block text-xs text-[#7a857e]">
                              {entry.recipe.time} min
                            </span>
                          </button>
                          <div className="mt-3 flex gap-2 text-xs font-semibold">
                            <button
                              onClick={() =>
                                setSelection({
                                  day: dayIndex,
                                  mealType: meal.key,
                                })
                              }
                              className="text-[#356248] hover:underline"
                            >
                              Zmień
                            </button>
                            <button
                              onClick={() => removeEntry(entry)}
                              className="text-[#a45c45] hover:underline"
                            >
                              Usuń
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setSelection({
                              day: dayIndex,
                              mealType: meal.key,
                            })
                          }
                          className="mt-3 grid h-24 w-full place-items-center rounded-xl border border-dashed border-[#d5d4ce] text-2xl text-[#9aa49d] transition hover:border-[#75917f] hover:bg-[#f4f7f3] hover:text-[#3f6852]"
                          aria-label={`Dodaj: ${day}, ${meal.label}`}
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e1ddd4] bg-white p-4">
          <p className="text-sm text-[#68736b]">
            {isLoading
              ? "Wczytuję plan..."
              : `${entries.length} z 21 posiłków zaplanowanych`}
            {!isSignedIn && " · plan zapisuje się na tym urządzeniu"}
          </p>
          {missingIngredients.length > 0 && (
            <button
              onClick={() => onAddToShoppingList(missingIngredients)}
              className="rounded-xl bg-[#e8efe9] px-4 py-2.5 text-sm font-semibold text-[#356248]"
            >
              Dodaj brakujące do zakupów ({missingIngredients.length})
            </button>
          )}
        </div>
      </div>

      {selection && (
        <div
          className="fixed inset-0 z-[55] grid place-items-center bg-[#18241e]/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Wybierz przepis"
          onClick={() => setSelection(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-[#fffdf8] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
                  Plan posiłków
                </p>
                <h3 className="mt-2 font-serif text-3xl font-semibold">
                  Wybierz przepis
                </h3>
              </div>
              <button
                onClick={() => setSelection(null)}
                className="grid size-9 place-items-center rounded-full bg-[#eeeae2] text-xl"
                aria-label="Zamknij"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {availableRecipes.length > 0 ? (
                availableRecipes.map((recipe) => (
                  <button
                    key={recipe.title}
                    onClick={() => assignRecipe(recipe)}
                    className="flex items-center gap-4 rounded-2xl border border-[#e1ddd4] bg-white p-4 text-left transition hover:border-[#7e9d89] hover:bg-[#f4f7f3]"
                  >
                    {recipe.image ? (
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={recipe.image.url}
                          alt={recipe.image.alt}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span className="text-3xl">{recipe.emoji}</span>
                    )}
                    <span className="min-w-0">
                      <span className="break-anywhere block text-sm font-semibold">
                        {recipe.title}
                      </span>
                      <span className="mt-1 block text-xs text-[#7a857e]">
                        {recipe.time} min · {recipe.calories} kcal
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="sm:col-span-2 rounded-xl bg-[#f5f2eb] p-5 text-sm text-[#748078]">
                  Najpierw wygeneruj lub zapisz ulubiony przepis.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
