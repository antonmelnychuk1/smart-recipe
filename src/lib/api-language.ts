import {
  languageCookieName,
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n";

export function getRequestLanguage(request?: Request): AppLanguage {
  const cookieLanguage = request
    ? getCookieValue(request.headers.get("cookie"), languageCookieName)
    : undefined;
  const queryLanguage = request ? getQueryLanguage(request.url) : undefined;
  const headerLanguage = request
    ?.headers.get("accept-language")
    ?.toLocaleLowerCase()
    .startsWith("en")
    ? "en"
    : undefined;

  return normalizeLanguage(queryLanguage ?? cookieLanguage ?? headerLanguage);
}

export function apiError(
  request: Request | undefined,
  messages: Partial<Record<AppLanguage, string>> & { pl: string; en: string },
  status: number,
  init?: ResponseInit,
) {
  const language = getRequestLanguage(request);

  return Response.json(
    { error: messages[language] ?? messages.en },
    { ...init, status },
  );
}

function getCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`))
    ?.slice(key.length + 1);
}

function getQueryLanguage(url: string) {
  try {
    const { searchParams } = new URL(url);
    return searchParams.get("lang") ?? searchParams.get("language");
  } catch {
    return undefined;
  }
}
