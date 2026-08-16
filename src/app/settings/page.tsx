import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d26849]">
              SmartRecipe
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Ustawienia konta
            </h1>
            <p className="mt-2 text-[#748078]">
              {session.user.name} · {session.user.email}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[#d8d7d0] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            ← Wróć do aplikacji
          </Link>
        </header>

        <section className="mt-6 rounded-[1.7rem] border border-[#ced9cf] bg-[#f8fbf7] p-4 shadow-sm sm:mt-10 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
                Aplikacja na telefonie
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold">
                Dodaj SmartRecipe do ekranu głównego
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#68736b]">
                Na iPhone użyj przycisku udostępniania w Safari i wybierz
                „Dodaj do ekranu początkowego”. Na Androidzie wybierz menu
                przeglądarki i „Zainstaluj aplikację” albo „Dodaj do ekranu
                głównego”.
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
