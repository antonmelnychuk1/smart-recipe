import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  consumeGenerationLimit,
  refundGenerationLimit,
} from "@/lib/generation-limit";
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
  calorieTarget: z.number().int().min(800).max(6000).nullable().optional(),
  proteinTarget: z.number().int().min(20).max(400).nullable().optional(),
});

const dishRequestSchema = z.object({
  mode: z.literal("dish"),
  dish: z.string().trim().min(2).max(120),
  diet: z.string().trim().min(1).max(60),
  maxTime: z.number().int().min(0).max(240),
  maxBudget: z.number().int().min(0).max(1000),
  calorieTarget: z.number().int().min(800).max(6000).nullable().optional(),
  proteinTarget: z.number().int().min(20).max(400).nullable().optional(),
});

const requestSchema = z.union([ingredientsRequestSchema, dishRequestSchema]);

const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  time: z.number().int(),
  difficulty: z.enum(["Bardzo łatwy", "Łatwy", "Średni", "Trudny"]),
  calories: z.number().int(),
  protein: z.number().int(),
  carbs: z.number().int(),
  fat: z.number().int(),
  estimatedCost: z.number().int().min(1),
  match: z.number().int().min(0).max(100),
  ingredients: z.array(
    z
      .string()
      .describe(
        "Składnik wraz z dokładną ilością i jednostką, np. 250 g mąki albo 2 łyżki oliwy",
      ),
  ),
  missing: z.array(z.string()),
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

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Brakuje OPENAI_API_KEY w pliku .env.local." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedRequest = requestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return Response.json(
      { error: "Podaj przynajmniej jeden poprawny składnik." },
      { status: 400 },
    );
  }

  const requestData = parsedRequest.data;
  const isDishMode = requestData.mode === "dish";
  const { diet, maxTime } = requestData;
  const budgetRequirement =
    requestData.maxBudget === 0
      ? "Bez ograniczeń budżetowych"
      : `Maksymalnie ${requestData.maxBudget} zł za 2 porcje`;
  const nutritionGoals = `Dzienne cele użytkownika: ${
    requestData.calorieTarget ? `${requestData.calorieTarget} kcal` : "brak celu kalorii"
  }, ${requestData.proteinTarget ? `${requestData.proteinTarget} g białka` : "brak celu białka"}.`;
  const timeRequirement =
    maxTime === 0
      ? "Bez ograniczeń czasowych"
      : `Maksymalnie ${maxTime} minut`;
  let responseSchema;
  let requestPrompt;

  if (requestData.mode === "dish") {
    responseSchema = dishResponseSchema;
    requestPrompt = `Przygotuj dokładnie 3 różne przepisy lub warianty dania opisanego przez użytkownika: ${requestData.dish}.

Dieta: ${diet}
Czas przygotowania: ${timeRequirement}
Budżet: ${budgetRequirement}
${nutritionGoals}

Każdy wariant ma wyraźnie różnić się składnikami, smakiem albo sposobem przygotowania, ale nadal odpowiadać podanemu daniu. Dopasuj wszystkie propozycje do diety i wymagań czasowych. Dla każdego przepisu podaj kompletną listę składników z ilościami dla 2 porcji oraz 4–8 konkretnych kroków. Pole missing ma zawierać tę samą kompletną listę produktów potrzebnych do zakupów, a pole match ustaw na 0.`;
  } else {
    responseSchema = ingredientsResponseSchema;
    requestPrompt = `Wygeneruj dokładnie 3 różne przepisy.

Dostępne składniki: ${requestData.ingredients.join(", ")}
Produkty z krótką datą ważności, które należy wykorzystać w pierwszej kolejności: ${
      requestData.priorityIngredients?.join(", ") || "brak"
    }
Dieta: ${diet}
Czas przygotowania: ${timeRequirement}
Budżet: ${budgetRequirement}
${nutritionGoals}

Każdy przepis musi spełniać podane wymagania czasowe, być zgodny z dietą, wykorzystywać możliwie dużo dostępnych składników i wymagać najwyżej 4 brakujących produktów. Jeśli podano produkty z krótką datą ważności, wykorzystaj je w możliwie wielu propozycjach. Podaj kompletną listę składników z ilościami dla 2 porcji, 3–7 konkretnych kroków oraz jedno pasujące emoji. Pole match to procent składników przepisu, które użytkownik już posiada.`;
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const usage = await consumeGenerationLimit();

  if (!usage.allowed) {
    await refundGenerationLimit(usage.identifier);
    return Response.json(
      {
        error:
          "Dzisiejszy limit generowania został wykorzystany. Spróbuj ponownie jutro.",
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
          content:
            "Jesteś doświadczonym kucharzem i dietetykiem. Tworzysz bezpieczne, realne przepisy po polsku. Szacunki wartości odżywczych dotyczą jednej porcji. Nie deklaruj, że danie jest bezpieczne dla alergika. Podstawowe produkty spiżarniane, których użytkownik nie podał, umieszczaj w brakujących składnikach.",
        },
        {
          role: "user",
          content: `${requestPrompt}

Pole imageQuery ma zawierać angielską frazę do wyszukania pasującego zdjęcia w Pexels. Użyj 6–10 konkretnych słów opisujących nazwę dania, najważniejsze widoczne składniki, sposób podania oraz opcjonalnie ujęcie lub styl. Nie używaj słów photo, image ani photography. Nie tłumacz frazy i nie dodawaj znaków interpunkcyjnych.

Każdy element tablicy ingredients MUSI zawierać dokładną ilość oraz jednostkę dla 2 porcji. Używaj jednostek praktycznych w polskiej kuchni: g, kg, ml, l, szt., łyżeczka lub łyżka. Dotyczy to również oleju, przypraw, soli i wody — nie używaj określeń „do smaku”, „trochę”, „według uznania” ani samych nazw produktów. Przykłady poprawnego formatu: „250 g mąki pszennej”, „2 szt. jajek”, „1 łyżka oliwy”, „0,5 łyżeczki soli”.

W krokach przygotowania podawaj ilość i jednostkę przy pierwszym użyciu każdego składnika, np. „Dodaj 250 g mąki i 300 ml mleka”. Nie pomijaj proporcji w instrukcjach.

Pole estimatedCost to realistyczny, całkowity szacowany koszt składników dla 2 porcji w pełnych złotych. Przestrzegaj budżetu, jeśli został podany. Cele żywieniowe traktuj jako wskazówkę dla jednego posiłku, nie jako wartości całego dnia.

Pole substitutions ma zawierać 2–5 praktycznych zamienników dla składników, które użytkownik może chcieć podmienić lub które często są problematyczne. Każdy element ma wskazywać oryginalny składnik z przepisu oraz 1–3 zamienniki z krótką ilością, np. „150 g jogurtu greckiego” zamiast „150 g śmietany”. Zamienniki muszą pasować do wybranej diety i nie mogą łamać ograniczeń użytkownika.

Przykładowy format imageQuery:
- chicken rice egg bowl top view asian style plated food
- creamy chicken spinach risotto
- chicken rice omelette golden brown on pan close up`,
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
        { error: "Model nie zwrócił gotowych przepisów. Spróbuj ponownie." },
        { status: 502 },
      );
    }

    const recipesWithPhotos = await attachRecipePhotos(
      response.output_parsed.recipes,
    );

    return Response.json({
      recipes: recipesWithPhotos,
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
          ? "Klucz API jest nieprawidłowy."
          : error.status === 429
            ? "Limit API został osiągnięty. Sprawdź limity lub billing."
            : "OpenAI API chwilowo nie odpowiada. Spróbuj ponownie.";

      return Response.json({ error: message }, { status: error.status ?? 500 });
    }

    return Response.json(
      { error: "Nie udało się wygenerować przepisów." },
      { status: 500 },
    );
  }
}
