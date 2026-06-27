import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type VerificationPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  INVALID_TOKEN:
    "Link weryfikacyjny jest nieprawidłowy. Wyślij nową wiadomość i użyj najnowszego linku.",
  TOKEN_EXPIRED:
    "Link weryfikacyjny wygasł. Wyślij nową wiadomość z poziomu aplikacji.",
  USER_NOT_FOUND: "Nie znaleziono konta powiązanego z tym adresem e-mail.",
  INVALID_ORIGIN: "Adres przekierowania nie został zaakceptowany.",
};

export default async function EmailVerifiedPage({
  searchParams,
}: VerificationPageProps) {
  const { error } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, emailVerified: true },
      })
    : null;
  const verified = user?.emailVerified === true;
  const errorMessage = error
    ? errorMessages[error] ??
      `Weryfikacja nie powiodła się (kod: ${error}).`
    : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ed] px-5 text-[#25322b]">
      <section className="w-full max-w-lg rounded-[2rem] border border-[#e2dfd6] bg-[#fffdf8] p-8 text-center shadow-xl sm:p-10">
        <div
          className={`mx-auto grid size-16 place-items-center rounded-full text-3xl ${
            verified
              ? "bg-[#e3eee5] text-[#2f684f]"
              : "bg-[#fff0e8] text-[#a45c45]"
          }`}
        >
          {verified ? "✓" : "!"}
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
          SmartRecipe
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">
          {verified ? "E-mail potwierdzony" : "Nie udało się potwierdzić"}
        </h1>
        <p className="mt-4 leading-7 text-[#68736b]">
          {verified
            ? `Adres ${user.email} został pomyślnie zweryfikowany.`
            : errorMessage ??
              "Konto nadal nie jest zweryfikowane. Wróć do aplikacji i wyślij nowy link."}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[#2f684f] px-6 font-semibold text-white"
        >
          Wróć do aplikacji
        </Link>
      </section>
    </main>
  );
}
