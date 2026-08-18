import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  languageCookieName,
  normalizeLanguage,
  type UiLanguage,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type VerificationPageProps = {
  searchParams: Promise<{ error?: string; lang?: string; language?: string }>;
};

export const metadata: Metadata = {
  title: "E-mail verification",
  description: "Confirm your SmartRecipe account e-mail address.",
  robots: {
    index: false,
    follow: false,
  },
};

const emailVerifiedCopy: Record<
  UiLanguage,
  {
    successTitle: string;
    failedTitle: string;
    success: (email: string) => string;
    failed: string;
    unknownFailed: string;
    back: string;
    errors: Record<string, string>;
  }
> = {
  pl: {
    successTitle: "E-mail potwierdzony",
    failedTitle: "Nie udało się potwierdzić",
    success: (email) => `Adres ${email} został pomyślnie zweryfikowany.`,
    failed:
      "Konto nadal nie jest zweryfikowane. Wróć do aplikacji i wyślij nowy link.",
    unknownFailed: "Weryfikacja nie powiodła się",
    back: "Wróć do aplikacji",
    errors: {
      INVALID_TOKEN:
        "Link weryfikacyjny jest nieprawidłowy. Wyślij nową wiadomość i użyj najnowszego linku.",
      TOKEN_EXPIRED:
        "Link weryfikacyjny wygasł. Wyślij nową wiadomość z poziomu aplikacji.",
      USER_NOT_FOUND: "Nie znaleziono konta powiązanego z tym adresem e-mail.",
      INVALID_ORIGIN: "Adres przekierowania nie został zaakceptowany.",
    },
  },
  en: {
    successTitle: "E-mail confirmed",
    failedTitle: "Could not confirm e-mail",
    success: (email) => `Address ${email} has been verified successfully.`,
    failed:
      "The account is still not verified. Return to the app and send a new link.",
    unknownFailed: "Verification failed",
    back: "Back to app",
    errors: {
      INVALID_TOKEN:
        "The verification link is invalid. Send a new message and use the latest link.",
      TOKEN_EXPIRED:
        "The verification link has expired. Send a new message from the app.",
      USER_NOT_FOUND: "No account was found for this e-mail address.",
      INVALID_ORIGIN: "The redirect address was not accepted.",
    },
  },
  uk: {
    successTitle: "E-mail підтверджено",
    failedTitle: "Не вдалося підтвердити e-mail",
    success: (email) => `Адресу ${email} успішно підтверджено.`,
    failed:
      "Акаунт усе ще не підтверджено. Повернись до застосунку й надішли нове посилання.",
    unknownFailed: "Верифікація не вдалася",
    back: "Назад до застосунку",
    errors: {
      INVALID_TOKEN:
        "Посилання для верифікації неправильне. Надішли новий лист і використай найновіше посилання.",
      TOKEN_EXPIRED:
        "Посилання для верифікації прострочене. Надішли новий лист із застосунку.",
      USER_NOT_FOUND: "Не знайдено акаунт, пов’язаний із цією e-mail адресою.",
      INVALID_ORIGIN: "Адресу перенаправлення не прийнято.",
    },
  },
};

export default async function EmailVerifiedPage({
  searchParams,
}: VerificationPageProps) {
  const { error, lang, language: queryLanguage } = await searchParams;
  const language = normalizeLanguage(
    lang ?? queryLanguage ?? (await cookies()).get(languageCookieName)?.value,
  );
  const copy = emailVerifiedCopy[language];
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, emailVerified: true },
      })
    : null;
  const verified = user?.emailVerified === true;
  const errorMessage = error
    ? copy.errors[error] ?? `${copy.unknownFailed} (code: ${error}).`
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
          {verified ? copy.successTitle : copy.failedTitle}
        </h1>
        <p className="mt-4 leading-7 text-[#68736b]">
          {verified
            ? copy.success(user.email)
            : errorMessage ?? copy.failed}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[#2f684f] px-6 font-semibold text-white"
        >
          {copy.back}
        </Link>
      </section>
    </main>
  );
}
