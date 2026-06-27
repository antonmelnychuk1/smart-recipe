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
  diet: z.string().trim().min(1).max(60),
  maxTime: z.number().int().min(5).max(240),
});

const dishRequestSchema = z.object({
  mode: z.literal("dish"),
  dish: z.string().trim().min(2).max(120),
  diet: z.string().trim().min(1).max(60),
  maxTime: z.number().int().min(5).max(240),
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
  match: z.number().int().min(0).max(100),
  ingredients: z.array(z.string()),
  missing: z.array(z.string()),
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
  recipes: z.array(recipeSchema).length(1),
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
  let responseSchema;
  let requestPrompt;

  if (requestData.mode === "dish") {
    responseSchema = dishResponseSchema;
    requestPrompt = `Przygotuj dokładnie jeden kompletny przepis na danie opisane przez użytkownika: ${requestData.dish}.

Dieta: ${diet}
Maksymalny czas przygotowania: ${maxTime} minut

Zachowaj charakter wskazanego dania, ale dopasuj je do diety i limitu czasu. Podaj kompletną listę składników z ilościami dla 2 porcji oraz 4–8 konkretnych kroków. Pole missing ma zawierać tę samą kompletną listę produktów potrzebnych do zakupów, a pole match ustaw na 0.`;
  } else {
    responseSchema = ingredientsResponseSchema;
    requestPrompt = `Wygeneruj dokładnie 3 różne przepisy.

Dostępne składniki: ${requestData.ingredients.join(", ")}
Dieta: ${diet}
Maksymalny czas przygotowania: ${maxTime} minut

Każdy przepis musi mieścić się w limicie czasu, być zgodny z dietą, wykorzystywać możliwie dużo dostępnych składników i wymagać najwyżej 4 brakujących produktów. Podaj kompletną listę składników z ilościami dla 2 porcji, 3–7 konkretnych kroków oraz jedno pasujące emoji. Pole match to procent składników przepisu, które użytkownik już posiada.`;
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
