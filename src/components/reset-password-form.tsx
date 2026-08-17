"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PasswordInput } from "@/components/password-input";

type ResetPasswordFormProps = {
  token: string;
  tokenError?: string;
};

export function ResetPasswordForm({
  token,
  tokenError,
}: ResetPasswordFormProps) {
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
      setError("Hasła nie są takie same.");
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
            ? "Link jest nieprawidłowy albo wygasł. Wyślij nowy link resetujący."
            : result?.error?.message ?? "Nie udało się ustawić nowego hasła.",
        );
      }

      setMessage("Hasło zostało zmienione. Możesz wrócić do aplikacji i zalogować się ponownie.");
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nie udało się ustawić nowego hasła.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-left text-sm font-semibold">
        Nowe hasło
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
        Powtórz hasło
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
        {isPending ? "Zapisywanie..." : "Ustaw nowe hasło"}
      </button>

      <Link
        href="/"
        className="flex h-12 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white font-semibold text-[#365a46]"
      >
        Wróć do aplikacji
      </Link>
    </form>
  );
}
