import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CopyButton, CopyRecipeLink } from "@/components/copy-recipe-link";
import { auth } from "@/lib/auth";
import {
  formatPrice,
  getUiLanguage,
  languageCookieName,
  normalizeLanguage,
  type AppLanguage,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { Recipe } from "@/lib/recipe-types";
import { siteName, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type RecipePageProps = {
  params: Promise<{ id: string }>;
};

const getSavedRecipe = cache(async (id: string) =>
  prisma.favorite.findUnique({
    where: { id },
    select: {
      id: true,
      recipe: true,
      isPublic: true,
      userId: true,
      user: { select: { name: true } },
    },
  }),
);

function truncate(value: string, maxLength = 155) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trim()}…`
    : value;
}

const recipePageCopy = {
  pl: {
    sharedTitle: "Udostępniony przepis · SmartRecipe",
    sharedDescription: "Przepis przygotowany w aplikacji SmartRecipe.",
    ingredientsTitle: "Składniki",
    preparationTitle: "Przygotowanie",
    backSaved: "← Wróć do zapisanych",
    home: "Strona główna",
    photo: "Zdjęcie:",
    public: "Publiczny",
    private: "Prywatny",
    toBuy: "do dokupienia",
    details: "Szczegóły przepisu",
    sharedBy: "Udostępnia:",
    calories: "Kalorie",
    protein: "Białko",
    carbs: "Węglowodany",
    fat: "Tłuszcz",
    time: "Czas",
    prep: "przygotowanie",
    cost: "Koszt",
    approx: "ok.",
    noData: "brak danych",
    estimate: "szacunek",
    match: "Dopasowanie",
    toIngredients: "do składników",
    servings: "Porcje",
    baseAmount: "bazowa ilość",
    copyLink: "Kopiuj link",
    copiedLink: "✓ Link skopiowany",
    copyIngredients: "Kopiuj składniki",
    copyInstructions: "Kopiuj instrukcje",
    copied: "✓ Skopiowano",
    openApp: "Otwórz aplikację",
    nutrition: "Wartości odżywcze",
    perServing: "Szacunek na 1 porcję",
    macro: "makro",
    items: "pozycji",
    missing: "Do dokupienia",
    missingHint:
      "Same nazwy produktów — bez gramów i łyżek, żeby lista zakupów była praktyczna.",
    steps: "kroków",
    around: "około",
    copySteps: "Kopiuj kroki",
    substitutions: "Zamienniki",
  },
  en: {
    sharedTitle: "Shared recipe · SmartRecipe",
    sharedDescription: "Recipe prepared in the SmartRecipe app.",
    ingredientsTitle: "Ingredients",
    preparationTitle: "Preparation",
    backSaved: "← Back to saved",
    home: "Home",
    photo: "Photo:",
    public: "Public",
    private: "Private",
    toBuy: "to buy",
    details: "Recipe details",
    sharedBy: "Shared by:",
    calories: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    time: "Time",
    prep: "preparation",
    cost: "Cost",
    approx: "approx.",
    noData: "no data",
    estimate: "estimate",
    match: "Match",
    toIngredients: "to ingredients",
    servings: "Servings",
    baseAmount: "base amount",
    copyLink: "Copy link",
    copiedLink: "✓ Link copied",
    copyIngredients: "Copy ingredients",
    copyInstructions: "Copy instructions",
    copied: "✓ Copied",
    openApp: "Open app",
    nutrition: "Nutrition",
    perServing: "Estimate per 1 serving",
    macro: "macro",
    items: "items",
    missing: "To buy",
    missingHint:
      "Product names only — without grams or tablespoons, so the shopping list stays practical.",
    steps: "steps",
    around: "around",
    copySteps: "Copy steps",
    substitutions: "Substitutions",
  },
  uk: {
    sharedTitle: "Поширений рецепт · SmartRecipe",
    sharedDescription: "Рецепт підготовлений у застосунку SmartRecipe.",
    ingredientsTitle: "Інгредієнти",
    preparationTitle: "Приготування",
    backSaved: "← Назад до збережених",
    home: "Головна",
    photo: "Фото:",
    public: "Публічний",
    private: "Приватний",
    toBuy: "до купівлі",
    details: "Деталі рецепту",
    sharedBy: "Поділився:",
    calories: "Калорії",
    protein: "Білки",
    carbs: "Вуглеводи",
    fat: "Жири",
    time: "Час",
    prep: "приготування",
    cost: "Вартість",
    approx: "прибл.",
    noData: "немає даних",
    estimate: "оцінка",
    match: "Збіг",
    toIngredients: "до інгредієнтів",
    servings: "Порції",
    baseAmount: "базова кількість",
    copyLink: "Копіювати посилання",
    copiedLink: "✓ Посилання скопійовано",
    copyIngredients: "Копіювати інгредієнти",
    copyInstructions: "Копіювати інструкції",
    copied: "✓ Скопійовано",
    openApp: "Відкрити застосунок",
    nutrition: "Харчова цінність",
    perServing: "Оцінка на 1 порцію",
    macro: "макро",
    items: "позицій",
    missing: "До купівлі",
    missingHint:
      "Лише назви продуктів — без грамів і ложок, щоб список покупок був практичним.",
    steps: "кроків",
    around: "близько",
    copySteps: "Копіювати кроки",
    substitutions: "Замінники",
  },
} as const;

function recipeText(
  recipe: Recipe,
  section: "ingredients" | "steps",
  language: AppLanguage,
) {
  const copy = recipePageCopy[getUiLanguage(language)];

  if (section === "ingredients") {
    return [
      `${copy.ingredientsTitle} — ${recipe.title}`,
      "",
      ...recipe.ingredients.map((ingredient) => `- ${ingredient}`),
    ].join("\n");
  }

  return [
    `${copy.preparationTitle} — ${recipe.title}`,
    "",
    ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
  ].join("\n");
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const savedRecipe = await getSavedRecipe(id);

  if (!savedRecipe?.isPublic) {
    return {
      title: recipePageCopy.pl.sharedTitle,
      description: recipePageCopy.pl.sharedDescription,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const recipe = savedRecipe.recipe as Recipe;
  const description = truncate(recipe.description);

  return {
    title: `${recipe.title} · ${siteName}`,
    description,
    alternates: {
      canonical: `/recipes/${id}`,
    },
    openGraph: {
      title: recipe.title,
      description,
      type: "article",
      url: `${siteUrl}/recipes/${id}`,
      siteName,
      images: recipe.image
        ? [
            {
              url: recipe.image.url,
              alt: recipe.image.alt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: recipe.image ? "summary_large_image" : "summary",
      title: recipe.title,
      description,
      images: recipe.image ? [recipe.image.url] : undefined,
    },
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const [savedRecipe, session, cookieStore] = await Promise.all([
    getSavedRecipe(id),
    auth.api.getSession({ headers: await headers() }),
    cookies(),
  ]);
  const language = normalizeLanguage(cookieStore.get(languageCookieName)?.value);
  const copy = recipePageCopy[getUiLanguage(language)];

  if (
    !savedRecipe ||
    (!savedRecipe.isPublic && savedRecipe.userId !== session?.user.id)
  ) {
    notFound();
  }

  const recipe = savedRecipe.recipe as Recipe;
  const nutrition = [
    [copy.calories, `${recipe.calories} kcal`],
    [copy.protein, `${recipe.protein} g`],
    [copy.carbs, `${recipe.carbs} g`],
    [copy.fat, `${recipe.fat} g`],
  ];
  const summary = [
    [copy.time, `${recipe.time} min`, copy.prep],
    [
      copy.cost,
      recipe.estimatedCost
        ? `${copy.approx} ${formatPrice(
            language,
            recipe.estimatedCost,
            recipe.currency,
          )}`
        : copy.noData,
      copy.estimate,
    ],
    [copy.match, `${recipe.match}%`, copy.toIngredients],
    [copy.servings, "2", copy.baseAmount],
  ];
  const missingCount = recipe.missing.length;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: recipe.image?.url,
    author: {
      "@type": "Organization",
      name: "SmartRecipe",
    },
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      text: step,
    })),
    totalTime: `PT${recipe.time}M`,
    nutrition: {
      "@type": "NutritionInformation",
      calories: `${recipe.calories} calories`,
      proteinContent: `${recipe.protein} g`,
      carbohydrateContent: `${recipe.carbs} g`,
      fatContent: `${recipe.fat} g`,
    },
    ...(recipe.estimatedCost
      ? {
          offers: {
            "@type": "Offer",
            price: recipe.estimatedCost,
            priceCurrency: recipe.currency ?? "PLN",
          },
        }
      : {}),
  };

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 py-4 text-[#25322b] sm:px-8 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <Link
          href="/recipes"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white px-3 text-sm font-semibold text-[#365a46] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f4f7f3]"
        >
          {copy.backSaved}
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white px-3 text-sm font-semibold text-[#365a46] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f4f7f3]"
        >
          {copy.home}
        </Link>
      </div>
      <article className="mx-auto max-w-6xl overflow-hidden rounded-[1.6rem] border border-[#dedbd2] bg-[#fffdf8] shadow-xl sm:rounded-[2rem]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-64 bg-[#edf2ed] sm:min-h-96 lg:min-h-full">
            {recipe.image ? (
              <>
                <Image
                  src={recipe.image.url}
                  alt={recipe.image.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <a
                  href={recipe.image.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-4 left-4 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:underline sm:left-5"
                >
                  {copy.photo} {recipe.image.photographer} · Pexels
                </a>
              </>
            ) : (
              <div className="grid min-h-64 place-items-center text-8xl sm:min-h-96">
                {recipe.emoji}
              </div>
            )}
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#025026] backdrop-blur">
                {savedRecipe.isPublic ? copy.public : copy.private}
              </span>
              {missingCount > 0 && (
                <span className="rounded-full bg-[#fff0e8]/95 px-3 py-1.5 text-xs font-bold text-[#a45c45] backdrop-blur">
                  {missingCount} {copy.toBuy}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-7 lg:p-9">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e8efe9] px-3 py-1.5 text-xs font-bold text-[#025026]">
                SmartRecipe
              </span>
              <span className="rounded-full bg-[#fff0e8] px-3 py-1.5 text-xs font-bold text-[#a45c45]">
                {recipe.difficulty}
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#fc5726]">
              {copy.details}
            </p>
            <h1 className="break-anywhere mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {recipe.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-[#68736b]">
              {recipe.description}
            </p>
            <p className="mt-3 text-xs text-[#929a94]">
              {copy.sharedBy} {savedRecipe.user.name}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3">
              {summary.map(([label, value, hint]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#e7e2d8] bg-white p-3 sm:p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#929a94]">
                    {label}
                  </p>
                  <p className="mt-1 font-serif text-xl font-semibold sm:text-2xl">
                    {value}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-[#929a94]">{hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {savedRecipe.isPublic && (
                <CopyRecipeLink
                  idleLabel={copy.copyLink}
                  copiedLabel={copy.copiedLink}
                />
              )}
              <CopyButton
                text={recipeText(recipe, "ingredients", language)}
                idleLabel={copy.copyIngredients}
                copiedLabel={copy.copied}
                className="rounded-xl border border-[#ccd7cf] bg-white px-4 py-2.5 text-sm font-semibold text-[#025026] transition hover:-translate-y-0.5 hover:bg-[#f4f7f3]"
              />
              <CopyButton
                text={recipeText(recipe, "steps", language)}
                idleLabel={copy.copyInstructions}
                copiedLabel={copy.copied}
                className="rounded-xl border border-[#ccd7cf] bg-white px-4 py-2.5 text-sm font-semibold text-[#025026] transition hover:-translate-y-0.5 hover:bg-[#f4f7f3]"
              />
              <Link
                href="/"
                className="rounded-xl border border-[#ccd7cf] bg-white px-4 py-2.5 text-sm font-semibold text-[#025026] transition hover:-translate-y-0.5 hover:bg-[#f4f7f3]"
              >
                {copy.openApp}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-5 border-t border-[#e8e2d8] bg-[#fbf8f1] p-4 sm:p-7 lg:grid-cols-[0.95fr_1.35fr] lg:p-9">
          <aside className="space-y-5">
            <section className="rounded-[1.5rem] border border-[#e5e0d7] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-semibold">
                    {copy.nutrition}
                  </h2>
                  <p className="mt-1 text-xs text-[#7a857e]">
                    {copy.perServing}
                  </p>
                </div>
                <span className="rounded-full bg-[#eef6ef] px-3 py-1 text-xs font-bold text-[#025026]">
                  {copy.macro}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {nutrition.map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f5f7f2] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#929a94]">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#365a46]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[#e5e0d7] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-semibold">
                  {copy.ingredientsTitle}
                </h2>
                <span className="text-xs font-semibold text-[#7a857e]">
                  {recipe.ingredients.length} {copy.items}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#59675f]">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={ingredient}
                    className="flex gap-3 rounded-xl bg-[#fbfaf6] p-3"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e8efe9] text-[0.65rem] font-bold text-[#025026]">
                      {index + 1}
                    </span>
                    <span className="break-anywhere">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </section>

            {recipe.missing.length > 0 && (
              <section className="rounded-[1.5rem] border border-[#f0d8c7] bg-[#fff8f4] p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-serif text-2xl font-semibold">
                    {copy.missing}
                  </h2>
                  <span className="text-xs font-semibold text-[#a45c45]">
                    {missingCount}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#9b6a58]">
                  {copy.missingHint}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {recipe.missing.map((item) => (
                    <span
                      key={item}
                      className="break-anywhere rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#a45c45] ring-1 ring-[#f0d8c7]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </aside>

          <div className="space-y-5">
            <section className="rounded-[1.5rem] border border-[#e5e0d7] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-semibold">
                    {copy.preparationTitle}
                  </h2>
                  <p className="mt-1 text-xs text-[#7a857e]">
                    {recipe.steps.length} {copy.steps} · {copy.around}{" "}
                    {recipe.time} min
                  </p>
                </div>
                <CopyButton
                  text={recipeText(recipe, "steps", language)}
                  idleLabel={copy.copySteps}
                  copiedLabel={copy.copied}
                  className="rounded-xl bg-[#eef6ef] px-3 py-2 text-xs font-semibold text-[#025026] transition hover:bg-[#e3efe5]"
                />
              </div>
              <ol className="mt-5 space-y-3 text-sm leading-6 text-[#59675f]">
                {recipe.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-3 rounded-2xl border border-[#eeeae2] bg-[#fffdf8] p-4"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#dce9df] text-xs font-bold text-[#025026]">
                      {index + 1}
                    </span>
                    <span className="break-anywhere pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {recipe.substitutions && recipe.substitutions.length > 0 && (
              <section className="rounded-[1.5rem] border border-[#e5e0d7] bg-[#f8fbf7] p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-serif text-2xl font-semibold">
                    {copy.substitutions}
                  </h2>
                  <span className="text-xs font-semibold text-[#7a857e]">
                    {recipe.substitutions.length}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {recipe.substitutions.map((item) => (
                    <div
                      key={item.ingredient}
                      className="rounded-2xl bg-white p-4 ring-1 ring-[#e2eadf]"
                    >
                      <p className="break-anywhere text-sm font-bold text-[#365a46]">
                        {item.ingredient}
                      </p>
                      <p className="mt-2 break-anywhere text-sm leading-6 text-[#68736b]">
                        {item.substitutes.join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
