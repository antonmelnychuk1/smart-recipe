"use client";

import { FormEvent, useMemo, useState } from "react";
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
};

function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${date}T00:00:00`);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

function expiryLabel(expiresAt: string | null) {
  if (!expiresAt) return null;

  const days = daysUntil(expiresAt);
  if (days < 0) return "po terminie";
  if (days === 0) return "ważne do dzisiaj";
  if (days === 1) return "został 1 dzień";
  if (days <= 4) return `zostały ${days} dni`;

  return new Intl.DateTimeFormat("pl-PL", {
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
}: PantryProps) {
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
    <article className="rounded-[1.7rem] border border-[#ced9cf] bg-[#f8fbf7] p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-2xl font-semibold">Moja spiżarnia</h3>
            <span className="rounded-full bg-[#dfeae1] px-3 py-1 text-xs font-bold text-[#356248]">
              {items.length}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748078]">
            Zapisz produkty, które masz w domu. Te z krótką datą ważności
            oznaczymy jako priorytet dla AI.
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
                  className="rounded-xl bg-[#fff0e3] px-4 py-2.5 text-xs font-semibold text-[#a45c45] transition hover:bg-[#f8e3d3]"
                >
                  Użyj pilnych ({urgentItems.length})
                </button>
                <button
                  onClick={() =>
                    onAddToShoppingList(urgentItems.map((item) => item.label))
                  }
                  className="rounded-xl border border-[#efd5ab] bg-white px-4 py-2.5 text-xs font-semibold text-[#8d6840] transition hover:bg-[#fff8e9]"
                >
                  Pilne do zakupów
                </button>
              </>
            )}
            <button
              onClick={() => onUseIngredients(items.map((item) => item.label))}
              className="rounded-xl bg-[#2f684f] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#275b44]"
            >
              Dodaj wszystkie do generatora
            </button>
            <button
              onClick={onCookFromPantry}
              disabled={isGenerating}
              className="rounded-xl bg-[#d66a49] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#c35d3e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "AI gotuje..." : "Ugotuj ze spiżarni"}
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="mt-5 grid gap-3 rounded-2xl border border-[#dfe6df] bg-white p-3 sm:grid-cols-[1fr_0.65fr_0.8fr_auto] sm:p-4"
      >
        <label className="text-xs font-semibold text-[#59675f]">
          Produkt
          <input
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            disabled={editingId !== null}
            maxLength={80}
            placeholder="np. jogurt naturalny"
            className="mt-1.5 block h-11 w-full rounded-xl border border-[#dedfd9] px-3 text-sm font-normal outline-none focus:border-[#71927e] disabled:bg-[#f3f1eb]"
          />
        </label>
        <label className="text-xs font-semibold text-[#59675f]">
          Ilość
          <input
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            maxLength={60}
            placeholder="np. 500 g"
            className="mt-1.5 block h-11 w-full rounded-xl border border-[#dedfd9] px-3 text-sm font-normal outline-none focus:border-[#71927e]"
          />
        </label>
        <label className="text-xs font-semibold text-[#59675f]">
          Data ważności
          <input
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="mt-1.5 block h-11 w-full rounded-xl border border-[#dedfd9] px-3 text-sm font-normal outline-none focus:border-[#71927e]"
          />
        </label>
        <div className="mt-auto flex gap-2">
          {editingId && (
            <button
              type="button"
              onClick={cancelEditing}
              className="h-11 rounded-xl border border-[#d8d7d0] px-3 text-xs font-semibold text-[#68736b]"
            >
              Anuluj
            </button>
          )}
          <button className="h-11 flex-1 rounded-xl bg-[#356248] px-5 text-sm font-semibold text-white transition hover:bg-[#2b553d]">
            {editingId ? "Zapisz" : "Dodaj produkt"}
          </button>
        </div>
      </form>

      <p className="mt-2 text-[11px] text-[#8a948e]">
        {isSignedIn
          ? "Spiżarnia synchronizuje się z Twoim kontem."
          : "Zaloguj się, aby synchronizować spiżarnię między urządzeniami."}
      </p>

      {items.length > 0 && (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {[
              ["Wszystkie", items.length, "bg-white text-[#365a46]"],
              ["Pilne", urgentItems.length, "bg-[#fff8e9] text-[#8d6840]"],
              ["Po terminie", expiredItems.length, "bg-[#fff3ef] text-[#a45c45]"],
              ["Bez daty", noDateItems.length, "bg-[#eef2ec] text-[#59675f]"],
            ].map(([label, value, className]) => (
              <div
                key={label}
                className={`rounded-2xl p-3 ring-1 ring-[#e6e2d8] ${className}`}
              >
                <p className="text-[0.65rem] font-bold uppercase tracking-wider opacity-75">
                  {label}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-[#dfe6df] bg-white p-3 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-2 px-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8a948e]">
                Kategorie
              </p>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setActiveCategory(category.name)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      activeCategory === category.name
                        ? "bg-[#356248] text-white"
                        : "bg-[#f6f5ef] text-[#59675f] hover:bg-[#edf1ec]"
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
              <label className="text-xs font-semibold text-[#59675f]">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as typeof statusFilter)
                  }
                  className="mt-1.5 block h-10 w-full rounded-xl border border-[#dedfd9] bg-white px-3 text-sm font-normal outline-none focus:border-[#71927e]"
                >
                  <option value="all">Wszystkie</option>
                  <option value="urgent">Kończące się</option>
                  <option value="expired">Po terminie</option>
                  <option value="no-date">Bez daty</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[#59675f]">
                Sortowanie
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as typeof sortBy)
                  }
                  className="mt-1.5 block h-10 w-full rounded-xl border border-[#dedfd9] bg-white px-3 text-sm font-normal outline-none focus:border-[#71927e]"
                >
                  <option value="expiry">Najkrótsza data</option>
                  <option value="name">Alfabetycznie</option>
                  <option value="category">Kategoriami</option>
                </select>
              </label>
            </div>
          </div>
        </>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => {
            const days = item.expiresAt ? daysUntil(item.expiresAt) : null;
            const isUrgent = days !== null && days >= 0 && days <= 4;
            const isExpired = days !== null && days < 0;

            return (
              <div
                key={item.id}
                className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl border p-3 ${
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
                  title="Dodaj do generatora"
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
                          {expiryLabel(item.expiresAt)}
                        </span>
                      </>
                    )}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {(isExpired || isUrgent) && (
                    <button
                      onClick={() => onAddToShoppingList([item.label])}
                      className="rounded-lg px-2 py-2 text-[11px] font-semibold text-[#8d6840] transition hover:bg-[#fff4de]"
                    >
                      Na zakupy
                    </button>
                  )}
                  <button
                    onClick={() => startEditing(item)}
                    className="rounded-lg px-2 py-2 text-[11px] font-semibold text-[#59675f] transition hover:bg-[#edf1ec]"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => onConsume(item)}
                    aria-label={`Oznacz ${item.label} jako zużyte`}
                    title="Oznacz jako zużyte"
                    className="grid size-9 place-items-center rounded-full text-sm font-bold text-[#356248] transition hover:bg-[#dfeae1]"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onRemove(item)}
                    aria-label={`Usuń ${item.label} ze spiżarni`}
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
              ? "Spiżarnia jest pusta. Dodaj pierwszy produkt wraz z ilością i opcjonalną datą ważności."
              : "Brak produktów w tej kategorii."}
          </p>
        )}
      </div>
    </article>
  );
}
