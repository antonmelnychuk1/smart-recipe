import { Resend } from "resend";

type VerificationEmail = {
  email: string;
  name: string;
  verificationUrl: string;
};

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

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Potwierdź swój adres e-mail w SmartRecipe",
    text: `Cześć ${name}! Potwierdź swój adres e-mail, otwierając ten link: ${verificationUrl}`,
    html: `
      <div style="background:#f7f4ed;padding:40px 16px;font-family:Arial,sans-serif;color:#25322b">
        <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #e2dfd6;border-radius:24px;padding:36px">
          <div style="font-size:20px;font-weight:700;color:#2f684f">Smart<span style="color:#dc704d">Recipe</span></div>
          <h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.15;margin:28px 0 14px">Potwierdź swój adres e-mail</h1>
          <p style="font-size:16px;line-height:1.7;color:#68736b;margin:0 0 26px">
            Cześć ${escapeHtml(name)}! Kliknij poniższy przycisk, aby potwierdzić adres e-mail i zabezpieczyć swoje konto.
          </p>
          <a href="${escapeHtml(verificationUrl)}" style="display:inline-block;background:#2f684f;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">
            Potwierdź e-mail
          </a>
          <p style="font-size:12px;line-height:1.6;color:#8a948e;margin:28px 0 0">
            Jeśli nie zakładałeś konta SmartRecipe, możesz zignorować tę wiadomość.
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

function normalizeEnvironmentValue(value: string | undefined) {
  if (!value) return undefined;

  const trimmed = value.trim();
  const hasMatchingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return hasMatchingQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
