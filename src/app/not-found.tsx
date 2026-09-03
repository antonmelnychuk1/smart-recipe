import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  languageCookieName,
  normalizeLanguage,
  type UiLanguage,
} from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested SmartRecipe page could not be found.",
};

const notFoundCopy: Record<
  UiLanguage,
  {
    eyebrow: string;
    title: string;
    description: string;
    home: string;
    recipes: string;
  }
> = {
  pl: {
    eyebrow: "404",
    title: "Nie znaleźliśmy tej strony",
    description:
      "Ten link może już nie istnieć albo został wpisany nieprawidłowo. Wróć do aplikacji i wygeneruj coś dobrego.",
    home: "Wróć do aplikacji",
    recipes: "Zapisane przepisy",
  },
  en: {
    eyebrow: "404",
    title: "We could not find this page",
    description:
      "This link may no longer exist or may have been typed incorrectly. Return to the app and generate something tasty.",
    home: "Back to app",
    recipes: "Saved recipes",
  },
  uk: {
    eyebrow: "404",
    title: "Ми не знайшли цю сторінку",
    description:
      "Це посилання може вже не існувати або його введено неправильно. Повернись до застосунку й згенеруй щось смачне.",
    home: "Назад до застосунку",
    recipes: "Збережені рецепти",
  },
};

export default async function NotFound() {
  const language = normalizeLanguage(
    (await cookies()).get(languageCookieName)?.value,
  );
  const copy = notFoundCopy[language];

  return (
    <main className="app-shell grid place-items-center bg-[#f7f4ed] px-4 py-8 text-[#25322b]">
      <section className="w-full max-w-lg rounded-[2rem] border border-[#e2dfd6] bg-[#fffdf8] p-6 text-center shadow-xl sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fff0e8] text-2xl font-bold text-[#a45c45]">
          {copy.eyebrow}
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
          SmartRecipe
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">
          {copy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#68736b]">
          {copy.description}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#025026] px-4 text-sm font-semibold text-white"
          >
            {copy.home}
          </Link>
          <Link
            href="/recipes"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white px-4 text-sm font-semibold text-[#025026]"
          >
            {copy.recipes}
          </Link>
        </div>
      </section>
    </main>
  );
}
