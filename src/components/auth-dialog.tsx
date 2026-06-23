"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

type AuthDialogProps = {
  onClose: () => void;
};

export function AuthDialog({ onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const result =
      mode === "register"
        ? await authClient.signUp.email({
            name: String(formData.get("name")),
            email,
            password,
          })
        : await authClient.signIn.email({
            email,
            password,
          });

    setIsPending(false);

    if (result.error) {
      setError(
        result.error.code === "USER_ALREADY_EXISTS"
          ? "Konto z tym adresem już istnieje."
          : mode === "login"
            ? "Nieprawidłowy e-mail lub hasło."
            : result.error.message || "Nie udało się utworzyć konta.",
      );
      return;
    }

    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[#18241e]/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "login" ? "Logowanie" : "Rejestracja"}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[2rem] bg-[#fffdf8] p-7 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              SmartRecipe
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">
              {mode === "login" ? "Witaj ponownie" : "Utwórz konto"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="grid size-9 place-items-center rounded-full bg-[#eeeae2] text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "register" && (
            <label className="block text-sm font-semibold">
              Imię
              <input
                required
                minLength={2}
                name="name"
                autoComplete="name"
                className="mt-2 h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none focus:border-[#71927e]"
              />
            </label>
          )}
          <label className="block text-sm font-semibold">
            E-mail
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>
          <label className="block text-sm font-semibold">
            Hasło
            <input
              required
              minLength={8}
              type="password"
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="mt-2 h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0eb] p-3 text-sm text-[#a44436]">
              {error}
            </p>
          )}

          <button
            disabled={isPending}
            className="h-12 w-full rounded-xl bg-[#2f684f] font-semibold text-white disabled:opacity-50"
          >
            {isPending
              ? "Chwileczkę..."
              : mode === "login"
                ? "Zaloguj się"
                : "Załóż konto"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((current) => (current === "login" ? "register" : "login"));
            setError("");
          }}
          className="mt-5 w-full text-sm text-[#667168] hover:text-[#2f684f]"
        >
          {mode === "login"
            ? "Nie masz konta? Zarejestruj się"
            : "Masz już konto? Zaloguj się"}
        </button>
      </div>
    </div>
  );
}
