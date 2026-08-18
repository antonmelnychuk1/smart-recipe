export type AppLanguage = "pl" | "en";
export type CurrencyCode = "PLN" | "EUR" | "USD" | "GBP";

export const languageCookieName = "smart-recipe:language";

export const languageOptions: {
  value: AppLanguage;
  label: string;
  flag: string;
  name: string;
}[] = [
  { value: "pl", label: "PL", flag: "🇵🇱", name: "Polski" },
  { value: "en", label: "EN", flag: "🇬🇧", name: "English" },
];

export const currencyOptions: {
  value: CurrencyCode;
  label: string;
  symbol: string;
}[] = [
  { value: "PLN", label: "PLN", symbol: "zł" },
  { value: "EUR", label: "EUR", symbol: "€" },
  { value: "USD", label: "USD", symbol: "$" },
  { value: "GBP", label: "GBP", symbol: "£" },
];

const currencyRatesToPln: Record<CurrencyCode, number> = {
  PLN: 1,
  EUR: 4.3,
  USD: 4,
  GBP: 5,
};

export function normalizeLanguage(value: string | undefined | null): AppLanguage {
  return value === "en" ? "en" : "pl";
}

export function normalizeCurrency(value: string | undefined | null): CurrencyCode {
  return value === "EUR" || value === "USD" || value === "GBP" ? value : "PLN";
}

export function getCurrencyForLocale(locale: string | undefined): CurrencyCode {
  const normalized = locale?.toLocaleLowerCase() ?? "";

  if (normalized.startsWith("pl")) return "PLN";
  if (normalized.startsWith("en-us")) return "USD";
  if (normalized.startsWith("en-gb")) return "GBP";
  if (
    normalized.startsWith("de") ||
    normalized.startsWith("fr") ||
    normalized.startsWith("es") ||
    normalized.startsWith("it") ||
    normalized.startsWith("nl") ||
    normalized.startsWith("pt") ||
    normalized.startsWith("fi") ||
    normalized.startsWith("el") ||
    normalized.startsWith("sk") ||
    normalized.startsWith("sl") ||
    normalized.startsWith("et") ||
    normalized.startsWith("lv") ||
    normalized.startsWith("lt")
  ) {
    return "EUR";
  }

  return "USD";
}

