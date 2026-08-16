import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUsersPanel } from "@/components/admin-users-panel";
import { getCurrentAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Recipe } from "@/lib/recipe-types";

export const dynamic = "force-dynamic";

const emailVerificationEnabled =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED === "true";

const feedbackLabels: Record<string, string> = {
  liked: "👍 Super",
  too_expensive: "Za drogie",
  too_hard: "Za trudne",
  too_caloric: "Za dużo kalorii",
  bad_photo: "Zdjęcie nie pasuje",
};

const feedbackStyles: Record<string, string> = {
  liked: "bg-[#e8efe9] text-[#356248]",
  too_expensive: "bg-[#fff5df] text-[#9c6a16]",
  too_hard: "bg-[#fff0e8] text-[#a45c45]",
  too_caloric: "bg-[#f4ece8] text-[#8a5a43]",
  bad_photo: "bg-[#edf1ec] text-[#536159]",
};

const negativeFeedbackValues = Object.keys(feedbackLabels).filter(
  (feedback) => feedback !== "liked",
);

function startOfUtcDay() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function formatDate(date: Date | null) {
  if (!date) return "Brak aktywności";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function cleanIngredientName(value: string) {
  return value
    .toLocaleLowerCase("pl")
    .replace(
      /^\s*(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|szt\.?|łyżeczki?|łyżka stołowa|łyżki stołowe|łyżek stołowych)?\s+/i,
      "",
    )
    .replace(/^(danie:\s*)/i, "")
    .trim();
}

function addCount(map: Map<string, number>, key: string, value = 1) {
  const normalized = key.trim();
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) ?? 0) + value);
}

