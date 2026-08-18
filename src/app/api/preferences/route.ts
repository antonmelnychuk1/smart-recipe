import { headers } from "next/headers";
import { z } from "zod";
import { apiError } from "@/lib/api-language";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  calorieTarget: z.number().int().min(800).max(6000).nullable(),
  proteinTarget: z.number().int().min(20).max(400).nullable(),
  defaultDiet: z.string().trim().min(1).max(60),
  defaultMaxTime: z.number().int().min(0).max(240),
  defaultBudget: z.number().int().min(0).max(1000),
  cookingGoal: z.enum([
    "balanced",
    "quick",
    "cheap",
    "healthy",
    "high_protein",
    "use_pantry",
  ]),
  excludedIngredients: z
    .array(z.string().trim().min(1).max(60))
    .max(30)
    .default([]),
});

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return apiError(
      request,
      { pl: "Brak uprawnień.", en: "Unauthorized.", uk: "Немає доступу." },
      401,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      calorieTarget: true,
      proteinTarget: true,
      defaultDiet: true,
      defaultMaxTime: true,
      defaultBudget: true,
      cookingGoal: true,
      excludedIngredients: true,
      preferencesCompleted: true,
    },
  });
  return Response.json(user);
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return apiError(
      request,
      { pl: "Brak uprawnień.", en: "Unauthorized.", uk: "Немає доступу." },
      401,
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      request,
      { pl: "Niepoprawne cele.", en: "Invalid goals.", uk: "Неправильні цілі." },
      400,
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...parsed.data,
      preferencesCompleted: true,
    },
    select: {
      calorieTarget: true,
      proteinTarget: true,
      defaultDiet: true,
      defaultMaxTime: true,
      defaultBudget: true,
      cookingGoal: true,
      excludedIngredients: true,
      preferencesCompleted: true,
    },
  });
  return Response.json(user);
}
