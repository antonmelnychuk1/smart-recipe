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
          }) => {
            setCalorieTarget(data.calorieTarget?.toString() ?? "");
            setProteinTarget(data.proteinTarget?.toString() ?? "");
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
      }),
    });
    const data = (await response.json()) as { error?: string };
    setGoalsPending(false);
    setGoalsMessage(response.ok ? "Cele zostały zapisane." : data.error ?? "Błąd zapisu.");
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
        <h2 className="font-serif text-2xl font-semibold">Cele żywieniowe</h2>
        <p className="mt-2 text-sm leading-6 text-[#748078]">
          AI wykorzysta je jako wskazówkę przy układaniu przepisów.
        </p>
        <form onSubmit={saveGoals} className="mt-5 grid gap-4 sm:grid-cols-2">
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
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              disabled={goalsPending}
              className="h-11 rounded-xl bg-[#2f684f] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {goalsPending ? "Zapisuję..." : "Zapisz cele"}
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
