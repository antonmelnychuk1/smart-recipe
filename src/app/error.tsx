"use client";

import Link from "next/link";
import { useMemo } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const errorCopy = {
  pl: {
    eyebrow: "Coś poszło nie tak",
    title: "Aplikacja złapała błąd",
    description:
      "Spróbuj odświeżyć ten widok. Jeśli problem wróci, przejdź na stronę główną i wykonaj akcję ponownie.",
    retry: "Spróbuj ponownie",
    home: "Strona główna",
    details: "Kod błędu:",
  },
  en: {
    eyebrow: "Something went wrong",
    title: "The app hit an error",
    description:
      "Try refreshing this view. If the problem returns, go back home and repeat the action.",
    retry: "Try again",
    home: "Home",
    details: "Error code:",
  },
  uk: {
    eyebrow: "Щось пішло не так",
    title: "У застосунку сталася помилка",
    description:
      "Спробуй оновити цей екран. Якщо проблема повториться, повернись на головну та виконай дію ще раз.",
    retry: "Спробувати ще раз",
    home: "Головна",
    details: "Код помилки:",
  },
} as const;

function getClientLanguage() {
  if (typeof window === "undefined") return "en";

  const stored = window.localStorage.getItem("smart-recipe:language");
  if (stored === "pl" || stored === "en" || stored === "uk") return stored;

  const browserLanguage = window.navigator.language.toLocaleLowerCase();
  if (browserLanguage.startsWith("pl")) return "pl";
  if (browserLanguage.startsWith("uk")) return "uk";

  return "en";
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const copy = useMemo(() => errorCopy[getClientLanguage()], []);

  return (
    <main className="app-shell grid place-items-center bg-[#f7f4ed] px-4 py-8 text-[#25322b]">
      <section className="w-full max-w-lg rounded-[2rem] border border-[#e2dfd6] bg-[#fffdf8] p-6 text-center shadow-xl sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fff0e8] text-3xl text-[#a45c45]">
          !
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">
          {copy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#68736b]">
          {copy.description}
        </p>
        {error.digest && (
          <p className="mt-4 rounded-xl bg-[#f7f4ed] px-3 py-2 text-xs text-[#8a948e]">
            {copy.details} {error.digest}
          </p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#025026] px-4 text-sm font-semibold text-white"
          >
            {copy.retry}
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white px-4 text-sm font-semibold text-[#025026]"
          >
            {copy.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
