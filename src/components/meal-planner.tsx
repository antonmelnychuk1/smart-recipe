"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type {
  MealPlanEntry,
  MealType,
  Recipe,
} from "@/lib/recipe-types";
import type { AppLanguage } from "@/lib/i18n";

const plannerCopy = {
  pl: {
    days: ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"],
    locale: "pl-PL",
    meals: {
      breakfast: "Śniadanie",
      lunch: "Obiad",
      dinner: "Kolacja",
    },
    eyebrow: "Zaplanuj z wyprzedzeniem",
    title: "Plan posiłków",
    description:
      "Przypisz wygenerowane lub ulubione przepisy do wybranego dnia i pory posiłku.",
    previousWeek: "Poprzedni tydzień",
    nextWeek: "Następny tydzień",
    copyPlan: "Kopiuj plan",
    clearWeek: "Wyczyść tydzień",
    clear: "Wyczyść",
    change: "Zmień",
    remove: "Usuń",
    addMissing: "Dodaj brakujące do zakupów",
    close: "Zamknij",
    planned: "Zaplanowane",
    mealsCount: "posiłków",
    avgCalories: "Śr. kalorie",
    kcalMeal: "kcal / posiłek",
    protein: "Białko",
    total: "łącznie",
    cost: "Koszt",
    estimated: "szacunkowo",
    time: "Czas",
    cooking: "gotowania",
    clearDay: "Wyczyszczono dzień:",
    confirmClear: "Wyczyścić cały plan posiłków dla tego tygodnia?",
    clearWeekDone: "Plan tygodnia został wyczyszczony.",
    copied: "Plan tygodnia został skopiowany.",
    copyFailed: "Nie udało się skopiować planu.",
    loading: "Wczytuję plan...",
    plannedCount: "z 21 posiłków zaplanowanych",
    local: "plan zapisuje się na tym urządzeniu",
    selectRecipe: "Wybierz przepis",
    firstGenerate: "Najpierw wygeneruj lub zapisz ulubiony przepis.",
    planPrefix: "Plan posiłków:",
    add: "Dodaj:",
  },
  en: {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    locale: "en-US",
    meals: {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
    },
    eyebrow: "Plan ahead",
    title: "Meal planner",
    description:
      "Assign generated or favorite recipes to a selected day and meal time.",
    previousWeek: "Previous week",
    nextWeek: "Next week",
    copyPlan: "Copy plan",
    clearWeek: "Clear week",
    clear: "Clear",
    change: "Change",
    remove: "Remove",
    addMissing: "Add missing to shopping list",
    close: "Close",
    planned: "Planned",
    mealsCount: "meals",
    avgCalories: "Avg. calories",
    kcalMeal: "kcal / meal",
    protein: "Protein",
    total: "total",
    cost: "Cost",
    estimated: "estimated",
    time: "Time",
    cooking: "cooking",
    clearDay: "Cleared day:",
    confirmClear: "Clear the whole meal plan for this week?",
    clearWeekDone: "The weekly plan has been cleared.",
    copied: "The weekly plan has been copied.",
    copyFailed: "Could not copy the plan.",
    loading: "Loading plan...",
    plannedCount: "of 21 meals planned",
    local: "plan is saved on this device",
    selectRecipe: "Choose recipe",
    firstGenerate: "First generate or save a favorite recipe.",
    planPrefix: "Meal plan:",
    add: "Add:",
  },
} as const;

const mealTypeKeys: MealType[] = ["breakfast", "lunch", "dinner"];

