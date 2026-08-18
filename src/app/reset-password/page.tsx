import { ResetPasswordForm } from "@/components/reset-password-form";
import { cookies } from "next/headers";
import {
  languageCookieName,
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
    lang?: string | string[];
    language?: string | string[];
  }>;
};

const resetPageCopy: Record<
  AppLanguage,
  {
    title: string;
    description: string;
    missingToken: string;
    failed: string;
    errors: Record<string, string>;
  }
> = {
  pl: {
    title: "Ustaw nowe hasło",
    description:
      "Wpisz nowe hasło do swojego konta. Po zmianie stare sesje zostaną wylogowane dla bezpieczeństwa.",
    missingToken:
      "Brakuje tokenu resetującego. Otwórz najnowszy link z wiadomości e-mail.",
    failed: "Reset hasła nie powiódł się",
    errors: {
      INVALID_TOKEN:
        "Link resetujący jest nieprawidłowy albo wygasł. Wróć do aplikacji i wyślij nowy link.",
      TOKEN_EXPIRED:
        "Link resetujący wygasł. Wróć do aplikacji i wyślij nowy link.",
      INVALID_ORIGIN: "Adres przekierowania nie został zaakceptowany.",
    },
  },
  en: {
    title: "Set new password",
    description:
      "Enter a new password for your account. After the change, old sessions will be logged out for security.",
    missingToken: "Missing reset token. Open the latest link from your e-mail.",
    failed: "Password reset failed",
    errors: {
      INVALID_TOKEN:
        "The reset link is invalid or expired. Return to the app and send a new link.",
      TOKEN_EXPIRED:
        "The reset link has expired. Return to the app and send a new link.",
      INVALID_ORIGIN: "The redirect address was not accepted.",
    },
  },
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const language = normalizeLanguage(
    getFirstParam(params.lang) ??
      getFirstParam(params.language) ??
      (await cookies()).get(languageCookieName)?.value,
  );
  const copy = resetPageCopy[language];
  const token = getFirstParam(params.token) ?? "";
  const error = getFirstParam(params.error);
  const tokenError = error
    ? copy.errors[error] ?? `${copy.failed} (code: ${error}).`
    : token
      ? undefined
      : copy.missingToken;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ed] px-5 py-8 text-[#25322b]">
      <section className="w-full max-w-lg rounded-[2rem] border border-[#e2dfd6] bg-[#fffdf8] p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3eee5] text-3xl text-[#2f684f]">
          🔐
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
          SmartRecipe
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">
          {copy.title}
        </h1>
        <p className="mt-4 leading-7 text-[#68736b]">
          {copy.description}
        </p>

        <ResetPasswordForm
          language={language}
          token={token}
          tokenError={tokenError}
        />
      </section>
    </main>
  );
}
