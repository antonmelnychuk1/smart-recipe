"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { MealPlanner } from "@/components/meal-planner";
import { Pantry } from "@/components/pantry";
import { authClient } from "@/lib/auth-client";
import {
  currencyOptions,
  type CurrencyCode,
  getCurrencyForLocale,
  getCurrencyForPriceRegion,
  getPriceRegionForLocale,
  formatOptionLabel,
  formatPrice,
  homeCopy,
  languageCookieName,
  languageOptions,
  normalizeCurrency,
  normalizePriceRegion,
  priceRegionOptions,
  type AppLanguage,
  type PriceRegionCode,
} from "@/lib/i18n";
import type {
  PantryItem,
  Recipe,
  RecipeFeedback,
  SearchHistoryEntry,
  ShoppingListItem,
} from "@/lib/recipe-types";
import { getSampleRecipes } from "@/lib/sample-recipes";

const emailVerificationEnabled =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED === "true";

const polishIngredientSuggestions = [
  "jajka",
  "ryż",
  "kurczak",
  "pomidor",
  "szpinak",
];
const defaultIngredientsByLanguage: Record<AppLanguage, string[]> = {
  pl: ["jajka", "ryż", "kurczak"],
  en: ["eggs", "rice", "chicken"],
  uk: ["яйця", "рис", "курка"],
};
const defaultIngredientSets = Object.values(defaultIngredientsByLanguage);

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

const shoppingCategoryMatchers = [
  {
    name: "Warzywa i owoce",
    keywords: [
      "pomidor",
      "ogórek",
      "cebula",
      "czosnek",
      "marchew",
      "papryka",
      "ziemni",
      "szpinak",
      "seler",
      "sałata",
      "broku",
      "cukinia",
      "jabł",
      "banan",
      "cytryn",
      "limonk",
      "warzyw",
      "owoc",
    ],
  },
  {
    name: "Mięso, ryby i jajka",
    keywords: [
      "kurcz",
      "indyk",
      "wołow",
      "wieprz",
      "mięso",
      "ryba",
      "łosoś",
      "tuńczyk",
      "jaj",
      "boczek",
      "szynk",
    ],
  },
  {
    name: "Nabiał",
    keywords: [
      "mleko",
      "jogurt",
      "ser",
      "parmezan",
      "mozzarella",
      "feta",
      "śmietan",
      "masło",
      "twaróg",
    ],
  },
  {
    name: "Produkty suche",
    keywords: [
      "ryż",
      "makaron",
      "kasz",
      "mąk",
      "płatki",
      "soczewic",
      "ciecierzyc",
      "fasol",
      "chleb",
      "bułk",
    ],
  },
  {
    name: "Przyprawy i sosy",
    keywords: [
      "sól",
      "pieprz",
      "papryka słodka",
      "curry",
      "oregano",
      "bazyl",
      "sos",
      "ocet",
      "musztard",
      "bulion",
      "oliw",
      "olej",
      "przypraw",
    ],
  },
];

const accents = [
  "from-[#f7c56c] to-[#e78a43]",
  "from-[#8fbb72] to-[#4f8457]",
  "from-[#e47d5d] to-[#bc4544]",
];

const storageKeys = {
  favorites: "smart-recipe:favorites",
  history: "smart-recipe:history",
  shopping: "smart-recipe:shopping",
  pantry: "smart-recipe:pantry",
  feedback: "smart-recipe:feedback",
  restoreHistory: "smart-recipe:restore-history",
  language: "smart-recipe:language",
  currency: "smart-recipe:currency",
  priceRegion: "smart-recipe:price-region",
};

const pageContainerClass = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

const feedbackOptions: {
  value: RecipeFeedback;
  label: string;
  tone: "positive" | "warning";
}[] = [
  { value: "liked", label: "👍 Super", tone: "positive" },
  { value: "too_expensive", label: "Za drogie", tone: "warning" },
  { value: "too_hard", label: "Za trudne", tone: "warning" },
  { value: "too_caloric", label: "Za dużo kalorii", tone: "warning" },
  { value: "bad_photo", label: "Zdjęcie nie pasuje", tone: "warning" },
];

type NativeTab = "generator" | "recipes" | "planner" | "kitchen";

function detectNativeIosApp() {
  if (typeof window === "undefined") return false;

  const capacitor = (
    window as Window & {
      Capacitor?: {
        getPlatform?: () => string;
        isNativePlatform?: () => boolean;
      };
    }
  ).Capacitor;
  const isNative =
    capacitor?.isNativePlatform?.() ||
    window.navigator.userAgent.includes("Capacitor");
  const isIos =
    capacitor?.getPlatform?.() === "ios" ||
    /iPad|iPhone|iPod/.test(window.navigator.userAgent);

  return Boolean(isNative && isIos);
}

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function daysUntilExpiry(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil(
    (new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86_400_000,
  );
}

function sameIngredients(first: string[], second: string[]) {
  return (
    first.length === second.length &&
    first.every((ingredient, index) => ingredient === second[index])
  );
}

function scaleIngredient(ingredient: string, multiplier: number) {
  return ingredient.replace(
    /(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)/,
    (value) => {
      let amount: number;
      if (value.includes("/")) {
        const [numerator, denominator] = value
          .split("/")
          .map((part) => Number(part.trim()));
        amount = denominator ? numerator / denominator : numerator;
      } else {
        amount = Number(value.replace(",", "."));
      }

      return new Intl.NumberFormat("pl-PL", {
        maximumFractionDigits: 2,
      }).format(amount * multiplier);
    },
  );
}

function scaleAmount(value: string, multiplier: number) {
  let amount: number;
  if (value.includes("/")) {
    const [numerator, denominator] = value
      .split("/")
      .map((part) => Number(part.trim()));
    amount = denominator ? numerator / denominator : numerator;
  } else {
    amount = Number(value.replace(",", "."));
  }

  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 2,
  }).format(amount * multiplier);
}

function formatScaledUnit(unit: string, scaledAmount: string) {
  const numericAmount = Number(scaledAmount.replace(",", "."));
  if (numericAmount === 1) return unit;

  const leadingSpace = unit.match(/^\s*/)?.[0] ?? "";
  const normalizedUnit = unit.trim().toLocaleLowerCase("pl");
  const pluralUnits: Record<string, string> = {
    "łyżeczka": "łyżeczki",
    "łyżka": "łyżki",
    "teaspoon": "teaspoons",
    "tablespoon": "tablespoons",
    "piece": "pieces",
    "pc": "pcs",
    "чайна ложка": "чайні ложки",
    "чайної ложки": "чайні ложки",
    "столова ложка": "столові ложки",
    "столової ложки": "столові ложки",
    "склянка": "склянки",
    "зубчик": "зубчики",
    "жменя": "жмені",
    "скибка": "скибки",
    "стебло": "стебла",
    "лист": "листи",
  };

  return `${leadingSpace}${pluralUnits[normalizedUnit] ?? unit.trim()}`;
}

function scaleRecipeText(text: string, multiplier: number) {
  return text.replace(
    /(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)(\s*(?:g|kg|ml|l|г|кг|мл|л|szt\.?|шт\.?|pcs?\.?|pieces?|łyżeczki|łyżeczek|łyżeczka|łyżka|łyżki|łyżek|stołowa|stołowe|stołowych|teaspoons?|tablespoons?|tsp|tbsp|чайна\s+ложка|чайної\s+ложки|чайні\s+ложки|чайних\s+ложок|столова\s+ложка|столової\s+ложки|столові\s+ложки|столових\s+ложок|szklanki|szklanka|склянки|склянка|ząbki|ząbek|зубчики|зубчик|garści|garść|жмені|жменя|plastry|plaster|скибки|скибка|łodyga|łodygi|стебло|стебла|liść|liścia|лист|листа))(?=\s|[.,;:!?)]|$)/gi,
    (_match, value: string, unit: string) => {
      const scaledAmount = scaleAmount(value, multiplier);
      return `${scaledAmount}${formatScaledUnit(unit, scaledAmount)}`;
    },
  );
}

function normalizeShoppingItem(item: string) {
  const withoutAmount = item
    .trim()
    .replace(
      /^(?:ok\.|około|about|approx\.|близько|прибл\.)?\s*\d+(?:\s*\/\s*\d+|[.,]\d+)?\s*(?:g|kg|ml|l|г|кг|мл|л|szt\.?|шт\.?|pcs?\.?|pieces?|łyżeczki|łyżeczek|łyżeczka|łyżka|łyżki|łyżek|stołowa|stołowe|stołowych|teaspoons?|tablespoons?|tsp|tbsp|чайна\s+ложка|чайної\s+ложки|чайні\s+ложки|чайних\s+ложок|столова\s+ложка|столової\s+ложки|столові\s+ложки|столових\s+ложок|szklanki|szklanka|склянки|склянка|ząbki|ząbek|зубчики|зубчик|garści|garść|жмені|жменя|plastry|plaster|скибки|скибка|łodyga|łodygi|стебло|стебла|liść|liścia|лист|листа)\s+/i,
      "",
    )
    .replace(/^(?:stołowa|stołowe|stołowych|ложка|ложки)\s+/i, "")
    .replace(/[.;:,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = withoutAmount.toLocaleLowerCase("pl");
  const commonNames: Record<string, string> = {
    "filetu z kurczaka": "filet z kurczaka",
    "tartego sera": "tarty ser",
    "parmezanu": "parmezan",
    "pieprzu": "pieprz",
    "oleju": "olej",
    "oliwy": "oliwa",
    "mieszanki warzyw": "mieszanka warzyw",
    "sosu sojowego": "sos sojowy",
    "sera cheddar": "ser cheddar",
    "sera bursztyn": "ser bursztyn",
    "marchewki": "marchewka",
    "cebuli": "cebula",
    "liścia laurowego": "liść laurowy",
    "all-purpose flour": "all-purpose flour",
    flour: "flour",
    egg: "eggs",
    eggs: "eggs",
    blueberries: "blueberries",
    "sour cream": "sour cream",
    butter: "butter",
    sugar: "sugar",
    salt: "salt",
    oil: "oil",
    potato: "potato",
    potatoes: "potato",
    mushroom: "mushrooms",
    mushrooms: "mushrooms",
    onion: "onion",
    garlic: "garlic",
    "black pepper": "black pepper",
    paprika: "paprika",
    "пшеничного борошна": "пшеничне борошно",
    борошна: "борошно",
    яйця: "яйця",
    яєць: "яйця",
    "теплої води": "вода",
    води: "вода",
    вода: "вода",
    олії: "олія",
    олія: "олія",
    лохини: "лохина",
    лохина: "лохина",
    цукру: "цукор",
    цукор: "цукор",
    сметани: "сметана",
    сметана: "сметана",
    "вершкового масла": "вершкове масло",
    "вершкове масло": "вершкове масло",
    солі: "сіль",
    сіль: "сіль",
    перцю: "перець",
    перець: "перець",
    картоплі: "картопля",
    картопля: "картопля",
    "курячого стегна без кістки": "куряче стегно без кістки",
    "куряче стегно без кістки": "куряче стегно без кістки",
    печериць: "печериці",
    печериці: "печериці",
    майонезу: "майонез",
    майонез: "майонез",
    цибулі: "цибуля",
    цибуля: "цибуля",
    часнику: "часник",
    часник: "часник",
    "чорного перцю": "чорний перець",
    "чорний перець": "чорний перець",
    паприки: "паприка",
    паприка: "паприка",
    ананаса: "ананас",
    ананас: "ананас",
    апельсина: "апельсин",
    апельсин: "апельсин",
    "соку лайма": "сік лайма",
    "сік лайма": "сік лайма",
    меду: "мед",
    мед: "мед",
    "кокосової стружки": "кокосова стружка",
    "кокосова стружка": "кокосова стружка",
    "винограду без кісточок": "виноград без кісточок",
    "виноград без кісточок": "виноград без кісточок",
    "листя мʼяти": "листя мʼяти",
    "листя м’яти": "листя мʼяти",
    ківі: "ківі",
  };

  return commonNames[normalized] ?? withoutAmount;
}

function uniqueShoppingItems(items: string[]) {
  const unique = new Map<string, string>();

  items.forEach((item) => {
    const normalizedItem = normalizeShoppingItem(item);
    if (!normalizedItem) return;
    unique.set(normalizedItem.toLocaleLowerCase("pl"), normalizedItem);
  });

  return [...unique.values()];
}

function getShoppingCategory(item: string) {
  const normalized = item.toLocaleLowerCase("pl");
  const category = shoppingCategoryMatchers.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );

  return category?.name ?? "Pozostałe";
}

function displayShoppingCategory(category: string, language: AppLanguage) {
  if (language === "pl") return category;

  const labels: Record<string, string> = {
    "Warzywa i owoce": "Fruit and vegetables",
    "Mięso, ryby i jajka": "Meat, fish and eggs",
    Nabiał: "Dairy",
    "Produkty suche": "Dry goods",
    "Przyprawy i sosy": "Spices and sauces",
    Pozostałe: "Other",
  };

  return labels[category] ?? category;
}

function groupShoppingItems(items: string[]) {
  return items.reduce<{ name: string; items: string[] }[]>((groups, item) => {
    const categoryName = getShoppingCategory(item);
    const existingGroup = groups.find((group) => group.name === categoryName);

    if (existingGroup) {
      existingGroup.items.push(item);
      return groups;
    }

    return [...groups, { name: categoryName, items: [item] }];
  }, []);
}

function normalizeStoredShoppingList(value: unknown): ShoppingListItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        const label = normalizeShoppingItem(item);
        return label
          ? { id: crypto.randomUUID(), label, checked: false }
          : null;
      }

      if (
        item &&
        typeof item === "object" &&
        "label" in item &&
        typeof item.label === "string"
      ) {
        return {
          id:
            "id" in item && typeof item.id === "string"
              ? item.id
              : crypto.randomUUID(),
          label: normalizeShoppingItem(item.label),
          checked:
            "checked" in item && typeof item.checked === "boolean"
              ? item.checked
              : false,
        };
      }

      return null;
    })
    .filter((item): item is ShoppingListItem => Boolean(item?.label));
}

