"use client";

import { FormEvent, useMemo, useState } from "react";
import { getUiLanguage, type AppLanguage } from "@/lib/i18n";
import type { PantryItem } from "@/lib/recipe-types";

type PantryProps = {
  items: PantryItem[];
  isSignedIn: boolean;
  onSave: (item: Omit<PantryItem, "id">) => void;
  onRemove: (item: PantryItem) => void;
  onConsume: (item: PantryItem) => void;
  onUseIngredients: (labels: string[]) => void;
  onAddToShoppingList: (labels: string[]) => void;
  onCookFromPantry: () => void;
  isGenerating: boolean;
  language?: AppLanguage;
  nativeApp?: boolean;
};

const pantryCopy = {
  pl: {
    locale: "pl-PL",
    all: "Wszystkie",
    categories: {
      produce: "Warzywa i owoce",
      meat: "Mięso, ryby i jajka",
      dairy: "Nabiał",
      dry: "Produkty suche",
      sauces: "Przyprawy i sosy",
      other: "Pozostałe",
    },
    expiry: {
      expired: "po terminie",
      today: "ważne do dzisiaj",
      oneDay: "został 1 dzień",
      days: "zostały",
      daysSuffix: "dni",
    },
    headerTitle: "Moja spiżarnia",
    headerText:
      "Zapisz produkty, które masz w domu. Te z krótką datą ważności oznaczymy jako priorytet dla AI.",
    useUrgent: "Użyj pilnych",
    urgentToShopping: "Pilne do zakupów",
    addAllToGenerator: "Dodaj wszystkie do generatora",
    cookFromPantry: "Ugotuj ze spiżarni",
    aiCooking: "AI gotuje...",
    product: "Produkt",
    productPlaceholder: "np. jogurt naturalny",
    quantity: "Ilość",
    quantityPlaceholder: "np. 500 g",
    expiryDate: "Data ważności",
    cancel: "Anuluj",
    save: "Zapisz",
    addProduct: "Dodaj produkt",
    syncSignedIn: "Spiżarnia synchronizuje się z Twoim kontem.",
    syncGuest:
      "Zaloguj się, aby synchronizować spiżarnię między urządzeniami.",
    urgent: "Pilne",
    expired: "Po terminie",
    noDate: "Bez daty",
    categoriesLabel: "Kategorie",
    status: "Status",
    ending: "Kończące się",
    sorting: "Sortowanie",
    shortestDate: "Najkrótsza data",
    alphabetical: "Alfabetycznie",
    byCategory: "Kategoriami",
    addToGeneratorTitle: "Dodaj do generatora",
    addToShopping: "Na zakupy",
    edit: "Edytuj",
    consumedTitle: "Oznacz jako zużyte",
    empty:
      "Spiżarnia jest pusta. Dodaj pierwszy produkt wraz z ilością i opcjonalną datą ważności.",
    noCategory: "Brak produktów w tej kategorii.",
    aria: {
      addToShopping: "Dodaj do listy zakupów",
      edit: "Edytuj w spiżarni",
      consume: "Oznacz jako zużyte",
      remove: "Usuń ze spiżarni",
    },
  },
  en: {
    locale: "en-US",
    all: "All",
    categories: {
      produce: "Fruit and vegetables",
      meat: "Meat, fish and eggs",
      dairy: "Dairy",
      dry: "Dry goods",
      sauces: "Spices and sauces",
      other: "Other",
    },
    expiry: {
      expired: "expired",
      today: "expires today",
      oneDay: "1 day left",
      days: "",
      daysSuffix: "days left",
    },
    headerTitle: "My pantry",
    headerText:
      "Save products you have at home. Items close to expiry will be prioritized for AI.",
    useUrgent: "Use urgent",
    urgentToShopping: "Urgent to shopping",
    addAllToGenerator: "Add all to generator",
    cookFromPantry: "Cook from pantry",
    aiCooking: "AI is cooking...",
    product: "Product",
    productPlaceholder: "e.g. plain yogurt",
    quantity: "Quantity",
    quantityPlaceholder: "e.g. 500 g",
    expiryDate: "Expiry date",
    cancel: "Cancel",
    save: "Save",
    addProduct: "Add product",
    syncSignedIn: "Pantry syncs with your account.",
    syncGuest: "Log in to sync your pantry across devices.",
    urgent: "Urgent",
    expired: "Expired",
    noDate: "No date",
    categoriesLabel: "Categories",
    status: "Status",
    ending: "Expiring soon",
    sorting: "Sort",
    shortestDate: "Soonest expiry",
    alphabetical: "Alphabetical",
    byCategory: "By category",
    addToGeneratorTitle: "Add to generator",
    addToShopping: "Shopping",
    edit: "Edit",
    consumedTitle: "Mark as used",
    empty:
      "Your pantry is empty. Add the first product with quantity and optional expiry date.",
    noCategory: "No products in this category.",
    aria: {
      addToShopping: "Add to shopping list",
      edit: "Edit in pantry",
      consume: "Mark as used",
      remove: "Remove from pantry",
    },
  },
  uk: {
    locale: "uk-UA",
    all: "Усі",
    categories: {
      produce: "Овочі та фрукти",
      meat: "М’ясо, риба та яйця",
      dairy: "Молочні продукти",
      dry: "Сухі продукти",
      sauces: "Спеції та соуси",
      other: "Інше",
    },
    expiry: {
      expired: "прострочено",
      today: "придатне до сьогодні",
      oneDay: "залишився 1 день",
      days: "залишилось",
      daysSuffix: "днів",
    },
    headerTitle: "Моя комора",
    headerText:
      "Збережи продукти, які маєш удома. Ті, що скоро закінчаться, позначимо як пріоритет для AI.",
    useUrgent: "Використати термінові",
    urgentToShopping: "Термінові до покупок",
    addAllToGenerator: "Додати всі до генератора",
    cookFromPantry: "Готувати з комори",
    aiCooking: "AI готує...",
    product: "Продукт",
    productPlaceholder: "напр. натуральний йогурт",
    quantity: "Кількість",
    quantityPlaceholder: "напр. 500 г",
    expiryDate: "Термін придатності",
    cancel: "Скасувати",
    save: "Зберегти",
    addProduct: "Додати продукт",
    syncSignedIn: "Комора синхронізується з твоїм акаунтом.",
    syncGuest: "Увійди, щоб синхронізувати комору між пристроями.",
    urgent: "Термінові",
    expired: "Прострочені",
    noDate: "Без дати",
    categoriesLabel: "Категорії",
    status: "Статус",
    ending: "Скоро закінчуються",
    sorting: "Сортування",
    shortestDate: "Найближча дата",
    alphabetical: "За алфавітом",
    byCategory: "За категоріями",
    addToGeneratorTitle: "Додати до генератора",
    addToShopping: "До покупок",
    edit: "Редагувати",
    consumedTitle: "Позначити як використане",
    empty:
      "Комора порожня. Додай перший продукт із кількістю та необов’язковою датою придатності.",
    noCategory: "У цій категорії немає продуктів.",
    aria: {
      addToShopping: "Додати до списку покупок",
      edit: "Редагувати в коморі",
      consume: "Позначити як використане",
      remove: "Видалити з комори",
    },
  },
} as const;

