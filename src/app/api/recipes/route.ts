import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  consumeGenerationLimit,
  refundGenerationLimit,
} from "@/lib/generation-limit";
import { apiError } from "@/lib/api-language";
import { getPriceRegionLabel } from "@/lib/i18n";
import { attachRecipePhotos } from "@/lib/pexels";

const ingredientsRequestSchema = z.object({
  mode: z.literal("ingredients").optional(),
  ingredients: z.array(z.string().trim().min(1).max(60)).min(1).max(30),
  priorityIngredients: z
    .array(z.string().trim().min(1).max(60))
    .max(30)
    .optional(),
  diet: z.string().trim().min(1).max(60),
  maxTime: z.number().int().min(0).max(240),
  maxBudget: z.number().int().min(0).max(1000),
  currency: z.enum(["PLN", "EUR", "USD", "GBP"]).default("PLN"),
  priceRegion: z
    .enum(["PL", "US", "GB", "DE", "FR", "ES", "IT", "NL", "CA", "AU"])
    .default("PL"),
  language: z.enum(["pl", "en", "uk"]).default("pl"),
  calorieTarget: z.number().int().min(800).max(6000).nullable().optional(),
  proteinTarget: z.number().int().min(20).max(400).nullable().optional(),
  cookingGoal: z
    .enum(["balanced", "quick", "cheap", "healthy", "high_protein", "use_pantry"])
    .default("balanced"),
  excludedIngredients: z
    .array(z.string().trim().min(1).max(60))
    .max(30)
    .default([]),
});

const dishRequestSchema = z.object({
  mode: z.literal("dish"),
  dish: z.string().trim().min(2).max(120),
  diet: z.string().trim().min(1).max(60),
  maxTime: z.number().int().min(0).max(240),
  maxBudget: z.number().int().min(0).max(1000),
  currency: z.enum(["PLN", "EUR", "USD", "GBP"]).default("PLN"),
  priceRegion: z
    .enum(["PL", "US", "GB", "DE", "FR", "ES", "IT", "NL", "CA", "AU"])
    .default("PL"),
  language: z.enum(["pl", "en", "uk"]).default("pl"),
  calorieTarget: z.number().int().min(800).max(6000).nullable().optional(),
  proteinTarget: z.number().int().min(20).max(400).nullable().optional(),
  cookingGoal: z
    .enum(["balanced", "quick", "cheap", "healthy", "high_protein", "use_pantry"])
    .default("balanced"),
  excludedIngredients: z
    .array(z.string().trim().min(1).max(60))
    .max(30)
    .default([]),
});

const requestSchema = z.union([ingredientsRequestSchema, dishRequestSchema]);

const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  time: z.number().int(),
  difficulty: z.enum([
    "Bardzo łatwy",
    "Łatwy",
    "Średni",
    "Trudny",
    "Very easy",
    "Easy",
    "Medium",
    "Hard",
    "Дуже легко",
    "Легко",
    "Середньо",
    "Складно",
  ]),
  calories: z.number().int(),
  protein: z.number().int(),
  carbs: z.number().int(),
  fat: z.number().int(),
  estimatedCost: z.number().int().min(1),
  currency: z.enum(["PLN", "EUR", "USD", "GBP"]),
  match: z.number().int().min(0).max(100),
  ingredients: z.array(
    z
      .string()
      .describe(
        "Składnik wraz z dokładną ilością i jednostką, np. 250 g mąki albo 2 łyżki stołowe oliwy",
      ),
  ),
  missing: z
    .array(z.string())
    .describe(
      "Lista zakupowa: tylko czyste nazwy brakujących produktów bez ilości i jednostek, np. parmezan albo mieszanka warzyw",
    ),
  substitutions: z
    .array(
      z.object({
        ingredient: z.string(),
        substitutes: z.array(z.string()).min(1).max(3),
      }),
    )
    .max(6),
  steps: z.array(z.string()),
  emoji: z.string(),
  imageQuery: z.string(),
});

