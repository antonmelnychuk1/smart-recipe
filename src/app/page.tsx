"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { MealPlanner } from "@/components/meal-planner";
import { authClient } from "@/lib/auth-client";
import type { Recipe, SearchHistoryEntry } from "@/lib/recipe-types";

const emailVerificationEnabled =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED === "true";

const suggestions = ["jajka", "ryż", "kurczak", "pomidor", "szpinak"];

const sampleRecipes: Recipe[] = [
  {
    title: "Kremowe risotto z kurczakiem",
    description:
      "Proste, sycące risotto z delikatnym kurczakiem i świeżym szpinakiem.",
    time: 30,
    difficulty: "Łatwy",
    calories: 540,
    protein: 38,
    carbs: 62,
    fat: 16,
    match: 92,
    ingredients: ["ryż", "kurczak", "szpinak"],
    missing: ["bulion", "parmezan"],
    steps: [
      "Pokrój kurczaka i podsmaż go na rozgrzanej patelni.",
      "Dodaj ryż i stopniowo dolewaj gorący bulion.",
      "Pod koniec wmieszaj szpinak i parmezan.",
    ],
    emoji: "🍲",
  },
  {
    title: "Ryż smażony z jajkiem",
    description:
      "Szybki obiad z jednej patelni — idealny sposób na wykorzystanie ugotowanego ryżu.",
    time: 18,
    difficulty: "Bardzo łatwy",
    calories: 430,
    protein: 27,
    carbs: 54,
    fat: 12,
    match: 86,
    ingredients: ["ryż", "jajka", "kurczak"],
    missing: ["sos sojowy", "dymka"],
    steps: [
      "Podsmaż kurczaka na patelni.",
      "Dodaj ryż i smaż przez kilka minut.",
      "Wbij jajka, wymieszaj i dopraw sosem sojowym.",
    ],
    emoji: "🍳",
  },
  {
    title: "Szakszuka ze szpinakiem",
    description:
      "Jajka duszone w aromatycznym sosie pomidorowym z porcją zielonych warzyw.",
    time: 24,
    difficulty: "Łatwy",
    calories: 370,
    protein: 21,
    carbs: 25,
    fat: 20,
    match: 78,
    ingredients: ["jajka", "pomidor", "szpinak"],
    missing: ["cebula", "kumin"],
    steps: [
      "Podsmaż cebulę z kuminem.",
      "Dodaj pomidory i szpinak, a następnie duś sos.",
      "Zrób wgłębienia, wbij jajka i gotuj pod przykryciem.",
    ],
    emoji: "🥘",
  },
];

const accents = [
  "from-[#f7c56c] to-[#e78a43]",
  "from-[#8fbb72] to-[#4f8457]",
  "from-[#e47d5d] to-[#bc4544]",
];