export const homeCopy = {
  pl: {
    nav: {
      how: "Jak to działa?",
      recipes: "Przepisy",
      planner: "Planer",
      kitchen: "Moja kuchnia",
      saved: "Zapisane",
      savedRecipes: "Zapisane przepisy",
      history: "Historia",
      recipeHistory: "Historia przepisów",
      admin: "Admin",
      accountSettings: "Ustawienia konta",
      adminPanel: "Panel administratora",
      logout: "Wyloguj",
      logoutFull: "Wyloguj się",
      login: "Zaloguj się",
      loginOrCreate: "Zaloguj się lub utwórz konto",
      openMenu: "Otwórz menu",
      closeMenu: "Zamknij menu",
      language: "Język",
    },
    hero: {
      badge: "Mniej marnowania, więcej smaku",
      title: "Co dziś ugotujemy",
      titleAccent: "z tego, co masz?",
      description:
        "Wpisz produkty ze swojej kuchni. Znajdziemy dla nich pyszne zastosowanie i podpowiemy, czego ewentualnie brakuje.",
    },
    generator: {
      ingredientsLabel: "Twoje składniki",
      addProduct: "Dodaj produkt...",
      suggestions: "Podpowiedzi:",
      diet: "Dieta",
      budget: "Budżet na 2 porcje",
      maxTime: "Maksymalny czas",
      generating: "AI gotuje...",
      generate: "Generuj przepisy",
      adminLimit: "Konto administratora — generowanie bez limitu.",
      accountLimitPrefix: "Twoje konto obejmuje",
      accountLimitSuffix: "generowań dziennie",
      guestLimitPrefix: "Bez konta otrzymujesz",
      guestLimitSuffix: "generowania dziennie",
      createAccount: "Załóż konto — zwiększ limit do 20",
      loadingTitle: "AI gotuje propozycje...",
      loadingText:
        "Tworzymy 3 przepisy z proporcjami, wartościami odżywczymi i zdjęciami z Pexels.",
      remainingToday: "Pozostało dziś:",
      generations: "generowań",
      resetAt: "Limit odnowi się",
      fallbackError: "Nie udało się wygenerować przepisów.",
      removeIngredient: "Usuń",
    },
    how: [
      ["01", "Dodaj składniki", "Wpisz to, co masz w lodówce i spiżarni."],
      [
        "02",
        "Ustaw preferencje",
        "Dieta, czas i poziom trudności są po Twojej stronie.",
      ],
      [
        "03",
        "Gotuj bez resztek",
        "Wybierz pomysł i wykorzystaj produkty do końca.",
      ],
    ],
    dish: {
      eyebrow: "Masz ochotę na konkretne danie?",
      title: "Wpisz, co chcesz ugotować",
      description:
        "Napisz „pancakes”, „gulasz” albo dokładniej: „wegańskie curry z ciecierzycą”. Otrzymasz pełny przepis dla dwóch osób.",
      label: "Nazwa lub opis dania",
      placeholder: "np. puszyste pancakes z owocami",
      creating: "AI gotuje...",
      create: "Stwórz przepis",
      note:
        "Ten generator ma własne ustawienia. Obowiązuje wspólny dzienny limit generowania.",
      loadingTitle: "Tworzymy warianty dania...",
      loadingText: "Za chwilę pojawią się 3 różne propozycje przepisu.",
      fallbackError: "Nie udało się przygotować przepisu.",
      historyPrefix: "Danie:",
    },
    options: {
      diets: {
        "Bez ograniczeń": "Bez ograniczeń",
        Wegetariańska: "Wegetariańska",
        Wegańska: "Wegańska",
        Pescetariańska: "Pescetariańska",
        Bezglutenowa: "Bezglutenowa",
        "Bez laktozy": "Bez laktozy",
        Ketogeniczna: "Ketogeniczna",
        Niskowęglowodanowa: "Niskowęglowodanowa",
        Śródziemnomorska: "Śródziemnomorska",
        Wysokobiałkowa: "Wysokobiałkowa",
      },
      noLimit: "Bez ograniczeń",
      minutesPrefix: "do",
      minutesSuffix: "minut",
      currency: "zł",
    },
    results: {
      cooking: "AI gotuje",
      requestedDish: "Przepis na Twoje życzenie",
      matched: "Dopasowane dla Ciebie",
      demo: "Przykładowe inspiracje",
      preparing: "Przygotowujemy 3 propozycje",
      variants: "warianty wybranego dania",
      ideas: "pomysły na dzisiaj",
      demoTitle: "Tak mogą wyglądać wyniki",
      cookingText:
        "To może chwilę potrwać — dobieramy składniki, proporcje, kroki i zdjęcia.",
      dishText:
        "Wybierz najlepszy z trzech wariantów. Każdy zawiera pełną listę produktów, instrukcję i wartości odżywcze.",
      defaultText:
        "Procent dopasowania pokazuje, ile potrzebnych produktów już masz. Brakujące składniki łatwo przeniesiesz później na listę zakupów.",
      inProgress: "Generowanie w toku",
      ready: "Wyniki gotowe",
      demoMode: "Tryb demo",
      limit: "Limit:",
      fullRecipe: "Pełny przepis",
      match: "dopasowania",
      photo: "Fot.",
      addFavorite: "Dodaj do ulubionych",
      removeFavorite: "Usuń z ulubionych",
      approx: "ok.",
      missing: "Brakuje",
      haveEverything: "Masz wszystko!",
      allOnList: "✓ Wszystkie są na liście",
      addAllMissing: "Dodaj wszystkie brakujące",
      substitutions: "Zamienniki",
      moreInDetails: "więcej w szczegółach przepisu",
      viewRecipe: "Zobacz przepis",
      noRecipes: "Brak przepisów dla wybranych filtrów",
      noRecipesHint: "Zwiększ maksymalny czas albo wygeneruj nowe propozycje.",
    },
    kitchen: {
      eyebrow: "Twój zapisany kącik",
      title: "Moja kuchnia",
      signedIn:
        "Twoje dane są zapisane na koncie i dostępne po ponownym zalogowaniu.",
      local:
        "Dane są teraz lokalne. Zaloguj się, aby zapisać je na koncie i synchronizować.",
      login: "Zaloguj się lub utwórz konto",
      favorites: "Ulubione",
      history: "Historia",
      fullHistory: "Cała historia",
      clear: "Wyczyść",
      emptyFavorites: "Kliknij serce przy przepisie, a znajdziesz go tutaj.",
      generated: "Wygenerowane",
      generatedHint: "przepisy z historii",
      savedInspirations: "zapisane inspiracje",
      recentSearches: "ostatnie wyszukiwania",
      pantry: "Spiżarnia",
      pantryHint: "produkty w domu",
      shoppingShort: "Zakupy",
      shoppingHint: "produkty do kupienia",
      plan: "Plan",
      planHint: "posiłki w tygodniu",
      feedback: "Feedback",
      feedbackHint: "oceny przepisów",
      dailyLimit: "Dzisiejszy limit",
      noLimit: "bez limitu",
      adminAccount: "konto administratora",
      remainingGenerations: "pozostałe generowania",
      shoppingList: "Lista zakupów",
      oneProductToBuy: "produkt do kupienia",
      productsToBuy: "produktów do kupienia",
      expired: "po terminie",
      expiringSoon: "z krótką datą",
      weeklyPlan: "Plan tygodnia",
      plannedMeal: "zaplanowany posiłek",
      plannedMeals: "zaplanowanych posiłków",
      lastSaved: "Ostatnio zapisany:",
      noHistory:
        "Po wygenerowaniu przepisów zapiszemy tutaj ostatnie wyszukiwania.",
      specificDish: "konkretne danie",
    },
    shopping: {
      listTitle: "Lista zakupów",
      visible: "widocznych",
      total: "łącznie",
      copy: "Kopiuj",
      copied: "Lista zakupów została skopiowana.",
      copyFailed: "Nie udało się skopiować listy zakupów.",
      boughtToPantry: "Kupione do spiżarni",
      removeBought: "Usuń kupione",
      clear: "Wyczyść",
      placeholder: "Dodaj produkt, np. banany",
      add: "Dodaj",
      pending: "Do kupienia",
      bought: "Kupione",
      all: "Wszystko",
      save: "Zapisz",
      cancel: "Anuluj",
      edit: "Edytuj",
      toPantry: "Do spiżarni",
      remove: "Usuń",
      noBought: "Nie masz jeszcze kupionych produktów.",
      allBought: "Wszystko z listy jest oznaczone jako kupione.",
      empty:
        "Dodaj produkt ręcznie albo przenieś brakujące składniki z karty przepisu.",
      alreadyOnList: "Te produkty są już na liście zakupów.",
      added: "Dodano:",
      addedMany: "produktów dodano do listy zakupów.",
      uncheck: "Cofnij oznaczenie",
      markBought: "Oznacz jako kupione",
    },
    recipeModal: {
      closeRecipe: "Zamknij przepis",
      photo: "Zdjęcie:",
      proteinShort: "B",
      carbsShort: "W",
      fatShort: "T",
      servings: "porcje",
      rate: "Oceń ten przepis",
      servingsLabel: "Porcje",
      decreaseServings: "Zmniejsz liczbę porcji",
      increaseServings: "Zwiększ liczbę porcji",
      cookingMode: "Tryb gotowania",
      markUsed: "Oznacz produkty jako zużyte",
      processing: "Przetwarzam...",
      copyLink: "Kopiuj link",
      openPublic: "Otwórz publiczną stronę",
      makePrivate: "Ustaw jako prywatny",
      sharing: "Udostępniam...",
      shareRecipe: "Udostępnij przepis",
      publicInfo: "Każda osoba z linkiem może zobaczyć ten przepis.",
      privateInfo: "Przepis jest prywatny, dopóki go nie udostępnisz.",
      missingClick: "Brakujące — kliknij, aby dodać",
      substitutions: "Zamienniki składników",
      ingredients: "Składniki",
      preparation: "Przygotowanie",
      approx: "ok.",
    },
    cookingMode: {
      label: "Tryb gotowania:",
      step: "Krok",
      of: "z",
      close: "Zamknij tryb gotowania",
      progress: "Postęp:",
      ingredientsFor: "Składniki na",
      servingOne: "porcję",
      servingFew: "porcje",
      servingMany: "porcji",
      scaled: "proporcje przeliczone",
      timer: "Timer kuchenny",
      pause: "Pauza",
      start: "Start",
      doneTitle: "Gotowe!",
      doneText:
        "Możesz oznaczyć użyte produkty jako zużyte w spiżarni albo wrócić do przepisu bez zmian.",
      markUsed: "Oznacz składniki jako zużyte",
      closeWithoutChanges: "Zamknij bez zmian",
      showSubstitutions: "Pokaż zamienniki składników",
      doneStep: "✓ Zrobione",
      checkStep: "Odhacz krok",
      goToStep: "Przejdź do kroku",
      previous: "← Poprzedni",
      done: "Gotowe",
      next: "Następny →",
    },
    feedback: {
      liked: "👍 Super",
      too_expensive: "Za drogie",
      too_hard: "Za trudne",
      too_caloric: "Za dużo kalorii",
      bad_photo: "Zdjęcie nie pasuje",
    },
    footer: {
      text: "SmartRecipe · Gotuj sprytniej, marnuj mniej.",
      pexels: "Photos provided by Pexels",
    },
  },
  en: {
    nav: {
      how: "How it works",
      recipes: "Recipes",
      planner: "Planner",
      kitchen: "My kitchen",
      saved: "Saved",
      savedRecipes: "Saved recipes",
      history: "History",
      recipeHistory: "Recipe history",
      admin: "Admin",
      accountSettings: "Account settings",
      adminPanel: "Admin panel",
      logout: "Log out",
      logoutFull: "Log out",
      login: "Log in",
      loginOrCreate: "Log in or create account",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      language: "Language",
    },
    hero: {
      badge: "Less waste, more flavor",
      title: "What should we cook today",
      titleAccent: "with what you have?",
      description:
        "Enter products from your kitchen. We will turn them into tasty recipe ideas and show what might be missing.",
    },
    generator: {
      ingredientsLabel: "Your ingredients",
      addProduct: "Add product...",
      suggestions: "Suggestions:",
      diet: "Diet",
      budget: "Budget for 2 servings",
      maxTime: "Max time",
      generating: "AI is cooking...",
      generate: "Generate recipes",
      adminLimit: "Administrator account — unlimited generation.",
      accountLimitPrefix: "Your account includes",
      accountLimitSuffix: "generations per day",
      guestLimitPrefix: "Without an account you get",
      guestLimitSuffix: "generations per day",
      createAccount: "Create account — increase limit to 20",
      loadingTitle: "AI is cooking ideas...",
      loadingText:
        "We are creating 3 recipes with proportions, nutrition estimates and Pexels photos.",
      remainingToday: "Remaining today:",
      generations: "generations",
      resetAt: "Limit resets",
      fallbackError: "Could not generate recipes.",
      removeIngredient: "Remove",
    },
    how: [
      ["01", "Add ingredients", "Enter what you have in the fridge and pantry."],
      ["02", "Set preferences", "Diet, time and difficulty are up to you."],
      ["03", "Cook with less waste", "Choose an idea and use your products fully."],
    ],
    dish: {
      eyebrow: "Craving a specific dish?",
      title: "Type what you want to cook",
      description:
        "Write “pancakes”, “stew”, or something more specific like “vegan chickpea curry”. You will get a complete recipe for two people.",
      label: "Dish name or description",
      placeholder: "e.g. fluffy pancakes with fruit",
      creating: "AI is cooking...",
      create: "Create recipe",
      note:
        "This generator has its own settings. The shared daily generation limit still applies.",
      loadingTitle: "Creating dish variants...",
      loadingText: "Three different recipe ideas will appear in a moment.",
      fallbackError: "Could not prepare the recipe.",
      historyPrefix: "Dish:",
    },
    options: {
      diets: {
        "Bez ograniczeń": "No restrictions",
        Wegetariańska: "Vegetarian",
        Wegańska: "Vegan",
        Pescetariańska: "Pescetarian",
        Bezglutenowa: "Gluten-free",
        "Bez laktozy": "Lactose-free",
        Ketogeniczna: "Keto",
        Niskowęglowodanowa: "Low-carb",
        Śródziemnomorska: "Mediterranean",
        Wysokobiałkowa: "High-protein",
      },
      noLimit: "No restrictions",
      minutesPrefix: "up to",
      minutesSuffix: "minutes",
      currency: "PLN",
    },
    results: {
      cooking: "AI is cooking",
      requestedDish: "Recipe on request",
      matched: "Matched for you",
      demo: "Sample inspiration",
      preparing: "Preparing 3 ideas",
      variants: "variants of your dish",
      ideas: "ideas for today",
      demoTitle: "This is how results can look",
      cookingText:
        "This can take a moment — we are matching ingredients, proportions, steps and photos.",
      dishText:
        "Choose the best of three variants. Each one includes products, instructions and nutrition estimates.",
      defaultText:
        "The match score shows how many needed products you already have. Missing products can be moved to the shopping list.",
      inProgress: "Generation in progress",
      ready: "Results ready",
      demoMode: "Demo mode",
      limit: "Limit:",
      fullRecipe: "Full recipe",
      match: "match",
      photo: "Photo:",
      addFavorite: "Add to favorites",
      removeFavorite: "Remove from favorites",
      approx: "approx.",
      missing: "Missing",
      haveEverything: "You have everything!",
      allOnList: "✓ All are on the list",
      addAllMissing: "Add all missing",
      substitutions: "Substitutions",
      moreInDetails: "more in recipe details",
      viewRecipe: "View recipe",
      noRecipes: "No recipes for selected filters",
      noRecipesHint: "Increase the maximum time or generate new ideas.",
    },
    kitchen: {
      eyebrow: "Your saved corner",
      title: "My kitchen",
      signedIn: "Your data is saved to your account and available after login.",
      local:
        "Your data is stored locally. Log in to save it to your account and sync it.",
      login: "Log in or create account",
      favorites: "Favorites",
      history: "History",
      fullHistory: "Full history",
      clear: "Clear",
      emptyFavorites: "Click the heart on a recipe and it will appear here.",
      generated: "Generated",
      generatedHint: "recipes from history",
      savedInspirations: "saved inspiration",
      recentSearches: "recent searches",
      pantry: "Pantry",
      pantryHint: "products at home",
      shoppingShort: "Shopping",
      shoppingHint: "products to buy",
      plan: "Plan",
      planHint: "meals this week",
      feedback: "Feedback",
      feedbackHint: "recipe ratings",
      dailyLimit: "Today’s limit",
      noLimit: "unlimited",
      adminAccount: "administrator account",
      remainingGenerations: "remaining generations",
      shoppingList: "Shopping list",
      oneProductToBuy: "product to buy",
      productsToBuy: "products to buy",
      expired: "expired",
      expiringSoon: "expiring soon",
      weeklyPlan: "Weekly plan",
      plannedMeal: "planned meal",
      plannedMeals: "planned meals",
      lastSaved: "Last saved:",
      noHistory: "After generating recipes, your recent searches will appear here.",
      specificDish: "specific dish",
    },
    shopping: {
      listTitle: "Shopping list",
      visible: "visible",
      total: "total",
      copy: "Copy",
      copied: "Shopping list copied.",
      copyFailed: "Could not copy the shopping list.",
      boughtToPantry: "Bought to pantry",
      removeBought: "Remove bought",
      clear: "Clear",
      placeholder: "Add product, e.g. bananas",
      add: "Add",
      pending: "To buy",
      bought: "Bought",
      all: "All",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      toPantry: "To pantry",
      remove: "Remove",
      noBought: "You do not have bought products yet.",
      allBought: "Everything on the list is marked as bought.",
      empty: "Add a product manually or move missing ingredients from a recipe card.",
      alreadyOnList: "These products are already on the shopping list.",
      added: "Added:",
      addedMany: "products added to the shopping list.",
      uncheck: "Unmark",
      markBought: "Mark as bought",
    },
    recipeModal: {
      closeRecipe: "Close recipe",
      photo: "Photo:",
      proteinShort: "P",
      carbsShort: "C",
      fatShort: "F",
      servings: "servings",
      rate: "Rate this recipe",
      servingsLabel: "Servings",
      decreaseServings: "Decrease servings",
      increaseServings: "Increase servings",
      cookingMode: "Cooking mode",
      markUsed: "Mark products as used",
      processing: "Processing...",
      copyLink: "Copy link",
      openPublic: "Open public page",
      makePrivate: "Make private",
      sharing: "Sharing...",
      shareRecipe: "Share recipe",
      publicInfo: "Anyone with the link can view this recipe.",
      privateInfo: "The recipe is private until you share it.",
      missingClick: "Missing — click to add",
      substitutions: "Ingredient substitutions",
      ingredients: "Ingredients",
      preparation: "Preparation",
      approx: "approx.",
    },
    cookingMode: {
      label: "Cooking mode:",
      step: "Step",
      of: "of",
      close: "Close cooking mode",
      progress: "Progress:",
      ingredientsFor: "Ingredients for",
      servingOne: "serving",
      servingFew: "servings",
      servingMany: "servings",
      scaled: "proportions adjusted",
      timer: "Kitchen timer",
      pause: "Pause",
      start: "Start",
      doneTitle: "Done!",
      doneText:
        "You can mark used products as consumed in your pantry or return to the recipe without changes.",
      markUsed: "Mark ingredients as used",
      closeWithoutChanges: "Close without changes",
      showSubstitutions: "Show ingredient substitutions",
      doneStep: "✓ Done",
      checkStep: "Check step",
      goToStep: "Go to step",
      previous: "← Previous",
      done: "Done",
      next: "Next →",
    },
    feedback: {
      liked: "👍 Great",
      too_expensive: "Too expensive",
      too_hard: "Too hard",
      too_caloric: "Too many calories",
      bad_photo: "Photo does not match",
    },
    footer: {
      text: "SmartRecipe · Cook smarter, waste less.",
      pexels: "Photos provided by Pexels",
    },
  },
} as const;

