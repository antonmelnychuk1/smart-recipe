"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { getUiLanguage, type AppLanguage } from "@/lib/i18n";

type ResetPasswordFormProps = {
  token: string;
  tokenError?: string;
  language?: AppLanguage;
};

const resetPasswordCopy = {
  pl: {
    mismatch: "Hasła nie są takie same.",
    invalidToken:
      "Link jest nieprawidłowy albo wygasł. Wyślij nowy link resetujący.",
    failed: "Nie udało się ustawić nowego hasła.",
    success:
      "Hasło zostało zmienione. Możesz wrócić do aplikacji i zalogować się ponownie.",
    password: "Nowe hasło",
    repeatPassword: "Powtórz hasło",
    saving: "Zapisywanie...",
    submit: "Ustaw nowe hasło",
    back: "Wróć do aplikacji",
  },
  en: {
    mismatch: "Passwords do not match.",
    invalidToken: "The link is invalid or expired. Send a new reset link.",
    failed: "Could not set the new password.",
    success:
      "Password changed. You can return to the app and log in again.",
    password: "New password",
    repeatPassword: "Repeat password",
    saving: "Saving...",
    submit: "Set new password",
    back: "Back to app",
  },
  uk: {
    mismatch: "Паролі не збігаються.",
    invalidToken:
      "Посилання неправильне або прострочене. Надішли нове посилання для скидання.",
    failed: "Не вдалося встановити новий пароль.",
    success:
      "Пароль змінено. Можеш повернутися до застосунку й увійти знову.",
    password: "Новий пароль",
    repeatPassword: "Повтори пароль",
    saving: "Зберігаю...",
    submit: "Встановити новий пароль",
    back: "Назад до застосунку",
  },
} as const;

export function ResetPasswordForm({
  token,
  tokenError,
  language = "pl",
}: ResetPasswordFormProps) {
  const copy = resetPasswordCopy[getUiLanguage(language)];
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(tokenError ?? "");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password"));
    const repeatedPassword = String(formData.get("repeatedPassword"));

    setError("");
    setMessage("");

    if (password !== repeatedPassword) {
      setError(copy.mismatch);
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: { code?: string; message?: string };
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error?.code === "INVALID_TOKEN"
            ? copy.invalidToken
            : result?.error?.message ?? copy.failed,
        );
      }

      setMessage(copy.success);
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.failed,
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-left text-sm font-semibold">
        {copy.password}
        <PasswordInput
          required
          minLength={8}
          name="password"
          autoComplete="new-password"
          disabled={!token || Boolean(message)}
          className="h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none focus:border-[#71927e] disabled:bg-[#f1eee7]"
        />
      </label>
      <label className="block text-left text-sm font-semibold">
        {copy.repeatPassword}
        <PasswordInput
          required
          minLength={8}
          name="repeatedPassword"
          autoComplete="new-password"
          disabled={!token || Boolean(message)}
          className="h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none focus:border-[#71927e] disabled:bg-[#f1eee7]"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-[#fff0eb] p-3 text-sm text-[#a44436]">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-[#e9f2eb] p-3 text-sm text-[#356248]">
          {message}
        </p>
      )}

      <button
        disabled={isPending || !token || Boolean(message)}
        className="h-12 w-full rounded-xl bg-[#2f684f] font-semibold text-white disabled:opacity-50"
      >
        {isPending ? copy.saving : copy.submit}
      </button>

      <Link
        href="/"
        className="flex h-12 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white font-semibold text-[#365a46]"
      >
        {copy.back}
      </Link>
    </form>
  );
}
