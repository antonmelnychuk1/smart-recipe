import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  languageCookieName,
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n";
import { siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn what data SmartRecipe uses to generate recipes, save account features and operate the app.",
  alternates: {
    canonical: "/privacy",
  },
};

const privacyCopy: Record<
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
    title: "Polityka prywatności",
    updated: "Ostatnia aktualizacja: 18 sierpnia 2026",
    intro:
      "SmartRecipe przetwarza tylko dane potrzebne do działania aplikacji: konta, generowania przepisów, list zakupów, spiżarni i planowania posiłków.",
    back: "← Wróć do aplikacji",
    sections: [
      {
        title: "Jakie dane zapisujemy",
        items: [
          "Dane konta: imię, adres e-mail, status weryfikacji i ustawienia bezpieczeństwa.",
          "Dane aplikacji: zapisane przepisy, historia generowania, lista zakupów, spiżarnia, plan posiłków i oceny przepisów.",
          "Preferencje gotowania: dieta, budżet, czas, alergie i składniki, których nie lubisz.",
        ],
      },
      {
        title: "Integracje",
        items: [
          "OpenAI służy do generowania przepisów na podstawie danych wpisanych w aplikacji.",
          "Pexels służy do pobierania zdjęć pasujących do przepisów.",
          "Resend służy do wysyłania wiadomości e-mail, np. weryfikacji konta i resetu hasła.",
        ],
      },
      {
        title: "Kontrola danych",
        items: [
          "Możesz edytować preferencje i zmienić hasło w ustawieniach konta.",
          "Możesz usunąć konto w ustawieniach — usuwa to dane powiązane z kontem.",
          "Część danych gościa może być przechowywana lokalnie w przeglądarce.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: August 18, 2026",
    intro:
      "SmartRecipe processes only the data needed to run the app: accounts, recipe generation, shopping lists, pantry tracking and meal planning.",
    back: "← Back to app",
    sections: [
      {
        title: "Data we store",
        items: [
          "Account data: name, e-mail address, verification status and security settings.",
          "App data: saved recipes, generation history, shopping list, pantry, meal plan and recipe feedback.",
          "Cooking preferences: diet, budget, time, allergies and ingredients you dislike.",
        ],
      },
      {
        title: "Integrations",
        items: [
          "OpenAI is used to generate recipes from the information entered in the app.",
          "Pexels is used to fetch photos matching recipes.",
          "Resend is used to send e-mails such as account verification and password reset messages.",
        ],
      },
      {
        title: "Data control",
        items: [
          "You can edit preferences and change your password in account settings.",
          "You can delete your account in settings — this removes data linked to your account.",
          "Some guest data may be stored locally in the browser.",
        ],
      },
    ],
  },
  uk: {
    title: "Політика приватності",
    updated: "Останнє оновлення: 18 серпня 2026",
    intro:
      "SmartRecipe обробляє лише дані, потрібні для роботи застосунку: акаунти, генерацію рецептів, списки покупок, комору та планування страв.",
    back: "← Назад до застосунку",
    sections: [
      {
        title: "Які дані ми зберігаємо",
        items: [
          "Дані акаунта: ім’я, e-mail адреса, статус верифікації та налаштування безпеки.",
          "Дані застосунку: збережені рецепти, історія генерацій, список покупок, комора, план страв і відгуки про рецепти.",
          "Кулінарні вподобання: дієта, бюджет, час, алергії та інгредієнти, які тобі не подобаються.",
        ],
      },
      {
        title: "Інтеграції",
        items: [
          "OpenAI використовується для генерації рецептів на основі інформації, введеної в застосунку.",
          "Pexels використовується для отримання фото, що відповідають рецептам.",
          "Resend використовується для надсилання e-mail, наприклад верифікації акаунта та скидання пароля.",
        ],
      },
      {
        title: "Контроль даних",
        items: [
          "Ти можеш редагувати вподобання та змінити пароль у налаштуваннях акаунта.",
          "Ти можеш видалити акаунт у налаштуваннях — це видаляє дані, пов’язані з акаунтом.",
          "Частина даних гостя може зберігатися локально в браузері.",
        ],
      },
    ],
  },
};

export default async function PrivacyPage() {
  const language = normalizeLanguage(
    (await cookies()).get(languageCookieName)?.value,
  );
  const copy = privacyCopy[language];

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

        <p className="mt-7 text-xs leading-5 text-[#8a948e]">
          {siteUrl}
        </p>
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
