"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "@/components/password-input";
import type { AppLanguage } from "@/lib/i18n";

const emailVerificationEnabled =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED === "true";

type AuthDialogProps = {
  onClose: () => void;
  language?: AppLanguage;
};

const authCopy = {
  pl: {
    labels: {
      login: "Logowanie",
      register: "Rejestracja",
      forgot: "Odzyskiwanie hasła",
      close: "Zamknij",
      name: "Imię",
      email: "E-mail",
      password: "Hasło",
    },
    titles: {
      login: "Witaj ponownie",
      register: "Utwórz konto",
      forgot: "Odzyskaj hasło",
    },
    forgotText:
      "Podaj e-mail konta, a wyślemy link do ustawienia nowego hasła.",
    buttons: {
      pending: "Chwileczkę...",
      login: "Zaloguj się",
      register: "Załóż konto",
      forgot: "Wyślij link resetujący",
      forgotPassword: "Nie pamiętasz hasła?",
      toRegister: "Nie masz konta? Zarejestruj się",
      toLogin: "Masz już konto? Zaloguj się",
      backToLogin: "Wróć do logowania",
    },
    errors: {
      resetFailed:
        "Nie udało się wysłać linku resetującego. Spróbuj ponownie.",
      userExists: "Konto z tym adresem już istnieje.",
      invalidLogin: "Nieprawidłowy e-mail lub hasło.",
      registerFailed: "Nie udało się utworzyć konta.",
    },
    messages: {
      resetSent:
        "Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia nowego hasła.",
      registered:
        "Konto zostało utworzone. Sprawdź skrzynkę i potwierdź adres e-mail.",
    },
  },
  en: {
    labels: {
      login: "Login",
      register: "Registration",
      forgot: "Password recovery",
      close: "Close",
      name: "Name",
      email: "E-mail",
      password: "Password",
    },
    titles: {
      login: "Welcome back",
      register: "Create account",
      forgot: "Recover password",
    },
    forgotText:
      "Enter your account e-mail and we will send a link to set a new password.",
    buttons: {
      pending: "One moment...",
      login: "Log in",
      register: "Create account",
      forgot: "Send reset link",
      forgotPassword: "Forgot password?",
      toRegister: "No account yet? Sign up",
      toLogin: "Already have an account? Log in",
      backToLogin: "Back to login",
    },
    errors: {
      resetFailed: "Could not send the reset link. Try again.",
      userExists: "An account with this e-mail already exists.",
      invalidLogin: "Invalid e-mail or password.",
      registerFailed: "Could not create the account.",
    },
    messages: {
      resetSent:
        "If an account with this e-mail exists, we sent a link to set a new password.",
      registered:
        "The account has been created. Check your inbox and confirm your e-mail address.",
    },
  },
} as const;

export function AuthDialog({ onClose, language = "pl" }: AuthDialogProps) {
  const copy = authCopy[language];
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));

    if (mode === "forgot") {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: "/reset-password",
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: { message?: string };
        message?: string;
      } | null;

      setIsPending(false);

      if (!response.ok) {
        setError(
          result?.error?.message ??
            copy.errors.resetFailed,
        );
        return;
      }

      setMessage(
        copy.messages.resetSent,
      );
      return;
    }

    const password = String(formData.get("password"));

    const result =
      mode === "register"
        ? await authClient.signUp.email({
            name: String(formData.get("name")),
            email,
            password,
            callbackURL: "/email-verified",
          })
        : await authClient.signIn.email({
            email,
            password,
          });

    setIsPending(false);

    if (result.error) {
      setError(
        result.error.code === "USER_ALREADY_EXISTS"
          ? copy.errors.userExists
          : mode === "login"
            ? copy.errors.invalidLogin
            : result.error.message || copy.errors.registerFailed,
      );
      return;
    }

    if (mode === "register" && emailVerificationEnabled) {
      setMessage(
        copy.messages.registered,
      );
      return;
    }

    onClose();
  }

  return (
    <div
      className="modal-safe-area fixed inset-0 z-[60] grid place-items-center bg-[#18241e]/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === "login"
          ? copy.labels.login
          : mode === "register"
            ? copy.labels.register
            : copy.labels.forgot
      }
      onClick={onClose}
    >
      <div
        className="modal-panel-safe w-full max-w-md overflow-y-auto rounded-3xl bg-[#fffdf8] p-5 shadow-2xl sm:rounded-[2rem] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              SmartRecipe
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">
              {mode === "login"
                ? copy.titles.login
                : mode === "register"
                  ? copy.titles.register
                  : copy.titles.forgot}
            </h2>
            {mode === "forgot" && (
              <p className="mt-2 text-sm leading-6 text-[#68736b]">
                {copy.forgotText}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={copy.labels.close}
            className="grid size-9 place-items-center rounded-full bg-[#eeeae2] text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "register" && (
            <label className="block text-sm font-semibold">
              {copy.labels.name}
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
            {copy.labels.email}
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>
          {mode !== "forgot" && (
            <label className="block text-sm font-semibold">
              {copy.labels.password}
              <PasswordInput
                required
                minLength={8}
                name="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none focus:border-[#71927e]"
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-[#fff0eb] p-3 text-sm text-[#a44436]">
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="rounded-xl bg-[#e9f2eb] p-3 text-sm text-[#356248]"
            >
              {message}
            </p>
          )}

          <button
            disabled={isPending}
            className="h-12 w-full rounded-xl bg-[#2f684f] font-semibold text-white disabled:opacity-50"
          >
            {isPending
              ? copy.buttons.pending
              : mode === "login"
                ? copy.buttons.login
                : mode === "register"
                  ? copy.buttons.register
                  : copy.buttons.forgot}
          </button>
        </form>

        {mode === "login" && (
          <button
            onClick={() => {
              setMode("forgot");
              setError("");
              setMessage("");
            }}
            className="mt-4 w-full text-sm font-semibold text-[#2f684f] hover:text-[#244f3c]"
          >
            {copy.buttons.forgotPassword}
          </button>
        )}

        <button
          onClick={() => {
            setMode((current) => (current === "login" ? "register" : "login"));
            setError("");
            setMessage("");
          }}
          className="mt-5 w-full text-sm text-[#667168] hover:text-[#2f684f]"
        >
          {mode === "login"
            ? copy.buttons.toRegister
            : mode === "register"
              ? copy.buttons.toLogin
              : copy.buttons.backToLogin}
        </button>
      </div>
    </div>
  );
}