type MealPlannerProps = {
  recipes: Recipe[];
  favorites: Recipe[];
  isSignedIn: boolean;
  onOpenRecipe: (recipe: Recipe) => void;
  onAddToShoppingList: (items: string[]) => void;
  onEntriesChange?: (count: number) => void;
  language?: AppLanguage;
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

function formatWeekRange(week: Date, locale: string) {
  const end = new Date(week);
  end.setDate(end.getDate() + 6);

  return `${new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(week)} – ${new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end)}`;
}

export function MealPlanner({
  recipes,
  favorites,
  isSignedIn,
  onOpenRecipe,
  onAddToShoppingList,
  onEntriesChange,
  language = "pl",
}: MealPlannerProps) {
  const copy = plannerCopy[language];
  const mealTypes = mealTypeKeys.map((key) => ({
    key,
    label: copy.meals[key],
  }));
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [selection, setSelection] = useState<{
    day: number;
    mealType: MealType;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plannerMessage, setPlannerMessage] = useState("");
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
          const parsedEntries = stored
            ? (JSON.parse(stored) as MealPlanEntry[])
            : [];
          setEntries(parsedEntries);
          onEntriesChange?.(parsedEntries.length);
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
        if (!cancelled) {
          setEntries(localEntries);
          onEntriesChange?.(localEntries.length);
        }
      } else if (!cancelled) {
        setEntries(data.entries);
        onEntriesChange?.(data.entries.length);
      }

      if (!cancelled) setIsLoading(false);
    }

    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, onEntriesChange, weekStart]);

  function saveRemote(body: Record<string, unknown>) {
    return fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function persist(nextEntries: MealPlanEntry[]) {
    setEntries(nextEntries);
    onEntriesChange?.(nextEntries.length);
    window.localStorage.setItem(
      localStorageKey(weekStart),
      JSON.stringify(nextEntries),
    );
  }

  function assignRecipe(recipe: Recipe) {
    if (!selection) return;
    setPlannerMessage("");

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
    setPlannerMessage("");
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

  function clearDay(day: number) {
    const dayEntries = entries.filter((entry) => entry.day === day);
    if (dayEntries.length === 0) return;

    const nextEntries = entries.filter((entry) => entry.day !== day);
    persist(nextEntries);

    if (isSignedIn) {
      for (const entry of dayEntries) {
        void saveRemote({
          action: "remove",
          weekStart,
          day: entry.day,
          mealType: entry.mealType,
        });
      }
    }

    setPlannerMessage(`${copy.clearDay} ${copy.days[day]}.`);
  }

  function clearWeek() {
    if (entries.length === 0) return;
    if (!window.confirm(copy.confirmClear)) {
      return;
    }

    persist([]);
    window.localStorage.removeItem(localStorageKey(weekStart));
    if (isSignedIn) {
      void saveRemote({
        action: "clear-week",
        weekStart,
      });
    }
    setPlannerMessage(copy.clearWeekDone);
  }

  async function copyWeekPlan() {
    if (entries.length === 0) return;

    const lines = [
      `${copy.planPrefix} ${formatWeekRange(week, copy.locale)}`,
      "",
      ...copy.days.flatMap((day, dayIndex) => {
        const plannedMeals = mealTypes
          .map((meal) => {
            const entry = entries.find(
              (item) => item.day === dayIndex && item.mealType === meal.key,
            );
            return entry ? `${meal.label}: ${entry.recipe.title}` : null;
          })
          .filter(Boolean);

        return plannedMeals.length > 0 ? [day, ...plannedMeals, ""] : [];
      }),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
      setPlannerMessage(copy.copied);
    } catch {
      setPlannerMessage(copy.copyFailed);
    }
  }

  function shiftWeek(days: number) {
    setPlannerMessage("");
    const next = new Date(week);
    next.setDate(next.getDate() + days);
    setWeek(next);
  }

  const missingIngredients = [
    ...new Set(entries.flatMap((entry) => entry.recipe.missing)),
  ];
  const weekSummary = entries.reduce(
    (summary, entry) => ({
      calories: summary.calories + entry.recipe.calories,
      protein: summary.protein + entry.recipe.protein,
      cost: summary.cost + (entry.recipe.estimatedCost ?? 0),
      time: summary.time + entry.recipe.time,
    }),
    { calories: 0, protein: 0, cost: 0, time: 0 },
  );
  const averageCalories =
    entries.length > 0 ? Math.round(weekSummary.calories / entries.length) : 0;

  return (
    <section
      id="meal-planner"
      className="scroll-mt-8 border-t border-[#e5e0d7] bg-[#faf8f3] px-4 py-8 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              {copy.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-[#748078]">
              {copy.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[#dedbd2] bg-white p-1.5 shadow-sm">
              <button
                onClick={() => shiftWeek(-7)}
                className="grid size-9 place-items-center rounded-full hover:bg-[#f1eee7]"
                aria-label={copy.previousWeek}
              >
                ←
              </button>
              <span className="min-w-44 text-center text-sm font-semibold">
                {formatWeekRange(week, copy.locale)}
              </span>
              <button
                onClick={() => shiftWeek(7)}
                className="grid size-9 place-items-center rounded-full hover:bg-[#f1eee7]"
                aria-label={copy.nextWeek}
              >
                →
              </button>
            </div>
            <button
              onClick={copyWeekPlan}
              disabled={entries.length === 0}
              className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#365a46] shadow-sm disabled:opacity-40"
            >
              {copy.copyPlan}
            </button>
            <button
              onClick={clearWeek}
              disabled={entries.length === 0}
              className="rounded-xl bg-[#fff0e8] px-4 py-2.5 text-sm font-semibold text-[#9a6251] disabled:opacity-40"
            >
              {copy.clearWeek}
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-1 sm:mt-6">
          <div className="grid min-w-[620px] grid-cols-5 gap-2 sm:min-w-0 sm:gap-3">
            {[
              [copy.planned, `${entries.length}/21`, copy.mealsCount],
              [copy.avgCalories, averageCalories, copy.kcalMeal],
              [copy.protein, `${weekSummary.protein} g`, copy.total],
              [copy.cost, `${weekSummary.cost} zł`, copy.estimated],
              [copy.time, `${weekSummary.time} min`, copy.cooking],
            ].map(([label, value, hint]) => (
              <article
                key={label}
                className="rounded-2xl border border-[#e1ddd4] bg-white p-3 shadow-sm sm:p-4"
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#8a948e] sm:text-xs">
                  {label}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold sm:mt-2 sm:text-3xl">
                  {value}
                </p>
                <p className="mt-1 line-clamp-1 text-[0.68rem] text-[#7a857e] sm:text-xs">
                  {hint}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-3 sm:mt-10">
          <div className="grid min-w-[1050px] grid-cols-7 gap-3">
            {copy.days.map((day, dayIndex) => (
              <div key={day} className="space-y-3">
                <div className="rounded-xl bg-[#2f684f] px-3 py-3 text-center text-white">
                  <div>
                    <p className="text-sm font-bold">{day}</p>
                    <p className="mt-0.5 text-xs text-white/70">
                      {new Date(
                        week.getFullYear(),
                        week.getMonth(),
                        week.getDate() + dayIndex,
                      ).getDate()}
                    </p>
                  </div>
                  {entries.some((entry) => entry.day === dayIndex) && (
                    <button
                      onClick={() => clearDay(dayIndex)}
                      className="mt-2 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/25"
                    >
                      {copy.clear}
                    </button>
                  )}
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
                              {entry.recipe.time} min · {entry.recipe.calories} kcal
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
                              {copy.change}
                            </button>
                            <button
                              onClick={() => removeEntry(entry)}
                              className="text-[#a45c45] hover:underline"
                            >
                              {copy.remove}
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
                          aria-label={`${copy.add} ${day}, ${meal.label}`}
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
          <div>
            <p className="text-sm text-[#68736b]">
              {isLoading
                ? copy.loading
                : `${entries.length} ${copy.plannedCount}`}
              {!isSignedIn && ` · ${copy.local}`}
            </p>
            {plannerMessage && (
              <p className="mt-1 text-xs font-semibold text-[#356248]">
                {plannerMessage}
              </p>
            )}
          </div>
          {missingIngredients.length > 0 && (
            <button
              onClick={() => onAddToShoppingList(missingIngredients)}
              className="rounded-xl bg-[#e8efe9] px-4 py-2.5 text-sm font-semibold text-[#356248]"
            >
              {copy.addMissing} ({missingIngredients.length})
            </button>
          )}
        </div>
      </div>

      {selection && (
        <div
          className="modal-safe-area fixed inset-0 z-[55] grid place-items-center bg-[#18241e]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={copy.selectRecipe}
          onClick={() => setSelection(null)}
        >
          <div
            className="modal-panel-safe w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#fffdf8] p-4 shadow-2xl sm:rounded-[2rem] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
                  {copy.title}
                </p>
                <h3 className="mt-2 font-serif text-3xl font-semibold">
                  {copy.selectRecipe}
                </h3>
              </div>
              <button
                onClick={() => setSelection(null)}
                className="grid size-9 place-items-center rounded-full bg-[#eeeae2] text-xl"
                aria-label={copy.close}
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
                  {copy.firstGenerate}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