function formatShoppingListForClipboard(
  groups: ReturnType<typeof groupShoppingItems>,
  title: string,
  language: AppLanguage,
) {
  return [
    title,
    "",
    ...groups.flatMap((group) => [
      displayShoppingCategory(group.name, language),
      ...group.items.map((item) => `- ${item}`),
      "",
    ]),
  ]
    .join("\n")
    .trim();
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(
    2,
    "0",
  )}`;
}

function localizedDifficulty(difficulty: string, language: AppLanguage) {
  const normalized = difficulty.toLocaleLowerCase("pl");
  const level =
    normalized === "bardzo łatwy" ||
    normalized === "very easy" ||
    normalized === "дуже легко"
      ? "veryEasy"
      : normalized === "łatwy" ||
          normalized === "easy" ||
          normalized === "легко"
        ? "easy"
        : normalized === "średni" ||
            normalized === "medium" ||
            normalized === "середньо"
          ? "medium"
          : "hard";

  const labels = {
    pl: {
      veryEasy: "Bardzo łatwy",
      easy: "Łatwy",
      medium: "Średni",
      hard: "Trudny",
    },
    en: {
      veryEasy: "Very easy",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
    },
    uk: {
      veryEasy: "Дуже легко",
      easy: "Легко",
      medium: "Середньо",
      hard: "Складно",
    },
  } as const;

  return labels[language][level];
}

function Icon({ name }: { name: "spark" | "clock" | "heart" | "leaf" }) {
  const paths = {
    spark: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zm6 11l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14z",
    clock:
      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v5l3 2",
    heart:
      "M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8z",
    leaf:
      "M20 4c-8 0-14 4-14 10 0 2 1 4 3 5 4-7 8-9 8-9-5 5-7 9-7 11 8 0 12-5 10-17z",
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill={name === "spark" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function NativeTabIcon({
  name,
  active,
}: {
  name: NativeTab | "more";
  active: boolean;
}) {
  const paths: Record<NativeTab | "more", ReactNode> = {
    generator: (
      <>
        <path d="M14 6a9.3 9.3 0 0 0 1.516-.546c.911-.438 1.494-1.015 1.937-1.932.207-.428.382-.928.547-1.522.165.595.34 1.095.547 1.521.443.918 1.026 1.495 1.937 1.933.426.205.925.38 1.516.546a9.3 9.3 0 0 0-1.516.547c-.911.438-1.494 1.015-1.937 1.932a9 9 0 0 0-.547 1.521c-.165-.594-.34-1.095-.547-1.521-.443-.918-1.026-1.494-1.937-1.932a9 9 0 0 0-1.516-.547" />
        <path d="M3 14a21 21 0 0 0 1.652-.532c2.542-.953 3.853-2.238 4.816-4.806a20 20 0 0 0 .532-1.662 20 20 0 0 0 .532 1.662c.963 2.567 2.275 3.853 4.816 4.806q.75.28 1.652.532a21 21 0 0 0-1.652.532c-2.542.953-3.854 2.238-4.816 4.806a20 20 0 0 0-.532 1.662 20 20 0 0 0-.532-1.662c-.963-2.568-2.275-3.853-4.816-4.806a21 21 0 0 0-1.652-.532" />
      </>
    ),
    recipes: (
      <>
        <path d="M10 19h-6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1h6a2 2 0 0 1 2 2 2 2 0 0 1 2-2h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6a2 2 0 0 0-2 2 2 2 0 0 0-2-2" />
        <path d="M12 5v16" />
        <path d="M7 7h1" />
        <path d="M7 11h1" />
        <path d="M16 7h1" />
        <path d="M16 11h1" />
        <path d="M16 15h1" />
      </>
    ),
    planner: (
      <>
        <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-12" />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M4 11h16" />
        <path d="M7 14h.013" />
        <path d="M10.01 14h.005" />
        <path d="M13.01 14h.005" />
        <path d="M16.015 14h.005" />
        <path d="M13.015 17h.005" />
        <path d="M7.01 17h.005" />
        <path d="M10.01 17h.005" />
      </>
    ),
    kitchen: (
      <>
        <path d="M12 3c1.918 0 3.52 1.35 3.91 3.151a4 4 0 0 1 2.09 7.723l0 7.126h-12v-7.126a4 4 0 1 1 2.092-7.723a4 4 0 0 1 3.908-3.151" />
        <path d="M6.161 17.009l11.839-.009" />
      </>
    ),
    more: (
      <>
        <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
        <path d="M11 19a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
        <path d="M11 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function RecipeCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-[#e2dfd6] bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-[#e7e4dc]" />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#e7e4dc]" />
        <div className="h-7 w-4/5 animate-pulse rounded-full bg-[#e7e4dc]" />
        <div className="space-y-2">
          <div className="h-3 animate-pulse rounded-full bg-[#eeeae2]" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#eeeae2]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 animate-pulse rounded-xl bg-[#f1eee7]" />
          <div className="h-12 animate-pulse rounded-xl bg-[#f1eee7]" />
          <div className="h-12 animate-pulse rounded-xl bg-[#f1eee7]" />
        </div>
      </div>
    </article>
  );
}

function LocaleSettings({
  language,
  currency,
  region,
  onLanguageChange,
  onCurrencyChange,
  onRegionChange,
  compact = false,
}: {
  language: AppLanguage;
  currency: CurrencyCode;
  region: PriceRegionCode;
  onLanguageChange: (language: AppLanguage) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onRegionChange: (region: PriceRegionCode) => void;
  compact?: boolean;
}) {
  const currentLanguage = languageOptions.find(
    (option) => option.value === language,
  );

  return (
    <div
      className={`grid gap-2 rounded-2xl border border-[#d9d7cd] bg-white p-2 text-xs font-bold text-[#667168] shadow-sm ${
        compact
          ? "grid-cols-3"
          : "grid-cols-[auto_auto_auto] rounded-full px-2 py-1.5"
      }`}
    >
      <label
        className={`flex min-w-0 items-center gap-1.5 rounded-full bg-[#f7f4ed] px-2 py-1 ${
          compact ? "justify-center" : ""
        }`}
      >
        <span className="text-sm leading-none">{currentLanguage?.flag}</span>
        <select
          aria-label={homeCopy[language].nav.language}
          value={language}
          onChange={(event) =>
            onLanguageChange(
              event.target.value === "en"
                ? "en"
                : event.target.value === "uk"
                  ? "uk"
                  : "pl",
            )
          }
          className="min-w-0 bg-transparent text-xs font-bold text-[#25322b] outline-none"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label
        className={`flex min-w-0 items-center gap-1.5 rounded-full bg-[#f7f4ed] px-2 py-1 ${
          compact ? "justify-center" : ""
        }`}
      >
        <span>{language === "pl" ? "Wal." : "Cur."}</span>
        <select
          aria-label={language === "pl" ? "Waluta" : "Currency"}
          value={currency}
          onChange={(event) => onCurrencyChange(normalizeCurrency(event.target.value))}
          className="min-w-0 bg-transparent text-xs font-bold text-[#25322b] outline-none"
        >
          {currencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label
        className={`flex min-w-0 items-center gap-1.5 rounded-full bg-[#f7f4ed] px-2 py-1 ${
          compact ? "justify-center" : ""
        }`}
      >
        <span>{language === "pl" ? "Ceny" : "Price"}</span>
        <select
          aria-label={language === "pl" ? "Region cen" : "Price region"}
          value={region}
          onChange={(event) => onRegionChange(normalizePriceRegion(event.target.value))}
          className="min-w-0 max-w-20 bg-transparent text-xs font-bold text-[#25322b] outline-none"
        >
          {priceRegionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default function Home() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [language, setLanguage] = useState<AppLanguage>("pl");
  const [currency, setCurrency] = useState<CurrencyCode>("PLN");
  const [priceRegion, setPriceRegion] = useState<PriceRegionCode>("PL");
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [ingredients, setIngredients] = useState(defaultIngredientsByLanguage.pl);
  const [input, setInput] = useState("");
  const [diet, setDiet] = useState("Bez ograniczeń");
  const [maxTime, setMaxTime] = useState("0");
  const [maxBudget, setMaxBudget] = useState("0");
  const [generated, setGenerated] = useState(false);
  const [generationMode, setGenerationMode] = useState<
    "ingredients" | "dish" | null
  >(null);
  const [desiredDish, setDesiredDish] = useState("");
  const [desiredDishDiet, setDesiredDishDiet] = useState("Bez ograniczeń");
  const [desiredDishMaxTime, setDesiredDishMaxTime] = useState("0");
  const [desiredDishBudget, setDesiredDishBudget] = useState("0");
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [proteinTarget, setProteinTarget] = useState<number | null>(null);
  const [cookingGoal, setCookingGoal] = useState("balanced");
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [preferencesCompleted, setPreferencesCompleted] = useState(true);
  const [desiredDishLoading, setDesiredDishLoading] = useState(false);
  const [desiredDishError, setDesiredDishError] = useState("");
  const [sharePending, setSharePending] = useState(false);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [shoppingInput, setShoppingInput] = useState("");
  const [shoppingFilter, setShoppingFilter] = useState<
    "all" | "pending" | "bought"
  >("pending");
  const [editingShoppingItem, setEditingShoppingItem] = useState("");
  const [editingShoppingValue, setEditingShoppingValue] = useState("");
  const [recipeFeedback, setRecipeFeedback] = useState<
    Record<string, RecipeFeedback>
  >({});
  const [mealPlanCount, setMealPlanCount] = useState(0);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [sampleRecipes, setSampleRecipes] =
    useState<Recipe[]>(getSampleRecipes("pl", "PLN"));
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(2);
  const [cookingMode, setCookingMode] = useState(false);
  const [cookingStep, setCookingStep] = useState(0);
  const [cookingTimerSeconds, setCookingTimerSeconds] = useState(0);
  const [cookingTimerRunning, setCookingTimerRunning] = useState(false);
  const [cookingFinished, setCookingFinished] = useState(false);
  const [checkedCookingIngredients, setCheckedCookingIngredients] = useState<
    Record<string, boolean>
  >({});
  const [checkedCookingSteps, setCheckedCookingSteps] = useState<
    Record<number, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nativeMoreOpen, setNativeMoreOpen] = useState(false);
  const [isNativeIosApp] = useState(detectNativeIosApp);
  const [nativeLaunchVisible, setNativeLaunchVisible] = useState(true);
  const [activeNativeTab, setActiveNativeTab] =
    useState<NativeTab>("generator");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountDailyLimit, setAccountDailyLimit] = useState(20);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [generationUsage, setGenerationUsage] = useState<{
    limit: number;
    remaining: number;
    resetAt: string;
    unlimited?: boolean;
  } | null>(null);
  const dailyGenerationLimit = isAdmin
    ? 0
    : session?.user
      ? accountDailyLimit
      : 3;
  const currentGenerationUsage =
    generationUsage?.unlimited ||
    generationUsage?.limit === dailyGenerationLimit
      ? generationUsage
      : null;
  const expiringPantryItems = pantryItems.filter(
    (item) =>
      item.expiresAt !== null &&
      daysUntilExpiry(item.expiresAt) >= 0 &&
      daysUntilExpiry(item.expiresAt) <= 4,
  );
  const expiredPantryItems = pantryItems.filter(
    (item) => item.expiresAt !== null && daysUntilExpiry(item.expiresAt) < 0,
  );
  const modalOpen = Boolean(selectedRecipe) || cookingMode || authOpen;
  const copy = homeCopy[language];
  const nativeMoreLabel =
    language === "pl" ? "Więcej" : language === "uk" ? "Більше" : "More";
  const nativeTabLabels: Record<NativeTab, string> =
    language === "pl"
      ? {
          generator: "Gotuj",
          recipes: "Przepisy",
          planner: "Plan",
          kitchen: "Kuchnia",
        }
      : language === "uk"
        ? {
            generator: "Готуй",
            recipes: "Рецепти",
            planner: "План",
            kitchen: "Кухня",
          }
        : {
            generator: "Cook",
            recipes: "Recipes",
            planner: "Plan",
            kitchen: "Kitchen",
          };
  const nativeTabClass = (tab: NativeTab) =>
    isNativeIosApp && activeNativeTab !== tab ? "hidden" : "";
  const nativeTabEndSpacer = isNativeIosApp ? (
    <div aria-hidden="true" className="native-tab-end-spacer" />
  ) : null;
  const minuteUnit = language === "uk" ? "хв" : "min";
  const calorieUnit = language === "uk" ? "ккал" : "kcal";
  const pageCopy =
    language === "pl"
      ? {
          suggestions: polishIngredientSuggestions,
          confirmCloseTimer: "Timer nadal działa. Zamknąć tryb gotowania?",
          shareFailed: "Nie udało się udostępnić przepisu.",
          shareCopied: "Przepis jest publiczny. Link został skopiowany.",
          privateFailed: "Nie udało się ukryć przepisu.",
          feedbackRemoved: "Usunięto ocenę przepisu.",
          feedbackLiked: "Dzięki! Zapisaliśmy, że ten przepis Ci pasuje.",
          feedbackSaved: "Dzięki za feedback. Przyda się do dalszych ulepszeń.",
          changed: "Zmieniono:",
          productChanged: "Produkt został zmieniony.",
          alreadyInPantry: "jest już w spiżarni. Usunięto z listy zakupów.",
          movedToPantry: "Przeniesiono do spiżarni:",
          removedOneBought: "Usunięto 1 kupiony produkt.",
          removedBought: "kupionych produktów usunięto.",
          boughtAlreadyInPantry:
            "Kupione produkty były już w spiżarni. Usunięto je z listy.",
          movedProductsToPantry: "produktów przeniesiono do spiżarni.",
          addedToPantry: "Dodano do spiżarni:",
          consumed: "Zużyto:",
          noPantryMatches: "Nie znaleziono pasujących produktów w spiżarni.",
          markAsUsed: "Oznaczyć jako zużyte:",
          removedFromPantry: "produktów usunięto ze spiżarni.",
          addedToGenerator: "produktów dodano do generatora.",
          verificationSent:
            "Wiadomość została wysłana. Sprawdź również folder spam.",
          alreadyVerified: "Ten adres jest już zweryfikowany. Odśwież stronę.",
          tooManyAttempts:
            "Wysłano zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.",
          sendFailed: "Nie udało się wysłać wiadomości. Kod:",
          verifyPrefix: "Potwierdź adres",
          verifySuffix: "aby zabezpieczyć konto.",
          sending: "Wysyłam...",
          sendVerification: "Wyślij link weryfikacyjny",
          checkPantry: "Sprawdź spiżarnię:",
          expired: "po terminie",
          expiring: "z krótką datą ważności",
          viewProducts: "Zobacz produkty",
          setPreferences: "Ustaw preferencje gotowania",
          preferencesText:
            "Dieta, budżet, czas i wykluczone składniki będą automatycznie używane przy generowaniu przepisów.",
          completeNow: "Uzupełnij teraz",
          onboardingSteps: [
            "Wybierz dietę",
            "Dodaj alergie",
            "Ustaw czas i budżet",
          ],
          userPanel: "Panel użytkownika",
          hello: "Cześć",
          dashboardText:
            "Szybki podgląd Twojej kuchni: limity, zakupy, spiżarnia i ostatnie przepisy w jednym miejscu.",
          generateRecipe: "Generuj przepis",
          activity: "Aktywność",
          latest: "Ostatnio:",
          noGenerationHistory: "Nie masz jeszcze historii generowania.",
          history: "Historia",
          limitUsage: "Wykorzystanie limitu",
          adminUnlimited:
            "Masz konto administratora, więc generowanie jest bez limitu.",
          used: "Wykorzystano",
          from: "z",
          limitStarts: "Limit zacznie się liczyć po pierwszym generowaniu.",
        }
      : language === "uk"
        ? {
            suggestions: ["яйця", "рис", "курка", "помідор", "шпинат"],
            confirmCloseTimer:
              "Таймер усе ще працює. Закрити режим готування?",
            shareFailed: "Не вдалося поділитися рецептом.",
            shareCopied: "Рецепт публічний. Посилання скопійовано.",
            privateFailed: "Не вдалося приховати рецепт.",
            feedbackRemoved: "Оцінку рецепту видалено.",
            feedbackLiked:
              "Дякуємо! Ми зберегли, що цей рецепт тобі підходить.",
            feedbackSaved:
              "Дякуємо за відгук. Він допоможе покращувати рецепти.",
            changed: "Змінено:",
            productChanged: "Продукт змінено.",
            alreadyInPantry:
              "вже є в коморі. Видалено зі списку покупок.",
            movedToPantry: "Перенесено до комори:",
            removedOneBought: "Видалено 1 куплений продукт.",
            removedBought: "куплених продуктів видалено.",
            boughtAlreadyInPantry:
              "Куплені продукти вже були в коморі. Їх видалено зі списку.",
            movedProductsToPantry: "продуктів перенесено до комори.",
            addedToPantry: "Додано до комори:",
            consumed: "Використано:",
            noPantryMatches: "Не знайдено відповідних продуктів у коморі.",
            markAsUsed: "Позначити як використане:",
            removedFromPantry: "продуктів видалено з комори.",
            addedToGenerator: "продуктів додано до генератора.",
            verificationSent:
              "Повідомлення надіслано. Перевір також папку зі спамом.",
            alreadyVerified:
              "Цю адресу вже підтверджено. Онови сторінку.",
            tooManyAttempts:
              "Занадто багато спроб. Зачекай трохи й спробуй ще раз.",
            sendFailed: "Не вдалося надіслати повідомлення. Код:",
            verifyPrefix: "Підтвердь адресу",
            verifySuffix: "щоб захистити акаунт.",
            sending: "Надсилаю...",
            sendVerification: "Надіслати посилання верифікації",
            checkPantry: "Перевір комору:",
            expired: "прострочено",
            expiring: "скоро закінчується термін",
            viewProducts: "Переглянути продукти",
            setPreferences: "Налаштуй кулінарні вподобання",
            preferencesText:
              "Дієта, бюджет, час і виключені інгредієнти автоматично використовуватимуться під час генерації рецептів.",
            completeNow: "Заповнити зараз",
            onboardingSteps: [
              "Вибери дієту",
              "Додай алергії",
              "Налаштуй час і бюджет",
            ],
            userPanel: "Панель користувача",
            hello: "Привіт",
            dashboardText:
              "Швидкий огляд твоєї кухні: ліміти, покупки, комора й останні рецепти в одному місці.",
            generateRecipe: "Згенерувати рецепт",
            activity: "Активність",
            latest: "Останнє:",
            noGenerationHistory: "У тебе ще немає історії генерацій.",
            history: "Історія",
            limitUsage: "Використання ліміту",
            adminUnlimited:
              "У тебе акаунт адміністратора, тому генерація без ліміту.",
            used: "Використано",
            from: "з",
            limitStarts:
              "Ліміт почне рахуватися після першої генерації.",
          }
      : {
          suggestions: ["eggs", "rice", "chicken", "tomato", "spinach"],
          confirmCloseTimer: "The timer is still running. Close cooking mode?",
          shareFailed: "Could not share the recipe.",
          shareCopied: "The recipe is public. Link copied.",
          privateFailed: "Could not hide the recipe.",
          feedbackRemoved: "Recipe rating removed.",
          feedbackLiked: "Thanks! We saved that this recipe works for you.",
          feedbackSaved: "Thanks for the feedback. It will help improve recipes.",
          changed: "Changed:",
          productChanged: "Product changed.",
          alreadyInPantry:
            "is already in your pantry. Removed from shopping list.",
          movedToPantry: "Moved to pantry:",
          removedOneBought: "Removed 1 bought product.",
          removedBought: "bought products removed.",
          boughtAlreadyInPantry:
            "Bought products were already in your pantry. Removed them from the list.",
          movedProductsToPantry: "products moved to pantry.",
          addedToPantry: "Added to pantry:",
          consumed: "Used:",
          noPantryMatches: "No matching products found in pantry.",
          markAsUsed: "Mark as used:",
          removedFromPantry: "products removed from pantry.",
          addedToGenerator: "products added to generator.",
          verificationSent: "Message sent. Also check your spam folder.",
          alreadyVerified: "This address is already verified. Refresh the page.",
          tooManyAttempts: "Too many attempts. Wait a moment and try again.",
          sendFailed: "Could not send the message. Code:",
          verifyPrefix: "Confirm address",
          verifySuffix: "to secure your account.",
          sending: "Sending...",
          sendVerification: "Send verification link",
          checkPantry: "Check pantry:",
          expired: "expired",
          expiring: "expiring soon",
          viewProducts: "View products",
          setPreferences: "Set cooking preferences",
          preferencesText:
            "Diet, budget, time and excluded ingredients will be used automatically when generating recipes.",
          completeNow: "Complete now",
          onboardingSteps: [
            "Choose diet",
            "Add allergies",
            "Set time and budget",
          ],
          userPanel: "User panel",
          hello: "Hi",
          dashboardText:
            "A quick look at your kitchen: limits, shopping, pantry and recent recipes in one place.",
          generateRecipe: "Generate recipe",
          activity: "Activity",
          latest: "Recently:",
          noGenerationHistory: "You do not have generation history yet.",
          history: "History",
          limitUsage: "Limit usage",
          adminUnlimited:
            "You have an administrator account, so generation is unlimited.",
          used: "Used",
          from: "of",
          limitStarts: "The limit will start counting after your first generation.",
        };

  function changeLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    setLanguageLoaded(true);
    setSampleRecipes(getSampleRecipes(nextLanguage, currency, priceRegion));
    setIngredients((current) =>
      defaultIngredientSets.some((items) => sameIngredients(current, items))
        ? defaultIngredientsByLanguage[nextLanguage]
        : current,
    );
    document.cookie = `${languageCookieName}=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
  }

  function changeCurrency(nextCurrency: CurrencyCode) {
    setCurrency(nextCurrency);
    setSampleRecipes(getSampleRecipes(language, nextCurrency, priceRegion));
  }

  function changePriceRegion(nextRegion: PriceRegionCode) {
    const nextCurrency = getCurrencyForPriceRegion(nextRegion);
    setPriceRegion(nextRegion);
    setCurrency(nextCurrency);
    setSampleRecipes(getSampleRecipes(language, nextCurrency, nextRegion));
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedLanguage = window.localStorage.getItem(storageKeys.language);
      const storedCurrency = normalizeCurrency(
        window.localStorage.getItem(storageKeys.currency),
      );
      const storedRegion = normalizePriceRegion(
        window.localStorage.getItem(storageKeys.priceRegion),
      );
      const nextLanguage =
        storedLanguage === "pl" ||
        storedLanguage === "en" ||
        storedLanguage === "uk"
          ? storedLanguage
          : window.navigator.language.toLocaleLowerCase().startsWith("en")
            ? "en"
            : window.navigator.language.toLocaleLowerCase().startsWith("uk")
              ? "uk"
            : "pl";
      const nextCurrency =
        window.localStorage.getItem(storageKeys.currency) === null
          ? getCurrencyForLocale(window.navigator.language)
          : storedCurrency;
      const nextRegion =
        window.localStorage.getItem(storageKeys.priceRegion) === null
          ? getPriceRegionForLocale(window.navigator.language)
          : storedRegion;

      setLanguage(nextLanguage);
      setPriceRegion(nextRegion);
      setCurrency(nextCurrency);
      setSampleRecipes(getSampleRecipes(nextLanguage, nextCurrency, nextRegion));
      setIngredients((current) =>
        defaultIngredientSets.some((items) => sameIngredients(current, items))
          ? defaultIngredientsByLanguage[nextLanguage]
          : current,
      );
      setLanguageLoaded(true);
      document.documentElement.lang = nextLanguage;
      document.cookie = `${languageCookieName}=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!languageLoaded) return;

    window.localStorage.setItem(storageKeys.language, language);
    window.localStorage.setItem(storageKeys.currency, currency);
    window.localStorage.setItem(storageKeys.priceRegion, priceRegion);
    document.documentElement.lang = language;
    document.cookie = `${languageCookieName}=${language}; path=/; max-age=31536000; samesite=lax`;
  }, [currency, language, languageLoaded, priceRegion]);

  useEffect(() => {
    const nativeIos = detectNativeIosApp();

    document.documentElement.dataset.nativeIos = nativeIos ? "true" : "false";
    if (!nativeIos) return;

    const closeMenu = window.setTimeout(() => setMobileMenuOpen(false), 0);

    return () => window.clearTimeout(closeMenu);
  }, []);

  useEffect(() => {
    if (!isNativeIosApp) return;

    const finishLaunch = window.setTimeout(() => {
      setNativeLaunchVisible(false);

      void import("@capacitor/status-bar")
        .then((statusBarModule) =>
          Promise.allSettled([
            statusBarModule.StatusBar.setStyle({
              style: statusBarModule.Style.Light,
            }),
            statusBarModule.StatusBar.setBackgroundColor({ color: "#f7f4ed" }),
          ]),
        )
        .catch(() => {
          // Native plugins are optional in the web build.
        });
    }, 1850);

    void Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
    ])
      .then(([statusBarModule, splashScreenModule]) =>
        Promise.allSettled([
          statusBarModule.StatusBar.setStyle({
            style: statusBarModule.Style.Dark,
          }),
          statusBarModule.StatusBar.setBackgroundColor({ color: "#025026" }),
          statusBarModule.StatusBar.setOverlaysWebView({ overlay: false }),
          splashScreenModule.SplashScreen.hide({ fadeOutDuration: 180 }),
        ]),
      )
      .catch(() => {
        // Native plugins are optional in the web build.
      });

    return () => window.clearTimeout(finishLaunch);
  }, [isNativeIosApp]);

  useEffect(() => {
    let cancelled = false;

    fetch(
      `/api/sample-recipes?v=2&language=${language}&currency=${currency}&priceRegion=${priceRegion}`,
    )
      .then((response) => {
        if (!response.ok) throw new Error("Sample photos request failed");
        return response.json() as Promise<{ recipes: Recipe[] }>;
      })
      .then(({ recipes }) => {
        if (!cancelled && recipes.length > 0) setSampleRecipes(recipes);
      })
      .catch(() => {
        // Emoji pozostają bezpiecznym fallbackiem przy niedostępnym Pexels.
      });

    return () => {
      cancelled = true;
    };
  }, [currency, language, priceRegion]);

  useEffect(() => {
    if (!modalOpen) return;

    const scrollY = window.scrollY;
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = originalStyle.position;
      document.body.style.top = originalStyle.top;
      document.body.style.left = originalStyle.left;
      document.body.style.right = originalStyle.right;
      document.body.style.width = originalStyle.width;
      document.body.style.overflow = originalStyle.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [modalOpen]);

  useEffect(() => {
    const initialization = window.setTimeout(() => {
      setFavorites(readStoredValue(storageKeys.favorites, []));
      setHistory(readStoredValue(storageKeys.history, []));
      setShoppingList(
        normalizeStoredShoppingList(readStoredValue(storageKeys.shopping, [])),
      );
      setRecipeFeedback(readStoredValue(storageKeys.feedback, {}));
      setPantryItems(readStoredValue(storageKeys.pantry, []));
      setStorageLoaded(true);
    }, 0);

    return () => window.clearTimeout(initialization);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    window.localStorage.setItem(
      storageKeys.favorites,
      JSON.stringify(favorites),
    );
    window.localStorage.setItem(storageKeys.history, JSON.stringify(history));
    window.localStorage.setItem(
      storageKeys.shopping,
      JSON.stringify(shoppingList),
    );
    window.localStorage.setItem(
      storageKeys.pantry,
      JSON.stringify(pantryItems),
    );
    window.localStorage.setItem(
      storageKeys.feedback,
      JSON.stringify(recipeFeedback),
    );
  }, [
    favorites,
    history,
    pantryItems,
    recipeFeedback,
    shoppingList,
    storageLoaded,
  ]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!storageLoaded) return;

    const stored = window.localStorage.getItem(storageKeys.restoreHistory);
    if (!stored) return;

    window.localStorage.removeItem(storageKeys.restoreHistory);

    try {
      const entry = JSON.parse(stored) as SearchHistoryEntry;
      window.setTimeout(() => {
        if (entry.mode === "dish" && entry.query) {
          setDesiredDish(entry.query);
          setDesiredDishDiet(entry.diet);
          setDesiredDishMaxTime(String(entry.maxTime));
          setGenerationMode("dish");
        } else {
          setIngredients(entry.ingredients);
          setDiet(entry.diet);
          setMaxTime(String(entry.maxTime));
          setGenerationMode("ingredients");
        }
        setGeneratedRecipes(entry.recipes);
        setGenerated(true);

        if (isNativeIosApp) {
          setActiveNativeTab("recipes");
          setNativeMoreOpen(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          window.setTimeout(
            () =>
              document
                .getElementById("results")
                ?.scrollIntoView({ behavior: "smooth", block: "start" }),
            50,
          );
        }
      }, 0);
    } catch {
      // Niepoprawny zapis ignorujemy — historia nadal zostaje w bazie.
    }
  }, [isNativeIosApp, storageLoaded]);

  useEffect(() => {
    if (!cookingMode || !cookingTimerRunning || cookingTimerSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setCookingTimerSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cookingMode, cookingTimerRunning, cookingTimerSeconds]);

  useEffect(() => {
    if (!session?.user || !storageLoaded) return;

    let cancelled = false;

    async function loadKitchen() {
      const response = await fetch("/api/kitchen");
      if (!response.ok) return;

      const remote = (await response.json()) as {
        favorites: Recipe[];
        history: SearchHistoryEntry[];
        shoppingList: ShoppingListItem[];
        pantryItems: PantryItem[];
        feedback: Record<string, RecipeFeedback>;
      };

      const remoteIsEmpty =
        remote.favorites.length === 0 &&
        remote.history.length === 0 &&
        remote.shoppingList.length === 0 &&
        remote.pantryItems.length === 0 &&
        Object.keys(remote.feedback).length === 0;
      const localHasData =
        favorites.length > 0 ||
        history.length > 0 ||
        shoppingList.length > 0 ||
        pantryItems.length > 0 ||
        Object.keys(recipeFeedback).length > 0;

      if (remoteIsEmpty && localHasData) {
        await Promise.all([
          ...favorites.map((recipe) =>
            saveKitchenAction({ action: "favorite.add", recipe }),
          ),
          ...history.map((entry) =>
            saveKitchenAction({
              action: "history.add",
              mode: entry.mode ?? "ingredients",
              query: entry.query ?? null,
              ingredients: entry.ingredients,
              diet: entry.diet,
              maxTime: entry.maxTime,
              recipes: entry.recipes,
            }),
          ),
          ...(shoppingList.length > 0
            ? [
                saveKitchenAction({
                  action: "shopping.add",
                  items: shoppingList.map((item) => item.label),
                }),
              ]
            : []),
          ...shoppingList
            .filter((item) => item.checked)
            .map((item) =>
              saveKitchenAction({
                action: "shopping.toggle",
                label: item.label,
                checked: true,
              }),
            ),
          ...pantryItems.map((item) =>
            saveKitchenAction({
              action: "pantry.upsert",
              label: item.label,
              quantity: item.quantity,
              expiresAt: item.expiresAt,
            }),
          ),
          ...Object.entries(recipeFeedback).map(([recipeKey, feedback]) =>
            saveKitchenAction({
              action: "feedback.set",
              recipeKey,
              recipeTitle: recipeKey,
              feedback,
            }),
          ),
        ]);
        return;
      }

      if (!cancelled) {
        setFavorites(remote.favorites);
        setHistory(remote.history);
        setShoppingList(remote.shoppingList);
        setPantryItems(remote.pantryItems);
        setRecipeFeedback(remote.feedback);
      }
    }

    void loadKitchen();

    return () => {
      cancelled = true;
    };
    // Dane lokalne są używane tylko podczas pierwszej synchronizacji po logowaniu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, storageLoaded]);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;
    fetch("/api/admin/status")
      .then((response) => response.json())
      .then((data: { isAdmin?: boolean; dailyLimit?: number }) => {
        if (!cancelled) {
          setIsAdmin(Boolean(data.isAdmin));
          setAccountDailyLimit(data.dailyLimit ?? 20);
        }
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/preferences")
      .then((response) => response.json())
      .then((data: {
        calorieTarget?: number | null;
        proteinTarget?: number | null;
        defaultDiet?: string;
        defaultMaxTime?: number;
        defaultBudget?: number;
        cookingGoal?: string;
        excludedIngredients?: string[];
        preferencesCompleted?: boolean;
      }) => {
        setCalorieTarget(data.calorieTarget ?? null);
        setProteinTarget(data.proteinTarget ?? null);
        setCookingGoal(data.cookingGoal ?? "balanced");
        setExcludedIngredients(data.excludedIngredients ?? []);
        setPreferencesCompleted(data.preferencesCompleted ?? true);
        if (data.defaultDiet) {
          setDiet(data.defaultDiet);
          setDesiredDishDiet(data.defaultDiet);
        }
        setMaxTime(String(data.defaultMaxTime ?? 0));
        setDesiredDishMaxTime(String(data.defaultMaxTime ?? 0));
        setMaxBudget(String(data.defaultBudget ?? 0));
        setDesiredDishBudget(String(data.defaultBudget ?? 0));
      });
  }, [session?.user]);

  const visibleRecipes = useMemo(
    () =>
      (generated ? generatedRecipes : sampleRecipes).filter(
        (recipe) => maxTime === "0" || recipe.time <= Number(maxTime),
      ),
    [generated, generatedRecipes, maxTime, sampleRecipes],
  );
  const generationInProgress = isLoading || desiredDishLoading;
  const groupedShoppingList = useMemo(
    () =>
      groupShoppingItems(
        shoppingList
          .filter((item) => !item.checked)
          .map((item) => item.label),
      ),
    [shoppingList],
  );
  const groupedBoughtShoppingList = useMemo(
    () =>
      groupShoppingItems(
        shoppingList.filter((item) => item.checked).map((item) => item.label),
      ),
    [shoppingList],
  );
  const pendingShoppingCount = shoppingList.filter((item) => !item.checked).length;
  const boughtShoppingCount = shoppingList.length - pendingShoppingCount;
  const visibleShoppingCount =
    shoppingFilter === "all"
      ? shoppingList.length
      : shoppingFilter === "bought"
        ? boughtShoppingCount
        : pendingShoppingCount;
  const shoppingSections = [
    {
      key: "pending",
      title: copy.shopping.pending,
      count: pendingShoppingCount,
      groups: groupedShoppingList,
      checked: false,
    },
    {
      key: "bought",
      title: copy.shopping.bought,
      count: boughtShoppingCount,
      groups: groupedBoughtShoppingList,
      checked: true,
    },
  ].filter(
    (section) =>
      shoppingFilter === "all" ||
      (shoppingFilter === "pending" && section.key === "pending") ||
      (shoppingFilter === "bought" && section.key === "bought"),
  );
  const shoppingCategorySummary = groupedShoppingList.map((group) => ({
    name: group.name,
    count: group.items.length,
  }));
  const feedbackCount = Object.keys(recipeFeedback).length;
  const generatedRecipeCount = history.reduce(
    (sum, entry) => sum + entry.recipes.length,
    0,
  );
  const kitchenStats = [
    [copy.kitchen.generated, generatedRecipeCount, copy.kitchen.generatedHint],
    [copy.kitchen.favorites, favorites.length, copy.kitchen.savedInspirations],
    [copy.kitchen.history, history.length, copy.kitchen.recentSearches],
    [copy.kitchen.pantry, pantryItems.length, copy.kitchen.pantryHint],
    [copy.kitchen.shoppingShort, pendingShoppingCount, copy.kitchen.shoppingHint],
    [copy.kitchen.plan, mealPlanCount, copy.kitchen.planHint],
    [copy.kitchen.feedback, feedbackCount, copy.kitchen.feedbackHint],
  ];
  const usagePercent =
    currentGenerationUsage && !currentGenerationUsage.unlimited
      ? Math.round(
          ((currentGenerationUsage.limit - currentGenerationUsage.remaining) /
            currentGenerationUsage.limit) *
            100,
        )
      : 0;
  const latestHistoryEntry = history[0];
  const latestFavorite = favorites[0];
  const dashboardCards = [
    {
      label: copy.kitchen.dailyLimit,
      value:
        currentGenerationUsage?.unlimited || isAdmin
          ? copy.kitchen.noLimit
          : currentGenerationUsage
            ? `${currentGenerationUsage.remaining}/${currentGenerationUsage.limit}`
            : `${dailyGenerationLimit}/${dailyGenerationLimit}`,
      hint:
        currentGenerationUsage?.unlimited || isAdmin
          ? copy.kitchen.adminAccount
          : copy.kitchen.remainingGenerations,
      href: "#generator",
    },
    {
      label: copy.kitchen.shoppingList,
      value: pendingShoppingCount,
      hint:
        pendingShoppingCount === 1
          ? copy.kitchen.oneProductToBuy
          : copy.kitchen.productsToBuy,
      href: "#my-kitchen",
    },
    {
      label: copy.kitchen.pantry,
      value: pantryItems.length,
      hint:
        expiredPantryItems.length > 0
          ? `${expiredPantryItems.length} ${copy.kitchen.expired}`
          : expiringPantryItems.length > 0
            ? `${expiringPantryItems.length} ${copy.kitchen.expiringSoon}`
            : copy.kitchen.pantryHint,
      href: "#my-kitchen",
    },
    {
      label: copy.kitchen.weeklyPlan,
      value: mealPlanCount,
      hint:
        mealPlanCount === 1
          ? copy.kitchen.plannedMeal
          : copy.kitchen.plannedMeals,
      href: "#meal-planner",
    },
  ];
  const handleMealPlanEntriesChange = useCallback((count: number) => {
    setMealPlanCount(count);
  }, []);

  function openNativeTab(tab: NativeTab) {
    setActiveNativeTab(tab);
    setNativeMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addIngredient(value = input) {
    const ingredient = value.trim().toLocaleLowerCase("pl");
    if (ingredient && !ingredients.includes(ingredient)) {
      setIngredients((current) => [...current, ingredient]);
    }
    setInput("");
  }

  function openRecipe(recipe: Recipe) {
    setServings(2);
    setCookingMode(false);
    setCookingStep(0);
    setCookingTimerSeconds(0);
    setCookingTimerRunning(false);
    setCookingFinished(false);
    setCheckedCookingIngredients({});
    setCheckedCookingSteps({});
    setSelectedRecipe(recipe);
  }

  function startCookingMode() {
    setCookingStep(0);
    setCookingTimerSeconds(0);
    setCookingTimerRunning(false);
    setCookingFinished(false);
    setCheckedCookingIngredients({});
    setCheckedCookingSteps({});
    setCookingMode(true);
  }

  function closeCookingMode() {
    if (
      cookingTimerRunning &&
      !window.confirm(pageCopy.confirmCloseTimer)
    ) {
      return;
    }

    setCookingMode(false);
    setCookingTimerRunning(false);
    setCookingFinished(false);
  }

  function finishCookingMode() {
    setCheckedCookingSteps((current) => ({
      ...current,
      [cookingStep]: true,
    }));
    setCookingTimerRunning(false);
    setCookingFinished(true);
  }

  function isFavorite(recipe: Recipe) {
    return favorites.some((favorite) => favorite.title === recipe.title);
  }

  function toggleFavorite(recipe: Recipe) {
    const removing = isFavorite(recipe);
    setFavorites((current) =>
      removing
        ? current.filter((favorite) => favorite.title !== recipe.title)
        : [recipe, ...current],
    );

    if (session?.user) {
      void saveKitchenAction(
        removing
          ? { action: "favorite.remove", title: recipe.title }
          : { action: "favorite.add", recipe },
      );
    }
  }

  function updateSavedRecipe(
    title: string,
    savedId: string,
    isPublic: boolean,
  ) {
    const update = (recipe: Recipe) =>
      recipe.title === title ? { ...recipe, savedId, isPublic } : recipe;

    setFavorites((current) => {
      const exists = current.some((recipe) => recipe.title === title);
      const source =
        current.find((recipe) => recipe.title === title) ??
        generatedRecipes.find((recipe) => recipe.title === title) ??
        sampleRecipes.find((recipe) => recipe.title === title);
      if (!exists && source) return [update(source), ...current];
      return current.map(update);
    });
    setGeneratedRecipes((current) => current.map(update));
    setSampleRecipes((current) => current.map(update));
    setSelectedRecipe((current) => (current ? update(current) : current));
  }

  async function shareRecipe(recipe: Recipe) {
    if (!session?.user) {
      setAuthOpen(true);
      return;
    }

    setSharePending(true);
    try {
      const response = await fetch("/api/saved-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe }),
      });
      const data = (await response.json()) as {
        savedId?: string;
        isPublic?: boolean;
        path?: string;
        error?: string;
      };
      if (!response.ok || !data.savedId || !data.path) {
        throw new Error(data.error ?? pageCopy.shareFailed);
      }

      updateSavedRecipe(recipe.title, data.savedId, true);
      const url = `${window.location.origin}${data.path}`;
      await navigator.clipboard.writeText(url);
      setToast(pageCopy.shareCopied);
    } catch (caughtError) {
      setToast(
        caughtError instanceof Error
          ? caughtError.message
          : pageCopy.shareFailed,
      );
    } finally {
      setSharePending(false);
    }
  }

  async function makeRecipePrivate(recipe: Recipe) {
    if (!recipe.savedId) return;

    setSharePending(true);
    try {
      const response = await fetch("/api/saved-recipes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recipe.savedId, isPublic: false }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? pageCopy.privateFailed);
      }

      updateSavedRecipe(recipe.title, recipe.savedId, false);
      setToast(copy.recipeModal.privateInfo);
    } catch (caughtError) {
      setToast(
        caughtError instanceof Error
          ? caughtError.message
          : pageCopy.privateFailed,
      );
    } finally {
      setSharePending(false);
    }
  }

  function getRecipeFeedback(recipe: Recipe) {
    return recipeFeedback[recipe.savedId ?? recipe.title];
  }

  function setFeedback(recipe: Recipe, feedback: RecipeFeedback) {
    const key = recipe.savedId ?? recipe.title;
    const selectedAgain = recipeFeedback[key] === feedback;

    setRecipeFeedback((current) => {
      if (!selectedAgain) return { ...current, [key]: feedback };

      const next = { ...current };
      delete next[key];
      return next;
    });

    setToast(
      selectedAgain
        ? pageCopy.feedbackRemoved
        : feedback === "liked"
          ? pageCopy.feedbackLiked
          : pageCopy.feedbackSaved,
    );

    if (session?.user) {
      void saveKitchenAction(
        selectedAgain
          ? { action: "feedback.remove", recipeKey: key }
          : {
              action: "feedback.set",
              recipeKey: key,
              recipeTitle: recipe.title,
              feedback,
              recipe,
            },
      );
    }
  }

  function addToShoppingList(items: string[]) {
    const cleanedItems = items
      .map(normalizeShoppingItem)
      .filter(Boolean);
    const newItems = cleanedItems.filter(
      (item) =>
        !shoppingList.some(
          (savedItem) =>
            savedItem.label.toLocaleLowerCase("pl") ===
            item.toLocaleLowerCase("pl"),
        ),
    );

    setShoppingList((current) => {
      const reactivated = current.map((savedItem) =>
        cleanedItems.some(
          (item) =>
            item.toLocaleLowerCase("pl") ===
            savedItem.label.toLocaleLowerCase("pl"),
        )
          ? { ...savedItem, checked: false }
          : savedItem,
      );
      const freshItems = newItems
        .filter(
          (item) =>
            !current.some(
              (savedItem) =>
                savedItem.label.toLocaleLowerCase("pl") ===
                item.toLocaleLowerCase("pl"),
            ),
        )
        .map((label) => ({ id: crypto.randomUUID(), label, checked: false }));

      return [...reactivated, ...freshItems];
    });

    setToast(
      newItems.length === 0
        ? copy.shopping.alreadyOnList
        : newItems.length === 1
          ? `${copy.shopping.added} ${newItems[0]}`
          : `${newItems.length} ${copy.shopping.addedMany}`,
    );

    if (session?.user && newItems.length > 0) {
      void saveKitchenAction({ action: "shopping.add", items: newItems });
    }
  }

  function submitShoppingItem(event: FormEvent) {
    event.preventDefault();

    const item = shoppingInput.trim();
    if (!item) return;

    addToShoppingList([item]);
    setShoppingInput("");
  }

  async function copyShoppingList() {
    if (groupedShoppingList.length === 0) return;

    try {
      await navigator.clipboard.writeText(
        formatShoppingListForClipboard(
          groupedShoppingList,
          copy.shopping.listTitle,
          language,
        ),
      );
      setToast(copy.shopping.copied);
    } catch {
      setToast(copy.shopping.copyFailed);
    }
  }

  function removeShoppingItem(item: string) {
    setShoppingList((current) =>
      current.filter((savedItem) => savedItem.label !== item),
    );
    if (session?.user) {
      void saveKitchenAction({
        action: "shopping.remove",
        label: item,
      });
    }
  }

  function toggleShoppingItem(item: string, checked: boolean) {
    setShoppingList((current) =>
      current.map((savedItem) =>
        savedItem.label === item ? { ...savedItem, checked } : savedItem,
      ),
    );
    if (session?.user) {
      void saveKitchenAction({
        action: "shopping.toggle",
        label: item,
        checked,
      });
    }
  }

  function startEditingShoppingItem(item: string) {
    setEditingShoppingItem(item);
    setEditingShoppingValue(item);
  }

  function cancelEditingShoppingItem() {
    setEditingShoppingItem("");
    setEditingShoppingValue("");
  }

  function saveEditedShoppingItem() {
    const oldLabel = editingShoppingItem;
    const newLabel = normalizeShoppingItem(editingShoppingValue);
    if (!oldLabel || !newLabel) {
      cancelEditingShoppingItem();
      return;
    }

    if (oldLabel.toLocaleLowerCase("pl") === newLabel.toLocaleLowerCase("pl")) {
      cancelEditingShoppingItem();
      return;
    }

    const oldItem = shoppingList.find((item) => item.label === oldLabel);
    setShoppingList((current) => {
      const exists = current.some(
        (item) =>
          item.label.toLocaleLowerCase("pl") === newLabel.toLocaleLowerCase("pl"),
      );

      if (exists) {
        return current.filter((item) => item.label !== oldLabel);
      }

      return current.map((item) =>
        item.label === oldLabel ? { ...item, label: newLabel } : item,
      );
    });

    if (session?.user) {
      void saveKitchenAction({
        action: "shopping.rename",
        oldLabel,
        newLabel,
      });
    }

    cancelEditingShoppingItem();
    setToast(
      oldItem
        ? `${pageCopy.changed} ${oldItem.label} → ${newLabel}`
        : pageCopy.productChanged,
    );
  }

  function moveShoppingItemToPantry(item: string) {
    const label = normalizeShoppingItem(item);
    const alreadyInPantry = pantryItems.some(
      (savedItem) =>
        savedItem.label.toLocaleLowerCase("pl") ===
        label.toLocaleLowerCase("pl"),
    );

    if (!alreadyInPantry) {
      const pantryItem = {
        label,
        quantity: "1 szt.",
        expiresAt: null,
      };

      setPantryItems((current) => [
        { ...pantryItem, id: crypto.randomUUID() },
        ...current,
      ]);

      if (session?.user) {
        void saveKitchenAction({ action: "pantry.upsert", ...pantryItem });
      }
    }

    removeShoppingItem(item);
    setToast(
      alreadyInPantry
        ? `${label} ${pageCopy.alreadyInPantry}`
        : `${pageCopy.movedToPantry} ${label}`,
    );
  }

  function clearBoughtShoppingItems() {
    const boughtItems = shoppingList.filter((item) => item.checked);
    if (boughtItems.length === 0) return;

    setShoppingList((current) => current.filter((item) => !item.checked));
    if (session?.user) {
      void saveKitchenAction({ action: "shopping.clear-checked" });
    }
    setToast(
      boughtItems.length === 1
        ? pageCopy.removedOneBought
        : `${boughtItems.length} ${pageCopy.removedBought}`,
    );
  }

  function moveBoughtShoppingItemsToPantry() {
    const boughtItems = shoppingList.filter((item) => item.checked);
    if (boughtItems.length === 0) return;

    const pantryLabels = new Set(
      pantryItems.map((item) => item.label.toLocaleLowerCase("pl")),
    );
    const itemsToAdd = boughtItems
      .map((item) => normalizeShoppingItem(item.label))
      .filter(
        (label) => label && !pantryLabels.has(label.toLocaleLowerCase("pl")),
      );

    setPantryItems((current) => [
      ...itemsToAdd.map((label) => ({
        id: crypto.randomUUID(),
        label,
        quantity: "1 szt.",
        expiresAt: null,
      })),
      ...current,
    ]);
    setShoppingList((current) => current.filter((item) => !item.checked));

    if (session?.user) {
      for (const label of itemsToAdd) {
        void saveKitchenAction({
          action: "pantry.upsert",
          label,
          quantity: "1 szt.",
          expiresAt: null,
        });
      }
      void saveKitchenAction({ action: "shopping.clear-checked" });
    }

    setToast(
      itemsToAdd.length === 0
        ? pageCopy.boughtAlreadyInPantry
        : `${itemsToAdd.length} ${pageCopy.movedProductsToPantry}`,
    );
  }

  function isOnShoppingList(item: string) {
    const normalizedItem = normalizeShoppingItem(item);
    return shoppingList.some(
      (savedItem) =>
        savedItem.label.toLocaleLowerCase("pl") ===
        normalizedItem.toLocaleLowerCase("pl"),
    );
  }

  function savePantryItem(item: Omit<PantryItem, "id">) {
    const isUpdate = pantryItems.some(
      (savedItem) =>
        savedItem.label.toLocaleLowerCase("pl") ===
        item.label.toLocaleLowerCase("pl"),
    );
    setPantryItems((current) => {
      const existing = current.find(
        (savedItem) =>
          savedItem.label.toLocaleLowerCase("pl") ===
          item.label.toLocaleLowerCase("pl"),
      );

      if (existing) {
        return current.map((savedItem) =>
          savedItem.id === existing.id ? { ...savedItem, ...item } : savedItem,
        );
      }

      return [{ ...item, id: crypto.randomUUID() }, ...current];
    });
    setToast(
      isUpdate
        ? `${pageCopy.changed} ${item.label}`
        : `${pageCopy.addedToPantry} ${item.label}`,
    );

    if (session?.user) {
      void saveKitchenAction({ action: "pantry.upsert", ...item });
    }
  }

  function removePantryItem(item: PantryItem) {
    setPantryItems((current) =>
      current.filter((savedItem) => savedItem.id !== item.id),
    );

    if (session?.user) {
      void saveKitchenAction({
        action: "pantry.remove",
        label: item.label,
      });
    }
  }

  function consumePantryItem(item: PantryItem) {
    removePantryItem(item);
    setToast(`${pageCopy.consumed} ${item.label}`);
  }

  function consumeRecipePantryItems(recipe: Recipe) {
    const usedItems = pantryItems.filter((item) =>
      recipe.ingredients.some((ingredient) =>
        ingredient
          .toLocaleLowerCase("pl")
          .includes(item.label.toLocaleLowerCase("pl")),
      ),
    );
    if (usedItems.length === 0) {
      setToast(pageCopy.noPantryMatches);
      return;
    }
    if (
      !window.confirm(
        `${pageCopy.markAsUsed} ${usedItems.map((item) => item.label).join(", ")}?`,
      )
    ) {
      return;
    }

    usedItems.forEach(removePantryItem);
    setToast(`${usedItems.length} ${pageCopy.removedFromPantry}`);
  }

  function usePantryIngredients(labels: string[]) {
    setIngredients((current) => [
      ...current,
      ...labels.filter(
        (label) =>
          !current.some(
            (ingredient) =>
              ingredient.toLocaleLowerCase("pl") ===
              label.toLocaleLowerCase("pl"),
          ),
      ),
    ]);
    setToast(
      labels.length === 1
        ? `${copy.shopping.added} ${labels[0]}`
        : `${labels.length} ${pageCopy.addedToGenerator}`,
    );
    window.setTimeout(
      () => window.scrollTo({ top: 0, behavior: "smooth" }),
      50,
    );
  }

  async function saveKitchenAction(action: Record<string, unknown>) {
    await fetch("/api/kitchen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
  }

  function restoreHistory(entry: SearchHistoryEntry) {
    if (entry.mode === "dish" && entry.query) {
      setDesiredDish(entry.query);
      setDesiredDishDiet(entry.diet);
      setDesiredDishMaxTime(String(entry.maxTime));
      setGenerationMode("dish");
    } else {
      setIngredients(entry.ingredients);
      setDiet(entry.diet);
      setMaxTime(String(entry.maxTime));
      setGenerationMode("ingredients");
    }
    setGeneratedRecipes(entry.recipes);
    setGenerated(true);
    if (isNativeIosApp) {
      openNativeTab("recipes");
    } else {
      window.setTimeout(
        () =>
          document
            .getElementById("results")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    }
  }

  async function generateFromIngredients(submittedIngredients: string[]) {
    if (submittedIngredients.length === 0) return;

    setIngredients(submittedIngredients);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: submittedIngredients,
          priorityIngredients: pantryItems
            .filter(
              (item) =>
                item.expiresAt &&
                new Date(`${item.expiresAt}T23:59:59`).getTime() >= Date.now() &&
                new Date(`${item.expiresAt}T23:59:59`).getTime() <=
                  Date.now() + 4 * 86_400_000 &&
                submittedIngredients.includes(item.label),
            )
            .map((item) => item.label),
          diet,
          maxTime: Number(maxTime),
          maxBudget: Number(maxBudget),
          currency,
          priceRegion,
          language,
          calorieTarget,
          proteinTarget,
          cookingGoal,
          excludedIngredients,
        }),
      });
      const data = (await response.json()) as {
        recipes?: Recipe[];
        error?: string;
        usage?: {
          limit: number;
          remaining: number;
          resetAt: string;
          unlimited?: boolean;
        };
      };

      if (data.usage) {
        setGenerationUsage(data.usage);
      }

      if (!response.ok || !data.recipes) {
        throw new Error(data.error ?? copy.generator.fallbackError);
      }

      setGeneratedRecipes(data.recipes);
      setGenerated(true);
      setGenerationMode("ingredients");
      setHistory((current) =>
        [
          {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            mode: "ingredients" as const,
            query: null,
            ingredients: submittedIngredients,
            diet,
            maxTime: Number(maxTime),
            recipes: data.recipes!,
          },
          ...current,
        ].slice(0, 50),
      );
      if (session?.user) {
        void saveKitchenAction({
          action: "history.add",
          mode: "ingredients",
          query: null,
          ingredients: submittedIngredients,
          diet,
          maxTime: Number(maxTime),
          recipes: data.recipes,
        });
      }
      if (isNativeIosApp) {
        openNativeTab("recipes");
      } else {
        window.setTimeout(
          () =>
            document
              .getElementById("results")
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
          50,
        );
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.generator.fallbackError,
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    const pendingIngredient = input.trim().toLocaleLowerCase("pl");
    const submittedIngredients =
      pendingIngredient && !ingredients.includes(pendingIngredient)
        ? [...ingredients, pendingIngredient]
        : ingredients;

    await generateFromIngredients(submittedIngredients);
  }

  function cookFromPantry() {
    const pantryLabels = pantryItems.map((item) => item.label);
    if (pantryLabels.length === 0 || isLoading) return;
    void generateFromIngredients(pantryLabels);
  }

  async function submitDesiredDish(event: FormEvent) {
    event.preventDefault();

    const dish = desiredDish.trim();
    if (dish.length < 2) return;

    setDesiredDishError("");
    setDesiredDishLoading(true);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "dish",
          dish,
          diet: desiredDishDiet,
          maxTime: Number(desiredDishMaxTime),
          maxBudget: Number(desiredDishBudget),
          currency,
          priceRegion,
          language,
          calorieTarget,
          proteinTarget,
          cookingGoal,
          excludedIngredients,
        }),
      });
      const data = (await response.json()) as {
        recipes?: Recipe[];
        error?: string;
        usage?: {
          limit: number;
          remaining: number;
          resetAt: string;
          unlimited?: boolean;
        };
      };

      if (data.usage) setGenerationUsage(data.usage);

      if (!response.ok || !data.recipes) {
        throw new Error(data.error ?? copy.dish.fallbackError);
      }

      setGeneratedRecipes(data.recipes);
      setGenerated(true);
      setGenerationMode("dish");
      const historyEntry: SearchHistoryEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        mode: "dish",
        query: dish,
        ingredients: [`${copy.dish.historyPrefix} ${dish}`],
        diet: desiredDishDiet,
        maxTime: Number(desiredDishMaxTime),
        recipes: data.recipes,
      };
      setHistory((current) => [historyEntry, ...current].slice(0, 50));
      if (session?.user) {
        void saveKitchenAction({
          action: "history.add",
          mode: "dish",
          query: dish,
          ingredients: historyEntry.ingredients,
          diet: desiredDishDiet,
          maxTime: Number(desiredDishMaxTime),
          recipes: data.recipes,
        });
      }
      if (isNativeIosApp) {
        openNativeTab("recipes");
      } else {
        window.setTimeout(
          () =>
            document
              .getElementById("results")
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
          50,
        );
      }
    } catch (caughtError) {
      setDesiredDishError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.dish.fallbackError,
      );
    } finally {
      setDesiredDishLoading(false);
    }
  }

  async function resendVerification() {
    if (!session?.user.email) return;

    setVerificationPending(true);
    setVerificationMessage("");
    const result = await authClient.sendVerificationEmail({
      email: session.user.email,
      callbackURL: `/email-verified?lang=${language}`,
    });
    setVerificationPending(false);

    if (!result.error) {
      setVerificationMessage(pageCopy.verificationSent);
      return;
    }

    if (result.error.code === "EMAIL_ALREADY_VERIFIED") {
      setVerificationMessage(pageCopy.alreadyVerified);
      return;
    }

    if (result.error.status === 429) {
      setVerificationMessage(pageCopy.tooManyAttempts);
      return;
    }

    const errorCode = result.error.code ?? `HTTP_${result.error.status}`;
    setVerificationMessage(`${pageCopy.sendFailed} ${errorCode}.`);
  }

  return (
    <main className="app-shell overflow-hidden bg-[#f7f4ed] text-[#25322b]">
      {isNativeIosApp && nativeLaunchVisible && (
        <div
          aria-hidden="true"
          className="native-launch-screen fixed inset-0 z-[100] grid place-items-center bg-[#025026] px-8"
        >
          <div className="rounded-[2rem] bg-white px-7 py-6">
            <Image
              src="/logo-full.svg"
              alt=""
              width={260}
              height={102}
              priority
              className="h-auto w-56 max-w-[68vw] object-contain"
            />
          </div>
        </div>
      )}

      {!isNativeIosApp && (
      <nav
        className={`${pageContainerClass} app-top-nav relative z-40 flex items-center justify-between`}
      >
        <a href="#" aria-label="SmartRecipe" className="flex items-center">
          <Image
            src="/logo-full.svg"
            alt="SmartRecipe logo"
            width={150}
            height={59}
            priority
            className="h-auto w-32 object-contain sm:w-40"
          />
        </a>
        <div className="hidden items-center gap-3 text-xs font-medium text-[#667168] xl:flex xl:gap-5 xl:text-sm">
          <a className="transition hover:text-[#25322b]" href="#how">
            {copy.nav.how}
          </a>
          <a className="transition hover:text-[#25322b]" href="#results">
            {copy.nav.recipes}
          </a>
          <a className="transition hover:text-[#25322b]" href="#meal-planner">
            {copy.nav.planner}
          </a>
          {session?.user && (
            <>
              <Link className="transition hover:text-[#25322b]" href="/recipes">
                {copy.nav.saved}
              </Link>
              <Link
                className="transition hover:text-[#25322b]"
                href="/recipes/history"
              >
                {copy.nav.history}
              </Link>
            </>
          )}
          <LocaleSettings
            language={language}
            currency={currency}
            region={priceRegion}
            onLanguageChange={changeLanguage}
            onCurrencyChange={changeCurrency}
            onRegionChange={changePriceRegion}
          />
          {sessionPending ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-[#e5e2da]" />
          ) : session?.user ? (
            <div className="flex items-center gap-2 lg:gap-3">
              {isAdmin && (
                <a
                  href="/admin"
                  className="rounded-full bg-[#253d31] px-4 py-2 text-white"
                >
                  {copy.nav.admin}
                </a>
              )}
              <a
                href="/settings"
                className="rounded-full border border-[#d9d7cd] bg-white px-4 py-2 text-[#33433a] shadow-sm"
              >
                {session.user.name}
              </a>
              <button
                onClick={() => {
                  setIsAdmin(false);
                  void authClient.signOut();
                }}
                className="text-xs text-[#7a857e] hover:text-[#025026]"
              >
                {copy.nav.logout}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-full border border-[#d9d7cd] bg-white px-4 py-2 text-[#33433a] shadow-sm"
            >
              {copy.nav.login}
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label={mobileMenuOpen ? copy.nav.closeMenu : copy.nav.openMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen((current) => !current)}
          className="grid size-10 place-items-center rounded-xl border border-[#d9d7cd] bg-white text-[#33433a] shadow-sm sm:size-11 xl:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition ${
                mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 rounded bg-current transition ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] h-0.5 w-5 rounded bg-current transition ${
                mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>
      )}

      {!isNativeIosApp && mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="app-mobile-menu relative z-30 rounded-2xl border border-[#dedbd2] bg-white p-3 shadow-xl xl:hidden"
        >
          <div className="grid gap-1 text-sm font-semibold text-[#536159]">
            {[
              [copy.nav.how, "#how"],
              [copy.nav.recipes, "#results"],
              [copy.nav.planner, "#meal-planner"],
              [copy.nav.kitchen, "#my-kitchen"],
              ...(session?.user
                ? [
                    [copy.nav.savedRecipes, "/recipes"],
                    [copy.nav.recipeHistory, "/recipes/history"],
                  ]
                : []),
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 transition hover:bg-[#f3f6f2] hover:text-[#025026]"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-2 border-t border-[#ebe8e0] pt-3">
            <div className="mb-3">
              <LocaleSettings
                language={language}
                currency={currency}
                region={priceRegion}
                onLanguageChange={changeLanguage}
                onCurrencyChange={changeCurrency}
                onRegionChange={changePriceRegion}
                compact
              />
            </div>
            {sessionPending ? (
              <div className="h-11 animate-pulse rounded-xl bg-[#eeeae2]" />
            ) : session?.user ? (
              <div className="grid gap-2">
                <div className="px-4 py-2">
                  <p className="text-sm font-semibold text-[#25322b]">
                    {session.user.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#7a857e]">
                    {session.user.email}
                  </p>
                </div>
                <a
                  href="/settings"
                  className="rounded-xl bg-[#f3f6f2] px-4 py-3 text-sm font-semibold text-[#025026]"
                >
                  {copy.nav.accountSettings}
                </a>
                {isAdmin && (
                  <a
                    href="/admin"
                    className="rounded-xl bg-[#253d31] px-4 py-3 text-sm font-semibold text-white"
                  >
                    {copy.nav.adminPanel}
                  </a>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAdmin(false);
                    void authClient.signOut();
                  }}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#a45c45]"
                >
                  {copy.nav.logoutFull}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthOpen(true);
                }}
                className="h-11 w-full rounded-xl bg-[#025026] text-sm font-semibold text-white"
              >
                {copy.nav.loginOrCreate}
              </button>
            )}
          </div>
        </div>
      )}

      {emailVerificationEnabled &&
        session?.user &&
        !session.user.emailVerified && (
        <div className="border-y border-[#efd4a8] bg-[#fff5df] py-3">
          <div
            className={`${pageContainerClass} flex flex-wrap items-center justify-between gap-3 text-sm text-[#795d2f]`}
          >
            <p>
              {pageCopy.verifyPrefix} <strong>{session.user.email}</strong>,{" "}
              {pageCopy.verifySuffix}
              {verificationMessage && (
                <span className="ml-2 text-xs">{verificationMessage}</span>
              )}
            </p>
            <button
              onClick={resendVerification}
              disabled={verificationPending}
              className="rounded-lg bg-[#795d2f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {verificationPending
                ? pageCopy.sending
                : pageCopy.sendVerification}
            </button>
          </div>
        </div>
        )}

      {(expiringPantryItems.length > 0 || expiredPantryItems.length > 0) && (
        <div className="border-y border-[#efd5ab] bg-[#fff8e9] py-3">
          <div
            className={`${pageContainerClass} flex flex-wrap items-center justify-between gap-3`}
          >
            <p className="text-sm text-[#795d2f]">
              <strong>{pageCopy.checkPantry}</strong>{" "}
              {expiredPantryItems.length > 0 &&
                `${expiredPantryItems.length} ${pageCopy.expired}`}
              {expiredPantryItems.length > 0 &&
                expiringPantryItems.length > 0 &&
                " · "}
              {expiringPantryItems.length > 0 &&
                `${expiringPantryItems.length} ${pageCopy.expiring}`}
            </p>
            <a
              href="#my-kitchen"
              className="rounded-lg bg-[#795d2f] px-3 py-2 text-xs font-semibold text-white"
            >
              {pageCopy.viewProducts}
            </a>
          </div>
        </div>
      )}

      {session?.user && !preferencesCompleted && (
        <section className={`${nativeTabClass("generator")} pt-4 sm:pt-6`}>
          <div className={pageContainerClass}>
            <div className="overflow-hidden rounded-[1.5rem] border border-[#d6e2d8] bg-[#eef6ef] p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#365a46]">
                    {pageCopy.setPreferences}
                  </p>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-[#68736b] sm:text-sm">
                    {pageCopy.preferencesText}
                  </p>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                    {pageCopy.onboardingSteps.map((step, index) => (
                      <span
                        key={step}
                        className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#365a46] shadow-sm"
                      >
                        {index + 1}. {step}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/settings"
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#025026] px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#013d1d]"
                >
                  {pageCopy.completeNow}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {session?.user && (
        <section className={`${pageContainerClass} ${nativeTabClass("kitchen")} pt-4 sm:pt-6`}>
          <div className="min-w-0 overflow-hidden rounded-2xl border border-[#dfe4dc] bg-white/85 p-3 shadow-[0_12px_36px_rgba(53,68,58,0.07)] backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
                  {pageCopy.userPanel}
                </p>
                <h2 className="mt-0.5 truncate font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
                  {pageCopy.hello}, {session.user.name}
                </h2>
                <p className="mt-1 hidden max-w-2xl text-xs leading-5 text-[#68736b] sm:block">
                  {pageCopy.dashboardText}
                </p>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                <a
                  href="#generator"
                  className="shrink-0 rounded-xl bg-[#025026] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#013d1d]"
                >
                  {pageCopy.generateRecipe}
                </a>
                <a
                  href="#my-kitchen"
                  className="shrink-0 rounded-xl border border-[#d8d7d0] bg-white px-3 py-2 text-xs font-semibold text-[#33433a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f6f0]"
                >
                  {copy.nav.kitchen}
                </a>
                <Link
                  href="/recipes"
                  className="shrink-0 rounded-xl border border-[#d8d7d0] bg-white px-3 py-2 text-xs font-semibold text-[#33433a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f6f0]"
                >
                  {copy.nav.saved}
                </Link>
              </div>
            </div>

            <div className="-mx-3 mt-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
              <div className="grid min-w-[520px] grid-cols-4 gap-2 sm:min-w-0">
                {dashboardCards.map((card) => (
                  <a
                    key={card.label}
                    href={card.href}
                    className="min-w-0 rounded-xl border border-[#ebe7dd] bg-[#fbfaf6] p-3 transition hover:-translate-y-0.5 hover:border-[#cfdacf] hover:bg-white"
                  >
                    <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#829087]">
                      {card.label}
                    </p>
                    <p className="mt-1 truncate font-serif text-2xl font-semibold leading-none text-[#25322b] sm:text-3xl">
                      {card.value}
                    </p>
                    <p className="mt-1 truncate text-[0.7rem] leading-4 text-[#748078]">
                      {card.hint}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-2 hidden gap-2 sm:grid lg:grid-cols-[1.15fr_0.85fr]">
              <div className="min-w-0 rounded-xl bg-[#eef6ef] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#365a46]">
                      {pageCopy.activity}
                    </p>
                    <p className="mt-0.5 truncate text-xs leading-5 text-[#68736b]">
                      {latestHistoryEntry
                        ? `${pageCopy.latest} ${latestHistoryEntry.ingredients.join(", ")}`
                        : pageCopy.noGenerationHistory}
                    </p>
                  </div>
                  <Link
                    href="/recipes/history"
                    className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#365a46] shadow-sm"
                  >
                    {pageCopy.history}
                  </Link>
                </div>
                {latestFavorite && (
                  <button
                    onClick={() => openRecipe(latestFavorite)}
                    className="mt-2 w-full truncate rounded-lg bg-white px-3 py-2 text-left text-xs font-semibold text-[#25322b] shadow-sm transition hover:bg-[#f9fbf8]"
                  >
                    {copy.kitchen.lastSaved}{" "}
                    <span className="text-[#fc5726]">{latestFavorite.title}</span>
                  </button>
                )}
              </div>

              <div className="min-w-0 rounded-xl bg-[#fff5df] p-3">
                <p className="text-xs font-semibold text-[#795d2f]">
                  {pageCopy.limitUsage}
                </p>
                {currentGenerationUsage?.unlimited || isAdmin ? (
                  <p className="mt-1 text-xs leading-5 text-[#795d2f]">
                    {pageCopy.adminUnlimited}
                  </p>
                ) : (
                  <>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#fc5726]"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#795d2f]">
                      {currentGenerationUsage
                        ? `${pageCopy.used} ${
                            currentGenerationUsage.limit -
                            currentGenerationUsage.remaining
                          } ${pageCopy.from} ${currentGenerationUsage.limit}.`
                        : pageCopy.limitStarts}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section
        id="generator"
        className={`${nativeTabClass("generator")} relative mx-auto max-w-7xl px-4 ${
          isNativeIosApp
            ? "pb-4 pt-4"
            : "pb-8 pt-6 sm:px-8 sm:pb-20 sm:pt-10 lg:pt-20"
        }`}
      >
        <div className="pointer-events-none absolute -right-32 top-0 size-80 rounded-full bg-[#e3a96b]/20 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full border border-[#d8dfd7] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#48705c] sm:mb-5 sm:px-4 ${
              isNativeIosApp ? "hidden" : ""
            }`}
          >
            <Icon name="spark" /> {copy.hero.badge}
          </div>
          <h1
            className={`font-serif font-semibold leading-[1.02] tracking-[-0.04em] text-[#203128] ${
              isNativeIosApp ? "text-4xl" : "text-5xl sm:text-7xl"
            }`}
          >
            {copy.hero.title}
            <span className="block italic text-[#fc5726]">
              {copy.hero.titleAccent}
            </span>
          </h1>
          <p
            className={`mx-auto mt-4 max-w-xl text-base leading-7 text-[#68736b] sm:mt-6 sm:text-lg ${
              isNativeIosApp ? "hidden" : ""
            }`}
          >
            {copy.hero.description}
          </p>
        </div>

        <form
          onSubmit={submit}
          className={`mx-auto max-w-4xl rounded-3xl border border-white bg-white/90 p-3 shadow-[0_24px_80px_rgba(53,68,58,0.13)] sm:rounded-[2rem] sm:p-7 ${
            isNativeIosApp ? "mt-5" : "mt-7 sm:mt-10"
          }`}
        >
          <label className="mb-2 block text-sm font-semibold text-[#35483e]">
            {copy.generator.ingredientsLabel}
          </label>
          <div
            className={`flex flex-wrap items-center gap-2 rounded-2xl border border-[#dedfd9] bg-[#fbfaf6] p-2.5 focus-within:border-[#71927e] focus-within:ring-4 focus-within:ring-[#71927e]/10 ${
              isNativeIosApp ? "min-h-12" : "min-h-16"
            }`}
          >
            {ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className={`flex items-center gap-2 rounded-full bg-[#e5eee6] text-sm font-medium text-[#365a46] ${
                  isNativeIosApp ? "px-2.5 py-1.5" : "px-3 py-2"
                }`}
              >
                {ingredient}
                <button
                  type="button"
                  aria-label={`${copy.generator.removeIngredient} ${ingredient}`}
                  className="text-[#71847a] hover:text-[#273d32]"
                  onClick={() =>
                    setIngredients((current) =>
                      current.filter((item) => item !== ingredient),
                    )
                  }
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addIngredient();
                }
              }}
              className="min-w-36 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#a3aaa5]"
              placeholder={copy.generator.addProduct}
            />
          </div>

          <div
            className={`mt-3 flex flex-wrap items-center gap-2 text-xs text-[#828a84] ${
              isNativeIosApp ? "hidden" : ""
            }`}
          >
            <span>{copy.generator.suggestions}</span>
            {pageCopy.suggestions
              .filter((item) => !ingredients.includes(item))
              .map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => addIngredient(item)}
                  className="rounded-full border border-[#e1e0da] px-2.5 py-1 transition hover:border-[#8ca796] hover:text-[#3e634f]"
                >
                  + {item}
                </button>
              ))}
          </div>

          <div
            className={`mt-4 grid gap-3 border-t border-[#eeece5] pt-4 sm:mt-6 sm:grid-cols-2 sm:gap-4 sm:pt-6 lg:grid-cols-[1fr_1fr_1fr_auto] ${
              isNativeIosApp ? "grid-cols-2 gap-2 pt-3" : ""
            }`}
          >
            <label className="text-sm font-semibold text-[#35483e]">
              {copy.generator.diet}
              <select
                value={diet}
                onChange={(event) => setDiet(event.target.value)}
                className={`mt-2 block w-full appearance-none rounded-xl border border-[#dedfd9] bg-white px-3 font-normal text-[#25322b] outline-none ${
                  isNativeIosApp ? "h-10 text-sm" : "h-12 text-base"
                }`}
              >
                {dietOptions.map((option) => (
                  <option key={option} value={option}>
                    {copy.options.diets[option as keyof typeof copy.options.diets]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-[#35483e]">
              {copy.generator.budget}
              <select
                value={maxBudget}
                onChange={(event) => setMaxBudget(event.target.value)}
                className={`mt-2 block w-full appearance-none rounded-xl border border-[#dedfd9] bg-white px-3 font-normal text-[#25322b] outline-none ${
                  isNativeIosApp ? "h-10 text-sm" : "h-12 text-base"
                }`}
              >
                {budgetOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {formatOptionLabel(language, "budget", value, label, currency)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-[#35483e]">
              {copy.generator.maxTime}
              <select
                value={maxTime}
                onChange={(event) => setMaxTime(event.target.value)}
                className={`mt-2 block w-full appearance-none rounded-xl border border-[#dedfd9] bg-white px-3 font-normal text-[#25322b] outline-none ${
                  isNativeIosApp ? "h-10 text-sm" : "h-12 text-base"
                }`}
              >
                {timeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {formatOptionLabel(language, "time", value, label)}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={ingredients.length === 0 || isLoading}
              className={`mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#025026] font-semibold text-white shadow-lg shadow-[#025026]/20 transition hover:-translate-y-0.5 hover:bg-[#013d1d] disabled:cursor-not-allowed disabled:opacity-40 ${
                isNativeIosApp ? "col-span-2 h-11 px-4" : "h-12 px-6"
              }`}
            >
              <Icon name="spark" />{" "}
              {isLoading ? copy.generator.generating : copy.generator.generate}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f3f6f2] px-4 py-3 text-xs text-[#617068]">
            <span>
              {session?.user ? (
                <>
                  {isAdmin ? (
                    <strong className="text-[#365a46]">
                      {copy.generator.adminLimit}
                    </strong>
                  ) : (
                    <>
                      {copy.generator.accountLimitPrefix}{" "}
                      <strong className="text-[#365a46]">
                        {accountDailyLimit} {copy.generator.accountLimitSuffix}
                      </strong>
                      .
                    </>
                  )}
                </>
              ) : (
                <>
                  {copy.generator.guestLimitPrefix}{" "}
                  <strong className="text-[#365a46]">
                    3 {copy.generator.guestLimitSuffix}
                  </strong>
                  .
                </>
              )}
            </span>
            {!session?.user && (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="font-semibold text-[#025026] hover:underline"
              >
                {copy.generator.createAccount}
              </button>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-[#fff0eb] px-4 py-3 text-sm text-[#a44436]"
            >
              {error}
              {generationUsage?.remaining === 0 && (
                <span className="mt-1 block text-xs">
                  {copy.generator.resetAt}{" "}
                  {new Intl.DateTimeFormat(language === "pl" ? "pl-PL" : "en-US", {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(generationUsage.resetAt))}
                  .
                </span>
              )}
            </p>
          )}
          {isLoading && !error && (
            <div className="mt-4 rounded-xl border border-[#efd5ab] bg-[#fff8e9] px-4 py-3 text-sm text-[#795d2f]">
              <p className="font-semibold">{copy.generator.loadingTitle}</p>
              <p className="mt-1 text-xs leading-5">
                {copy.generator.loadingText}
              </p>
            </div>
          )}
          {currentGenerationUsage &&
            !currentGenerationUsage.unlimited &&
            !error && (
            <p className="mt-4 text-center text-xs text-[#7a857e]">
              {copy.generator.remainingToday}{" "}
              <strong className="text-[#466453]">
                {currentGenerationUsage.remaining}/
                {currentGenerationUsage.limit}
              </strong>{" "}
              {copy.generator.generations}
            </p>
          )}
        </form>
      </section>

      <section
        id="how"
        className={`${nativeTabClass("generator")} ${
          isNativeIosApp ? "hidden" : ""
        } border-y border-[#e4e0d7] bg-[#eeebe3]`}
      >
        <div
          className={`${pageContainerClass} grid gap-5 py-6 text-center sm:grid-cols-3 sm:gap-8 sm:py-8`}
        >
          {copy.how.map(([number, title, text]) => (
            <div key={number} className="flex items-start gap-4 text-left">
              <span className="font-serif text-3xl italic text-[#d46c4c]">{number}</span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#748078]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className={`${nativeTabClass("generator")} ${
          isNativeIosApp ? "hidden" : ""
        } bg-[#f7f4ed] py-8 sm:py-14`}
      >
        <div className={pageContainerClass}>
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
                {copy.value.eyebrow}
              </p>
              <h2 className="mt-2 max-w-xl font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                {copy.value.title}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-[#68736b] sm:text-base lg:justify-self-end">
              {copy.value.description}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {copy.value.items.map(([icon, title, text]) => (
              <article
                key={title}
                className="rounded-[1.4rem] border border-[#e2dfd6] bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-[#edf3ee] text-xl">
                  {icon}
                </span>
                <h3 className="mt-3 font-serif text-xl font-semibold">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#748078]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className={`${nativeTabClass("generator")} border-t border-[#e4e0d7] bg-[#f0e8dc] ${
          isNativeIosApp ? "py-4" : "py-8 sm:py-14"
        }`}
      >
        <div
          className={`${pageContainerClass} grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726] sm:text-sm">
              {copy.dish.eyebrow}
            </p>
            <h2
              className={`mt-2 font-serif font-semibold tracking-tight ${
                isNativeIosApp ? "text-2xl" : "text-3xl sm:text-4xl"
              }`}
            >
              {copy.dish.title}
            </h2>
            <p
              className={`mt-3 max-w-lg text-sm leading-6 text-[#68736b] sm:text-base ${
                isNativeIosApp ? "hidden" : ""
              }`}
            >
              {copy.dish.description}
            </p>
          </div>

          <form
            onSubmit={submitDesiredDish}
            className={`rounded-3xl border border-white bg-white/90 p-3 shadow-[0_18px_60px_rgba(53,68,58,0.10)] sm:p-5 ${
              isNativeIosApp ? "rounded-[1.35rem]" : ""
            }`}
          >
            <label className="text-sm font-semibold text-[#35483e]">
              {copy.dish.label}
              <input
                id="desired-dish"
                value={desiredDish}
                onChange={(event) => setDesiredDish(event.target.value)}
                maxLength={120}
                className="mt-1.5 block h-10 w-full rounded-xl border border-[#dedfd9] px-3 text-sm font-normal outline-none focus:border-[#71927e] sm:h-11"
                placeholder={copy.dish.placeholder}
              />
            </label>
            <div
              className={`mt-3 grid gap-3 border-t border-[#eeece5] pt-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] ${
                isNativeIosApp ? "grid-cols-2 gap-2" : ""
              }`}
            >
              <label className="text-sm font-semibold text-[#35483e]">
                {copy.generator.diet}
                <select
                  value={desiredDishDiet}
                  onChange={(event) => setDesiredDishDiet(event.target.value)}
                  className={`mt-2 block w-full appearance-none rounded-xl border border-[#dedfd9] bg-white px-3 font-normal text-[#25322b] outline-none ${
                    isNativeIosApp ? "h-10 text-sm" : "h-12 text-base"
                  }`}
                >
                  {dietOptions.map((option) => (
                    <option key={option} value={option}>
                      {copy.options.diets[option as keyof typeof copy.options.diets]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-[#35483e]">
                {copy.generator.budget}
                <select
                  value={desiredDishBudget}
                  onChange={(event) => setDesiredDishBudget(event.target.value)}
                  className={`mt-2 block w-full appearance-none rounded-xl border border-[#dedfd9] bg-white px-3 font-normal text-[#25322b] outline-none ${
                    isNativeIosApp ? "h-10 text-sm" : "h-12 text-base"
                  }`}
                >
                  {budgetOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {formatOptionLabel(language, "budget", value, label, currency)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-[#35483e]">
                {copy.generator.maxTime}
                <select
                  value={desiredDishMaxTime}
                  onChange={(event) =>
                    setDesiredDishMaxTime(event.target.value)
                  }
                  className={`mt-2 block w-full appearance-none rounded-xl border border-[#dedfd9] bg-white px-3 font-normal text-[#25322b] outline-none ${
                    isNativeIosApp ? "h-10 text-sm" : "h-12 text-base"
                  }`}
                >
                  {timeOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {formatOptionLabel(language, "time", value, label)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={desiredDish.trim().length < 2 || desiredDishLoading}
                className={`mt-auto flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#fc5726] font-semibold text-white shadow-lg shadow-[#fc5726]/20 transition hover:-translate-y-0.5 hover:bg-[#d94318] disabled:cursor-not-allowed disabled:opacity-40 ${
                  isNativeIosApp ? "col-span-2 h-11 px-4" : "h-12 px-5"
                }`}
              >
                <Icon name="spark" />
                {desiredDishLoading ? copy.dish.creating : copy.dish.create}
              </button>
            </div>
            <p className={`mt-3 text-xs text-[#7a857e] ${isNativeIosApp ? "hidden" : ""}`}>
              {copy.dish.note}
            </p>
            {desiredDishError && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-[#fff0eb] px-4 py-3 text-sm text-[#a44436]"
              >
                {desiredDishError}
              </p>
            )}
            {desiredDishLoading && !desiredDishError && (
              <div className="mt-3 rounded-xl border border-[#efd5ab] bg-[#fff8e9] px-4 py-3 text-sm text-[#795d2f]">
                <p className="font-semibold">{copy.dish.loadingTitle}</p>
                <p className="mt-1 text-xs leading-5">
                  {copy.dish.loadingText}
                </p>
              </div>
            )}
          </form>
        </div>
        {nativeTabEndSpacer}
      </section>

      <section
        id="results"
        className={`${pageContainerClass} ${nativeTabClass("recipes")} scroll-mt-8 ${
          isNativeIosApp ? "py-4" : "py-8 sm:py-20"
        }`}
      >
        <div
          className={`flex flex-wrap items-end justify-between gap-4 ${
            isNativeIosApp ? "mb-2" : ""
          }`}
        >
          <div>
            <p
              className={`font-semibold uppercase tracking-[0.16em] text-[#fc5726] ${
                isNativeIosApp ? "text-xs" : "text-sm"
              }`}
            >
              {generationInProgress
                ? copy.results.cooking
                : generationMode === "dish"
                ? copy.results.requestedDish
                : generated
                  ? copy.results.matched
                  : copy.results.demo}
            </p>
            <h2
              className={`mt-2 font-serif font-semibold tracking-tight ${
                isNativeIosApp ? "text-3xl" : "text-4xl sm:text-5xl"
              }`}
            >
              {generationInProgress
                ? copy.results.preparing
                : generationMode === "dish"
                ? `${visibleRecipes.length} ${copy.results.variants}`
                : generated
                ? `${visibleRecipes.length} ${copy.results.ideas}`
                : copy.results.demoTitle}
            </h2>
          </div>
          <p
            className={`max-w-md text-sm leading-6 text-[#748078] ${
              isNativeIosApp ? "hidden" : ""
            }`}
          >
            {generationInProgress
              ? copy.results.cookingText
              : generationMode === "dish"
              ? copy.results.dishText
              : copy.results.defaultText}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              generationInProgress
                ? "bg-[#fff5df] text-[#9c6a16]"
                : generated
                  ? "bg-[#e8efe9] text-[#025026]"
                  : "bg-[#edf1ec] text-[#536159]"
            }`}
          >
            {generationInProgress
              ? copy.results.inProgress
              : generated
                ? copy.results.ready
                : copy.results.demoMode}
          </span>
          {currentGenerationUsage && !currentGenerationUsage.unlimited && (
            <span className="rounded-full bg-[#f6f3ec] px-3 py-1.5 text-xs font-bold text-[#68736b]">
              {copy.results.limit} {currentGenerationUsage.remaining}/
              {currentGenerationUsage.limit}
            </span>
          )}
        </div>

        <div
          className={`grid ${
            isNativeIosApp
              ? "mt-4 gap-3"
              : "mt-7 gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-3"
          }`}
        >
          {generationInProgress
            ? Array.from({ length: 3 }).map((_, index) => (
                <RecipeCardSkeleton key={index} />
              ))
            : visibleRecipes.length > 0
              ? visibleRecipes.map((recipe, index) => {
                  if (isNativeIosApp) {
                    const missingItems = uniqueShoppingItems(recipe.missing);

                    return (
                      <article
                        key={recipe.title}
                        className="grid min-w-0 grid-cols-[6.25rem_1fr] overflow-hidden rounded-[1.35rem] border border-[#e2dfd6] bg-white shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => openRecipe(recipe)}
                          className={`relative grid min-h-32 place-items-center overflow-hidden bg-gradient-to-br ${accents[index % accents.length]}`}
                        >
                          {recipe.image ? (
                            <Image
                              src={recipe.image.url}
                              alt={recipe.image.alt}
                              fill
                              sizes="100px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-5xl drop-shadow-lg">
                              {recipe.emoji}
                            </span>
                          )}
                          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[0.65rem] font-bold text-[#025026] backdrop-blur">
                            {generationMode === "dish"
                              ? copy.results.fullRecipe
                              : `${recipe.match}%`}
                          </span>
                        </button>
                        <div className="min-w-0 p-3">
                          <div className="flex min-w-0 items-center gap-2 text-[0.68rem] font-semibold text-[#78837c]">
                            <span className="flex shrink-0 items-center gap-1">
                              <Icon name="clock" /> {recipe.time} {minuteUnit}
                            </span>
                            <span className="truncate">
                              {localizedDifficulty(recipe.difficulty, language)}
                            </span>
                            <span className="shrink-0">
                              {recipe.calories} {calorieUnit}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openRecipe(recipe)}
                            className="mt-2 block w-full text-left"
                          >
                            <h3 className="break-anywhere font-serif text-xl font-semibold leading-6 text-[#25322b]">
                              {recipe.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#748078]">
                              {recipe.description}
                            </p>
                          </button>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <button
                              onClick={() => toggleFavorite(recipe)}
                              aria-label={
                                isFavorite(recipe)
                                  ? `${copy.results.removeFavorite}: ${recipe.title}`
                                  : `${copy.results.addFavorite}: ${recipe.title}`
                              }
                              className={`grid size-9 shrink-0 place-items-center rounded-full ${
                                isFavorite(recipe)
                                  ? "bg-[#fc5726] text-white"
                                  : "bg-[#f6f3ec] text-[#536159]"
                              }`}
                            >
                              <Icon name="heart" />
                            </button>
                            {missingItems.length > 0 ? (
                              <button
                                onClick={() => addToShoppingList(missingItems)}
                                disabled={missingItems.every(isOnShoppingList)}
                                className="min-w-0 truncate rounded-full bg-[#f7eee8] px-3 py-2 text-xs font-bold text-[#a45c45] disabled:bg-[#e3eee5] disabled:text-[#025026]"
                              >
                                {missingItems.every(isOnShoppingList)
                                  ? copy.results.allOnList
                                  : `+ ${missingItems.slice(0, 2).join(", ")}${
                                      missingItems.length > 2 ? "…" : ""
                                    }`}
                              </button>
                            ) : (
                              <span className="truncate rounded-full bg-[#e3eee5] px-3 py-2 text-xs font-bold text-[#025026]">
                                {copy.results.haveEverything}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  }

                  return (
            <article
              key={recipe.title}
              className="group min-w-0 overflow-hidden rounded-[1.7rem] border border-[#e2dfd6] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`relative grid h-48 place-items-center bg-gradient-to-br ${accents[index % accents.length]}`}
              >
                {recipe.image ? (
                  <>
                    <Image
                      src={recipe.image.url}
                      alt={recipe.image.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
                    <a
                      href={recipe.image.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-3 left-4 max-w-[75%] truncate text-[10px] font-medium text-white/90 hover:text-white hover:underline"
                    >
                      {copy.results.photo} {recipe.image.photographer} · Pexels
                    </a>
                  </>
                ) : (
                  <span className="text-7xl drop-shadow-lg transition duration-300 group-hover:scale-110">
                    {recipe.emoji}
                  </span>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#025026] backdrop-blur">
                  {generationMode === "dish"
                    ? copy.results.fullRecipe
                    : `${recipe.match}% ${copy.results.match}`}
                </span>
                <button
                  onClick={() => toggleFavorite(recipe)}
                  aria-label={
                    isFavorite(recipe)
                      ? `${copy.results.removeFavorite}: ${recipe.title}`
                      : `${copy.results.addFavorite}: ${recipe.title}`
                  }
                  className={`absolute right-4 top-4 grid size-10 place-items-center rounded-full backdrop-blur transition ${
                    isFavorite(recipe)
                      ? "bg-[#d9684c] text-white"
                      : "bg-white/90 text-[#536159] hover:text-[#d9684c]"
                  }`}
                >
                  <Icon name="heart" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex min-w-0 gap-3 overflow-x-auto pb-1 text-xs font-medium text-[#78837c] sm:gap-4 sm:overflow-visible sm:pb-0">
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" /> {recipe.time} {minuteUnit}
                  </span>
                  <span className="shrink-0">
                    {localizedDifficulty(recipe.difficulty, language)}
                  </span>
                  <span className="shrink-0">
                    {recipe.calories} {calorieUnit}
                  </span>
                  {recipe.estimatedCost && (
                    <span className="shrink-0">
                      {copy.results.approx}{" "}
                      {formatPrice(language, recipe.estimatedCost, recipe.currency)}
                    </span>
                  )}
                </div>
                <h3 className="break-anywhere mt-4 font-serif text-2xl font-semibold">
                  {recipe.title}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#748078]">
                  {recipe.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {feedbackOptions.slice(0, 3).map((option) => {
                    const active = getRecipeFeedback(recipe) === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFeedback(recipe, option.value)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                          active
                            ? option.tone === "positive"
                              ? "bg-[#dfeae1] text-[#025026]"
                              : "bg-[#fff0e8] text-[#a45c45]"
                            : "bg-[#f6f3ec] text-[#748078] hover:bg-[#eee9df]"
                        }`}
                      >
                        {copy.feedback[option.value]}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 border-t border-[#eeeae2] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#829087]">
                    {copy.results.missing}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(() => {
                      const missingItems = uniqueShoppingItems(recipe.missing);

                      return missingItems.length > 0 ? (
                        missingItems.map((shoppingItem) => {
                          const added = isOnShoppingList(shoppingItem);
                          return (
                            <button
                              key={shoppingItem}
                              onClick={() => addToShoppingList([shoppingItem])}
                              disabled={added}
                              className={`break-anywhere max-w-full whitespace-normal rounded-full px-2.5 py-1 text-left text-xs font-medium transition-all duration-200 ${
                                added
                                  ? "bg-[#e3eee5] text-[#025026]"
                                  : "bg-[#f7eee8] text-[#a45c45] hover:-translate-y-0.5 hover:bg-[#f2ded3] hover:shadow-sm"
                              }`}
                            >
                              {added ? "✓" : "+"} {shoppingItem}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-sm text-[#4f765e]">
                          {copy.results.haveEverything}
                        </span>
                      );
                    })()}
                  </div>
                  {(() => {
                    const missingItems = uniqueShoppingItems(recipe.missing);
                    if (missingItems.length === 0) return null;

                    return (
                      <button
                        onClick={() => addToShoppingList(missingItems)}
                        disabled={missingItems.every(isOnShoppingList)}
                        className="mt-3 rounded-lg px-2 py-1 text-xs font-semibold text-[#a45c45] transition hover:bg-[#fff0e8] disabled:text-[#6e8376]"
                      >
                        {missingItems.every(isOnShoppingList)
                          ? copy.results.allOnList
                          : copy.results.addAllMissing}
                      </button>
                    );
                  })()}
                </div>
                {recipe.substitutions && recipe.substitutions.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-[#f8f4ec] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#829087]">
                      {copy.results.substitutions}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#59675f]">
                      {recipe.substitutions[0].ingredient}:{" "}
                      {recipe.substitutions[0].substitutes.join(" / ")}
                    </p>
                    {recipe.substitutions.length > 1 && (
                      <p className="mt-1 text-xs text-[#7a857e]">
                        +{recipe.substitutions.length - 1}{" "}
                        {copy.results.moreInDetails}
                      </p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => openRecipe(recipe)}
                  className="mt-6 w-full rounded-xl border border-[#ccd7cf] py-3 text-sm font-semibold text-[#025026] transition hover:bg-[#edf3ee]"
                >
                  {copy.results.viewRecipe}
                </button>
              </div>
            </article>
                  );
                })
              : (
                <div className="rounded-[1.7rem] border border-dashed border-[#cfcec7] bg-white/70 p-8 text-center lg:col-span-3">
                  <p className="font-serif text-2xl font-semibold">
                    {copy.results.noRecipes}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#7a857e]">
                    {copy.results.noRecipesHint}
                  </p>
                </div>
              )}
        </div>
        {nativeTabEndSpacer}
      </section>

      <div className={nativeTabClass("planner")}>
        <MealPlanner
          recipes={generated ? generatedRecipes : sampleRecipes}
          favorites={favorites}
          isSignedIn={Boolean(session?.user)}
          language={language}
          currency={currency}
          nativeApp={isNativeIosApp}
          onOpenRecipe={openRecipe}
          onAddToShoppingList={addToShoppingList}
          onEntriesChange={handleMealPlanEntriesChange}
        />
        {nativeTabEndSpacer}
      </div>

      <section
        id="my-kitchen"
        className={`${nativeTabClass("kitchen")} scroll-mt-8 border-t border-[#e1ddd3] bg-[#eeebe3] ${
          isNativeIosApp ? "py-4" : "py-8 sm:py-20"
        }`}
      >
        <div className={pageContainerClass}>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726] sm:text-sm">
              {copy.kitchen.eyebrow}
            </p>
            <h2
              className={`mt-2 font-serif font-semibold tracking-tight ${
                isNativeIosApp ? "text-3xl" : "text-3xl sm:text-5xl"
              }`}
            >
              {copy.kitchen.title}
            </h2>
            <p
              className={`mt-2 text-sm leading-6 text-[#748078] sm:mt-3 sm:text-base sm:leading-7 ${
                isNativeIosApp ? "hidden" : ""
              }`}
            >
              {session?.user
                ? copy.kitchen.signedIn
                : copy.kitchen.local}
            </p>
            {!session?.user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="mt-5 rounded-xl bg-[#025026] px-5 py-3 text-sm font-semibold text-white"
              >
                {copy.kitchen.login}
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-10 sm:gap-3 lg:grid-cols-4">
            {kitchenStats.map(([label, value, hint]) => (
              <div
                key={label}
                className="min-w-0 rounded-2xl border border-[#dedbd2] bg-white/80 p-3 shadow-sm sm:p-4"
              >
                <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#829087] sm:text-xs sm:tracking-[0.14em]">
                  {label}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold text-[#25322b] sm:mt-2 sm:text-3xl">
                  {value}
                </p>
                <p className="mt-1 line-clamp-1 text-[0.68rem] leading-4 text-[#748078] sm:text-xs sm:leading-5">
                  {hint}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 sm:mt-10">
            <Pantry
              items={pantryItems}
              isSignedIn={Boolean(session?.user)}
              onSave={savePantryItem}
              onRemove={removePantryItem}
              onConsume={consumePantryItem}
              onUseIngredients={usePantryIngredients}
              onAddToShoppingList={addToShoppingList}
              onCookFromPantry={cookFromPantry}
              isGenerating={isLoading}
              language={language}
              nativeApp={isNativeIosApp}
            />
          </div>

          <div
            className={`mt-4 grid gap-3 sm:mt-6 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 ${
              isNativeIosApp ? "hidden" : ""
            }`}
          >
            <article className="min-w-0 rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-semibold">
                  {copy.kitchen.favorites}
                </h3>
                <span className="rounded-full bg-[#f7eee8] px-3 py-1 text-xs font-bold text-[#a45c45]">
                  {favorites.length}
                </span>
              </div>
              <div className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto sm:mt-5">
                {favorites.length > 0 ? (
                  favorites.map((recipe) => (
                    <div
                      key={recipe.title}
                      className="flex items-center gap-3 rounded-xl bg-[#faf8f3] p-3"
                    >
                      {recipe.image ? (
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={recipe.image.url}
                            alt={recipe.image.alt}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <span className="text-2xl">{recipe.emoji}</span>
                      )}
                      <button
                        onClick={() => openRecipe(recipe)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="break-anywhere block text-sm font-semibold">
                          {recipe.title}
                        </span>
                        <span className="text-xs text-[#7a857e]">
                          {recipe.time} {minuteUnit} · {recipe.calories}{" "}
                          {calorieUnit}
                        </span>
                      </button>
                      <button
                        onClick={() => toggleFavorite(recipe)}
                        aria-label={`${copy.results.removeFavorite}: ${recipe.title}`}
                        className="text-xl text-[#fc5726]"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#faf8f3] p-4 text-sm leading-6 text-[#7a857e]">
                    {copy.kitchen.emptyFavorites}
                  </p>
                )}
              </div>
            </article>

            <article className="min-w-0 rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-2xl font-semibold">
                  {copy.kitchen.history}
                </h3>
                <div className="flex items-center gap-3">
                  {session?.user && history.length > 0 && (
                    <Link
                      href="/recipes/history"
                      className="text-xs font-semibold text-[#025026] hover:underline"
                    >
                      {copy.kitchen.fullHistory}
                    </Link>
                  )}
                  {history.length > 0 && (
                    <button
                      onClick={() => {
                        setHistory([]);
                        if (session?.user) {
                          void saveKitchenAction({ action: "history.clear" });
                        }
                      }}
                      className="text-xs font-semibold text-[#9a6251] hover:underline"
                    >
                      {copy.kitchen.clear}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto sm:mt-5">
                {history.length > 0 ? (
                  history.slice(0, 5).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => restoreHistory(entry)}
                      className="block w-full rounded-xl bg-[#faf8f3] p-3 text-left transition hover:bg-[#f1eee6]"
                    >
                      <span className="break-anywhere block text-sm font-semibold">
                        {entry.mode === "dish" && entry.query
                          ? `${copy.dish.historyPrefix} ${entry.query}`
                          : entry.ingredients.join(", ")}
                      </span>
                      <span className="mt-1 block text-xs text-[#7a857e]">
                        {new Intl.DateTimeFormat(language === "pl" ? "pl-PL" : "en-US", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(entry.createdAt))}{" "}
                        · {entry.diet}
                        {entry.mode === "dish" &&
                          ` · ${copy.kitchen.specificDish}`}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#faf8f3] p-4 text-sm leading-6 text-[#7a857e]">
                    {copy.kitchen.noHistory}
                  </p>
                )}
              </div>
            </article>

            <article className="min-w-0 rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 sm:p-6 md:col-span-2 lg:col-span-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-2xl font-semibold">
                    {copy.shopping.listTitle}
                  </h3>
                  <p className="mt-1 text-xs text-[#7a857e]">
                    {visibleShoppingCount} {copy.shopping.visible} ·{" "}
                    {shoppingList.length} {copy.shopping.total}
                  </p>
                </div>
                {shoppingList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={copyShoppingList}
                      disabled={pendingShoppingCount === 0}
                      className="rounded-full bg-[#edf3ee] px-3 py-1.5 text-xs font-semibold text-[#025026] transition hover:bg-[#dfece2]"
                    >
                      {copy.shopping.copy}
                    </button>
                    {boughtShoppingCount > 0 && (
                      <>
                        <button
                          onClick={moveBoughtShoppingItemsToPantry}
                          className="rounded-full bg-[#025026] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#013d1d]"
                        >
                          {copy.shopping.boughtToPantry}
                        </button>
                        <button
                          onClick={clearBoughtShoppingItems}
                          className="rounded-full bg-[#fff0e8] px-3 py-1.5 text-xs font-semibold text-[#9a6251] transition hover:bg-[#ffe3d7]"
                        >
                          {copy.shopping.removeBought}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setShoppingList([]);
                        if (session?.user) {
                          void saveKitchenAction({ action: "shopping.clear" });
                        }
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#9a6251] transition hover:bg-[#fff0e8]"
                    >
                      {copy.shopping.clear}
                    </button>
                  </div>
                )}
              </div>
              <form
                onSubmit={submitShoppingItem}
                className="mt-4 flex flex-col gap-2 rounded-2xl border border-[#e5e2da] bg-[#fbfaf6] p-2 sm:flex-row"
              >
                <input
                  value={shoppingInput}
                  onChange={(event) => setShoppingInput(event.target.value)}
                  maxLength={80}
                  className="mt-1.5 block h-11 w-full rounded-xl border border-[#dedfd9] px-3 text-sm font-normal outline-none focus:border-[#71927e] disabled:bg-[#f3f1eb]"
                  placeholder={copy.shopping.placeholder}
                />
                <button
                  disabled={shoppingInput.trim().length === 0}
                  className="h-11 rounded-xl bg-[#025026] px-4 text-sm font-semibold text-white transition hover:bg-[#013d1d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copy.shopping.add}
                </button>
              </form>

              {shoppingList.length > 0 && (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#f4f1e9] p-1.5 text-xs font-semibold">
                    {[
                      ["pending", `${copy.shopping.pending} (${pendingShoppingCount})`],
                      ["bought", `${copy.shopping.bought} (${boughtShoppingCount})`],
                      ["all", `${copy.shopping.all} (${shoppingList.length})`],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() =>
                          setShoppingFilter(value as typeof shoppingFilter)
                        }
                        className={`rounded-xl px-2 py-2 transition ${
                          shoppingFilter === value
                            ? "bg-white text-[#025026] shadow-sm"
                            : "text-[#68736b] hover:bg-white/60"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {shoppingCategorySummary.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {shoppingCategorySummary.map((category) => (
                        <span
                          key={category.name}
                          className="rounded-full bg-[#f8f6f0] px-2.5 py-1 text-[0.68rem] font-bold text-[#68736b] ring-1 ring-[#eeeae2]"
                        >
                          {displayShoppingCategory(category.name, language)}:{" "}
                          {category.count}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mt-5 space-y-4">
                {shoppingList.length > 0 ? (
                  shoppingSections.map((section) => (
                    <div
                      key={section.key}
                      className={`rounded-2xl border p-3 ${
                        section.checked
                          ? "border-[#dfeae1] bg-[#f4faf5]"
                          : "border-[#eeeae2] bg-[#fffdf8]"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 px-1">
                        <p
                          className={`text-xs font-bold uppercase tracking-[0.14em] ${
                            section.checked ? "text-[#025026]" : "text-[#7a857e]"
                          }`}
                        >
                          {section.title}
                        </p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#025026]">
                          {section.count}
                        </span>
                      </div>

                      {section.count > 0 ? (
                        <div className="space-y-4">
                          {section.groups.map((group) => (
                            <div key={group.name}>
                              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9aa29d]">
                                  {displayShoppingCategory(group.name, language)}
                                </p>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#7a857e]">
                                  {group.items.length}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {group.items.map((item) => (
                                  <div
                                    key={item}
                                    className={`rounded-xl p-3 text-sm transition ${
                                      section.checked
                                        ? "bg-white ring-1 ring-[#dfeae1]"
                                        : "bg-[#faf8f3] hover:bg-[#f2eee5]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        aria-label={
                                          section.checked
                                            ? `${copy.shopping.uncheck}: ${item}`
                                            : `${copy.shopping.markBought}: ${item}`
                                        }
                                        checked={section.checked}
                                        onChange={(event) =>
                                          toggleShoppingItem(
                                            item,
                                            event.currentTarget.checked,
                                          )
                                        }
                                        className="size-4 shrink-0 accent-[#025026]"
                                      />

                                      {editingShoppingItem === item ? (
                                        <input
                                          value={editingShoppingValue}
                                          onChange={(event) =>
                                            setEditingShoppingValue(
                                              event.target.value,
                                            )
                                          }
                                          onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                              event.preventDefault();
                                              saveEditedShoppingItem();
                                            }
                                            if (event.key === "Escape") {
                                              cancelEditingShoppingItem();
                                            }
                                          }}
                                          autoFocus
                                          className="min-w-0 flex-1 rounded-lg border border-[#dedfd9] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#71927e]"
                                        />
                                      ) : (
                                        <span
                                          className={`break-anywhere min-w-0 flex-1 ${
                                            section.checked
                                              ? "text-[#65736a] line-through"
                                              : ""
                                          }`}
                                        >
                                          {item}
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                                      {editingShoppingItem === item ? (
                                        <>
                                          <button
                                            onClick={saveEditedShoppingItem}
                                            className="rounded-lg bg-[#025026] px-2 py-1.5 text-[11px] font-semibold text-white"
                                          >
                                            {copy.shopping.save}
                                          </button>
                                          <button
                                            onClick={cancelEditingShoppingItem}
                                            className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#7a857e] transition hover:bg-white"
                                          >
                                            {copy.shopping.cancel}
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() =>
                                              startEditingShoppingItem(item)
                                            }
                                            className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#68736b] transition hover:bg-white"
                                          >
                                            {copy.shopping.edit}
                                          </button>
                                          <button
                                            onClick={() =>
                                              moveShoppingItemToPantry(item)
                                            }
                                            className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#025026] transition hover:bg-[#dfeae1]"
                                          >
                                            {copy.shopping.toPantry}
                                          </button>
                                          <button
                                            onClick={() =>
                                              removeShoppingItem(item)
                                            }
                                            className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#9a6251] transition hover:bg-[#fff0e8]"
                                          >
                                            {copy.shopping.remove}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl bg-[#faf8f3] p-4 text-sm leading-6 text-[#7a857e]">
                          {section.checked
                            ? copy.shopping.noBought
                            : copy.shopping.allBought}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#faf8f3] p-4 text-sm leading-6 text-[#7a857e]">
                    {copy.shopping.empty}
                  </p>
                )}
              </div>
            </article>
          </div>
        </div>
        {nativeTabEndSpacer}
      </section>

      {selectedRecipe && (
        <div
          className="modal-safe-area fixed inset-0 z-50 grid place-items-center bg-[#18241e]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={selectedRecipe.title}
          onClick={() => setSelectedRecipe(null)}
        >
          <article
            className="modal-panel-safe w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#fffdf8] p-4 shadow-2xl sm:rounded-[2rem] sm:p-9"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {selectedRecipe.image ? (
                  <div className="relative mb-6 h-56 w-full overflow-hidden rounded-2xl sm:h-72">
                    <Image
                      src={selectedRecipe.image.url}
                      alt={selectedRecipe.image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <a
                      href={selectedRecipe.image.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-3 left-4 text-xs font-medium text-white hover:underline"
                    >
                      {copy.recipeModal.photo}{" "}
                      {selectedRecipe.image.photographer} · Pexels
                    </a>
                  </div>
                ) : (
                  <span className="text-5xl">{selectedRecipe.emoji}</span>
                )}
                <h2 className="break-anywhere mt-4 font-serif text-3xl font-semibold sm:text-4xl">
                  {selectedRecipe.title}
                </h2>
                <p className="mt-2 text-[#748078]">
                  {selectedRecipe.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                aria-label={`${copy.recipeModal.closeRecipe} ${selectedRecipe.title}`}
                className="absolute right-5 top-5 grid size-10 shrink-0 place-items-center rounded-full bg-[#eeeae2] text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#edf2ed] p-3 text-sm sm:grid-cols-5 sm:gap-3 sm:p-4">
              <span className="min-w-0 truncate">
                {selectedRecipe.time} {minuteUnit}
              </span>
              <span className="min-w-0 truncate">
                {selectedRecipe.calories} {calorieUnit}
              </span>
              <span className="min-w-0 truncate">
                {copy.recipeModal.proteinShort}: {selectedRecipe.protein} g
              </span>
              <span className="min-w-0 truncate">
                {copy.recipeModal.carbsShort}: {selectedRecipe.carbs} g
              </span>
              <span className="min-w-0 truncate">
                {copy.recipeModal.fatShort}: {selectedRecipe.fat} g
              </span>
              {selectedRecipe.estimatedCost && (
                <span className="min-w-0 truncate">
                  {copy.recipeModal.approx}{" "}
                  {formatPrice(
                    language,
                    selectedRecipe.estimatedCost,
                    selectedRecipe.currency,
                  )}{" "}
                  / 2 {copy.recipeModal.servings}
                </span>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-[#e6e1d7] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#829087]">
                {copy.recipeModal.rate}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {feedbackOptions.map((option) => {
                  const active = getRecipeFeedback(selectedRecipe) === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFeedback(selectedRecipe, option.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? option.tone === "positive"
                            ? "bg-[#dfeae1] text-[#025026]"
                            : "bg-[#fff0e8] text-[#a45c45]"
                          : "bg-[#f6f3ec] text-[#748078] hover:bg-[#eee9df]"
                      }`}
                    >
                      {copy.feedback[option.value]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f6f3ec] p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#59675f]">
                  {copy.recipeModal.servingsLabel}
                </span>
                <button
                  onClick={() => setServings((current) => Math.max(1, current - 1))}
                  className="grid size-9 place-items-center rounded-full bg-white text-lg shadow-sm"
                  aria-label={copy.recipeModal.decreaseServings}
                >
                  −
                </button>
                <strong className="min-w-6 text-center">{servings}</strong>
                <button
                  onClick={() => setServings((current) => Math.min(12, current + 1))}
                  className="grid size-9 place-items-center rounded-full bg-white text-lg shadow-sm"
                  aria-label={copy.recipeModal.increaseServings}
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={startCookingMode}
                  className="rounded-xl bg-[#fc5726] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  {copy.recipeModal.cookingMode}
                </button>
                <button
                  onClick={() => consumeRecipePantryItems(selectedRecipe)}
                  className="rounded-xl border border-[#ccd7cf] bg-white px-4 py-2.5 text-xs font-semibold text-[#025026]"
                >
                  {copy.recipeModal.markUsed}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#e1ddd4] bg-white p-3">
              {selectedRecipe.isPublic && selectedRecipe.savedId ? (
                <>
                  <button
                    disabled={sharePending}
                    onClick={() => shareRecipe(selectedRecipe)}
                    className="rounded-xl bg-[#025026] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {sharePending
                      ? copy.recipeModal.processing
                      : copy.recipeModal.copyLink}
                  </button>
                  <a
                    href={`/recipes/${selectedRecipe.savedId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#ccd7cf] px-4 py-2.5 text-xs font-semibold text-[#025026]"
                  >
                    {copy.recipeModal.openPublic}
                  </a>
                  <button
                    disabled={sharePending}
                    onClick={() => makeRecipePrivate(selectedRecipe)}
                    className="px-3 py-2.5 text-xs font-semibold text-[#9a6251] disabled:opacity-50"
                  >
                    {copy.recipeModal.makePrivate}
                  </button>
                </>
              ) : (
                <button
                  disabled={sharePending}
                  onClick={() => shareRecipe(selectedRecipe)}
                  className="rounded-xl bg-[#025026] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {sharePending
                    ? copy.recipeModal.sharing
                    : copy.recipeModal.shareRecipe}
                </button>
              )}
              <span className="text-xs text-[#7a857e]">
                {selectedRecipe.isPublic
                  ? copy.recipeModal.publicInfo
                  : copy.recipeModal.privateInfo}
              </span>
            </div>

            {(() => {
              const missingItems = uniqueShoppingItems(selectedRecipe.missing);
              if (missingItems.length === 0) return null;

              return (
                <div className="mt-5 rounded-2xl border border-[#eee1d8] bg-[#fff8f3] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9a6251]">
                    {copy.recipeModal.missingClick}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingItems.map((shoppingItem) => {
                      const added = isOnShoppingList(shoppingItem);
                      return (
                        <button
                          key={shoppingItem}
                          onClick={() => addToShoppingList([shoppingItem])}
                          disabled={added}
                          className={`break-anywhere max-w-full whitespace-normal rounded-full px-3 py-1.5 text-left text-xs font-semibold transition-all ${
                            added
                              ? "bg-[#e3eee5] text-[#025026]"
                              : "bg-white text-[#a45c45] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                          }`}
                        >
                          {added ? "✓" : "+"} {shoppingItem}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {selectedRecipe.substitutions &&
              selectedRecipe.substitutions.length > 0 && (
                <div className="mt-5 rounded-2xl border border-[#dde7dc] bg-[#f6faf5] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#4f765e]">
                    {copy.recipeModal.substitutions}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {selectedRecipe.substitutions.map((item) => (
                      <div
                        key={`${item.ingredient}-${item.substitutes.join("-")}`}
                        className="rounded-xl bg-white p-3 shadow-sm"
                      >
                        <p className="text-sm font-bold text-[#35483e]">
                          {item.ingredient}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#59675f]">
                          {item.substitutes.join(" / ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="font-serif text-2xl font-semibold">
                  {copy.recipeModal.ingredients}
                </h3>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-[#59675f]">
                  {selectedRecipe.ingredients.map((ingredient) => (
                    <li key={ingredient} className="flex gap-2">
                      <span className="text-[#fc5726]">•</span>{" "}
                      {scaleIngredient(ingredient, servings / 2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-serif text-2xl font-semibold">
                  {copy.recipeModal.preparation}
                </h3>
                <ol className="mt-4 space-y-4 text-sm leading-6 text-[#59675f]">
                  {selectedRecipe.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#dce9df] text-xs font-bold text-[#025026]">
                        {index + 1}
                      </span>
                      {scaleRecipeText(step, servings / 2)}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </article>
        </div>
      )}

      {selectedRecipe && cookingMode && (
        <div
          className="modal-safe-area fixed inset-0 z-[70] grid place-items-center bg-[#18241e]/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${copy.cookingMode.label} ${selectedRecipe.title}`}
        >
          <div className="modal-panel-safe-tall w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#fffdf8] p-4 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
                  {copy.cookingMode.step} {cookingStep + 1}{" "}
                  {copy.cookingMode.of} {selectedRecipe.steps.length}
                </p>
                <h2 className="break-anywhere mt-2 font-serif text-3xl font-semibold">
                  {selectedRecipe.title}
                </h2>
              </div>
              <button
                onClick={closeCookingMode}
                aria-label={copy.cookingMode.close}
                className="grid size-10 place-items-center rounded-full bg-[#eeeae2] text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#68736b]">
                <span>
                  {copy.cookingMode.progress}{" "}
                  {Object.values(checkedCookingSteps).filter(Boolean).length}/
                  {selectedRecipe.steps.length}
                </span>
                <span>
                  {Math.round(
                    ((cookingStep + 1) / selectedRecipe.steps.length) * 100,
                  )}
                  %
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e5e2da]">
                <div
                  className="h-full rounded-full bg-[#fc5726] transition-all"
                  style={{
                    width: `${((cookingStep + 1) / selectedRecipe.steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#dedbd2] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#35483e]">
                  {copy.cookingMode.ingredientsFor} {servings}{" "}
                  {servings === 1
                    ? copy.cookingMode.servingOne
                    : servings < 5
                      ? copy.cookingMode.servingFew
                      : copy.cookingMode.servingMany}
                </h3>
                <span className="text-xs text-[#7a857e]">
                  {copy.cookingMode.scaled}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[#59675f] sm:grid-cols-2">
                {selectedRecipe.ingredients.map((ingredient) => {
                  const scaledIngredient = scaleIngredient(
                    ingredient,
                    servings / 2,
                  );
                  const checked = Boolean(
                    checkedCookingIngredients[ingredient],
                  );

                  return (
                    <button
                      key={ingredient}
                      onClick={() =>
                        setCheckedCookingIngredients((current) => ({
                          ...current,
                          [ingredient]: !current[ingredient],
                        }))
                      }
                      className={`flex items-start gap-2 rounded-xl px-3 py-2 text-left transition ${
                        checked
                          ? "bg-[#dfeae1] text-[#025026]"
                          : "bg-[#f6f3ec] hover:bg-[#eee9df]"
                      }`}
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-current text-[10px]">
                        {checked ? "✓" : ""}
                      </span>
                      <span
                        className={checked ? "line-through opacity-75" : ""}
                      >
                        {scaledIngredient}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-[#dedbd2] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#829087]">
                    {copy.cookingMode.timer}
                  </p>
                  <p className="mt-1 font-serif text-4xl font-semibold">
                    {formatTimer(cookingTimerSeconds)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setCookingTimerSeconds((current) => current + 60)
                    }
                    className="h-10 rounded-xl border border-[#ccd7cf] px-3 text-xs font-semibold text-[#025026]"
                  >
                    +1 {minuteUnit}
                  </button>
                  <button
                    onClick={() =>
                      setCookingTimerSeconds((current) =>
                        Math.max(0, current - 60),
                      )
                    }
                    disabled={cookingTimerSeconds === 0}
                    className="h-10 rounded-xl border border-[#ccd7cf] px-3 text-xs font-semibold text-[#025026] disabled:opacity-40"
                  >
                    -1 {minuteUnit}
                  </button>
                  <button
                    onClick={() =>
                      setCookingTimerSeconds((current) => current + 300)
                    }
                    className="h-10 rounded-xl border border-[#ccd7cf] px-3 text-xs font-semibold text-[#025026]"
                  >
                    +5 {minuteUnit}
                  </button>
                  <button
                    onClick={() =>
                      setCookingTimerRunning((current) =>
                        cookingTimerSeconds > 0 ? !current : false,
                      )
                    }
                    disabled={cookingTimerSeconds === 0}
                    className="h-10 rounded-xl bg-[#025026] px-3 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {cookingTimerRunning && cookingTimerSeconds > 0
                      ? copy.cookingMode.pause
                      : copy.cookingMode.start}
                  </button>
                  <button
                    onClick={() => {
                      setCookingTimerSeconds(0);
                      setCookingTimerRunning(false);
                    }}
                    className="h-10 rounded-xl px-3 text-xs font-semibold text-[#9a6251] hover:bg-[#fff0e8]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {cookingFinished ? (
              <div className="my-6 rounded-[1.7rem] border border-[#dfeae1] bg-[#f4faf5] p-6 text-center sm:p-8">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#025026] text-2xl text-white">
                  ✓
                </div>
                <h3 className="mt-4 font-serif text-3xl font-semibold">
                  {copy.cookingMode.doneTitle}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68736b]">
                  {copy.cookingMode.doneText}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => {
                      consumeRecipePantryItems(selectedRecipe);
                      closeCookingMode();
                    }}
                    className="rounded-xl bg-[#025026] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    {copy.cookingMode.markUsed}
                  </button>
                  <button
                    onClick={closeCookingMode}
                    className="rounded-xl border border-[#ccd7cf] bg-white px-4 py-2.5 text-sm font-semibold text-[#025026]"
                  >
                    {copy.cookingMode.closeWithoutChanges}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {selectedRecipe.substitutions &&
                  selectedRecipe.substitutions.length > 0 && (
                  <details className="mt-3 rounded-2xl border border-[#dde7dc] bg-[#f6faf5] p-4">
                    <summary className="cursor-pointer text-sm font-bold text-[#025026]">
                      {copy.cookingMode.showSubstitutions}
                    </summary>
                    <div className="mt-3 space-y-2 text-sm text-[#59675f]">
                      {selectedRecipe.substitutions.map((item) => (
                        <p key={`${item.ingredient}-cooking`}>
                          <span className="font-semibold text-[#35483e]">
                            {item.ingredient}:
                          </span>{" "}
                          {item.substitutes.join(" / ")}
                        </p>
                      ))}
                    </div>
                  </details>
                  )}

                <div className="my-6 min-h-44 rounded-2xl bg-[#edf2ed] p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-[#025026] text-sm font-bold text-white">
                      {cookingStep + 1}
                    </span>
                    <button
                      onClick={() =>
                        setCheckedCookingSteps((current) => ({
                          ...current,
                          [cookingStep]: !current[cookingStep],
                        }))
                      }
                      className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        checkedCookingSteps[cookingStep]
                          ? "bg-[#dfeae1] text-[#025026]"
                          : "bg-white text-[#025026]"
                      }`}
                    >
                      {checkedCookingSteps[cookingStep]
                        ? copy.cookingMode.doneStep
                        : copy.cookingMode.checkStep}
                    </button>
                  </div>
                  <p className="mt-5 font-serif text-2xl leading-9 text-[#25322b] sm:text-3xl sm:leading-10">
                    {scaleRecipeText(
                      selectedRecipe.steps[cookingStep],
                      servings / 2,
                    )}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedRecipe.steps.map((step, index) => (
                    <button
                      key={step}
                      onClick={() => setCookingStep(index)}
                      aria-label={`${copy.cookingMode.goToStep} ${index + 1}`}
                      className={`grid size-9 place-items-center rounded-full text-xs font-bold transition ${
                        cookingStep === index
                          ? "bg-[#fc5726] text-white"
                          : checkedCookingSteps[index]
                            ? "bg-[#dfeae1] text-[#025026]"
                            : "bg-[#eeeae2] text-[#59675f]"
                      }`}
                    >
                      {checkedCookingSteps[index] ? "✓" : index + 1}
                    </button>
                  ))}
                </div>
              </>
            )}

            {!cookingFinished && (
            <div className="sticky bottom-0 -mx-4 mt-5 flex justify-between gap-3 border-t border-[#e6e1d7] bg-[#fffdf8]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
              <button
                disabled={cookingStep === 0}
                onClick={() =>
                  setCookingStep((current) => Math.max(0, current - 1))
                }
                className="h-12 flex-1 rounded-xl border border-[#ccd7cf] px-5 text-sm font-semibold text-[#025026] disabled:opacity-30"
              >
                {copy.cookingMode.previous}
              </button>
              {cookingStep === selectedRecipe.steps.length - 1 ? (
                <button
                  onClick={finishCookingMode}
                  className="h-12 flex-1 rounded-xl bg-[#025026] px-5 text-sm font-semibold text-white"
                >
                  {copy.cookingMode.done}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCheckedCookingSteps((current) => ({
                      ...current,
                      [cookingStep]: true,
                    }));
                    setCookingStep((current) =>
                      Math.min(selectedRecipe.steps.length - 1, current + 1),
                    );
                  }}
                  className="h-12 flex-1 rounded-xl bg-[#025026] px-5 text-sm font-semibold text-white"
                >
                  {copy.cookingMode.next}
                </button>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {authOpen && (
        <AuthDialog
          language={language}
          onClose={() => setAuthOpen(false)}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="toast-enter safe-bottom fixed left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#253d31] px-4 py-3 text-sm font-semibold text-white shadow-2xl"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15">
            ✓
          </span>
          {toast}
        </div>
      )}

      {isNativeIosApp && nativeMoreOpen && (
        <div className="native-more-sheet fixed left-3 right-3 z-[75] rounded-[1.4rem] border border-[#dedbd2] bg-white p-3 shadow-2xl">
          <LocaleSettings
            language={language}
            currency={currency}
            region={priceRegion}
            onLanguageChange={changeLanguage}
            onCurrencyChange={changeCurrency}
            onRegionChange={changePriceRegion}
            compact
          />
          <div className="mt-3 grid gap-2 text-sm font-semibold text-[#536159]">
            {session?.user ? (
              <>
                <Link
                  href="/recipes"
                  className="rounded-xl bg-[#f8f5ee] px-4 py-3 text-[#35483e]"
                >
                  {copy.nav.savedRecipes}
                </Link>
                <Link
                  href="/recipes/history"
                  className="rounded-xl bg-[#f8f5ee] px-4 py-3 text-[#35483e]"
                >
                  {copy.nav.recipeHistory}
                </Link>
                <Link
                  href="/settings"
                  className="rounded-xl bg-[#f3f6f2] px-4 py-3 text-[#025026]"
                >
                  {copy.nav.accountSettings}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-xl bg-[#253d31] px-4 py-3 text-white"
                  >
                    {copy.nav.adminPanel}
                  </Link>
                )}
                <button
                  onClick={() => {
                    setNativeMoreOpen(false);
                    setIsAdmin(false);
                    void authClient.signOut();
                  }}
                  className="rounded-xl px-4 py-3 text-left text-[#a45c45]"
                >
                  {copy.nav.logoutFull}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setNativeMoreOpen(false);
                  setAuthOpen(true);
                }}
                className="h-11 rounded-xl bg-[#025026] px-4 text-white"
              >
                {copy.nav.loginOrCreate}
              </button>
            )}
          </div>
        </div>
      )}

      {isNativeIosApp && (
        <nav className="native-tab-bar fixed z-[70] rounded-[1.45rem] border border-[#dedbd2] bg-white px-1.5 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5">
            {[
              ["generator", nativeTabLabels.generator],
              ["recipes", nativeTabLabels.recipes],
              ["planner", nativeTabLabels.planner],
              ["kitchen", nativeTabLabels.kitchen],
            ].map(([tab, label]) => {
              const nativeTab = tab as NativeTab;
              const active = activeNativeTab === nativeTab && !nativeMoreOpen;

              return (
              <button
                key={nativeTab}
                type="button"
                onClick={() => openNativeTab(nativeTab)}
                className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 text-center text-[0.64rem] font-bold leading-[1.05] ${
                  active
                    ? "bg-[#025026] text-white"
                    : "text-[#5f6c64] active:bg-[#f1eee7]"
                }`}
              >
                <span className="grid size-7 place-items-center">
                  <NativeTabIcon name={nativeTab} active={active} />
                </span>
                <span className="line-clamp-1 w-full px-0.5">{label}</span>
              </button>
              );
            })}
            <button
              type="button"
              onClick={() => setNativeMoreOpen((current) => !current)}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 text-center text-[0.64rem] font-bold leading-[1.05] ${
                nativeMoreOpen
                  ? "bg-[#025026] text-white"
                  : "text-[#5f6c64] active:bg-[#f1eee7]"
                }`}
            >
              <span className="grid size-7 place-items-center">
                <NativeTabIcon name="more" active={nativeMoreOpen} />
              </span>
              <span className="line-clamp-1 w-full px-0.5">{nativeMoreLabel}</span>
            </button>
          </div>
        </nav>
      )}

      {!isNativeIosApp && (
      <footer className="bg-[#23362c] py-6 text-center text-sm text-[#b8c3bc] sm:py-8">
        <div
          className={`${pageContainerClass} flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap`}
        >
          <span>{copy.footer.text}</span>
          <span className="hidden text-white/25 sm:inline">·</span>
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            {copy.footer.pexels}
          </a>
          <span className="hidden text-white/25 sm:inline">·</span>
          <Link
            href="/privacy"
            className="underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            {copy.footer.privacy}
          </Link>
          <Link
            href="/terms"
            className="underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            {copy.footer.terms}
          </Link>
        </div>
      </footer>
      )}
    </main>
  );
}
