"use client";

import { FormEvent, useEffect, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { authClient } from "@/lib/auth-client";
import {
  formatOptionLabel,
  getUiLanguage,
  homeCopy,
  normalizeCurrency,
  type AppLanguage,
  type CurrencyCode,
  type UiLanguage,
} from "@/lib/i18n";

type AccountSession = {
  token: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const dietOptions = [
  "Bez ograniczeń",
  "Wegetariańska",
  "Wegańska",
  "Pescetariańska",
  "Bezglutenowa",
  "Bez laktozy",
  "Ketogeniczna",
  "Niskowęglowodanowa",
  "Śródziemnomorska",
  "Wysokobiałkowa",
];

const timeOptions = [
  ["0", "Bez ograniczeń"],
  ["15", "do 15 minut"],
  ["20", "do 20 minut"],
  ["30", "do 30 minut"],
  ["45", "do 45 minut"],
  ["60", "do 60 minut"],
  ["90", "do 90 minut"],
  ["120", "do 120 minut"],
];

const budgetOptions = [
  ["0", "Bez ograniczeń"],
  ["15", "do 15 zł"],
  ["25", "do 25 zł"],
  ["40", "do 40 zł"],
  ["60", "do 60 zł"],
  ["100", "do 100 zł"],
];

const goalOptions = [
  ["balanced", "Zbalansowanie"],
  ["quick", "Szybko"],
  ["cheap", "Tanio"],
  ["healthy", "Zdrowiej"],
  ["high_protein", "Wysokobiałkowo"],
  ["use_pantry", "Z tego co mam"],
];

const dislikedPrefix = "nie lubię: ";

const accountSettingsCopy = {
  pl: {
    saved: "Preferencje zostały zapisane.",
    saveError: "Błąd zapisu.",
    passwordMismatch: "Nowe hasła nie są identyczne.",
    invalidCurrentPassword: "Obecne hasło jest nieprawidłowe.",
    passwordError: "Nie udało się zmienić hasła.",
    passwordChanged:
      "Hasło zostało zmienione, a pozostałe sesje wylogowane.",
    invalidPassword: "Hasło jest nieprawidłowe.",
    deleteError: "Nie udało się usunąć konta.",
    unknownDevice: "Nieznane urządzenie",
    browser: "Przeglądarka",
    device: "urządzenie",
    deleteConfirmation: "USUŃ",
    personalization: "Personalizacja",
    cookingPreferences: "Preferencje gotowania",
    preferencesDescription:
      "Te ustawienia będą automatycznie używane w generatorze składników i w sekcji „Wpisz, co chcesz ugotować”.",
    diet: "Dieta:",
    goal: "Cel:",
    defaultDiet: "Domyślna dieta",
    cookingGoal: "Cel gotowania",
    defaultBudget: "Domyślny budżet",
    defaultTime: "Domyślny czas",
    caloriesDaily: "Kalorie dziennie",
    proteinDaily: "Białko dziennie (g)",
    allergies: "Alergie i składniki zakazane",
    allergiesPlaceholder: "np. orzechy, krewetki, seler",
    allergiesHint:
      "Wpisz po przecinku. Generator ma całkowicie unikać tych składników w przepisach, krokach i zamiennikach.",
    disliked: "Produkty, których nie lubisz",
    dislikedPlaceholder: "np. kolendra, oliwki, pieczarki",
    dislikedHint:
      "To nie musi być alergia — po prostu produkty, których aplikacja ma nie proponować.",
    impactTitle: "Jak to wpłynie na generator?",
    impactText:
      "Domyślna dieta, czas, budżet i cel ustawią się automatycznie na stronie głównej. Alergie i nielubiane produkty będą przekazywane do AI przy każdym generowaniu.",
    saving: "Zapisuję...",
    savePreferences: "Zapisz preferencje",
    changePassword: "Zmiana hasła",
    changePasswordHint:
      "Po zmianie hasła wszystkie pozostałe urządzenia zostaną wylogowane.",
    currentPassword: "Obecne hasło",
    newPassword: "Nowe hasło",
    repeatPassword: "Powtórz nowe hasło",
    changing: "Zmieniam...",
    changePasswordButton: "Zmień hasło",
    activeSessions: "Aktywne sesje",
    activeSessionsHint:
      "Urządzenia, na których Twoje konto jest obecnie zalogowane.",
    signOutOthers: "Wyloguj pozostałe",
    loadingSessions: "Wczytuję sesje...",
    current: "obecna",
    noData: "brak danych",
    created: "utworzona",
    signOut: "Wyloguj",
    deleteAccount: "Usuń konto",
    deleteWarning:
      "Ta operacja trwale usunie konto, przepisy, historię, listę zakupów, planer oraz statystyki. Nie można jej cofnąć.",
    password: "Hasło",
    typeConfirmation: "Wpisz",
    deleting: "Usuwam...",
    deleteForever: "Usuń konto na zawsze",
    locale: "pl-PL",
  },
  en: {
    saved: "Preferences saved.",
    saveError: "Could not save preferences.",
    passwordMismatch: "The new passwords do not match.",
    invalidCurrentPassword: "Current password is incorrect.",
    passwordError: "Could not change password.",
    passwordChanged:
      "Password changed and all other sessions have been signed out.",
    invalidPassword: "Password is incorrect.",
    deleteError: "Could not delete account.",
    unknownDevice: "Unknown device",
    browser: "Browser",
    device: "device",
    deleteConfirmation: "DELETE",
    personalization: "Personalization",
    cookingPreferences: "Cooking preferences",
    preferencesDescription:
      "These settings will be used automatically in the ingredient generator and in the “Type what you want to cook” section.",
    diet: "Diet:",
    goal: "Goal:",
    defaultDiet: "Default diet",
    cookingGoal: "Cooking goal",
    defaultBudget: "Default budget",
    defaultTime: "Default time",
    caloriesDaily: "Daily calories",
    proteinDaily: "Daily protein (g)",
    allergies: "Allergies and forbidden ingredients",
    allergiesPlaceholder: "e.g. nuts, shrimp, celery",
    allergiesHint:
      "Separate items with commas. The generator should avoid these ingredients in recipes, steps and substitutions.",
    disliked: "Products you dislike",
    dislikedPlaceholder: "e.g. cilantro, olives, mushrooms",
    dislikedHint:
      "This does not have to be an allergy — just products the app should not suggest.",
    impactTitle: "How will this affect the generator?",
    impactText:
      "Default diet, time, budget and goal will be applied automatically on the home page. Allergies and disliked products will be sent to AI with every generation.",
    saving: "Saving...",
    savePreferences: "Save preferences",
    changePassword: "Change password",
    changePasswordHint:
      "After changing your password, all other devices will be signed out.",
    currentPassword: "Current password",
    newPassword: "New password",
    repeatPassword: "Repeat new password",
    changing: "Changing...",
    changePasswordButton: "Change password",
    activeSessions: "Active sessions",
    activeSessionsHint: "Devices where your account is currently signed in.",
    signOutOthers: "Sign out others",
    loadingSessions: "Loading sessions...",
    current: "current",
    noData: "no data",
    created: "created",
    signOut: "Sign out",
    deleteAccount: "Delete account",
    deleteWarning:
      "This permanently deletes your account, recipes, history, shopping list, meal planner and statistics. This cannot be undone.",
    password: "Password",
    typeConfirmation: "Type",
    deleting: "Deleting...",
    deleteForever: "Delete account forever",
    locale: "en-US",
  },
  uk: {
    saved: "Налаштування збережено.",
    saveError: "Помилка збереження.",
    passwordMismatch: "Нові паролі не збігаються.",
    invalidCurrentPassword: "Поточний пароль неправильний.",
    passwordError: "Не вдалося змінити пароль.",
    passwordChanged:
      "Пароль змінено, а всі інші сесії завершено.",
    invalidPassword: "Пароль неправильний.",
    deleteError: "Не вдалося видалити акаунт.",
    unknownDevice: "Невідомий пристрій",
    browser: "Браузер",
    device: "пристрій",
    deleteConfirmation: "ВИДАЛИТИ",
    personalization: "Персоналізація",
    cookingPreferences: "Кулінарні вподобання",
    preferencesDescription:
      "Ці налаштування автоматично використовуватимуться в генераторі інгредієнтів і в секції «Введи, що хочеш приготувати».",
    diet: "Дієта:",
    goal: "Ціль:",
    defaultDiet: "Типова дієта",
    cookingGoal: "Ціль готування",
    defaultBudget: "Типовий бюджет",
    defaultTime: "Типовий час",
    caloriesDaily: "Калорії на день",
    proteinDaily: "Білки на день (г)",
    allergies: "Алергії та заборонені інгредієнти",
    allergiesPlaceholder: "наприклад, горіхи, креветки, селера",
    allergiesHint:
      "Вводь через кому. Генератор має повністю уникати цих інгредієнтів у рецептах, кроках і замінниках.",
    disliked: "Продукти, які ти не любиш",
    dislikedPlaceholder: "наприклад, кінза, оливки, печериці",
    dislikedHint:
      "Це не обов’язково алергія — просто продукти, які застосунок не має пропонувати.",
    impactTitle: "Як це вплине на генератор?",
    impactText:
      "Типова дієта, час, бюджет і ціль автоматично встановляться на головній сторінці. Алергії та небажані продукти надсилатимуться AI під час кожної генерації.",
    saving: "Зберігаю...",
    savePreferences: "Зберегти вподобання",
    changePassword: "Зміна пароля",
    changePasswordHint:
      "Після зміни пароля всі інші пристрої будуть виведені з акаунта.",
    currentPassword: "Поточний пароль",
    newPassword: "Новий пароль",
    repeatPassword: "Повтори новий пароль",
    changing: "Змінюю...",
    changePasswordButton: "Змінити пароль",
    activeSessions: "Активні сесії",
    activeSessionsHint:
      "Пристрої, на яких твій акаунт зараз активний.",
    signOutOthers: "Вийти з інших",
    loadingSessions: "Завантажую сесії...",
    current: "поточна",
    noData: "немає даних",
    created: "створена",
    signOut: "Вийти",
    deleteAccount: "Видалити акаунт",
    deleteWarning:
      "Ця операція назавжди видалить акаунт, рецепти, історію, список покупок, планер і статистику. Її не можна скасувати.",
    password: "Пароль",
    typeConfirmation: "Введи",
    deleting: "Видаляю...",
    deleteForever: "Видалити акаунт назавжди",
    locale: "uk-UA",
  },
} as const satisfies Record<UiLanguage, Record<string, string>>;

const goalLabels: Record<UiLanguage, Record<string, string>> = {
  pl: Object.fromEntries(goalOptions),
  en: {
    balanced: "Balanced",
    quick: "Quick",
    cheap: "Budget-friendly",
    healthy: "Healthier",
    high_protein: "High-protein",
    use_pantry: "Use what I have",
  },
  uk: {
    balanced: "Збалансовано",
    quick: "Швидко",
    cheap: "Бюджетно",
    healthy: "Здоровіше",
    high_protein: "Високобілково",
    use_pantry: "З того, що маю",
  },
};

function splitPreferenceItems(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLocaleLowerCase("pl"))
    .filter(Boolean);
}

function splitStoredExcludedIngredients(items: string[] = []) {
  const allergies: string[] = [];
  const disliked: string[] = [];

  for (const item of items) {
    if (item.startsWith(dislikedPrefix)) {
      disliked.push(item.slice(dislikedPrefix.length));
    } else {
      allergies.push(item);
    }
  }

  return {
    allergies: allergies.join(", "),
    disliked: disliked.join(", "),
  };
}

function deviceName(
  userAgent: string | null | undefined,
  copy: (typeof accountSettingsCopy)[UiLanguage],
) {
  if (!userAgent) return copy.unknownDevice;

  const browser = userAgent.includes("Chrome")
    ? "Chrome"
    : userAgent.includes("Firefox")
      ? "Firefox"
      : userAgent.includes("Safari")
        ? "Safari"
        : copy.browser;
  const system = userAgent.includes("iPhone")
    ? "iPhone"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("Mac")
        ? "macOS"
      : userAgent.includes("Windows")
        ? "Windows"
        : copy.device;

  return `${browser} · ${system}`;
}

type AccountSettingsProps = {
  language?: AppLanguage;
};

export function AccountSettings({ language = "pl" }: AccountSettingsProps) {
  const uiLanguage = getUiLanguage(language);
  const copy = accountSettingsCopy[uiLanguage];
  const optionCopy = homeCopy[language].options;
  const deleteConfirmation = copy.deleteConfirmation;
  const { data: currentSession } = authClient.useSession();
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [defaultDiet, setDefaultDiet] = useState("Bez ograniczeń");
  const [defaultMaxTime, setDefaultMaxTime] = useState("0");
  const [defaultBudget, setDefaultBudget] = useState("0");
  const [currency] = useState<CurrencyCode>(() =>
    typeof window === "undefined"
      ? "PLN"
      : normalizeCurrency(window.localStorage.getItem("smart-recipe:currency")),
  );
  const [cookingGoal, setCookingGoal] = useState("balanced");
  const [excludedIngredients, setExcludedIngredients] = useState("");
  const [dislikedIngredients, setDislikedIngredients] = useState("");
  const [goalsPending, setGoalsPending] = useState(false);
  const [goalsMessage, setGoalsMessage] = useState("");

  async function loadSessions() {
    setSessionsLoading(true);
    const result = await authClient.listSessions();
    setSessions((result.data ?? []) as AccountSession[]);
    setSessionsLoading(false);
  }

  useEffect(() => {
    const initialization = window.setTimeout(() => {
      void loadSessions();
      void fetch("/api/preferences")
        .then((response) => response.json())
        .then(
          (data: {
            calorieTarget?: number | null;
            proteinTarget?: number | null;
            defaultDiet?: string;
            defaultMaxTime?: number;
            defaultBudget?: number;
            cookingGoal?: string;
            excludedIngredients?: string[];
          }) => {
            setCalorieTarget(data.calorieTarget?.toString() ?? "");
            setProteinTarget(data.proteinTarget?.toString() ?? "");
            setDefaultDiet(data.defaultDiet ?? "Bez ograniczeń");
            setDefaultMaxTime(String(data.defaultMaxTime ?? 0));
            setDefaultBudget(String(data.defaultBudget ?? 0));
            setCookingGoal(data.cookingGoal ?? "balanced");
            const storedPreferences = splitStoredExcludedIngredients(
              data.excludedIngredients,
            );
            setExcludedIngredients(storedPreferences.allergies);
            setDislikedIngredients(storedPreferences.disliked);
          },
        );
    }, 0);

    return () => window.clearTimeout(initialization);
  }, []);

  async function saveGoals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGoalsPending(true);
    setGoalsMessage("");
    const response = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calorieTarget: calorieTarget ? Number(calorieTarget) : null,
        proteinTarget: proteinTarget ? Number(proteinTarget) : null,
        defaultDiet,
        defaultMaxTime: Number(defaultMaxTime),
        defaultBudget: Number(defaultBudget),
        cookingGoal,
        excludedIngredients: [
          ...splitPreferenceItems(excludedIngredients),
          ...splitPreferenceItems(dislikedIngredients).map(
            (item) => `${dislikedPrefix}${item}`,
          ),
        ],
      }),
    });
    const data = (await response.json()) as { error?: string };
    setGoalsPending(false);
    setGoalsMessage(
      response.ok ? copy.saved : data.error ?? copy.saveError,
    );
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordPending(true);
    setPasswordMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPassword = String(formData.get("newPassword"));
    const repeatedPassword = String(formData.get("repeatedPassword"));

    if (newPassword !== repeatedPassword) {
      setPasswordPending(false);
      setPasswordMessage(copy.passwordMismatch);
      return;
    }

    const result = await authClient.changePassword({
      currentPassword: String(formData.get("currentPassword")),
      newPassword,
      revokeOtherSessions: true,
    });
    setPasswordPending(false);

    if (result.error) {
      setPasswordMessage(
        result.error.code === "INVALID_PASSWORD"
          ? copy.invalidCurrentPassword
          : result.error.message || copy.passwordError,
      );
      return;
    }

    form.reset();
    setPasswordMessage(copy.passwordChanged);
    await loadSessions();
  }

  async function revokeSession(token: string) {
    await authClient.revokeSession({ token });
    await loadSessions();
  }

  async function revokeOtherSessions() {
    await authClient.revokeOtherSessions();
    await loadSessions();
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== deleteConfirmation) return;

    setDeletePending(true);
    setDeleteError("");
    const formData = new FormData(event.currentTarget);
    const result = await authClient.deleteUser({
      password: String(formData.get("password")),
    });

    if (result.error) {
      setDeletePending(false);
      setDeleteError(
        result.error.code === "INVALID_PASSWORD"
          ? copy.invalidPassword
          : result.error.message || copy.deleteError,
      );
      return;
    }

    window.localStorage.clear();
    window.location.href = "/";
  }

  return (
    <div className="mt-6 space-y-4 sm:mt-10 sm:space-y-6">
      <section className="rounded-[1.7rem] border border-[#ced9cf] bg-[#f8fbf7] p-4 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
              {copy.personalization}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold">
              {copy.cookingPreferences}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748078]">
              {copy.preferencesDescription}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-[#68736b] shadow-sm ring-1 ring-[#e2eadf]">
            <p>
              <strong className="text-[#365a46]">{copy.diet}</strong>{" "}
              {optionCopy.diets[defaultDiet as keyof typeof optionCopy.diets] ??
                defaultDiet}
            </p>
            <p>
              <strong className="text-[#365a46]">{copy.goal}</strong>{" "}
              {goalLabels[uiLanguage][cookingGoal] ??
                goalLabels[uiLanguage].balanced}
            </p>
          </div>
        </div>
        <form onSubmit={saveGoals} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            {copy.defaultDiet}
            <select
              value={defaultDiet}
              onChange={(event) => setDefaultDiet(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            >
              {dietOptions.map((option) => (
                <option key={option} value={option}>
                  {optionCopy.diets[option as keyof typeof optionCopy.diets] ??
                    option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {copy.cookingGoal}
            <select
              value={cookingGoal}
              onChange={(event) => setCookingGoal(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            >
              {goalOptions.map(([value]) => (
                <option key={value} value={value}>
                  {goalLabels[uiLanguage][value] ?? value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {copy.defaultBudget}
            <select
              value={defaultBudget}
              onChange={(event) => setDefaultBudget(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            >
              {budgetOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {formatOptionLabel(language, "budget", value, label, currency)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {copy.defaultTime}
            <select
              value={defaultMaxTime}
              onChange={(event) => setDefaultMaxTime(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            >
              {timeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {formatOptionLabel(language, "time", value, label)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {copy.caloriesDaily}
            <input
              type="number"
              min="800"
              max="6000"
              value={calorieTarget}
              onChange={(event) => setCalorieTarget(event.target.value)}
              placeholder="np. 2200"
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            />
          </label>
          <label className="text-sm font-semibold">
            {copy.proteinDaily}
            <input
              type="number"
              min="20"
              max="400"
              value={proteinTarget}
              onChange={(event) => setProteinTarget(event.target.value)}
              placeholder="np. 120"
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            {copy.allergies}
            <input
              value={excludedIngredients}
              onChange={(event) => setExcludedIngredients(event.target.value)}
              placeholder={copy.allergiesPlaceholder}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            />
            <span className="mt-1 block text-xs font-normal leading-5 text-[#748078]">
              {copy.allergiesHint}
            </span>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            {copy.disliked}
            <input
              value={dislikedIngredients}
              onChange={(event) => setDislikedIngredients(event.target.value)}
              placeholder={copy.dislikedPlaceholder}
              className="mt-2 block h-12 w-full rounded-xl border border-[#dedfd9] bg-white px-4 font-normal outline-none"
            />
            <span className="mt-1 block text-xs font-normal leading-5 text-[#748078]">
              {copy.dislikedHint}
            </span>
          </label>
          <div className="rounded-2xl bg-white p-4 text-xs leading-5 text-[#68736b] ring-1 ring-[#e2eadf] sm:col-span-2">
            <p className="font-semibold text-[#365a46]">
              {copy.impactTitle}
            </p>
            <p className="mt-1">{copy.impactText}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              disabled={goalsPending}
              className="h-11 rounded-xl bg-[#025026] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {goalsPending ? copy.saving : copy.savePreferences}
            </button>
            {goalsMessage && <p className="text-sm text-[#59675f]">{goalsMessage}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">
          {copy.changePassword}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#748078]">
          {copy.changePasswordHint}
        </p>
        <form onSubmit={changePassword} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
            {copy.currentPassword}
            <PasswordInput
              required
              name="currentPassword"
              autoComplete="current-password"
              className="block h-12 w-full rounded-xl border border-[#dedfd9] px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>
          <label className="text-sm font-semibold">
            {copy.newPassword}
            <PasswordInput
              required
              minLength={8}
              name="newPassword"
              autoComplete="new-password"
              className="block h-12 w-full rounded-xl border border-[#dedfd9] px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>
          <label className="text-sm font-semibold">
            {copy.repeatPassword}
            <PasswordInput
              required
              minLength={8}
              name="repeatedPassword"
              autoComplete="new-password"
              className="block h-12 w-full rounded-xl border border-[#dedfd9] px-4 font-normal outline-none focus:border-[#71927e]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              disabled={passwordPending}
              className="h-11 rounded-xl bg-[#025026] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {passwordPending ? copy.changing : copy.changePasswordButton}
            </button>
            {passwordMessage && (
              <p className="text-sm text-[#59675f]">{passwordMessage}</p>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold">
              {copy.activeSessions}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#748078]">
              {copy.activeSessionsHint}
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={revokeOtherSessions}
              className="rounded-xl border border-[#ccd7cf] px-4 py-2.5 text-xs font-semibold text-[#025026]"
            >
              {copy.signOutOthers}
            </button>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {sessionsLoading ? (
            <p className="text-sm text-[#7a857e]">{copy.loadingSessions}</p>
          ) : (
            sessions.map((session) => {
              const isCurrent =
                currentSession?.session.token === session.token;

              return (
                <div
                  key={session.token}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#faf8f3] p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {deviceName(session.userAgent, copy)}
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-[#dfeae1] px-2 py-0.5 text-[10px] text-[#025026]">
                          {copy.current}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[#7a857e]">
                      IP: {session.ipAddress || copy.noData} · {copy.created}{" "}
                      {new Intl.DateTimeFormat(copy.locale, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(session.createdAt))}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => revokeSession(session.token)}
                      className="text-xs font-semibold text-[#a45c45] hover:underline"
                    >
                      {copy.signOut}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-[1.7rem] border border-[#e4bdb5] bg-[#fff9f6] p-4 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-[#913f32]">
          {copy.deleteAccount}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#805f58]">
          {copy.deleteWarning}
        </p>
        <form onSubmit={deleteAccount} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#704d47]">
            {copy.password}
            <PasswordInput
              required
              name="password"
              autoComplete="current-password"
              className="block h-12 w-full rounded-xl border border-[#ddbdb6] bg-white px-4 font-normal outline-none"
            />
          </label>
          <label className="text-sm font-semibold text-[#704d47]">
            {copy.typeConfirmation} “{deleteConfirmation}”
            <input
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 block h-12 w-full rounded-xl border border-[#ddbdb6] bg-white px-4 font-normal outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              disabled={deletePending || confirmation !== deleteConfirmation}
              className="h-11 rounded-xl bg-[#a74738] px-5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {deletePending ? copy.deleting : copy.deleteForever}
            </button>
            {deleteError && (
              <p className="text-sm text-[#a74738]">{deleteError}</p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
