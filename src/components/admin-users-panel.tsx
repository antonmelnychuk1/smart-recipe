"use client";

import { useMemo, useState } from "react";
import { AdminUserActions } from "@/components/admin-user-actions";
import type { AppLanguage } from "@/lib/i18n";

export type AdminPanelUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  dailyLimit: number;
  emailVerified: boolean;
  createdAt: string;
  usage: {
    total: number;
    today: number;
    lastActivity: string | null;
  };
  counts: {
    favorites: number;
    searches: number;
    shoppingItems: number;
    mealPlans: number;
    feedbacks: number;
  };
};

type AdminUsersPanelProps = {
  users: AdminPanelUser[];
  currentAdminId: string;
  emailVerificationEnabled: boolean;
  language?: AppLanguage;
};

const adminUsersCopy = {
  pl: {
    noActivity: "Brak aktywności",
    accountsAndLimits: "Konta i limity",
    allUsers: "Wszyscy użytkownicy",
    description:
      "Szukaj, filtruj i zarządzaj kontami bez przewijania szerokiej tabeli.",
    accounts: "kont",
    admins: "Admini",
    bannedUsers: "Zablokowani",
    atLimit: "Przy limicie",
    unverified: "Niezweryfikowani",
    searchPlaceholder: "Szukaj po nazwie lub e-mailu",
    allRoles: "Każda rola",
    allStatuses: "Każdy status",
    activeUsers: "Aktywni",
    allVerification: "Każda weryfikacja",
    verified: "Zweryfikowani",
    allLimits: "Każdy limit",
    availableLimit: "Z dostępnym limitem",
    newest: "Najnowsi",
    lastActivity: "Ostatnia aktywność",
    mostGenerations: "Najwięcej generowań",
    mostFavorites: "Najwięcej ulubionych",
    mostHistory: "Najwięcej historii",
    reset: "Reset",
    unnamed: "Bez nazwy",
    active: "aktywny",
    banned: "zablokowany",
    emailUnverified: "e-mail niezweryfikowany",
    noLimit: "bez limitu",
    today: "Dzisiaj",
    total: "Łącznie",
    favorites: "Ulubione",
    history: "Historia",
    shopping: "Zakupy",
    feedback: "Feedback",
    plan: "Plan",
    activity: "Aktywność",
    registration: "Rejestracja:",
    noUsers: "Brak pasujących użytkowników",
    noUsersHint: "Zmień filtry albo wyczyść wyszukiwanie.",
    clearFilters: "Wyczyść filtry",
    locale: "pl-PL",
  },
  en: {
    noActivity: "No activity",
    accountsAndLimits: "Accounts and limits",
    allUsers: "All users",
    description: "Search, filter and manage accounts without a wide table.",
    accounts: "accounts",
    admins: "Admins",
    bannedUsers: "Banned",
    atLimit: "At limit",
    unverified: "Unverified",
    searchPlaceholder: "Search by name or email",
    allRoles: "Any role",
    allStatuses: "Any status",
    activeUsers: "Active",
    allVerification: "Any verification",
    verified: "Verified",
    allLimits: "Any limit",
    availableLimit: "Limit available",
    newest: "Newest",
    lastActivity: "Last activity",
    mostGenerations: "Most generations",
    mostFavorites: "Most favorites",
    mostHistory: "Most history",
    reset: "Reset",
    unnamed: "Unnamed",
    active: "active",
    banned: "banned",
    emailUnverified: "email unverified",
    noLimit: "no limit",
    today: "Today",
    total: "Total",
    favorites: "Favorites",
    history: "History",
    shopping: "Shopping",
    feedback: "Feedback",
    plan: "Plan",
    activity: "Activity",
    registration: "Registration:",
    noUsers: "No matching users",
    noUsersHint: "Change filters or clear the search.",
    clearFilters: "Clear filters",
    locale: "en-US",
  },
} as const satisfies Record<AppLanguage, Record<string, string>>;

