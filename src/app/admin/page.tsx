import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUserActions } from "@/components/admin-user-actions";
import { getCurrentAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const emailVerificationEnabled =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED === "true";

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

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const today = startOfUtcDay();
  const [users, usageRows, totalFavorites, totalMealPlans] = await Promise.all([
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
            ["Generowania gości", guestGenerations],
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

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Ulubione przepisy", totalFavorites],
            ["Zaplanowane posiłki", totalMealPlans],
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

        <section className="mt-6 overflow-hidden rounded-[1.7rem] border border-[#dedbd2] bg-white shadow-sm sm:mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebe8e0] px-6 py-5">
            <div>
              <h2 className="font-serif text-2xl font-semibold">
                Wszyscy użytkownicy
              </h2>
              <p className="mt-1 text-sm text-[#7a857e]">
                Limity można ustawiać indywidualnie. Administratorzy generują
                bez limitu.
              </p>
            </div>
            <span className="rounded-full bg-[#e8efe9] px-3 py-1.5 text-xs font-bold text-[#356248]">
              {users.length} kont
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
              <thead className="bg-[#faf8f3] text-xs uppercase tracking-wider text-[#7b857f]">
                <tr>
                  <th className="px-6 py-4">Użytkownik</th>
                  <th className="px-4 py-4">Rola</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Dzisiaj</th>
                  <th className="px-4 py-4">Łącznie</th>
                  <th className="px-4 py-4">Ulubione</th>
                  <th className="px-4 py-4">Historia</th>
                  <th className="px-4 py-4">Plan</th>
                  <th className="px-4 py-4">Ostatnia aktywność</th>
                  <th className="px-6 py-4">Rejestracja</th>
                  <th className="px-6 py-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const usage = usageByUser.get(user.id) ?? {
                    total: 0,
                    today: 0,
                    lastActivity: null,
                  };

                  return (
                    <tr
                      key={user.id}
                      className="border-t border-[#efede7] align-top hover:bg-[#fcfbf8]"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold">{user.name}</p>
                        <p className="mt-1 text-xs text-[#7a857e]">
                          {user.email}
                        </p>
                        {emailVerificationEnabled && !user.emailVerified && (
                          <span className="mt-2 inline-block rounded-full bg-[#fff0e8] px-2 py-0.5 text-[10px] font-bold text-[#a45c45]">
                            e-mail niezweryfikowany
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                            user.role === "admin"
                              ? "bg-[#253d31] text-white"
                              : "bg-[#edf1ec] text-[#536159]"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                            user.banned
                              ? "bg-[#fff0e8] text-[#a45c45]"
                              : "bg-[#e8efe9] text-[#356248]"
                          }`}
                          title={user.banReason ?? undefined}
                        >
                          {user.banned ? "zablokowany" : "aktywny"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`whitespace-nowrap ${
                            user.role !== "admin" &&
                            usage.today >= user.dailyLimit
                              ? "font-bold text-[#b04f3a]"
                              : "font-semibold text-[#365a46]"
                          }`}
                        >
                          {user.role === "admin"
                            ? "bez limitu"
                            : `${usage.today}/${user.dailyLimit}`}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold">{usage.total}</td>
                      <td className="px-4 py-4">{user._count.favorites}</td>
                      <td className="px-4 py-4">{user._count.searches}</td>
                      <td className="px-4 py-4">{user._count.mealPlans}</td>
                      <td className="px-4 py-4 text-xs text-[#68736b]">
                        {formatDate(usage.lastActivity)}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#68736b]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <AdminUserActions
                          userId={user.id}
                          userName={user.name}
                          role={user.role}
                          banned={user.banned}
                          dailyLimit={user.dailyLimit}
                          isCurrentAdmin={user.id === admin.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-5 text-xs leading-5 text-[#879089]">
          „Łącznie” obejmuje udane generowania zapisane w tabeli limitów.
          Historia pokazuje maksymalnie 10 ostatnich zapisanych wyszukiwań na
          konto.
        </p>
      </div>
    </main>
  );
}
