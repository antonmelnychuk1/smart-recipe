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
  title: "Terms of Use",
  description:
    "Read the basic rules for using SmartRecipe, an AI recipe generator and meal planning app.",
  alternates: {
    canonical: "/terms",
  },
};

const termsCopy: Record<
  AppLanguage,
  {
    title: string;
    updated: string;
    intro: string;
    back: string;
    sections: { title: string; items: string[] }[];
  }
> = {
  pl: {
    title: "Regulamin",
    updated: "Ostatnia aktualizacja: 18 sierpnia 2026",
    intro:
      "SmartRecipe pomaga tworzyć przepisy, listy zakupów i plany posiłków. Korzystając z aplikacji, akceptujesz podstawowe zasady opisane poniżej.",
    back: "← Wróć do aplikacji",
    sections: [
      {
        title: "Przepisy generowane przez AI",
        items: [
          "Przepisy są generowane automatycznie i mogą wymagać Twojej oceny przed gotowaniem.",
          "Sprawdzaj alergeny, terminy ważności produktów i bezpieczeństwo przygotowania potraw.",
          "Wartości odżywcze i koszty są szacunkowe.",
        ],
      },
      {
        title: "Konto i limity",
        items: [
          "Konto pozwala zapisywać przepisy, historię, spiżarnię, listę zakupów i plan posiłków.",
          "Aplikacja może stosować dzienne limity generowania, żeby kontrolować koszty działania AI.",
          "Administrator może zarządzać kontami i limitami w panelu administracyjnym.",
        ],
      },
      {
        title: "Odpowiedzialne używanie",
        items: [
          "Nie używaj aplikacji do tworzenia treści niebezpiecznych lub naruszających prawo.",
          "Nie traktuj aplikacji jako porady medycznej, dietetycznej lub prawnej.",
          "Możemy zmieniać funkcje aplikacji wraz z jej rozwojem.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of Use",
    updated: "Last updated: August 18, 2026",
    intro:
      "SmartRecipe helps create recipes, shopping lists and meal plans. By using the app, you accept the basic rules below.",
    back: "← Back to app",
    sections: [
      {
        title: "AI-generated recipes",
        items: [
          "Recipes are generated automatically and may require your review before cooking.",
          "Check allergens, product expiry dates and safe food preparation practices.",
          "Nutrition values and costs are estimates.",
        ],
      },
      {
        title: "Account and limits",
        items: [
          "An account lets you save recipes, history, pantry items, shopping lists and meal plans.",
          "The app may use daily generation limits to control AI operating costs.",
          "An administrator can manage accounts and limits in the admin panel.",
        ],
      },
      {
        title: "Responsible use",
        items: [
          "Do not use the app to create unsafe or unlawful content.",
          "Do not treat the app as medical, dietetic or legal advice.",
          "We may change app features as the product evolves.",
        ],
      },
    ],
  },
  uk: {
    title: "Умови використання",
    updated: "Останнє оновлення: 18 серпня 2026",
    intro:
      "SmartRecipe допомагає створювати рецепти, списки покупок і плани страв. Користуючись застосунком, ти приймаєш основні правила нижче.",
    back: "← Назад до застосунку",
    sections: [
      {
        title: "Рецепти, згенеровані AI",
        items: [
          "Рецепти генеруються автоматично й можуть потребувати твоєї перевірки перед готуванням.",
          "Перевіряй алергени, терміни придатності продуктів і безпечне приготування їжі.",
          "Харчова цінність і вартість є орієнтовними.",
        ],
      },
      {
        title: "Акаунт і ліміти",
        items: [
          "Акаунт дозволяє зберігати рецепти, історію, комору, список покупок і план страв.",
          "Застосунок може використовувати денні ліміти генерації, щоб контролювати витрати на AI.",
          "Адміністратор може керувати акаунтами та лімітами в адмін-панелі.",
        ],
      },
      {
        title: "Відповідальне використання",
        items: [
          "Не використовуй застосунок для створення небезпечного або незаконного контенту.",
          "Не сприймай застосунок як медичну, дієтологічну або юридичну пораду.",
          "Ми можемо змінювати функції застосунку в процесі розвитку продукту.",
        ],
      },
    ],
  },
};

export default async function TermsPage() {
  const language = normalizeLanguage(
    (await cookies()).get(languageCookieName)?.value,
  );
  const copy = termsCopy[language];

  return (
    <main className="app-shell bg-[#f7f4ed] px-4 py-6 text-[#25322b] sm:px-8 sm:py-10">
      <article className="mx-auto max-w-3xl rounded-[2rem] border border-[#e2dfd6] bg-[#fffdf8] p-5 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
          {siteName}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-[#748078]">{copy.updated}</p>
        <p className="mt-5 leading-7 text-[#59675f]">{copy.intro}</p>

        <div className="mt-7 space-y-6">
          {copy.sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl font-semibold">
                {section.title}
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#59675f]">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#025026] px-4 text-sm font-semibold text-white"
        >
          {copy.back}
        </Link>
      </article>
    </main>
  );
}