function formatDate(date: string | null, language: AppLanguage) {
  const copy = adminUsersCopy[language];
  if (!date) return copy.noActivity;

  return new Intl.DateTimeFormat(copy.locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function isAtLimit(user: AdminPanelUser) {
  return user.role !== "admin" && user.usage.today >= user.dailyLimit;
}

function lastActivityTime(user: AdminPanelUser) {
  return user.usage.lastActivity
    ? new Date(user.usage.lastActivity).getTime()
    : 0;
}

export function AdminUsersPanel({
  users,
  currentAdminId,
  emailVerificationEnabled,
  language = "pl",
}: AdminUsersPanelProps) {
  const copy = adminUsersCopy[language];
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [verification, setVerification] = useState("all");
  const [limit, setLimit] = useState("all");
  const [sort, setSort] = useState("newest");

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pl");

    return users
      .filter((user) => {
        const searchable = `${user.name} ${user.email}`.toLocaleLowerCase("pl");

        return (
          (!query || searchable.includes(query)) &&
          (role === "all" || user.role === role) &&
          (status === "all" ||
            (status === "active" && !user.banned) ||
            (status === "banned" && user.banned)) &&
          (verification === "all" ||
            (verification === "verified" && user.emailVerified) ||
            (verification === "unverified" && !user.emailVerified)) &&
          (limit === "all" ||
            (limit === "at-limit" && isAtLimit(user)) ||
            (limit === "available" && !isAtLimit(user)))
        );
      })
      .sort((first, second) => {
        if (sort === "activity") {
          return lastActivityTime(second) - lastActivityTime(first);
        }
        if (sort === "usage") return second.usage.total - first.usage.total;
        if (sort === "favorites") {
          return second.counts.favorites - first.counts.favorites;
        }
        if (sort === "searches") {
          return second.counts.searches - first.counts.searches;
        }
        if (sort === "name") return first.name.localeCompare(second.name, "pl");

        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      });
  }, [limit, role, search, sort, status, users, verification]);

  const admins = users.filter((user) => user.role === "admin").length;
  const banned = users.filter((user) => user.banned).length;
  const atLimit = users.filter(isAtLimit).length;
  const unverified = users.filter((user) => !user.emailVerified).length;

  function resetFilters() {
    setSearch("");
    setRole("all");
    setStatus("all");
    setVerification("all");
    setLimit("all");
    setSort("newest");
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[1.7rem] border border-[#dedbd2] bg-white shadow-sm sm:mt-10">
      <div className="border-b border-[#ebe8e0] p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#d26849]">
              {copy.accountsAndLimits}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold">
              {copy.allUsers}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#7a857e]">
              {copy.description}
            </p>
          </div>
          <span className="rounded-full bg-[#e8efe9] px-3 py-1.5 text-xs font-bold text-[#356248]">
            {visibleUsers.length} / {users.length} {copy.accounts}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [copy.admins, admins],
            [copy.bannedUsers, banned],
            [copy.atLimit, atLimit],
            [copy.unverified, emailVerificationEnabled ? unverified : "off"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#eeeae2] bg-[#faf8f3] p-3"
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#929a94]">
                {label}
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-[#eeeae2] bg-[#fffdf8] p-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-11 w-full rounded-xl border border-[#dedfd9] px-3 text-sm outline-none focus:border-[#71927e]"
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
            >
              <option value="all">{copy.allRoles}</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
            >
              <option value="all">{copy.allStatuses}</option>
              <option value="active">{copy.activeUsers}</option>
              <option value="banned">{copy.bannedUsers}</option>
            </select>
            <select
              value={verification}
              onChange={(event) => setVerification(event.target.value)}
              className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
            >
              <option value="all">{copy.allVerification}</option>
              <option value="verified">{copy.verified}</option>
              <option value="unverified">{copy.unverified}</option>
            </select>
            <select
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
            >
              <option value="all">{copy.allLimits}</option>
              <option value="at-limit">{copy.atLimit}</option>
              <option value="available">{copy.availableLimit}</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-11 rounded-xl border border-[#dedfd9] bg-white px-3 text-sm outline-none"
            >
              <option value="newest">{copy.newest}</option>
              <option value="activity">{copy.lastActivity}</option>
              <option value="usage">{copy.mostGenerations}</option>
              <option value="favorites">{copy.mostFavorites}</option>
              <option value="searches">{copy.mostHistory}</option>
              <option value="name">A-Z</option>
            </select>
            <button
              onClick={resetFilters}
              className="h-11 rounded-xl border border-[#d8d7d0] px-3 text-sm font-semibold text-[#59675f] transition hover:bg-[#f6f3ec]"
            >
              {copy.reset}
            </button>
          </div>
        </div>
      </div>

      {visibleUsers.length > 0 ? (
        <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visibleUsers.map((user) => (
            <article
              key={user.id}
              className="rounded-[1.35rem] border border-[#ebe8e0] bg-[#fffdf8] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {user.name || copy.unnamed}
                  </p>
                  <p className="mt-1 break-all text-xs text-[#7a857e]">
                    {user.email}
                  </p>
                </div>
                <AdminUserActions
                  userId={user.id}
                  userName={user.name}
                  role={user.role}
                  banned={user.banned}
                  dailyLimit={user.dailyLimit}
                  isCurrentAdmin={user.id === currentAdminId}
                  language={language}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    user.role === "admin"
                      ? "bg-[#253d31] text-white"
                      : "bg-[#edf1ec] text-[#536159]"
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    user.banned
                      ? "bg-[#fff0e8] text-[#a45c45]"
                      : "bg-[#e8efe9] text-[#356248]"
                  }`}
                  title={user.banReason ?? undefined}
                >
                  {user.banned ? copy.banned : copy.active}
                </span>
                {emailVerificationEnabled && !user.emailVerified && (
                  <span className="rounded-full bg-[#fff0e8] px-2.5 py-1 text-xs font-bold text-[#a45c45]">
                    {copy.emailUnverified}
                  </span>
                )}
                {isAtLimit(user) && (
                  <span className="rounded-full bg-[#fff5df] px-2.5 py-1 text-xs font-bold text-[#9c6a16]">
                    {copy.atLimit.toLocaleLowerCase(language)}
                  </span>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm min-[520px]:grid-cols-4">
                {[
                  [
                    copy.today,
                    user.role === "admin"
                      ? copy.noLimit
                      : `${user.usage.today}/${user.dailyLimit}`,
                  ],
                  [copy.total, user.usage.total],
                  [copy.favorites, user.counts.favorites],
                  [copy.history, user.counts.searches],
                  [copy.shopping, user.counts.shoppingItems],
                  [copy.feedback, user.counts.feedbacks],
                  [copy.plan, user.counts.mealPlans],
                  [copy.activity, formatDate(user.usage.lastActivity, language)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl bg-white p-3 ring-1 ring-[#eeeae2]"
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[#929a94]">
                      {label}
                    </dt>
                    <dd
                      className={`mt-1 text-xs font-semibold ${
                        label === copy.today && isAtLimit(user)
                          ? "text-[#b04f3a]"
                          : "text-[#4f5e56]"
                      }`}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 text-xs text-[#879089]">
                {copy.registration} {formatDate(user.createdAt, language)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <div className="rounded-[1.4rem] border border-dashed border-[#cfcec7] bg-[#fffdf8] p-8 text-center">
            <p className="font-serif text-2xl font-semibold">
              {copy.noUsers}
            </p>
            <p className="mt-2 text-sm text-[#7a857e]">{copy.noUsersHint}</p>
            <button
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-[#2f684f] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {copy.clearFilters}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
