import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  languageCookieName,
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n";
import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with SmartRecipe, report issues, manage your account and find privacy information.",
  alternates: {
    canonical: "/support",
  },
};

const supportEmail = "support@smartrecipeapp.com";

const supportCopy: Record<
  AppLanguage,
  {
    title: string;
    intro: string;
    back: string;
    contact: string;
    emailLabel: string;
    terms: string;
    sections: { title: string; text: string; action?: string; href?: string }[];
  }
> = {
  pl: {
    title: "Pomoc i kontakt",
    intro:
      "Masz problem z generowaniem przepisów, kontem albo chcesz zgłosić błąd? Napisz do nas — najlepiej z krótkim opisem, urządzeniem i adresem e-mail konta.",
    back: "← Wróć do aplikacji",
    contact: "Napisz do supportu",
    emailLabel: "Adres kontaktowy",
    terms: "Regulamin",
    sections: [
      {
        title: "Problemy techniczne",
        text: "Opisz, co kliknąłeś, jaki komunikat się pojawił i czy problem dotyczy strony, iPhone czy Androida.",
      },
      {
        title: "Konto i dane",
        text: "Hasło możesz zresetować w aplikacji. Konto i dane możesz usunąć w ustawieniach konta.",
        action: "Otwórz ustawienia",
        href: "/settings",
      },
      {
        title: "Prywatność i regulamin",
        text: "Tutaj znajdziesz informacje o danych, integracjach AI i zasadach korzystania z aplikacji.",
        action: "Polityka prywatności",
        href: "/privacy",
      },
    ],
  },
  en: {
    title: "Support and contact",
    intro:
      "Having trouble with recipe generation, your account or want to report a bug? Email us with a short description, your device and the account email if relevant.",
    back: "← Back to app",
    contact: "Email support",
    emailLabel: "Contact email",
    terms: "Terms",
    sections: [
      {
        title: "Technical issues",
        text: "Tell us what you tapped, what message appeared and whether the issue happens on the website, iPhone or Android.",
      },
      {
        title: "Account and data",
        text: "You can reset your password in the app. You can delete your account and related data in account settings.",
        action: "Open settings",
        href: "/settings",
      },
      {
        title: "Privacy and terms",
        text: "Find details about data, AI integrations and the basic rules for using SmartRecipe.",
        action: "Privacy policy",
        href: "/privacy",
      },
    ],
  },
  uk: {
    title: "Підтримка і контакт",
    intro:
      "Є проблема з генерацією рецептів, акаунтом або хочеш повідомити про помилку? Напиши нам короткий опис, пристрій і e-mail акаунта, якщо це доречно.",
    back: "← Назад до застосунку",
    contact: "Написати в підтримку",
    emailLabel: "Контактний e-mail",
    terms: "Умови",
    sections: [
      {
        title: "Технічні проблеми",
        text: "Опиши, що ти натиснув, яке повідомлення з’явилося і де виникає проблема: на сайті, iPhone чи Android.",
      },
      {
        title: "Акаунт і дані",
        text: "Пароль можна скинути в застосунку. Акаунт і пов’язані дані можна видалити в налаштуваннях акаунта.",
        action: "Відкрити налаштування",
        href: "/settings",
      },
      {
        title: "Приватність і умови",
        text: "Тут є інформація про дані, AI-інтеграції та основні правила користування SmartRecipe.",
        action: "Політика приватності",
        href: "/privacy",
      },
    ],
  },
};

export default async function SupportPage() {
  const language = normalizeLanguage(
    (await cookies()).get(languageCookieName)?.value,
  );
  const copy = supportCopy[language];

  return (
    <main className="app-shell subpage-shell bg-[#f7f4ed] px-4 py-6 text-[#25322b] sm:px-8 sm:py-10">
      <article className="mx-auto max-w-3xl rounded-[2rem] border border-[#e2dfd6] bg-[#fffdf8] p-5 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
          {siteName}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">
          {copy.title}
        </h1>
        <p className="mt-5 leading-7 text-[#59675f]">{copy.intro}</p>

        <section className="mt-7 rounded-[1.5rem] border border-[#d6e2d8] bg-[#eef6ef] p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#365a46]">
            {copy.emailLabel}
          </p>
          <a
            href={`mailto:${supportEmail}`}
            className="mt-2 inline-flex text-lg font-bold text-[#025026] underline decoration-[#025026]/30 underline-offset-4"
          >
            {supportEmail}
          </a>
        </section>

        <div className="mt-7 grid gap-4">
          {copy.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[1.5rem] border border-[#e2dfd6] bg-white p-4 sm:p-5"
            >
              <h2 className="font-serif text-2xl font-semibold">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#59675f]">
                {section.text}
              </p>
              {section.href && section.action && (
                <Link
                  href={section.href}
                  className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#f3f6f2] px-4 text-sm font-semibold text-[#025026]"
                >
                  {section.action}
                </Link>
              )}
            </section>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#025026] px-4 text-sm font-semibold text-white"
          >
            {copy.contact}
          </a>
          <Link
            href="/terms"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white px-4 text-sm font-semibold text-[#25322b]"
          >
            {copy.terms}
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white px-4 text-sm font-semibold text-[#25322b]"
          >
            {copy.back}
          </Link>
        </div>
      </article>
    </main>
  );
}
