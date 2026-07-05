import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  calorieTarget: z.number().int().min(800).max(6000).nullable(),
  proteinTarget: z.number().int().min(20).max(400).nullable(),
});

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Brak uprawnień." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { calorieTarget: true, proteinTarget: true },
  });
  return Response.json(user);
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Brak uprawnień." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Niepoprawne cele." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { calorieTarget: true, proteinTarget: true },
  });
  return Response.json(user);
}