function topEntries(map: Map<string, number>, limit = 6) {
  return [...map.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, limit);
}

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const today = startOfUtcDay();
  const [
    users,
    usageRows,
    totalFavorites,
    totalMealPlans,
    totalFeedback,
    feedbackRows,
    recentFeedback,
    recentSearches,
    negativeFeedback,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        dailyLimit: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            favorites: true,
            searches: true,
            shoppingItems: true,
            mealPlans: true,
            feedbacks: true,
          },
        },
      },
    }),
    prisma.generationUsage.findMany({
      select: {
        identifier: true,
        windowStart: true,
        count: true,
        updatedAt: true,
      },
    }),
    prisma.favorite.count(),
    prisma.mealPlan.count(),
    prisma.recipeFeedback.count(),
    prisma.recipeFeedback.groupBy({
      by: ["feedback"],
      _count: { _all: true },
    }),
    prisma.recipeFeedback.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        recipeTitle: true,
        feedback: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.searchHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
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
    }),
    prisma.recipeFeedback.findMany({
      where: { feedback: { in: negativeFeedbackValues } },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        recipeTitle: true,
        feedback: true,
      },
    }),
  ]);

  const usageByUser = new Map<
    string,
    { total: number; today: number; lastActivity: Date | null }
  >();
  let totalGenerations = 0;
  let todayGenerations = 0;
  let guestGenerations = 0;

  for (const row of usageRows) {
    totalGenerations += row.count;
    const isToday = row.windowStart.getTime() === today.getTime();
    if (isToday) todayGenerations += row.count;

    if (row.identifier.startsWith("guest:")) {
      guestGenerations += row.count;
      continue;
    }

    if (!row.identifier.startsWith("user:")) continue;
    const userId = row.identifier.slice("user:".length);
    const current = usageByUser.get(userId) ?? {
      total: 0,
      today: 0,
      lastActivity: null,
    };

    current.total += row.count;
    if (isToday) current.today += row.count;
    if (!current.lastActivity || row.updatedAt > current.lastActivity) {
      current.lastActivity = row.updatedAt;
    }
    usageByUser.set(userId, current);
  }

  const activeToday = users.filter(
    (user) => (usageByUser.get(user.id)?.today ?? 0) > 0,
  ).length;
  const usersAtLimit = users.filter((user) => {
    const usage = usageByUser.get(user.id);
    return (
      user.role !== "admin" &&
      Boolean(usage) &&
      usage!.today >= user.dailyLimit
    );
  }).length;
  const adminUsers = users.map((user) => {
    const usage = usageByUser.get(user.id) ?? {
      total: 0,
      today: 0,
      lastActivity: null,
    };

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      dailyLimit: user.dailyLimit,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      usage: {
        total: usage.total,
        today: usage.today,
        lastActivity: usage.lastActivity?.toISOString() ?? null,
      },
      counts: {
        favorites: user._count.favorites,
        searches: user._count.searches,
        shoppingItems: user._count.shoppingItems,
        mealPlans: user._count.mealPlans,
        feedbacks: user._count.feedbacks,
      },
    };
  });
  const feedbackCountByType = new Map(
    feedbackRows.map((row) => [row.feedback, row._count._all]),
  );
  const searchCounts = new Map<string, number>();
  const ingredientCounts = new Map<string, number>();
  const recipeCounts = new Map<string, number>();
  const problemRecipeCounts = new Map<string, number>();

  for (const entry of recentSearches) {
    const searchLabel =
      entry.mode === "dish" && entry.query
        ? `Danie: ${entry.query}`
        : entry.ingredients.join(", ");
    addCount(searchCounts, searchLabel);

    for (const ingredient of entry.ingredients) {
      const cleanIngredient = cleanIngredientName(ingredient);
      if (cleanIngredient && !cleanIngredient.startsWith("danie:")) {
        addCount(ingredientCounts, cleanIngredient);
      }
    }

    for (const recipe of entry.recipes as Recipe[]) {
      addCount(recipeCounts, recipe.title);
    }
  }

  for (const row of negativeFeedback) {
    addCount(problemRecipeCounts, row.recipeTitle);
  }

  const topSearches = topEntries(searchCounts, 5);
  const topIngredients = topEntries(ingredientCounts, 8);
  const topRecipes = topEntries(recipeCounts, 5);
  const problemRecipes = topEntries(problemRecipeCounts, 5);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              SmartRecipe
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Panel administratora
            </h1>
            <p className="mt-2 text-sm text-[#748078]">
              Zalogowano jako {admin.email}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            ← Wróć do aplikacji
          </Link>
        </header>

        <section className="mt-6 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Użytkownicy", users.length],
            ["Generowania łącznie", totalGenerations],
            ["Generowania dzisiaj", todayGenerations],
            ["Aktywni dzisiaj", activeToday],
            ["Przy limicie", usersAtLimit],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-[#e0ddd4] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8a948e]">
                {label}
              </p>
              <p className="mt-3 font-serif text-4xl font-semibold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Ulubione przepisy", totalFavorites],
            ["Zaplanowane posiłki", totalMealPlans],
            ["Oceny przepisów", totalFeedback],
            ["Generowania gości", guestGenerations],
            [
              "Średnio na użytkownika",
              users.length
                ? (totalGenerations / users.length).toFixed(1)
                : "0",
            ],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-[#e0ddd4] bg-[#eef2ec] p-5"
            >
              <p className="text-sm text-[#68736b]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[#365a46]">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#d26849]">
                  Jakość przepisów
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold">
                  Feedback użytkowników
                </h2>
              </div>
              <span className="rounded-full bg-[#eef2ec] px-3 py-1.5 text-xs font-bold text-[#356248]">
                {totalFeedback} ocen
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {Object.entries(feedbackLabels).map(([value, label]) => {
                const count = feedbackCountByType.get(value) ?? 0;
                const percentage =
                  totalFeedback > 0
                    ? Math.round((count / totalFeedback) * 100)
                    : 0;

                return (
                  <div key={value}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          feedbackStyles[value]
                        }`}
                      >
                        {label}
                      </span>
                      <span className="font-semibold text-[#4f5e56]">
                        {count} · {percentage}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eeeae2]">
                      <div
                        className="h-full rounded-full bg-[#d26849]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#d26849]">
                  Ostatnie sygnały
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold">
                  Najnowsze oceny
                </h2>
              </div>
            </div>

            <div className="mt-5 divide-y divide-[#efede7]">
              {recentFeedback.length === 0 ? (
                <p className="rounded-2xl bg-[#faf8f3] p-4 text-sm text-[#68736b]">
                  Brak ocen. Gdy użytkownicy zaczną klikać feedback przy
                  przepisach, zobaczysz je tutaj.
                </p>
              ) : (
                recentFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {item.recipeTitle}
                      </p>
                      <p className="mt-1 text-xs text-[#7a857e]">
                        {item.user.name || item.user.email} ·{" "}
                        {formatDate(item.updatedAt)}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${
                        feedbackStyles[item.feedback] ??
                        "bg-[#edf1ec] text-[#536159]"
                      }`}
                    >
                      {feedbackLabels[item.feedback] ?? item.feedback}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-[1.7rem] border border-[#dedbd2] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#d26849]">
                Trendy
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold">
                Co użytkownicy generują najczęściej
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#7a857e]">
                Dane z ostatnich zapisanych wyszukiwań i ocen pomagają szybko
                zobaczyć, czego ludzie szukają i gdzie przepisy wymagają
                poprawy.
              </p>
            </div>
            <span className="rounded-full bg-[#eef2ec] px-3 py-1.5 text-xs font-bold text-[#356248]">
              {recentSearches.length} wpisów historii
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {[
              ["Najczęstsze zapytania", topSearches],
              ["Najczęstsze składniki", topIngredients],
              ["Najczęściej generowane przepisy", topRecipes],
              ["Przepisy do poprawy", problemRecipes],
            ].map(([title, rows]) => (
              <article
                key={title as string}
                className="rounded-2xl border border-[#eeeae2] bg-[#fffdf8] p-4"
              >
                <h3 className="text-sm font-bold text-[#365a46]">
                  {title as string}
                </h3>
                <div className="mt-4 space-y-2">
                  {(rows as [string, number][]).length > 0 ? (
                    (rows as [string, number][]).map(([label, count], index) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-[#eeeae2]"
                      >
                        <div className="min-w-0">
                          <p className="break-anywhere text-sm font-semibold">
                            {index + 1}. {label}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#eef2ec] px-2 py-1 text-xs font-bold text-[#356248]">
                          {count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-white p-3 text-sm leading-6 text-[#7a857e] ring-1 ring-[#eeeae2]">
                      Brak danych.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>

          <article className="mt-4 rounded-2xl border border-[#eeeae2] bg-[#faf8f3] p-4">
            <h3 className="text-sm font-bold text-[#365a46]">
              Najnowsze wyszukiwania
            </h3>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {recentSearches.slice(0, 6).length > 0 ? (
                recentSearches.slice(0, 6).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl bg-white p-3 ring-1 ring-[#eeeae2]"
                  >
                    <p className="break-anywhere text-sm font-semibold">
                      {entry.mode === "dish" && entry.query
                        ? `Danie: ${entry.query}`
                        : entry.ingredients.join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-[#7a857e]">
                      {formatDate(entry.createdAt)} · {entry.diet}
                      {entry.maxTime > 0 ? ` · do ${entry.maxTime} min` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-white p-3 text-sm leading-6 text-[#7a857e] ring-1 ring-[#eeeae2]">
                  Brak zapisanej historii wyszukiwań.
                </p>
              )}
            </div>
          </article>
        </section>

        <AdminUsersPanel
          users={adminUsers}
          currentAdminId={admin.id}
          emailVerificationEnabled={emailVerificationEnabled}
        />

        <p className="mt-5 text-xs leading-5 text-[#879089]">
          „Łącznie” obejmuje udane generowania zapisane w tabeli limitów.
          Historia pokazuje maksymalnie 50 ostatnich zapisanych wyszukiwań na
          konto.
        </p>
      </div>
    </main>
  );
}