const storageKeys = {
  favorites: "smart-recipe:favorites",
  history: "smart-recipe:history",
  shopping: "smart-recipe:shopping",
};

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function Icon({ name }: { name: "spark" | "clock" | "heart" | "leaf" }) {
  const paths = {
    spark: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zm6 11l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14z",
    clock:
      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v5l3 2",
    heart:
      "M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8z",
    leaf:
      "M20 4c-8 0-14 4-14 10 0 2 1 4 3 5 4-7 8-9 8-9-5 5-7 9-7 11 8 0 12-5 10-17z",
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill={name === "spark" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export default function Home() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [ingredients, setIngredients] = useState(["jajka", "ryż", "kurczak"]);
  const [input, setInput] = useState("");
  const [diet, setDiet] = useState("Bez ograniczeń");
  const [maxTime, setMaxTime] = useState("30");
  const [generated, setGenerated] = useState(false);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountDailyLimit, setAccountDailyLimit] = useState(20);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [generationUsage, setGenerationUsage] = useState<{
    limit: number;
    remaining: number;
    resetAt: string;
    unlimited?: boolean;
  } | null>(null);
  const dailyGenerationLimit = isAdmin
    ? 0
    : session?.user
      ? accountDailyLimit
      : 3;
  const currentGenerationUsage =
    generationUsage?.unlimited ||
    generationUsage?.limit === dailyGenerationLimit
      ? generationUsage
      : null;

  useEffect(() => {
    const initialization = window.setTimeout(() => {
      setFavorites(readStoredValue(storageKeys.favorites, []));
      setHistory(readStoredValue(storageKeys.history, []));
      setShoppingList(readStoredValue(storageKeys.shopping, []));
      setStorageLoaded(true);
    }, 0);

    return () => window.clearTimeout(initialization);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    window.localStorage.setItem(
      storageKeys.favorites,
      JSON.stringify(favorites),
    );
    window.localStorage.setItem(storageKeys.history, JSON.stringify(history));
    window.localStorage.setItem(
      storageKeys.shopping,
      JSON.stringify(shoppingList),
    );
  }, [favorites, history, shoppingList, storageLoaded]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!session?.user || !storageLoaded) return;

    let cancelled = false;

    async function loadKitchen() {
      const response = await fetch("/api/kitchen");
      if (!response.ok) return;

      const remote = (await response.json()) as {
        favorites: Recipe[];
        history: SearchHistoryEntry[];
        shoppingList: string[];
      };

      const remoteIsEmpty =
        remote.favorites.length === 0 &&
        remote.history.length === 0 &&
        remote.shoppingList.length === 0;
      const localHasData =
        favorites.length > 0 || history.length > 0 || shoppingList.length > 0;

      if (remoteIsEmpty && localHasData) {
        await Promise.all([
          ...favorites.map((recipe) =>
            saveKitchenAction({ action: "favorite.add", recipe }),
          ),
          ...history.map((entry) =>
            saveKitchenAction({
              action: "history.add",
              ingredients: entry.ingredients,
              diet: entry.diet,
              maxTime: entry.maxTime,
              recipes: entry.recipes,
            }),
          ),
          ...(shoppingList.length > 0
            ? [
                saveKitchenAction({
                  action: "shopping.add",
                  items: shoppingList,
                }),
              ]
            : []),
        ]);
        return;
      }

      if (!cancelled) {
        setFavorites(remote.favorites);
        setHistory(remote.history);
        setShoppingList(remote.shoppingList);
      }
    }

    void loadKitchen();

    return () => {
      cancelled = true;
    };
    // Dane lokalne są używane tylko podczas pierwszej synchronizacji po logowaniu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, storageLoaded]);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;
    fetch("/api/admin/status")
      .then((response) => response.json())
      .then((data: { isAdmin?: boolean; dailyLimit?: number }) => {
        if (!cancelled) {
          setIsAdmin(Boolean(data.isAdmin));
          setAccountDailyLimit(data.dailyLimit ?? 20);
        }
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const visibleRecipes = useMemo(
    () =>
      (generated ? generatedRecipes : sampleRecipes).filter(
        (recipe) => recipe.time <= Number(maxTime),
      ),
    [generated, generatedRecipes, maxTime],
  );

  function addIngredient(value = input) {
    const ingredient = value.trim().toLocaleLowerCase("pl");
    if (ingredient && !ingredients.includes(ingredient)) {
      setIngredients((current) => [...current, ingredient]);
    }
    setInput("");
  }

  function isFavorite(recipe: Recipe) {
    return favorites.some((favorite) => favorite.title === recipe.title);
  }

  function toggleFavorite(recipe: Recipe) {
    const removing = isFavorite(recipe);
    setFavorites((current) =>
      removing
        ? current.filter((favorite) => favorite.title !== recipe.title)
        : [recipe, ...current],
    );

    if (session?.user) {
      void saveKitchenAction(
        removing
          ? { action: "favorite.remove", title: recipe.title }
          : { action: "favorite.add", recipe },
      );
    }
  }

  function addToShoppingList(items: string[]) {
    const newItems = items.filter(
      (item) =>
        !shoppingList.some(
          (savedItem) =>
            savedItem.toLocaleLowerCase("pl") ===
            item.toLocaleLowerCase("pl"),
        ),
    );

    setShoppingList((current) => [
      ...current,
      ...newItems.filter(
        (item) =>
          !current.some(
            (savedItem) =>
              savedItem.toLocaleLowerCase("pl") ===
              item.toLocaleLowerCase("pl"),
          ),
      ),
    ]);

    setToast(
      newItems.length === 0
        ? "Te produkty są już na liście zakupów."
        : newItems.length === 1
          ? `Dodano: ${newItems[0]}`
          : `Dodano ${newItems.length} produktów do listy zakupów.`,
    );

    if (session?.user && newItems.length > 0) {
      void saveKitchenAction({ action: "shopping.add", items: newItems });
    }
  }

  function isOnShoppingList(item: string) {
    return shoppingList.some(
      (savedItem) =>
        savedItem.toLocaleLowerCase("pl") === item.toLocaleLowerCase("pl"),
    );
  }

  async function saveKitchenAction(action: Record<string, unknown>) {
    await fetch("/api/kitchen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
  }

  function restoreHistory(entry: SearchHistoryEntry) {
    setIngredients(entry.ingredients);
    setDiet(entry.diet);
    setMaxTime(String(entry.maxTime));
    setGeneratedRecipes(entry.recipes);
    setGenerated(true);
    window.setTimeout(
      () =>
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    const pendingIngredient = input.trim().toLocaleLowerCase("pl");
    const submittedIngredients =
      pendingIngredient && !ingredients.includes(pendingIngredient)
        ? [...ingredients, pendingIngredient]
        : ingredients;

    if (submittedIngredients.length === 0) return;

    setIngredients(submittedIngredients);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: submittedIngredients,
          diet,
          maxTime: Number(maxTime),
        }),
      });
      const data = (await response.json()) as {
        recipes?: Recipe[];
        error?: string;
        usage?: {
          limit: number;
          remaining: number;
          resetAt: string;
          unlimited?: boolean;
        };
      };

      if (data.usage) {
        setGenerationUsage(data.usage);
      }

      if (!response.ok || !data.recipes) {
        throw new Error(data.error ?? "Nie udało się wygenerować przepisów.");
      }

      setGeneratedRecipes(data.recipes);
      setGenerated(true);
      setHistory((current) =>
        [
          {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            ingredients: submittedIngredients,
            diet,
            maxTime: Number(maxTime),
            recipes: data.recipes!,
          },
          ...current,
        ].slice(0, 10),
      );
      if (session?.user) {
        void saveKitchenAction({
          action: "history.add",
          ingredients: submittedIngredients,
          diet,
          maxTime: Number(maxTime),
          recipes: data.recipes,
        });
      }
      window.setTimeout(
        () =>
          document
            .getElementById("results")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nie udało się wygenerować przepisów.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function resendVerification() {
    if (!session?.user.email) return;

    setVerificationPending(true);
    setVerificationMessage("");
    const result = await authClient.sendVerificationEmail({
      email: session.user.email,
      callbackURL: "/email-verified",
    });
    setVerificationPending(false);

    if (!result.error) {
      setVerificationMessage(
        "Wiadomość została wysłana. Sprawdź również folder spam.",
      );
      return;
    }

    if (result.error.code === "EMAIL_ALREADY_VERIFIED") {
      setVerificationMessage(
        "Ten adres jest już zweryfikowany. Odśwież stronę.",
      );
      return;
    }

    if (result.error.status === 429) {
      setVerificationMessage(
        "Wysłano zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.",
      );
      return;
    }

    const errorCode = result.error.code ?? `HTTP_${result.error.status}`;
    setVerificationMessage(
      `Nie udało się wysłać wiadomości. Kod: ${errorCode}.`,
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f4ed] text-[#25322b]">
      <nav className="relative z-40 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
        <a href="#" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-xl bg-[#2f684f] text-white">
            <Icon name="leaf" />
          </span>
          Smart<span className="-ml-2 text-[#dc704d]">Recipe</span>
        </a>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#667168] sm:flex">
          <a className="transition hover:text-[#25322b]" href="#how">
            Jak to działa?
          </a>
          <a className="transition hover:text-[#25322b]" href="#results">
            Przepisy
          </a>
          <a className="transition hover:text-[#25322b]" href="#meal-planner">
            Planer
          </a>
          {sessionPending ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-[#e5e2da]" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <a
                  href="/admin"
                  className="rounded-full bg-[#253d31] px-4 py-2 text-white"
                >
                  Admin
                </a>
              )}
              <a
                href="/settings"
                className="rounded-full border border-[#d9d7cd] bg-white px-4 py-2 text-[#33433a] shadow-sm"
              >
                {session.user.name}
              </a>
              <button
                onClick={() => {
                  setIsAdmin(false);
                  void authClient.signOut();
                }}
                className="text-xs text-[#7a857e] hover:text-[#2f684f]"
              >
                Wyloguj
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-full border border-[#d9d7cd] bg-white px-4 py-2 text-[#33433a] shadow-sm"
            >
              Zaloguj się
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen((current) => !current)}
          className="grid size-11 place-items-center rounded-xl border border-[#d9d7cd] bg-white text-[#33433a] shadow-sm sm:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition ${
                mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 rounded bg-current transition ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] h-0.5 w-5 rounded bg-current transition ${
                mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="relative z-30 mx-4 rounded-2xl border border-[#dedbd2] bg-white p-3 shadow-xl sm:hidden"
        >
          <div className="grid gap-1 text-sm font-semibold text-[#536159]">
            {[
              ["Jak to działa?", "#how"],
              ["Przepisy", "#results"],
              ["Planer posiłków", "#meal-planner"],
              ["Moja kuchnia", "#my-kitchen"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 transition hover:bg-[#f3f6f2] hover:text-[#2f684f]"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="mt-2 border-t border-[#ebe8e0] pt-3">
            {sessionPending ? (
              <div className="h-11 animate-pulse rounded-xl bg-[#eeeae2]" />
            ) : session?.user ? (
              <div className="grid gap-2">
                <div className="px-4 py-2">
                  <p className="text-sm font-semibold text-[#25322b]">
                    {session.user.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#7a857e]">
                    {session.user.email}
                  </p>
                </div>
                <a
                  href="/settings"
                  className="rounded-xl bg-[#f3f6f2] px-4 py-3 text-sm font-semibold text-[#356248]"
                >
                  Ustawienia konta
                </a>
                {isAdmin && (
                  <a
                    href="/admin"
                    className="rounded-xl bg-[#253d31] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Panel administratora
                  </a>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAdmin(false);
                    void authClient.signOut();
                  }}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#a45c45]"
                >
                  Wyloguj się
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthOpen(true);
                }}
                className="h-11 w-full rounded-xl bg-[#2f684f] text-sm font-semibold text-white"
              >
                Zaloguj się lub utwórz konto
              </button>
            )}
          </div>
        </div>
      )}

      {emailVerificationEnabled &&
        session?.user &&
        !session.user.emailVerified && (
        <div className="border-y border-[#efd4a8] bg-[#fff5df] px-5 py-3 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-[#795d2f]">
            <p>
              Potwierdź adres <strong>{session.user.email}</strong>, aby
              zabezpieczyć konto.
              {verificationMessage && (
                <span className="ml-2 text-xs">{verificationMessage}</span>
              )}
            </p>
            <button
              onClick={resendVerification}
              disabled={verificationPending}
              className="rounded-lg bg-[#795d2f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {verificationPending
                ? "Wysyłam..."
                : "Wyślij link weryfikacyjny"}
            </button>
          </div>
        </div>
        )}

      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8 sm:pb-20 sm:pt-10 lg:pt-20">
        <div className="pointer-events-none absolute -right-32 top-0 size-80 rounded-full bg-[#e3a96b]/20 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d8dfd7] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#48705c] sm:mb-5 sm:px-4">
            <Icon name="spark" /> Mniej marnowania, więcej smaku
          </div>
          <h1 className="font-serif text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#203128] sm:text-7xl">
            Co dziś ugotujemy
            <span className="block italic text-[#d66a49]">z tego, co masz?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#68736b] sm:mt-6 sm:text-lg">
            Wpisz produkty ze swojej kuchni. Znajdziemy dla nich pyszne
            zastosowanie i podpowiemy, czego ewentualnie brakuje.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mx-auto mt-7 max-w-4xl rounded-3xl border border-white bg-white/90 p-3 shadow-[0_24px_80px_rgba(53,68,58,0.13)] sm:mt-10 sm:rounded-[2rem] sm:p-7"
        >
          <label className="mb-2 block text-sm font-semibold text-[#35483e]">
            Twoje składniki
          </label>
          <div className="flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border border-[#dedfd9] bg-[#fbfaf6] p-2.5 focus-within:border-[#71927e] focus-within:ring-4 focus-within:ring-[#71927e]/10">
            {ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className="flex items-center gap-2 rounded-full bg-[#e5eee6] px-3 py-2 text-sm font-medium text-[#365a46]"
              >
                {ingredient}
                <button
                  type="button"
                  aria-label={`Usuń ${ingredient}`}
                  className="text-[#71847a] hover:text-[#273d32]"
                  onClick={() =>
                    setIngredients((current) =>
                      current.filter((item) => item !== ingredient),
                    )
                  }
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addIngredient();
                }
              }}
              className="min-w-36 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#a3aaa5]"
              placeholder="Dodaj produkt..."
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#828a84]">
            <span>Podpowiedzi:</span>
            {suggestions
              .filter((item) => !ingredients.includes(item))
              .map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => addIngredient(item)}
                  className="rounded-full border border-[#e1e0da] px-2.5 py-1 transition hover:border-[#8ca796] hover:text-[#3e634f]"
                >
                  + {item}
                </button>
              ))}
          </div>

          <div className="mt-4 grid gap-3 border-t border-[#eeece5] pt-4 sm:mt-6 sm:grid-cols-[1fr_1fr_auto] sm:gap-4 sm:pt-6">
            <label className="text-sm font-semibold text-[#35483e]">
              Dieta
              <select
                value={diet}
                onChange={(event) => setDiet(event.target.value)}
                className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-3 font-normal outline-none"
              >
                <option>Bez ograniczeń</option>
                <option>Wegetariańska</option>
                <option>Wegańska</option>
                <option>Bezglutenowa</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-[#35483e]">
              Maksymalny czas
              <select
                value={maxTime}
                onChange={(event) => setMaxTime(event.target.value)}
                className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-3 font-normal outline-none"
              >
                <option value="20">do 20 minut</option>
                <option value="30">do 30 minut</option>
                <option value="60">do 60 minut</option>
              </select>
            </label>
            <button
              disabled={ingredients.length === 0 || isLoading}
              className="mt-auto flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2f684f] px-6 font-semibold text-white shadow-lg shadow-[#2f684f]/20 transition hover:-translate-y-0.5 hover:bg-[#275b44] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="spark" />{" "}
              {isLoading ? "AI gotuje..." : "Generuj przepisy"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f3f6f2] px-4 py-3 text-xs text-[#617068]">
            <span>
              {session?.user ? (
                <>
                  {isAdmin ? (
                    <strong className="text-[#365a46]">
                      Konto administratora — generowanie bez limitu.
                    </strong>
                  ) : (
                    <>
                      Twoje konto obejmuje{" "}
                      <strong className="text-[#365a46]">
                        {accountDailyLimit} generowań dziennie
                      </strong>
                      .
                    </>
                  )}
                </>
              ) : (
                <>
                  Bez konta otrzymujesz{" "}
                  <strong className="text-[#365a46]">
                    3 generowania dziennie
                  </strong>
                  .
                </>
              )}
            </span>
            {!session?.user && (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="font-semibold text-[#2f684f] hover:underline"
              >
                Załóż konto — zwiększ limit do 20
              </button>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-[#fff0eb] px-4 py-3 text-sm text-[#a44436]"
            >
              {error}
              {generationUsage?.remaining === 0 && (
                <span className="mt-1 block text-xs">
                  Limit odnowi się{" "}
                  {new Intl.DateTimeFormat("pl-PL", {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(generationUsage.resetAt))}
                  .
                </span>
              )}
            </p>
          )}
          {currentGenerationUsage &&
            !currentGenerationUsage.unlimited &&
            !error && (
            <p className="mt-4 text-center text-xs text-[#7a857e]">
              Pozostało dziś:{" "}
              <strong className="text-[#466453]">
                {currentGenerationUsage.remaining}/
                {currentGenerationUsage.limit}
              </strong>{" "}
              generowań
            </p>
          )}
        </form>
      </section>

      <section id="how" className="border-y border-[#e4e0d7] bg-[#eeebe3]">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 text-center sm:grid-cols-3 sm:gap-8 sm:px-8 sm:py-8">
          {[
            ["01", "Dodaj składniki", "Wpisz to, co masz w lodówce i spiżarni."],
            ["02", "Ustaw preferencje", "Dieta, czas i poziom trudności są po Twojej stronie."],
            ["03", "Gotuj bez resztek", "Wybierz pomysł i wykorzystaj produkty do końca."],
          ].map(([number, title, text]) => (
            <div key={number} className="flex items-start gap-4 text-left">
              <span className="font-serif text-3xl italic text-[#d46c4c]">{number}</span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#748078]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="results" className="mx-auto max-w-7xl scroll-mt-8 px-4 py-12 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              {generated ? "Dopasowane dla Ciebie" : "Przykładowe inspiracje"}
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {generated
                ? `${visibleRecipes.length} pomysły na dzisiaj`
                : "Tak mogą wyglądać wyniki"}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#748078]">
            Procent dopasowania pokazuje, ile potrzebnych produktów już masz.
            Brakujące składniki łatwo przeniesiesz później na listę zakupów.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-3">
          {visibleRecipes.map((recipe, index) => (
            <article
              key={recipe.title}
              className="group min-w-0 overflow-hidden rounded-[1.7rem] border border-[#e2dfd6] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`relative grid h-48 place-items-center bg-gradient-to-br ${accents[index % accents.length]}`}
              >
                {recipe.image ? (
                  <>
                    <Image
                      src={recipe.image.url}
                      alt={recipe.image.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
                    <a
                      href={recipe.image.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-3 left-4 max-w-[75%] truncate text-[10px] font-medium text-white/90 hover:text-white hover:underline"
                    >
                      Fot. {recipe.image.photographer} · Pexels
                    </a>
                  </>
                ) : (
                  <span className="text-7xl drop-shadow-lg transition duration-300 group-hover:scale-110">
                    {recipe.emoji}
                  </span>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#356248] backdrop-blur">
                  {recipe.match}% dopasowania
                </span>
                <button
                  onClick={() => toggleFavorite(recipe)}
                  aria-label="Dodaj do ulubionych"
                  className={`absolute right-4 top-4 grid size-10 place-items-center rounded-full backdrop-blur transition ${
                    isFavorite(recipe)
                      ? "bg-[#d9684c] text-white"
                      : "bg-white/90 text-[#536159] hover:text-[#d9684c]"
                  }`}
                >
                  <Icon name="heart" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex gap-4 text-xs font-medium text-[#78837c]">
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" /> {recipe.time} min
                  </span>
                  <span>{recipe.difficulty}</span>
                  <span>{recipe.calories} kcal</span>
                </div>
                <h3 className="break-anywhere mt-4 font-serif text-2xl font-semibold">
                  {recipe.title}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#748078]">
                  {recipe.description}
                </p>
                <div className="mt-5 border-t border-[#eeeae2] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#829087]">
                    Brakuje
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recipe.missing.length > 0 ? (
                      recipe.missing.map((item) => {
                        const added = isOnShoppingList(item);
                        return (
                        <button
                          key={item}
                          onClick={() => addToShoppingList([item])}
                          disabled={added}
                          className={`break-anywhere max-w-full whitespace-normal rounded-full px-2.5 py-1 text-left text-xs font-medium transition-all duration-200 ${
                            added
                              ? "bg-[#e3eee5] text-[#356248]"
                              : "bg-[#f7eee8] text-[#a45c45] hover:-translate-y-0.5 hover:bg-[#f2ded3] hover:shadow-sm"
                          }`}
                        >
                          {added ? "✓" : "+"} {item}
                        </button>
                        );
                      })
                    ) : (
                      <span className="text-sm text-[#4f765e]">
                        Masz wszystko!
                      </span>
                    )}
                  </div>
                  {recipe.missing.length > 0 && (
                    <button
                      onClick={() => addToShoppingList(recipe.missing)}
                      disabled={recipe.missing.every(isOnShoppingList)}
                      className="mt-3 rounded-lg px-2 py-1 text-xs font-semibold text-[#a45c45] transition hover:bg-[#fff0e8] disabled:text-[#6e8376]"
                    >
                      {recipe.missing.every(isOnShoppingList)
                        ? "✓ Wszystkie są na liście"
                        : "Dodaj wszystkie brakujące"}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectedRecipe(recipe)}
                  className="mt-6 w-full rounded-xl border border-[#ccd7cf] py-3 text-sm font-semibold text-[#356248] transition hover:bg-[#edf3ee]"
                >
                  Zobacz przepis
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MealPlanner
        recipes={generated ? generatedRecipes : sampleRecipes}
        favorites={favorites}
        isSignedIn={Boolean(session?.user)}
        onOpenRecipe={setSelectedRecipe}
        onAddToShoppingList={addToShoppingList}
      />

      <section
        id="my-kitchen"
        className="scroll-mt-8 border-t border-[#e1ddd3] bg-[#eeebe3] px-4 py-12 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              Twój zapisany kącik
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Moja kuchnia
            </h2>
            <p className="mt-3 leading-7 text-[#748078]">
              {session?.user
                ? "Twoje dane są zapisane na koncie i dostępne po ponownym zalogowaniu."
                : "Dane są teraz lokalne. Zaloguj się, aby zapisać je na koncie i synchronizować."}
            </p>
            {!session?.user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="mt-5 rounded-xl bg-[#2f684f] px-5 py-3 text-sm font-semibold text-white"
              >
                Zaloguj się lub utwórz konto
              </button>
            )}
          </div>

          <div className="mt-7 grid gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-3">
            <article className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-semibold">Ulubione</h3>
                <span className="rounded-full bg-[#f7eee8] px-3 py-1 text-xs font-bold text-[#a45c45]">
                  {favorites.length}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {favorites.length > 0 ? (
                  favorites.map((recipe) => (
                    <div
                      key={recipe.title}
                      className="flex items-center gap-3 rounded-xl bg-[#faf8f3] p-3"
                    >
                      {recipe.image ? (
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={recipe.image.url}
                            alt={recipe.image.alt}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <span className="text-2xl">{recipe.emoji}</span>
                      )}
                      <button
                        onClick={() => setSelectedRecipe(recipe)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="break-anywhere block text-sm font-semibold">
                          {recipe.title}
                        </span>
                        <span className="text-xs text-[#7a857e]">
                          {recipe.time} min · {recipe.calories} kcal
                        </span>
                      </button>
                      <button
                        onClick={() => toggleFavorite(recipe)}
                        aria-label={`Usuń ${recipe.title} z ulubionych`}
                        className="text-xl text-[#d26849]"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#faf8f3] p-4 text-sm leading-6 text-[#7a857e]">
                    Kliknij serce przy przepisie, a znajdziesz go tutaj.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-semibold">Historia</h3>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      setHistory([]);
                      if (session?.user) {
                        void saveKitchenAction({ action: "history.clear" });
                      }
                    }}
                    className="text-xs font-semibold text-[#9a6251] hover:underline"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-3">
                {history.length > 0 ? (
                  history.slice(0, 5).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => restoreHistory(entry)}
                      className="block w-full rounded-xl bg-[#faf8f3] p-3 text-left transition hover:bg-[#f1eee6]"
                    >
                      <span className="break-anywhere block text-sm font-semibold">
                        {entry.ingredients.join(", ")}
                      </span>
                      <span className="mt-1 block text-xs text-[#7a857e]">
                        {new Intl.DateTimeFormat("pl-PL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(entry.createdAt))}{" "}
                        · {entry.diet}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#faf8f3] p-4 text-sm leading-6 text-[#7a857e]">
                    Po wygenerowaniu przepisów zapiszemy tutaj ostatnie
                    wyszukiwania.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-semibold">
                  Lista zakupów
                </h3>
                {shoppingList.length > 0 && (
                  <button
                    onClick={() => {
                      setShoppingList([]);
                      if (session?.user) {
                        void saveKitchenAction({ action: "shopping.clear" });
                      }
                    }}
                    className="text-xs font-semibold text-[#9a6251] hover:underline"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-2">
                {shoppingList.length > 0 ? (
                  shoppingList.map((item) => (
                    <label
                      key={item}
                      className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#faf8f3] p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        onChange={() =>
                          {
                            setShoppingList((current) =>
                              current.filter(
                                (savedItem) => savedItem !== item,
                              ),
                            );
                            if (session?.user) {
                              void saveKitchenAction({
                                action: "shopping.remove",
                                label: item,
                              });
                            }
                          }
                        }
                        className="size-4 accent-[#356248]"
                      />
                      <span>{item}</span>
                    </label>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#faf8f3] p-4 text-sm leading-6 text-[#7a857e]">
                    Dodaj brakujące produkty bezpośrednio z karty przepisu.
                  </p>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      {selectedRecipe && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#18241e]/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={selectedRecipe.title}
          onClick={() => setSelectedRecipe(null)}
        >
          <article
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#fffdf8] p-4 shadow-2xl sm:rounded-[2rem] sm:p-9"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {selectedRecipe.image ? (
                  <div className="relative mb-6 h-56 w-full overflow-hidden rounded-2xl sm:h-72">
                    <Image
                      src={selectedRecipe.image.url}
                      alt={selectedRecipe.image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <a
                      href={selectedRecipe.image.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-3 left-4 text-xs font-medium text-white hover:underline"
                    >
                      Zdjęcie: {selectedRecipe.image.photographer} · Pexels
                    </a>
                  </div>
                ) : (
                  <span className="text-5xl">{selectedRecipe.emoji}</span>
                )}
                <h2 className="break-anywhere mt-4 font-serif text-3xl font-semibold sm:text-4xl">
                  {selectedRecipe.title}
                </h2>
                <p className="mt-2 text-[#748078]">
                  {selectedRecipe.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                aria-label="Zamknij"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eeeae2] text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#edf2ed] p-4 text-sm sm:grid-cols-5">
              <span>{selectedRecipe.time} min</span>
              <span>{selectedRecipe.calories} kcal</span>
              <span>B: {selectedRecipe.protein} g</span>
              <span>W: {selectedRecipe.carbs} g</span>
              <span>T: {selectedRecipe.fat} g</span>
            </div>

            {selectedRecipe.missing.length > 0 && (
              <div className="mt-5 rounded-2xl border border-[#eee1d8] bg-[#fff8f3] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9a6251]">
                  Brakujące — kliknij, aby dodać
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedRecipe.missing.map((item) => {
                    const added = isOnShoppingList(item);
                    return (
                      <button
                        key={item}
                        onClick={() => addToShoppingList([item])}
                        disabled={added}
                        className={`break-anywhere max-w-full whitespace-normal rounded-full px-3 py-1.5 text-left text-xs font-semibold transition-all ${
                          added
                            ? "bg-[#e3eee5] text-[#356248]"
                            : "bg-white text-[#a45c45] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                        }`}
                      >
                        {added ? "✓" : "+"} {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="font-serif text-2xl font-semibold">Składniki</h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-[#59675f]">
                  {selectedRecipe.ingredients.map((ingredient) => (
                    <li key={ingredient} className="flex gap-2">
                      <span className="text-[#d26849]">•</span> {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-serif text-2xl font-semibold">
                  Przygotowanie
                </h3>
                <ol className="mt-4 space-y-4 text-sm leading-6 text-[#59675f]">
                  {selectedRecipe.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#dce9df] text-xs font-bold text-[#356248]">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </article>
        </div>
      )}

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="toast-enter fixed bottom-5 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#253d31] px-4 py-3 text-sm font-semibold text-white shadow-2xl"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15">
            ✓
          </span>
          {toast}
        </div>
      )}

      <footer className="bg-[#23362c] px-4 py-6 text-center text-sm text-[#b8c3bc] sm:px-5 sm:py-8">
        SmartRecipe · Gotuj sprytniej, marnuj mniej.{" "}
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-white/30 underline-offset-4 hover:text-white"
        >
          Photos provided by Pexels
        </a>
      </footer>
    </main>
  );
}