function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${date}T00:00:00`);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

function expiryLabel(expiresAt: string | null, language: AppLanguage) {
  if (!expiresAt) return null;

  const copy = pantryCopy[getUiLanguage(language)];
  const days = daysUntil(expiresAt);
  if (days < 0) return copy.expiry.expired;
  if (days === 0) return copy.expiry.today;
  if (days === 1) return copy.expiry.oneDay;
  if (days <= 4) {
    return language === "pl"
      ? `${copy.expiry.days} ${days} ${copy.expiry.daysSuffix}`
      : `${days} ${copy.expiry.daysSuffix}`;
  }

  return new Intl.DateTimeFormat(copy.locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(`${expiresAt}T12:00:00`));
}

const pantryCategories = [
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
      "owoc",
      "warzyw",
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
      "curry",
      "oregano",
      "bazyl",
      "sos",
      "ocet",
      "musztard",
      "oliw",
      "olej",
      "przypraw",
    ],
  },
];

function getPantryCategory(label: string) {
  const normalized = label.toLocaleLowerCase("pl");
  const category = pantryCategories.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );

  return category?.name ?? "Pozostałe";
}

function displayCategoryName(category: string, language: AppLanguage) {
  const copy = pantryCopy[getUiLanguage(language)].categories;
  const labels: Record<string, string> = {
    "Warzywa i owoce": copy.produce,
    "Mięso, ryby i jajka": copy.meat,
    Nabiał: copy.dairy,
    "Produkty suche": copy.dry,
    "Przyprawy i sosy": copy.sauces,
    Pozostałe: copy.other,
    Wszystkie: pantryCopy[getUiLanguage(language)].all,
  };

  return labels[category] ?? category;
}

export function Pantry({
  items,
  isSignedIn,
  onSave,
  onRemove,
  onConsume,
  onUseIngredients,
  onAddToShoppingList,
  onCookFromPantry,
  isGenerating,
  language = "pl",
  nativeApp = false,
}: PantryProps) {
  const copy = pantryCopy[getUiLanguage(language)];
  const [label, setLabel] = useState("");
  const [quantity, setQuantity] = useState("1 szt.");
  const [expiresAt, setExpiresAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Wszystkie");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "urgent" | "expired" | "no-date"
  >("all");
  const [sortBy, setSortBy] = useState<"expiry" | "name" | "category">(
    "expiry",
  );

  const sortedItems = useMemo(
    () => {
      const sortableItems = [...items];

      return sortableItems.sort((first, second) => {
        if (sortBy === "name") {
          return first.label.localeCompare(second.label, "pl");
        }
        if (sortBy === "category") {
          return getPantryCategory(first.label).localeCompare(
            getPantryCategory(second.label),
            "pl",
          );
        }

        if (!first.expiresAt) return 1;
        if (!second.expiresAt) return -1;
        return first.expiresAt.localeCompare(second.expiresAt);
      });
    },
    [items, sortBy],
  );
  const expiredItems = sortedItems.filter(
    (item) => item.expiresAt !== null && daysUntil(item.expiresAt) < 0,
  );
  const urgentItems = sortedItems.filter(
    (item) =>
      item.expiresAt !== null &&
      daysUntil(item.expiresAt) >= 0 &&
      daysUntil(item.expiresAt) <= 4,
  );
  const noDateItems = sortedItems.filter((item) => item.expiresAt === null);
  const availableCategories = useMemo(() => {
    const counts = items.reduce<Record<string, number>>((accumulator, item) => {
      const category = getPantryCategory(item.label);
      accumulator[category] = (accumulator[category] ?? 0) + 1;
      return accumulator;
    }, {});

    return [
      { name: "Wszystkie", count: items.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count })),
    ];
  }, [items]);
  const visibleItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        const categoryMatches =
          activeCategory === "Wszystkie" ||
          getPantryCategory(item.label) === activeCategory;
        const days = item.expiresAt ? daysUntil(item.expiresAt) : null;
        const statusMatches =
          statusFilter === "all" ||
          (statusFilter === "urgent" &&
            days !== null &&
            days >= 0 &&
            days <= 4) ||
          (statusFilter === "expired" && days !== null && days < 0) ||
          (statusFilter === "no-date" && item.expiresAt === null);

        return categoryMatches && statusMatches;
      }),
    [activeCategory, sortedItems, statusFilter],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedLabel = label.trim().toLocaleLowerCase("pl");
    const normalizedQuantity = quantity.trim();
    if (!normalizedLabel || !normalizedQuantity) return;

    onSave({
      label: normalizedLabel,
      quantity: normalizedQuantity,
      expiresAt: expiresAt || null,
    });
    setLabel("");
    setQuantity("1 szt.");
    setExpiresAt("");
    setEditingId(null);
  }

  function startEditing(item: PantryItem) {
    setEditingId(item.id);
    setLabel(item.label);
    setQuantity(item.quantity);
    setExpiresAt(item.expiresAt ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setLabel("");
    setQuantity("1 szt.");
    setExpiresAt("");
  }

  return (
    <article
      className={`rounded-[1.7rem] border border-[#ced9cf] bg-[#f8fbf7] shadow-sm ${
        nativeApp ? "p-3" : "p-4 sm:p-6"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3
              className={`font-serif font-semibold ${
                nativeApp ? "text-xl" : "text-2xl"
              }`}
            >
              {copy.headerTitle}
            </h3>
            <span className="rounded-full bg-[#dfeae1] px-3 py-1 text-xs font-bold text-[#025026]">
              {items.length}
            </span>
          </div>
          <p
            className={`mt-2 max-w-2xl text-sm leading-6 text-[#748078] ${
              nativeApp ? "hidden" : ""
            }`}
          >
            {copy.headerText}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {urgentItems.length > 0 && (
              <>
                <button
                  onClick={() =>
                    onUseIngredients(urgentItems.map((item) => item.label))
                  }
                  className={`rounded-xl bg-[#fff0e3] text-xs font-semibold text-[#a45c45] transition hover:bg-[#f8e3d3] ${
                    nativeApp ? "px-3 py-2" : "px-4 py-2.5"
                  }`}
                >
                  {copy.useUrgent} ({urgentItems.length})
                </button>
                <button
                  onClick={() =>
                    onAddToShoppingList(urgentItems.map((item) => item.label))
                  }
                  className={`rounded-xl border border-[#efd5ab] bg-white text-xs font-semibold text-[#8d6840] transition hover:bg-[#fff8e9] ${
                    nativeApp ? "px-3 py-2" : "px-4 py-2.5"
                  }`}
                >
                  {copy.urgentToShopping}
                </button>
              </>
            )}
            <button
              onClick={() => onUseIngredients(items.map((item) => item.label))}
              className={`rounded-xl bg-[#025026] text-xs font-semibold text-white transition hover:bg-[#013d1d] ${
                nativeApp ? "px-3 py-2" : "px-4 py-2.5"
              }`}
            >
              {copy.addAllToGenerator}
            </button>
            <button
              onClick={onCookFromPantry}
              disabled={isGenerating}
              className={`rounded-xl bg-[#fc5726] text-xs font-semibold text-white transition hover:bg-[#d94318] disabled:cursor-not-allowed disabled:opacity-50 ${
                nativeApp ? "px-3 py-2" : "px-4 py-2.5"
              }`}
            >
              {isGenerating ? copy.aiCooking : copy.cookFromPantry}
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className={`grid gap-3 rounded-2xl border border-[#dfe6df] bg-white p-3 sm:grid-cols-[1fr_0.65fr_0.8fr_auto] sm:p-4 ${
          nativeApp ? "mt-3 grid-cols-2 gap-2" : "mt-5"
        }`}
      >
        <label className="text-xs font-semibold text-[#59675f]">
          {copy.product}
          <input
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            disabled={editingId !== null}
            maxLength={80}
            placeholder={copy.productPlaceholder}
            className="mt-1.5 block h-10 w-full rounded-xl border border-[#dedfd9] px-3 text-sm font-normal outline-none focus:border-[#71927e] disabled:bg-[#f3f1eb] sm:h-11"
          />
        </label>
        <label className="text-xs font-semibold text-[#59675f]">
          {copy.quantity}
          <input
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            maxLength={60}
            placeholder={copy.quantityPlaceholder}
            className="mt-1.5 block h-10 w-full rounded-xl border border-[#dedfd9] px-3 text-sm font-normal outline-none focus:border-[#71927e] sm:h-11"
          />
        </label>
        <label className="text-xs font-semibold text-[#59675f]">
          {copy.expiryDate}
          <input
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="mt-1.5 block h-10 w-full rounded-xl border border-[#dedfd9] px-3 text-sm font-normal outline-none focus:border-[#71927e] sm:h-11"
          />
        </label>
        <div className={`mt-auto flex gap-2 ${nativeApp ? "col-span-2" : ""}`}>
          {editingId && (
            <button
              type="button"
              onClick={cancelEditing}
              className="h-11 rounded-xl border border-[#d8d7d0] px-3 text-xs font-semibold text-[#68736b]"
            >
              {copy.cancel}
            </button>
          )}
          <button className="h-10 flex-1 rounded-xl bg-[#025026] px-5 text-sm font-semibold text-white transition hover:bg-[#013d1d] sm:h-11">
            {editingId ? copy.save : copy.addProduct}
          </button>
        </div>
      </form>

      <p className={`mt-2 text-[11px] text-[#8a948e] ${nativeApp ? "hidden" : ""}`}>
        {isSignedIn
          ? copy.syncSignedIn
          : copy.syncGuest}
      </p>

      {items.length > 0 && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4">
            {[
              [copy.all, items.length, "bg-white text-[#365a46]"],
              [copy.urgent, urgentItems.length, "bg-[#fff8e9] text-[#8d6840]"],
              [copy.expired, expiredItems.length, "bg-[#fff3ef] text-[#a45c45]"],
              [copy.noDate, noDateItems.length, "bg-[#eef2ec] text-[#59675f]"],
            ].map(([label, value, className]) => (
              <div
                key={label}
                className={`rounded-2xl ring-1 ring-[#e6e2d8] ${className} ${
                  nativeApp ? "p-2.5" : "p-3"
                }`}
              >
                <p className="text-[0.65rem] font-bold uppercase tracking-wider opacity-75">
                  {label}
                </p>
                <p
                  className={`mt-1 font-serif font-semibold ${
                    nativeApp ? "text-xl" : "text-2xl"
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div
            className={`mt-3 grid gap-3 rounded-2xl border border-[#dfe6df] bg-white p-3 lg:grid-cols-[1fr_auto] ${
              nativeApp ? "hidden" : ""
            }`}
          >
            <div>
              <p className="mb-2 px-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8a948e]">
                {copy.categoriesLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setActiveCategory(category.name)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      activeCategory === category.name
                        ? "bg-[#025026] text-white"
                        : "bg-[#f6f5ef] text-[#59675f] hover:bg-[#edf1ec]"
                    }`}
                  >
                    {displayCategoryName(category.name, language)} ({category.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
              <label className="text-xs font-semibold text-[#59675f]">
                {copy.status}
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as typeof statusFilter)
                  }
                  className="mt-1.5 block h-10 w-full rounded-xl border border-[#dedfd9] bg-white px-3 text-sm font-normal outline-none focus:border-[#71927e]"
                >
                  <option value="all">{copy.all}</option>
                  <option value="urgent">{copy.ending}</option>
                  <option value="expired">{copy.expired}</option>
                  <option value="no-date">{copy.noDate}</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[#59675f]">
                {copy.sorting}
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as typeof sortBy)
                  }
                  className="mt-1.5 block h-10 w-full rounded-xl border border-[#dedfd9] bg-white px-3 text-sm font-normal outline-none focus:border-[#71927e]"
                >
                  <option value="expiry">{copy.shortestDate}</option>
                  <option value="name">{copy.alphabetical}</option>
                  <option value="category">{copy.byCategory}</option>
                </select>
              </label>
            </div>
          </div>
        </>
      )}

      <div
        className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${
          nativeApp ? "mt-3" : "mt-5"
        }`}
      >
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => {
            const days = item.expiresAt ? daysUntil(item.expiresAt) : null;
            const isUrgent = days !== null && days >= 0 && days <= 4;
            const isExpired = days !== null && days < 0;

            return (
              <div
                key={item.id}
                className={`flex min-w-0 flex-col rounded-2xl border p-3 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between ${
                  nativeApp ? "gap-2" : "gap-3"
                } ${
                  isExpired
                    ? "border-[#e6b9ae] bg-[#fff3ef]"
                    : isUrgent
                      ? "border-[#efd5ab] bg-[#fff8e9]"
                      : "border-[#e5e4de] bg-white"
                }`}
              >
                <button
                  onClick={() => onUseIngredients([item.label])}
                  className="min-w-0 flex-1 text-left"
                  title={copy.addToGeneratorTitle}
                >
                  <span className="block truncate text-sm font-semibold">
                    + {item.label}
                  </span>
                  <span className="mt-1 block text-xs text-[#748078]">
                    {item.quantity}
                    {item.expiresAt && (
                      <>
                        {" · "}
                        <span
                          className={
                            isExpired || isUrgent ? "font-semibold text-[#a45c45]" : ""
                          }
                        >
                          {expiryLabel(item.expiresAt, language)}
                        </span>
                      </>
                    )}
                  </span>
                </button>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {(isExpired || isUrgent) && (
                    <button
                      onClick={() => onAddToShoppingList([item.label])}
                      aria-label={`${copy.aria.addToShopping}: ${item.label}`}
                      className="rounded-lg px-2 py-2 text-[11px] font-semibold text-[#8d6840] transition hover:bg-[#fff4de]"
                    >
                      {copy.addToShopping}
                    </button>
                  )}
                  <button
                    onClick={() => startEditing(item)}
                    aria-label={`${copy.aria.edit}: ${item.label}`}
                    className="rounded-lg px-2 py-2 text-[11px] font-semibold text-[#59675f] transition hover:bg-[#edf1ec]"
                  >
                    {copy.edit}
                  </button>
                  <button
                    onClick={() => onConsume(item)}
                    aria-label={`${copy.aria.consume}: ${item.label}`}
                    title={copy.consumedTitle}
                    className="grid size-9 place-items-center rounded-full text-sm font-bold text-[#025026] transition hover:bg-[#dfeae1]"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onRemove(item)}
                    aria-label={`${copy.aria.remove}: ${item.label}`}
                    className="grid size-9 place-items-center rounded-full text-lg text-[#9a6251] transition hover:bg-[#fff0e8]"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl bg-white p-4 text-sm leading-6 text-[#7a857e] sm:col-span-2 lg:col-span-3">
            {items.length === 0
              ? copy.empty
              : copy.noCategory}
          </p>
        )}
      </div>
    </article>
  );
}