const ingredientsResponseSchema = z.object({
  recipes: z
    .array(recipeSchema)
    .length(3),
});

const dishResponseSchema = z.object({
  recipes: z.array(recipeSchema).length(3),
});

function localizeDifficulty(difficulty: string, language: "pl" | "en" | "uk") {
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

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return apiError(
      request,
      {
        pl: "Brakuje OPENAI_API_KEY w pliku .env.local.",
        en: "OPENAI_API_KEY is missing in .env.local.",
        uk: "У файлі .env.local бракує OPENAI_API_KEY.",
      },
      500,
    );
  }

  const body = await request.json().catch(() => null);
  const parsedRequest = requestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return apiError(
      request,
      {
        pl: "Podaj przynajmniej jeden poprawny składnik.",
        en: "Enter at least one valid ingredient.",
        uk: "Введи принаймні один правильний інгредієнт.",
      },
      400,
    );
  }

  const requestData = parsedRequest.data;
  const isDishMode = requestData.mode === "dish";
  const { diet, maxTime } = requestData;
  const language = requestData.language;
  const currency = requestData.currency;
  const priceRegion = getPriceRegionLabel(requestData.priceRegion);
  const isEnglish = language === "en";
  const isUkrainian = language === "uk";
  const targetLanguageName = isUkrainian
    ? "Ukrainian"
    : isEnglish
      ? "English"
      : "Polish";
  const apiCopy =
    language === "uk"
      ? {
          dailyLimit:
            "Сьогоднішній ліміт генерацій використано. Спробуй завтра.",
          emptyModel: "Модель не повернула готових рецептів. Спробуй ще раз.",
          invalidKey: "API ключ неправильний.",
          apiLimit: "Ліміт API досягнуто. Перевір ліміти або оплату.",
          apiUnavailable: "OpenAI API тимчасово недоступне. Спробуй ще раз.",
          fallback: "Не вдалося згенерувати рецепти.",
        }
      : language === "en"
      ? {
          dailyLimit:
            "Today's generation limit has been used. Try again tomorrow.",
          emptyModel: "The model did not return ready recipes. Try again.",
          invalidKey: "The API key is invalid.",
          apiLimit: "The API limit has been reached. Check limits or billing.",
          apiUnavailable: "OpenAI API is temporarily unavailable. Try again.",
          fallback: "Could not generate recipes.",
        }
      : {
          dailyLimit:
            "Dzisiejszy limit generowania został wykorzystany. Spróbuj ponownie jutro.",
          emptyModel:
            "Model nie zwrócił gotowych przepisów. Spróbuj ponownie.",
          invalidKey: "Klucz API jest nieprawidłowy.",
          apiLimit: "Limit API został osiągnięty. Sprawdź limity lub billing.",
          apiUnavailable: "OpenAI API chwilowo nie odpowiada. Spróbuj ponownie.",
          fallback: "Nie udało się wygenerować przepisów.",
        };
  const dietLabels: Record<string, string> = {
    "Bez ograniczeń": isUkrainian
      ? "Без обмежень"
      : isEnglish
        ? "No restrictions"
        : "Bez ograniczeń",
    Wegetariańska: isUkrainian
      ? "Вегетаріанська"
      : isEnglish
        ? "Vegetarian"
        : "Wegetariańska",
    Wegańska: isUkrainian ? "Веганська" : isEnglish ? "Vegan" : "Wegańska",
    Pescetariańska:
      isUkrainian ? "Пескетаріанська" : isEnglish ? "Pescetarian" : "Pescetariańska",
    Bezglutenowa:
      isUkrainian ? "Без глютену" : isEnglish ? "Gluten-free" : "Bezglutenowa",
    "Bez laktozy":
      isUkrainian ? "Без лактози" : isEnglish ? "Lactose-free" : "Bez laktozy",
    Ketogeniczna: isUkrainian ? "Кетогенна" : isEnglish ? "Keto" : "Ketogeniczna",
    Niskowęglowodanowa:
      isUkrainian ? "Низьковуглеводна" : isEnglish ? "Low-carb" : "Niskowęglowodanowa",
    Śródziemnomorska:
      isUkrainian ? "Середземноморська" : isEnglish ? "Mediterranean" : "Śródziemnomorska",
    Wysokobiałkowa:
      isUkrainian ? "Високобілкова" : isEnglish ? "High-protein" : "Wysokobiałkowa",
  };
  const localizedDiet = dietLabels[diet] ?? diet;
  const budgetRequirement =
    requestData.maxBudget === 0
      ? isUkrainian
        ? "Без обмеження бюджету"
        : isEnglish
        ? "No budget limit"
        : "Bez ograniczeń budżetowych"
      : isUkrainian
        ? `Максимум ${requestData.maxBudget} ${currency} на 2 порції`
        : isEnglish
        ? `Maximum ${requestData.maxBudget} ${currency} for 2 servings`
        : `Maksymalnie ${requestData.maxBudget} ${currency} za 2 porcje`;
  const goalLabels: Record<typeof requestData.cookingGoal, string> = {
    balanced: isUkrainian
      ? "збалансована страва"
      : isEnglish
        ? "a balanced meal"
        : "zbalansowany posiłek",
    quick: isUkrainian
      ? "найшвидше можливе приготування"
      : isEnglish
      ? "the fastest possible preparation"
      : "jak najszybsze przygotowanie",
    cheap: isUkrainian
      ? "найнижча можлива вартість"
      : isEnglish
        ? "the lowest possible cost"
        : "jak najniższy koszt",
    healthy: isUkrainian
      ? "здоровіший і легший склад"
      : isEnglish
      ? "a healthier, lighter composition"
      : "zdrowszy, lekki skład",
    high_protein: isUkrainian
      ? "високий вміст білка"
      : isEnglish
      ? "high protein content"
      : "wysoka zawartość białka",
    use_pantry: isUkrainian
      ? "максимальне використання продуктів користувача"
      : isEnglish
      ? "maximum use of the user's products"
      : "maksymalne wykorzystanie produktów użytkownika",
  };
  const cookingGoalRequirement = isUkrainian
    ? `Пріоритет користувача: ${goalLabels[requestData.cookingGoal]}.`
    : isEnglish
    ? `User priority: ${goalLabels[requestData.cookingGoal]}.`
    : `Priorytet użytkownika: ${goalLabels[requestData.cookingGoal]}.`;
  const excludedRequirement =
    requestData.excludedIngredients.length > 0
      ? isUkrainian
        ? `Виключені продукти, алергії або нелюбимі інгредієнти: ${requestData.excludedIngredients.join(", ")}. Не використовуй їх в ingredients, missing, steps або substitutions.`
        : isEnglish
        ? `Excluded products, allergies or disliked ingredients: ${requestData.excludedIngredients.join(", ")}. Do not use them in ingredients, missing, steps or substitutions.`
        : `Produkty wykluczone, alergie lub nielubiane składniki: ${requestData.excludedIngredients.join(", ")}. Nie używaj ich w składnikach, missing, krokach ani zamiennikach.`
      : isUkrainian
        ? "Немає додаткових виключень або нелюбимих інгредієнтів."
        : isEnglish
        ? "No additional exclusions or disliked ingredients."
        : "Brak dodatkowych wykluczeń i nielubianych składników.";
  const nutritionGoals = isUkrainian
    ? `Денні цілі користувача: ${
        requestData.calorieTarget
          ? `${requestData.calorieTarget} ккал`
          : "немає цілі калорій"
      }, ${
        requestData.proteinTarget
          ? `${requestData.proteinTarget} г білка`
          : "немає цілі білка"
      }.`
    : isEnglish
    ? `User daily goals: ${
        requestData.calorieTarget
          ? `${requestData.calorieTarget} kcal`
          : "no calorie target"
      }, ${
        requestData.proteinTarget
          ? `${requestData.proteinTarget} g protein`
          : "no protein target"
      }.`
    : `Dzienne cele użytkownika: ${
        requestData.calorieTarget
          ? `${requestData.calorieTarget} kcal`
          : "brak celu kalorii"
      }, ${
        requestData.proteinTarget
          ? `${requestData.proteinTarget} g białka`
          : "brak celu białka"
      }.`;
  const timeRequirement =
    maxTime === 0
      ? isUkrainian
        ? "Без обмеження часу"
        : isEnglish
        ? "No time limit"
        : "Bez ograniczeń czasowych"
      : isUkrainian
        ? `Максимум ${maxTime} хвилин`
        : isEnglish
        ? `Maximum ${maxTime} minutes`
        : `Maksymalnie ${maxTime} minut`;
  const priceRegionRequirement = isUkrainian
    ? `Оцінюй ціни інгредієнтів для регіону: ${priceRegion}. Використовуй типові роздрібні ціни на продукти для цього регіону.`
    : isEnglish
    ? `Estimate ingredient prices for ${priceRegion}. Use typical consumer grocery prices for this region.`
    : `Szacuj ceny składników dla regionu: ${priceRegion}. Używaj typowych konsumenckich cen spożywczych dla tego regionu.`;
  let responseSchema;
  let requestPrompt;

  if (requestData.mode === "dish") {
    responseSchema = dishResponseSchema;
    requestPrompt = isUkrainian
      ? `Підготуй рівно 3 різні рецепти або варіанти страви, яку описав користувач: ${requestData.dish}.

Дієта: ${localizedDiet}
Час приготування: ${timeRequirement}
Бюджет: ${budgetRequirement}
Регіон цін: ${priceRegion}
${priceRegionRequirement}
${cookingGoalRequirement}
${excludedRequirement}
${nutritionGoals}

Кожен варіант має чітко відрізнятися інгредієнтами, смаком або способом приготування, але все одно відповідати запитаній страві. Усі пропозиції мають відповідати дієті та вимогам часу. Для кожного рецепта подай повний список інгредієнтів з кількостями на 2 порції та 4–8 конкретних кроків. Поле missing має містити тільки чисті назви продуктів для купівлі без кількостей і одиниць, а поле match встанови на 0.`
      : isEnglish
        ? `Prepare exactly 3 different recipes or variants of the dish described by the user: ${requestData.dish}.

Diet: ${localizedDiet}
Preparation time: ${timeRequirement}
Budget: ${budgetRequirement}
Price region: ${priceRegion}
${priceRegionRequirement}
${cookingGoalRequirement}
${excludedRequirement}
${nutritionGoals}

Each variant must clearly differ in ingredients, flavor or preparation method while still matching the requested dish. Fit all suggestions to the diet and time requirements. For each recipe provide a complete ingredient list with amounts for 2 servings and 4–8 specific steps. The missing field must contain only clean product names to buy, without amounts or units, and match must be 0.`
        : `Przygotuj dokładnie 3 różne przepisy lub warianty dania opisanego przez użytkownika: ${requestData.dish}.

Dieta: ${localizedDiet}
Czas przygotowania: ${timeRequirement}
Budżet: ${budgetRequirement}
Region cen: ${priceRegion}
${priceRegionRequirement}
${cookingGoalRequirement}
${excludedRequirement}
${nutritionGoals}

Każdy wariant ma wyraźnie różnić się składnikami, smakiem albo sposobem przygotowania, ale nadal odpowiadać podanemu daniu. Dopasuj wszystkie propozycje do diety i wymagań czasowych. Dla każdego przepisu podaj kompletną listę składników z ilościami dla 2 porcji oraz 4–8 konkretnych kroków. Pole missing ma zawierać tylko czyste nazwy produktów do kupienia bez ilości i jednostek, a pole match ustaw na 0.`;
  } else {
    responseSchema = ingredientsResponseSchema;
    requestPrompt = isUkrainian
      ? `Згенеруй рівно 3 різні рецепти.

Доступні інгредієнти: ${requestData.ingredients.join(", ")}
Продукти з коротким терміном придатності, які треба використати першими: ${
          requestData.priorityIngredients?.join(", ") || "немає"
        }
Дієта: ${localizedDiet}
Час приготування: ${timeRequirement}
Бюджет: ${budgetRequirement}
Регіон цін: ${priceRegion}
${priceRegionRequirement}
${cookingGoalRequirement}
${excludedRequirement}
${nutritionGoals}

Кожен рецепт має відповідати вимогам часу, дотримуватися дієти, використовувати якомога більше доступних інгредієнтів і потребувати максимум 4 відсутні продукти. Якщо подано продукти з коротким терміном придатності, використай їх у якомога більшій кількості пропозицій. Подай повний список інгредієнтів з кількостями на 2 порції, 3–7 конкретних кроків і один відповідний emoji. Поле match — це відсоток інгредієнтів рецепта, які користувач уже має.`
      : isEnglish
        ? `Generate exactly 3 different recipes.

Available ingredients: ${requestData.ingredients.join(", ")}
Products close to expiry that should be used first: ${
          requestData.priorityIngredients?.join(", ") || "none"
        }
Diet: ${localizedDiet}
Preparation time: ${timeRequirement}
Budget: ${budgetRequirement}
Price region: ${priceRegion}
${priceRegionRequirement}
${cookingGoalRequirement}
${excludedRequirement}
${nutritionGoals}

Each recipe must meet the time requirement, follow the diet, use as many available ingredients as possible and require at most 4 missing products. If close-to-expiry products were provided, use them in as many suggestions as possible. Provide a complete ingredient list with amounts for 2 servings, 3–7 specific steps and one matching emoji. The match field is the percentage of recipe ingredients the user already has.`
        : `Wygeneruj dokładnie 3 różne przepisy.

Dostępne składniki: ${requestData.ingredients.join(", ")}
Produkty z krótką datą ważności, które należy wykorzystać w pierwszej kolejności: ${
          requestData.priorityIngredients?.join(", ") || "brak"
        }
Dieta: ${localizedDiet}
Czas przygotowania: ${timeRequirement}
Budżet: ${budgetRequirement}
Region cen: ${priceRegion}
${priceRegionRequirement}
${cookingGoalRequirement}
${excludedRequirement}
${nutritionGoals}

Każdy przepis musi spełniać podane wymagania czasowe, być zgodny z dietą, wykorzystywać możliwie dużo dostępnych składników i wymagać najwyżej 4 brakujących produktów. Jeśli podano produkty z krótką datą ważności, wykorzystaj je w możliwie wielu propozycjach. Podaj kompletną listę składników z ilościami dla 2 porcji, 3–7 konkretnych kroków oraz jedno pasujące emoji. Pole match to procent składników przepisu, które użytkownik już posiada.`;
  }
  const systemPrompt = isUkrainian
    ? "Ти досвідчений кухар і дієтолог. Створюй безпечні, реалістичні рецепти українською мовою. Оцінки харчової цінності стосуються однієї порції. Не стверджуй, що страва безпечна для людей з алергіями. Базові продукти комори, як вода, сіль, перець і невелика кількість олії, можуть бути в інгредієнтах рецепта, але не додавай їх до списку відсутніх покупок."
    : isEnglish
    ? `You are an experienced chef and dietitian. Create safe, realistic recipes in ${targetLanguageName}. Nutrition estimates are for one serving. Do not claim that a dish is safe for people with allergies. Basic pantry products such as water, salt, pepper and a small amount of oil can be included in recipe ingredients, but do not add them to the missing shopping list.`
    : "Jesteś doświadczonym kucharzem i dietetykiem. Tworzysz bezpieczne, realne przepisy po polsku. Szacunki wartości odżywczych dotyczą jednej porcji. Nie deklaruj, że danie jest bezpieczne dla alergika. Podstawowe produkty spiżarniane, takie jak woda, sól, pieprz i niewielka ilość oleju, mogą być w składnikach przepisu, ale nie dodawaj ich do listy brakujących zakupów.";
  const generationRules = isUkrainian
    ? `Відповідай українською мовою в усіх полях: title, description, difficulty, ingredients, missing, substitutions та steps. Єдиний виняток — imageQuery, він завжди має бути англійською фразою для пошуку в Pexels.

Поле difficulty має бути рівно одним із цих українських значень: "Дуже легко", "Легко", "Середньо", "Складно". Не використовуй польські або англійські назви складності.

Поле imageQuery має містити англійську фразу для пошуку відповідного фото їжі в Pexels. Використай 6–10 конкретних слів, які описують назву страви, видимі ключові інгредієнти, подачу та за бажанням ракурс або стиль. Не використовуй слова photo, image або photography. Не додавай пунктуацію.

Кожен елемент масиву ingredients ОБОВʼЯЗКОВО має містити точну кількість і одиницю на 2 порції. Використовуй практичні українські одиниці: г, кг, мл, л, шт., чайна ложка або столова ложка. “Чайна ложка” означає маленьку ложку для чаю, а “столова ложка” — велику ложку. Завжди пиши конкретно “чайна ложка” або “столова ложка”, ніколи не пиши нечітке “ложки”. Це стосується також олії, спецій, солі та води — не використовуй “за смаком”, “трохи”, “за потреби” або назви продуктів без кількостей. Правильні приклади: “250 г пшеничного борошна”, “2 шт. яєць”, “1 столова ложка оливкової олії”, “0,5 чайної ложки солі”.

Поле missing — це ТІЛЬКИ список покупок. Кожен елемент missing має бути короткою назвою продукту українською мовою без кількостей, грамів, мл, штук, столових або чайних ложок. Правильно: “пармезан”, “суміш овочів”, “соєвий соус”. Неправильно: “50 г пармезану”, “150 г суміші овочів”, “2 столові ложки соєвого соусу”. Не додавай до missing воду, сіль, перець або дрібну кількість базової олії. Якщо потрібен бульйон, не вважай його одним відсутнім інгредієнтом: в ingredients подай продукти для простого бульйону або використай воду і спеції, а в missing додай тільки магазинні продукти, потрібні для його приготування.

У кроках приготування вказуй кількість і одиницю під час першого використання кожного інгредієнта, наприклад: “Додай 250 г борошна і 300 мл молока”. Не пропускай пропорції в інструкціях.

estimatedCost — це реалістична загальна орієнтовна вартість інгредієнтів для 2 порцій у цілих одиницях валюти ${currency}, на основі типових цін у регіоні ${priceRegion}. Поле currency встанови рівно як "${currency}". Дотримуйся бюджету, якщо його задано. Харчові цілі — це орієнтир для однієї страви, не для всього дня.

substitutions має містити 2–5 практичних замін для інгредієнтів, які користувач може захотіти замінити або які часто є проблемними. Кожен елемент має вказувати оригінальний інгредієнт рецепта та 1–3 заміни з короткою кількістю, наприклад “150 г грецького йогурту” замість “150 г сметани”. Заміни мають відповідати вибраній дієті й не порушувати обмеження користувача.

Приклади imageQuery:
- chicken rice egg bowl top view asian style plated food
- creamy chicken spinach risotto
- chicken rice omelette golden brown on pan close up`
    : isEnglish
    ? `Respond in English. The only exception is imageQuery, which must always be an English Pexels search phrase.

The difficulty field must be exactly one of these English values: "Very easy", "Easy", "Medium", "Hard". Do not use Polish or Ukrainian difficulty labels.

The imageQuery field must contain an English phrase for finding a matching food photo in Pexels. Use 6–10 specific words describing the dish name, visible key ingredients, serving style and optionally angle or style. Do not use the words photo, image or photography. Do not add punctuation.

Every item in ingredients MUST include an exact amount and unit for 2 servings. Use practical units: g, kg, ml, l, pcs, teaspoon or tablespoon. “Teaspoon” means a small tea spoon and “tablespoon” means a large spoon. Always write specifically “teaspoon” or “tablespoon”, never vague “spoons”. This also applies to oil, spices, salt and water — do not use “to taste”, “a little”, “as needed” or product names without amounts. Correct examples: “250 g all-purpose flour”, “2 pcs eggs”, “1 tablespoon olive oil”, “0.5 teaspoon salt”.

The missing field is ONLY a shopping list. Each missing item must be a short product name without amounts, grams, ml, pieces, tablespoons or teaspoons. Correct: “parmesan”, “mixed vegetables”, “soy sauce”. Incorrect: “50 g parmesan”, “150 g mixed vegetables”, “2 tablespoons soy sauce”. Do not add water, salt, pepper or tiny amounts of basic oil to missing. If stock/broth is needed, do not treat it as one missing ingredient: in ingredients list the products for a simple stock or use water and spices, and in missing add only shop products needed to prepare it.

In preparation steps, include the amount and unit the first time each ingredient is used, e.g. “Add 250 g flour and 300 ml milk”. Do not omit proportions in instructions.

estimatedCost is a realistic total estimated ingredient cost for 2 servings in whole ${currency}, based on typical grocery prices in ${priceRegion}. Set currency exactly to "${currency}". Respect the budget if provided. Nutrition goals are a hint for one meal, not whole-day values.

substitutions must contain 2–5 practical swaps for ingredients users may want to replace or that are often problematic. Each item must mention the original recipe ingredient and 1–3 substitutes with short quantities, e.g. “150 g Greek yogurt” instead of “150 g sour cream”. Substitutes must fit the chosen diet and cannot break user restrictions.

Example imageQuery values:
- chicken rice egg bowl top view asian style plated food
- creamy chicken spinach risotto
- chicken rice omelette golden brown on pan close up`
    : `Odpowiadaj po polsku we wszystkich polach poza imageQuery.

Pole difficulty ma mieć dokładnie jedną z polskich wartości: "Bardzo łatwy", "Łatwy", "Średni", "Trudny". Nie używaj angielskich ani ukraińskich nazw trudności.

Pole imageQuery ma zawierać angielską frazę do wyszukania pasującego zdjęcia w Pexels. Użyj 6–10 konkretnych słów opisujących nazwę dania, najważniejsze widoczne składniki, sposób podania oraz opcjonalnie ujęcie lub styl. Nie używaj słów photo, image ani photography. Nie tłumacz frazy i nie dodawaj znaków interpunkcyjnych.

Każdy element tablicy ingredients MUSI zawierać dokładną ilość oraz jednostkę dla 2 porcji. Używaj jednostek praktycznych w polskiej kuchni: g, kg, ml, l, szt., łyżeczka albo łyżka stołowa. „Łyżeczka” oznacza małą łyżeczkę do herbaty, a „łyżka stołowa” oznacza dużą łyżkę. Zawsze pisz konkretnie „łyżeczka” albo „łyżka stołowa”, nigdy samo niejasne „łyżki”. Dotyczy to również oleju, przypraw, soli i wody — nie używaj określeń „do smaku”, „trochę”, „według uznania” ani samych nazw produktów. Przykłady poprawnego formatu: „250 g mąki pszennej”, „2 szt. jajek”, „1 łyżka stołowa oliwy”, „0,5 łyżeczki soli”.

Pole missing służy WYŁĄCZNIE jako lista zakupów. Każdy element missing musi być krótką nazwą produktu bez ilości, gramów, ml, sztuk, łyżek i łyżeczek. Poprawnie: „parmezan”, „mieszanka warzyw”, „sos sojowy”. Niepoprawnie: „50 g parmezanu”, „150 g mieszanki warzyw”, „2 łyżki sosu sojowego”. Nie dodawaj do missing wody, soli, pieprzu ani drobnych ilości podstawowego oleju. Jeśli potrzebny jest bulion, nie traktuj go jako pojedynczego brakującego składnika: w ingredients podaj składniki do przygotowania prostego bulionu lub użyj wody i przypraw, a w missing podaj tylko produkty sklepowe potrzebne do jego przygotowania.

W krokach przygotowania podawaj ilość i jednostkę przy pierwszym użyciu każdego składnika, np. „Dodaj 250 g mąki i 300 ml mleka”. Nie pomijaj proporcji w instrukcjach.

Pole estimatedCost to realistyczny, całkowity szacowany koszt składników dla 2 porcji w pełnych jednostkach waluty ${currency}, oparty o typowe ceny spożywcze w regionie ${priceRegion}. Pole currency ustaw dokładnie na "${currency}". Przestrzegaj budżetu, jeśli został podany. Cele żywieniowe traktuj jako wskazówkę dla jednego posiłku, nie jako wartości całego dnia.

Pole substitutions ma zawierać 2–5 praktycznych zamienników dla składników, które użytkownik może chcieć podmienić lub które często są problematyczne. Każdy element ma wskazywać oryginalny składnik z przepisu oraz 1–3 zamienniki z krótką ilością, np. „150 g jogurtu greckiego” zamiast „150 g śmietany”. Zamienniki muszą pasować do wybranej diety i nie mogą łamać ograniczeń użytkownika.

Przykładowy format imageQuery:
- chicken rice egg bowl top view asian style plated food
- creamy chicken spinach risotto
- chicken rice omelette golden brown on pan close up`;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const usage = await consumeGenerationLimit();

  if (!usage.allowed) {
    await refundGenerationLimit(usage.identifier);
    return Response.json(
      {
        error:
          apiCopy.dailyLimit,
        usage: {
          limit: usage.limit,
          remaining: usage.remaining,
          resetAt: usage.resetAt,
          unlimited: usage.unlimited,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(
              1,
              Math.ceil(
                (new Date(usage.resetAt).getTime() - Date.now()) / 1000,
              ),
            ),
          ),
          "X-RateLimit-Limit": String(usage.limit),
          "X-RateLimit-Remaining": String(usage.remaining),
          "X-RateLimit-Reset": usage.resetAt,
        },
      },
    );
  }

  try {
    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `${requestPrompt}

${generationRules}`,
        },
      ],
      text: {
        format: zodTextFormat(
          responseSchema,
          isDishMode ? "requested_dish" : "recipe_suggestions",
        ),
      },
    });

    if (!response.output_parsed) {
      await refundGenerationLimit(usage.identifier);
      return Response.json(
        { error: apiCopy.emptyModel },
        { status: 502 },
      );
    }

    const recipesWithPhotos = await attachRecipePhotos(
      response.output_parsed.recipes,
    );

    return Response.json({
      recipes: recipesWithPhotos.map((recipe) => ({
        ...recipe,
        difficulty: localizeDifficulty(recipe.difficulty, language),
        priceRegion: requestData.priceRegion,
      })),
      usage: {
        limit: usage.limit,
        remaining: usage.remaining,
        resetAt: usage.resetAt,
        unlimited: usage.unlimited,
      },
    });
  } catch (error) {
    await refundGenerationLimit(usage.identifier).catch((refundError) => {
      console.error("Generation limit refund failed", refundError);
    });
    console.error("Recipe generation failed", error);

    if (error instanceof OpenAI.APIError) {
      const message =
        error.status === 401
          ? apiCopy.invalidKey
          : error.status === 429
            ? apiCopy.apiLimit
            : apiCopy.apiUnavailable;

      return Response.json({ error: message }, { status: error.status ?? 500 });
    }

    return Response.json(
      { error: apiCopy.fallback },
      { status: 500 },
    );
  }
}
