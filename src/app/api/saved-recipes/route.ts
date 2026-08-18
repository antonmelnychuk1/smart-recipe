import { headers } from "next/headers";
import { z } from "zod";
import { apiError } from "@/lib/api-language";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const recipeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string(),
  time: z.number(),
  difficulty: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  estimatedCost: z.number().optional(),
  currency: z.enum(["PLN", "EUR", "USD", "GBP"]).optional(),
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

const shareSchema = z.object({
  recipe: recipeSchema,
});

const visibilitySchema = z.object({
  id: z.string().min(1),
  isPublic: z.boolean(),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return apiError(
      request,
      {
        pl: "Zaloguj się, aby udostępnić przepis.",
        en: "Log in to share a recipe.",
      },
      401,
    );
  }

  const parsed = shareSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      request,
      { pl: "Niepoprawny przepis.", en: "Invalid recipe." },
      400,
    );
  }

  const recipe = await prisma.favorite.upsert({
    where: {
      userId_title: {
        userId,
        title: parsed.data.recipe.title,
      },
    },
    create: {
      userId,
      title: parsed.data.recipe.title,
      recipe: parsed.data.recipe,
      isPublic: true,
    },
    update: {
      recipe: parsed.data.recipe,
      isPublic: true,
    },
    select: { id: true, isPublic: true },
  });

  return Response.json({
    savedId: recipe.id,
    isPublic: recipe.isPublic,
    path: `/recipes/${recipe.id}`,
  });
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return apiError(
      request,
      { pl: "Brak uprawnień.", en: "Unauthorized." },
      401,
    );
  }

  const parsed = visibilitySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return apiError(
      request,
      { pl: "Niepoprawne dane.", en: "Invalid data." },
      400,
    );
  }

  const existing = await prisma.favorite.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true },
  });
  if (!existing) {
    return apiError(
      request,
      {
        pl: "Nie znaleziono zapisanego przepisu.",
        en: "Saved recipe was not found.",
      },
      404,
    );
  }

  const recipe = await prisma.favorite.update({
    where: { id: existing.id },
    data: { isPublic: parsed.data.isPublic },
    select: { id: true, isPublic: true },
  });

  return Response.json({
    savedId: recipe.id,
    isPublic: recipe.isPublic,
    path: `/recipes/${recipe.id}`,
  });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return apiError(
      request,
      { pl: "Brak uprawnień.", en: "Unauthorized." },
      401,
    );
  }

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      request,
      { pl: "Niepoprawne dane.", en: "Invalid data." },
      400,
    );
  }

  const result = await prisma.favorite.deleteMany({
    where: { id: parsed.data.id, userId },
  });
  if (result.count === 0) {
    return apiError(
      request,
      {
        pl: "Nie znaleziono zapisanego przepisu.",
        en: "Saved recipe was not found.",
      },
      404,
    );
  }

  return Response.json({ ok: true });
}
