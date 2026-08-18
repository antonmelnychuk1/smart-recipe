import { Resend } from "resend";
import {
  getUiLanguage,
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n";

type VerificationEmail = {
  email: string;
  name: string;
  verificationUrl: string;
};

type PasswordResetEmail = {
  email: string;
  name: string;
  resetUrl: string;
};

const emailCopy = {
  pl: {
    verificationSubject: "Potwierdź swój adres e-mail w SmartRecipe",
    verificationText: (name: string, url: string) =>
      `Cześć ${name}! Potwierdź swój adres e-mail, otwierając ten link: ${url}`,
    verificationTitle: "Potwierdź swój adres e-mail",
    verificationIntro: (name: string) =>
      `Cześć ${name}! Kliknij poniższy przycisk, aby potwierdzić adres e-mail i zabezpieczyć swoje konto.`,
    verificationButton: "Potwierdź e-mail",
    verificationFooter:
      "Jeśli nie zakładałeś konta SmartRecipe, możesz zignorować tę wiadomość.",
    resetSubject: "Zresetuj hasło w SmartRecipe",
    resetText: (name: string, url: string) =>
      `Cześć ${name}! Ustaw nowe hasło, otwierając ten link: ${url}. Link wygaśnie po 1 godzinie.`,
    resetTitle: "Reset hasła",
    resetIntro: (name: string) =>
      `Cześć ${name}! Kliknij poniższy przycisk, aby ustawić nowe hasło do swojego konta.`,
    resetButton: "Ustaw nowe hasło",
    resetFooter:
      "Link wygaśnie po 1 godzinie. Jeśli nie prosiłeś o reset hasła, możesz zignorować tę wiadomość.",
  },
  en: {
    verificationSubject: "Confirm your e-mail address in SmartRecipe",
    verificationText: (name: string, url: string) =>
      `Hi ${name}! Confirm your e-mail address by opening this link: ${url}`,
    verificationTitle: "Confirm your e-mail address",
    verificationIntro: (name: string) =>
      `Hi ${name}! Click the button below to confirm your e-mail address and secure your account.`,
    verificationButton: "Confirm e-mail",
    verificationFooter:
      "If you did not create a SmartRecipe account, you can ignore this message.",
    resetSubject: "Reset your SmartRecipe password",
    resetText: (name: string, url: string) =>
      `Hi ${name}! Set a new password by opening this link: ${url}. The link expires in 1 hour.`,
    resetTitle: "Password reset",
    resetIntro: (name: string) =>
      `Hi ${name}! Click the button below to set a new password for your account.`,
    resetButton: "Set new password",
    resetFooter:
      "The link expires in 1 hour. If you did not request a password reset, you can ignore this message.",
  },
} as const;

export async function sendVerificationEmail({
  email,
  name,
  verificationUrl,
}: VerificationEmail) {
  const apiKey = normalizeEnvironmentValue(process.env.RESEND_API_KEY);

  if (!apiKey) {
    console.error("RESEND_API_KEY is missing. Verification email was not sent.");
    return;
  }

  const resend = new Resend(apiKey);
  const from =
    normalizeEnvironmentValue(process.env.EMAIL_FROM) ??
    "SmartRecipe <onboarding@resend.dev>";
  const copy = emailCopy[getUiLanguage(getLanguageFromUrl(verificationUrl))];
  const safeName = escapeHtml(name);
  const safeVerificationUrl = escapeHtml(verificationUrl);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: copy.verificationSubject,
    text: copy.verificationText(name, verificationUrl),
    html: `
      <div style="background:#f7f4ed;padding:40px 16px;font-family:Arial,sans-serif;color:#25322b">
        <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #e2dfd6;border-radius:24px;padding:36px">
          <div style="font-size:20px;font-weight:700;color:#2f684f">Smart<span style="color:#dc704d">Recipe</span></div>
          <h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.15;margin:28px 0 14px">${copy.verificationTitle}</h1>
          <p style="font-size:16px;line-height:1.7;color:#68736b;margin:0 0 26px">
            ${copy.verificationIntro(safeName)}
          </p>
          <a href="${safeVerificationUrl}" style="display:inline-block;background:#2f684f;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">
            ${copy.verificationButton}
          </a>
          <p style="font-size:12px;line-height:1.6;color:#8a948e;margin:28px 0 0">
            ${copy.verificationFooter}
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Resend verification email failed", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
    throw new Error(`Resend failed: ${error.message}`);
  }
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: PasswordResetEmail) {
  const apiKey = normalizeEnvironmentValue(process.env.RESEND_API_KEY);

  if (!apiKey) {
    console.error("RESEND_API_KEY is missing. Password reset email was not sent.");
    return;
  }

  const resend = new Resend(apiKey);
  const from =
    normalizeEnvironmentValue(process.env.EMAIL_FROM) ??
    "SmartRecipe <onboarding@resend.dev>";
  const copy = emailCopy[getUiLanguage(getLanguageFromUrl(resetUrl))];
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: copy.resetSubject,
    text: copy.resetText(name, resetUrl),
    html: `
      <div style="background:#f7f4ed;padding:40px 16px;font-family:Arial,sans-serif;color:#25322b">
        <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #e2dfd6;border-radius:24px;padding:36px">
          <div style="font-size:20px;font-weight:700;color:#2f684f">Smart<span style="color:#dc704d">Recipe</span></div>
          <h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.15;margin:28px 0 14px">${copy.resetTitle}</h1>
          <p style="font-size:16px;line-height:1.7;color:#68736b;margin:0 0 26px">
            ${copy.resetIntro(safeName)}
          </p>
          <a href="${safeResetUrl}" style="display:inline-block;background:#2f684f;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">
            ${copy.resetButton}
          </a>
          <p style="font-size:12px;line-height:1.6;color:#8a948e;margin:28px 0 0">
            ${copy.resetFooter}
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Resend password reset email failed", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
    throw new Error(`Resend failed: ${error.message}`);
  }
}

function normalizeEnvironmentValue(value: string | undefined) {
  if (!value) return undefined;

  const trimmed = value.trim();
  const hasMatchingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return hasMatchingQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

function getLanguageFromUrl(value: string): AppLanguage {
  try {
    const url = new URL(value);
    return normalizeLanguage(
      url.searchParams.get("lang") ?? url.searchParams.get("language"),
    );
  } catch {
    return "pl";
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
