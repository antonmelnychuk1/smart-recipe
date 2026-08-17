import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { auth } from "@/lib/auth";
import {
  languageCookieName,
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n";

export const dynamic = "force-dynamic";

const settingsCopy: Record<
  AppLanguage,
  {
    title: string;
    back: string;
    mobileEyebrow: string;
    mobileTitle: string;
    mobileText: string;
  }
> = {
  pl: {
    title: "Ustawienia konta",
    back: "← Wróć do aplikacji",
    mobileEyebrow: "Aplikacja na telefonie",
    mobileTitle: "Dodaj SmartRecipe do ekranu głównego",
    mobileText:
      "Na iPhone użyj przycisku udostępniania w Safari i wybierz „Dodaj do ekranu początkowego”. Na Androidzie wybierz menu przeglądarki i „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.",
  },
  en: {
    title: "Account settings",
    back: "← Back to app",
    mobileEyebrow: "Mobile app",
    mobileTitle: "Add SmartRecipe to your home screen",
    mobileText:
      "On iPhone, use the share button in Safari and choose “Add to Home Screen”. On Android, open the browser menu and choose “Install app” or “Add to Home screen”.",
  },
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");
  const language = normalizeLanguage(
    (await cookies()).get(languageCookieName)?.value,
  );
  const copy = settingsCopy[language];

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              SmartRecipe
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-2 text-[#748078]">
              {session.user.name} · {session.user.email}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            {copy.back}
          </Link>
        </header>

        <section className="mt-6 rounded-[1.7rem] border border-[#ced9cf] bg-[#f8fbf7] p-4 shadow-sm sm:mt-10 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
                {copy.mobileEyebrow}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold">
                {copy.mobileTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#68736b]">
                {copy.mobileText}
              </p>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-[#2f684f] text-2xl text-white">
              🍳
            </span>
          </div>
        </section>

        <AccountSettings />
      </div>
    </main>
  );
}