export function formatOptionLabel(
  language: AppLanguage,
  type: "time" | "budget",
  value: string,
  polishLabel: string,
  currency?: CurrencyCode,
) {
  const copy = homeCopy[language].options;
  const optionCurrency = currency ?? (language === "pl" ? "PLN" : "USD");

  if (language === "pl") return polishLabel;
  if (value === "0") return copy.noLimit;
  if (type === "budget") return `${copy.minutesPrefix} ${value} ${optionCurrency}`;

  return `${copy.minutesPrefix} ${value} ${copy.minutesSuffix}`;
}

export function formatPrice(
  language: AppLanguage,
  value: number | string,
  currency: CurrencyCode = "PLN",
) {
  const numericValue =
    typeof value === "number"
      ? new Intl.NumberFormat(language === "pl" ? "pl-PL" : "en-US", {
          maximumFractionDigits: 0,
        }).format(value)
      : value;
  const symbol = currencyOptions.find((option) => option.value === currency)?.symbol;

  if (language === "pl" && currency === "PLN") return `${numericValue} zł`;
  if (language === "en" && symbol && currency !== "PLN") {
    return `${symbol}${numericValue}`;
  }

  return `${numericValue} ${currency}`;
}

export function convertPrice(
  value: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
) {
  if (fromCurrency === toCurrency) return value;

  const inPln = value * currencyRatesToPln[fromCurrency];
  return Math.max(1, Math.round(inPln / currencyRatesToPln[toCurrency]));
}
