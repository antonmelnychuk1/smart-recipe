import { headers } from "next/headers";
import { z } from "zod";
import { apiError } from "@/lib/api-language";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Recipe } from "@/lib/recipe-types";

const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  time: z.number(),
  difficulty: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  estimatedCost: z.number().optional(),
  match: z.number(),
  ingredients: z.array(z.string()),
  missing: z.array(z.string()),
  substitutions: z
    .array(
      z.object({
        ingredient: z.string(),
        substitutes: z.array(z.string()),
      }),
    )
    .optional(),
  steps: z.array(z.string()),
  emoji: z.string(),
  imageQuery: z.string().optional(),
  image: z
    .object({
      url: z.string().url(),
      alt: z.string(),
      photographer: z.string(),
      photographerUrl: z.string().url(),
      sourceUrl: z.string().url(),
    })
    .optional(),
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set"),
    weekStart: z.string().date(),
    day: z.number().int().min(0).max(6),
    mealType: z.enum(["breakfast", "lunch", "dinner"]),
    recipe: recipeSchema,
  }),
  z.object({
    action: z.literal("remove"),
    weekStart: z.string().date(),
    day: z.number().int().min(0).max(6),
    mealType: z.enum(["breakfast", "lunch", "dinner"]),
  }),
  z.object({
    action: z.literal("clear-week"),
    weekStart: z.string().date(),
  }),
]);

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

function parseWeekStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return apiError(
      request,
      { pl: "Zaloguj się, aby pobrać plan.", en: "Log in to load the plan." },
      401,
    );
  }

  const weekStart = new URL(request.url).searchParams.get("weekStart");
  const parsedWeek = z.string().date().safeParse(weekStart);
  if (!parsedWeek.success) {
    return apiError(
      request,
      { pl: "Niepoprawny tydzień.", en: "Invalid week." },
      400,
    );
  }

  const entries = await prisma.mealPlan.findMany({
    where: { userId, weekStart: parseWeekStart(parsedWeek.data) },
    orderBy: [{ day: "asc" }, { mealType: "asc" }],
  });

  return Response.json({
    entries: entries.map((entry) => ({
      id: entry.id,
      day: entry.day,
      mealType: entry.mealType,
      recipe: entry.recipe as Recipe,
    })),
  });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return apiError(
      request,
      { pl: "Zaloguj się, aby zapisać plan.", en: "Log in to save the plan." },
      401,
    );
  }

  const body = actionSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(
      request,
      { pl: "Niepoprawne dane planera.", en: "Invalid planner data." },
      400,
    );
  }

  const data = body.data;
  if (data.action === "clear-week") {
    await prisma.mealPlan.deleteMany({
      where: { userId, weekStart: parseWeekStart(data.weekStart) },
    });
    return Response.json({ ok: true });
  }

  const key = {
    userId,
    weekStart: parseWeekStart(data.weekStart),
    day: data.day,
    mealType: data.mealType,
  };

  if (data.action === "set") {
    await prisma.mealPlan.upsert({
      where: { userId_weekStart_day_mealType: key },
      create: { ...key, recipe: data.recipe },
      update: { recipe: data.recipe },
    });
  } else {
    await prisma.mealPlan.deleteMany({ where: key });
  }

  return Response.json({ ok: true });
}
