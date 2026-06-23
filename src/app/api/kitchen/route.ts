import { headers } from "next/headers";
import { z } from "zod";
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
  match: z.number(),
  ingredients: z.array(z.string()),
  missing: z.array(z.string()),
  steps: z.array(z.string()),
  emoji: z.string(),
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("favorite.add"),
    recipe: recipeSchema,
  }),
  z.object({
    action: z.literal("favorite.remove"),
    title: z.string(),
  }),
  z.object({
    action: z.literal("history.add"),
    ingredients: z.array(z.string()).min(1),
    diet: z.string(),
    maxTime: z.number().int(),
    recipes: z.array(recipeSchema),
  }),
  z.object({
    action: z.literal("history.clear"),
  }),
  z.object({
    action: z.literal("shopping.add"),
    items: z.array(z.string()).min(1),
  }),
  z.object({
    action: z.literal("shopping.remove"),
    label: z.string(),
  }),
  z.object({
    action: z.literal("shopping.clear"),
  }),
]);

async function getUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user.id ?? null;
}

export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return Response.json({ error: "Zaloguj się, aby pobrać dane." }, { status: 401 });
  }

  const [favorites, history, shoppingItems] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.shoppingItem.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return Response.json({
    favorites: favorites.map((favorite) => favorite.recipe as Recipe),
    history: history.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt.toISOString(),
      ingredients: entry.ingredients,
      diet: entry.diet,
      maxTime: entry.maxTime,
      recipes: entry.recipes as Recipe[],
    })),
    shoppingList: shoppingItems.map((item) => item.label),
  });
}

export async function POST(request: Request) {
  const userId = await getUserId();

  if (!userId) {
    return Response.json({ error: "Zaloguj się, aby zapisać dane." }, { status: 401 });
  }

  const body = actionSchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return Response.json({ error: "Niepoprawne dane." }, { status: 400 });
  }

  const data = body.data;

  switch (data.action) {
    case "favorite.add":
      await prisma.favorite.upsert({
        where: { userId_title: { userId, title: data.recipe.title } },
        create: {
          userId,
          title: data.recipe.title,
          recipe: data.recipe,
        },
        update: { recipe: data.recipe },
      });
      break;
    case "favorite.remove":
      await prisma.favorite.deleteMany({
        where: { userId, title: data.title },
      });
      break;
    case "history.add":
      await prisma.$transaction(async (tx) => {
        await tx.searchHistory.create({
          data: {
            userId,
            ingredients: data.ingredients,
            diet: data.diet,
            maxTime: data.maxTime,
            recipes: data.recipes,
          },
        });

        const oldEntries = await tx.searchHistory.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip: 10,
          select: { id: true },
        });

        if (oldEntries.length > 0) {
          await tx.searchHistory.deleteMany({
            where: { id: { in: oldEntries.map((entry) => entry.id) } },
          });
        }
      });
      break;
    case "history.clear":
      await prisma.searchHistory.deleteMany({ where: { userId } });
      break;
    case "shopping.add":
      await Promise.all(
        data.items.map((label) =>
          prisma.shoppingItem.upsert({
            where: { userId_label: { userId, label } },
            create: { userId, label },
            update: {},
          }),
        ),
      );
      break;
    case "shopping.remove":
      await prisma.shoppingItem.deleteMany({
        where: { userId, label: data.label },
      });
      break;
    case "shopping.clear":
      await prisma.shoppingItem.deleteMany({ where: { userId } });
      break;
  }

  return Response.json({ ok: true });
}
