"use client";

import { FormEvent, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type AccountSession = {
  token: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const dietOptions = [
  "Bez ograniczeń",
  "Wegetariańska",
  "Wegańska",
  "Pescetariańska",
  "Bezglutenowa",
  "Bez laktozy",
  "Ketogeniczna",
  "Niskowęglowodanowa",
  "Śródziemnomorska",
  "Wysokobiałkowa",
];

const timeOptions = [
  ["0", "Bez ograniczeń"],
  ["15", "do 15 minut"],
  ["20", "do 20 minut"],
  ["30", "do 30 minut"],
  ["45", "do 45 minut"],
  ["60", "do 60 minut"],
  ["90", "do 90 minut"],
  ["120", "do 120 minut"],
];

const budgetOptions = [
  ["0", "Bez ograniczeń"],
  ["15", "do 15 zł"],
  ["25", "do 25 zł"],
  ["40", "do 40 zł"],
  ["60", "do 60 zł"],
  ["100", "do 100 zł"],
];

const goalOptions = [
  ["balanced", "Zbalansowanie"],
  ["quick", "Szybko"],
  ["cheap", "Tanio"],
  ["healthy", "Zdrowiej"],
  ["high_protein", "Wysokobiałkowo"],
];

function deviceName(userAgent?: string | null) {
  if (!userAgent) return "Nieznane urządzenie";

  const browser = userAgent.includes("Chrome")
    ? "Chrome"
    : userAgent.includes("Firefox")
      ? "Firefox"
      : userAgent.includes("Safari")
        ? "Safari"
        : "Przeglądarka";
  const system = userAgent.includes("iPhone")
    ? "iPhone"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("Mac")
        ? "macOS"
        : userAgent.includes("Windows")
          ? "Windows"
          : "urządzenie";

  return `${browser} · ${system}`;
}

export function AccountSettings() {
  const { data: currentSession } = authClient.useSession();
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [defaultDiet, setDefaultDiet] = useState("Bez ograniczeń");
  const [defaultMaxTime, setDefaultMaxTime] = useState("0");
  const [defaultBudget, setDefaultBudget] = useState("0");
  const [cookingGoal, setCookingGoal] = useState("balanced");
  const [excludedIngredients, setExcludedIngredients] = useState("");
  const [goalsPending, setGoalsPending] = useState(false);
  const [goalsMessage, setGoalsMessage] = useState("");

  async function loadSessions() {
    setSessionsLoading(true);
    const result = await authClient.listSessions();
    setSessions((result.data ?? []) as AccountSession[]);
    setSessionsLoading(false);
  }

  useEffect(() => {
    const initialization = window.setTimeout(() => {
      void loadSessions();
      void fetch("/api/preferences")
        .then((response) => response.json())
        .then(
          (data: {
            calorieTarget?: number | null;
            proteinTarget?: number | null;
            defaultDiet?: string;
            defaultMaxTime?: number;
            defaultBudget?: number;
            cookingGoal?: string;
            excludedIngredients?: string[];
          }) => {
            setCalorieTarget(data.calorieTarget?.toString() ?? "");
            setProteinTarget(data.proteinTarget?.toString() ?? "");
            setDefaultDiet(data.defaultDiet ?? "Bez ograniczeń");
            setDefaultMaxTime(String(data.defaultMaxTime ?? 0));
            setDefaultBudget(String(data.defaultBudget ?? 0));
            setCookingGoal(data.cookingGoal ?? "balanced");
            setExcludedIngredients(
              data.excludedIngredients?.join(", ") ?? "",
            );
          },
        );
    }, 0);

    return () => window.clearTimeout(initialization);
  }, []);

  async function saveGoals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGoalsPending(true);
    setGoalsMessage("");
    const response = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calorieTarget: calorieTarget ? Number(calorieTarget) : null,
        proteinTarget: proteinTarget ? Number(proteinTarget) : null,
        defaultDiet,
        defaultMaxTime: Number(defaultMaxTime),
        defaultBudget: Number(defaultBudget),
        cookingGoal,
        excludedIngredients: excludedIngredients
          .split(",")
          .map((item) => item.trim().toLocaleLowerCase("pl"))
          .filter(Boolean),
      }),
    });
    const data = (await response.json()) as { error?: string };
    setGoalsPending(false);
    setGoalsMessage(
      response.ok ? "Preferencje zostały zapisane." : data.error ?? "Błąd zapisu.",
    );
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordPending(true);
    setPasswordMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPassword = String(formData.get("newPassword"));
    const repeatedPassword = String(formData.get("repeatedPassword"));

    if (newPassword !== repeatedPassword) {
      setPasswordPending(false);
      setPasswordMessage("Nowe hasła nie są identyczne.");
      return;
    }

    const result = await authClient.changePassword({
      currentPassword: String(formData.get("currentPassword")),
      newPassword,
      revokeOtherSessions: true,
    });
    setPasswordPending(false);

    if (result.error) {
      setPasswordMessage(
        result.error.code === "INVALID_PASSWORD"
          ? "Obecne hasło jest nieprawidłowe."
          : result.error.message || "Nie udało się zmienić hasła.",
      );
      return;
    }

    form.reset();
    setPasswordMessage(
      "Hasło zostało zmienione, a pozostałe sesje wylogowane.",
    );
    await loadSessions();
  }

  async function revokeSession(token: string) {
    await authClient.revokeSession({ token });
    await loadSessions();
  }

  async function revokeOtherSessions() {
    await authClient.revokeOtherSessions();
    await loadSessions();
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== "USUŃ") return;

    setDeletePending(true);
    setDeleteError("");
    const formData = new FormData(event.currentTarget);
    const result = await authClient.deleteUser({
      password: String(formData.get("password")),
    });

    if (result.error) {
      setDeletePending(false);
      setDeleteError(
        result.error.code === "INVALID_PASSWORD"
          ? "Hasło jest nieprawidłowe."
          : result.error.message || "Nie udało się usunąć konta.",
      );
      return;
    }

    window.localStorage.clear();
    window.location.href = "/";
  }

  return (
    <div className="mt-6 space-y-4 sm:mt-10 sm:space-y-6">
      <section className="rounded-[1.7rem] border border-[#ced9cf] bg-[#f8fbf7] p-4 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">
          Preferencje generowania
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#748078]">
          AI wykorzysta je jako domyślne ustawienia przy układaniu przepisów.
        </p>
        <form onSubmit={saveGoals} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Domyślna dieta
            <select
              value={defaultDiet}
              onChange={(event) => setDefaultDiet(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            >
              {dietOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Cel gotowania
            <select
              value={cookingGoal}
              onChange={(event) => setCookingGoal(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            >
              {goalOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Domyślny budżet
            <select
              value={defaultBudget}
              onChange={(event) => setDefaultBudget(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            >
              {budgetOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Domyślny czas
            <select
              value={defaultMaxTime}
              onChange={(event) => setDefaultMaxTime(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            >
              {timeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Kalorie dziennie
            <input
              type="number"
              min="800"
              max="6000"
              value={calorieTarget}
              onChange={(event) => setCalorieTarget(event.target.value)}
              placeholder="np. 2200"
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            />
          </label>
          <label className="text-sm font-semibold">
            Białko dziennie (g)
            <input
              type="number"
              min="20"
              max="400"
              value={proteinTarget}
              onChange={(event) => setProteinTarget(event.target.value)}
              placeholder="np. 120"
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Produkty wykluczone / alergie
            <input
              value={excludedIngredients}
              onChange={(event) => setExcludedIngredients(event.target.value)}
              placeholder="np. orzechy, krewetki, seler"
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            />
            <span className="mt-1 block text-xs font-normal leading-5 text-[#748078]">
              Wpisz po przecinku. Generator będzie unikał tych składników w
              przepisach i zamiennikach.
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              disabled={goalsPending}
              className="h-11 rounded-xl bg-[#2f684f] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {goalsPending ? "Zapisuję..." : "Zapisz preferencje"}
            </button>
            {goalsMessage && <p className="text-sm text-[#59675f]">{goalsMessage}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">Zmiana hasła</h2>
        <p className="mt-2 text-sm leading-6 text-[#748078]">
          Po zmianie hasła wszystkie pozostałe urządzenia zostaną wylogowane.
        </p>
        <form onSubmit={changePassword} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
            Obecne hasło
            <input
              required
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>
          <label className="text-sm font-semibold">
            Nowe hasło
            <input
              required
              minLength={8}
              type="password"
              name="newPassword"
              autoComplete="new-password"
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>
          <label className="text-sm font-semibold">
            Powtórz nowe hasło
            <input
              required
              minLength={8}
              type="password"
              name="repeatedPassword"
              autoComplete="new-password"
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              disabled={passwordPending}
              className="h-11 rounded-xl bg-[#2f684f] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {passwordPending ? "Zmieniam..." : "Zmień hasło"}
            </button>
            {passwordMessage && (
              <p className="text-sm text-[#59675f]">{passwordMessage}</p>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Aktywne sesje</h2>
            <p className="mt-2 text-sm leading-6 text-[#748078]">
              Urządzenia, na których Twoje konto jest obecnie zalogowane.
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={revokeOtherSessions}
              className="rounded-xl border border-[#ccd7cf] px-4 py-2.5 text-xs font-semibold text-[#356248]"
            >
              Wyloguj pozostałe
            </button>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {sessionsLoading ? (
            <p className="text-sm text-[#7a857e]">Wczytuję sesje...</p>
          ) : (
            sessions.map((session) => {
              const isCurrent =
                currentSession?.session.token === session.token;

              return (
                <div
                  key={session.token}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#faf8f3] p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {deviceName(session.userAgent)}
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-[#dfeae1] px-2 py-0.5 text-[10px] text-[#356248]">
                          obecna
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[#7a857e]">
                      IP: {session.ipAddress || "brak danych"} · utworzona{" "}
                      {new Intl.DateTimeFormat("pl-PL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(session.createdAt))}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => revokeSession(session.token)}
                      className="text-xs font-semibold text-[#a45c45] hover:underline"
                    >
                      Wyloguj
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-[1.7rem] border border-[#e4bdb5] bg-[#fff9f6] p-4 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-[#913f32]">
          Usuń konto
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#805f58]">
          Ta operacja trwale usunie konto, przepisy, historię, listę zakupów,
          planer oraz statystyki. Nie można jej cofnąć.
        </p>
        <form onSubmit={deleteAccount} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#704d47]">
            Hasło
            <input
              required
              type="password"
              name="password"
              autoComplete="current-password"
              className="mt-2 block h-12 w-full rounded-xl border border-[#ddbdb6] bg-white px-4 font-normal outline-none"
            />
          </label>
          <label className="text-sm font-semibold text-[#704d47]">
            Wpisz „USUŃ”
            <input
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#ddbdb6] bg-white px-4 font-normal outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              disabled={deletePending || confirmation !== "USUŃ"}
              className="h-11 rounded-xl bg-[#a74738] px-5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {deletePending ? "Usuwam..." : "Usuń konto na zawsze"}
            </button>
            {deleteError && (
              <p className="text-sm text-[#a74738]">{deleteError}</p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
