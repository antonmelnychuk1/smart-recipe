import { ResetPasswordForm } from "@/components/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
};

const errorMessages: Record<string, string> = {
  INVALID_TOKEN:
    "Link resetujący jest nieprawidłowy albo wygasł. Wróć do aplikacji i wyślij nowy link.",
  TOKEN_EXPIRED:
    "Link resetujący wygasł. Wróć do aplikacji i wyślij nowy link.",
  INVALID_ORIGIN: "Adres przekierowania nie został zaakceptowany.",
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = getFirstParam(params.token) ?? "";
  const error = getFirstParam(params.error);
  const tokenError = error
    ? errorMessages[error] ?? `Reset hasła nie powiódł się (kod: ${error}).`
    : token
      ? undefined
      : "Brakuje tokenu resetującego. Otwórz najnowszy link z wiadomości e-mail.";

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
          Ustaw nowe hasło
        </h1>
        <p className="mt-4 leading-7 text-[#68736b]">
          Wpisz nowe hasło do swojego konta. Po zmianie stare sesje zostaną
          wylogowane dla bezpieczeństwa.
        </p>

        <ResetPasswordForm token={token} tokenError={tokenError} />
      </section>
    </main>
  );
}
