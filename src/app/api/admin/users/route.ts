import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCurrentAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set-limit"),
    userId: z.string().min(1),
    dailyLimit: z.number().int().min(1).max(1000),
  }),
  z.object({
    action: z.literal("reset-usage"),
    userId: z.string().min(1),
  }),
  z.object({
    action: z.literal("set-role"),
    userId: z.string().min(1),
    role: z.enum(["user", "admin"]),
  }),
  z.object({
    action: z.literal("ban"),
    userId: z.string().min(1),
    reason: z.string().trim().max(200).optional(),
  }),
  z.object({
    action: z.literal("unban"),
    userId: z.string().min(1),
  }),
  z.object({
    action: z.literal("delete"),
    userId: z.string().min(1),
  }),
]);

function startOfUtcDay() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: "Brak uprawnień." }, { status: 403 });
  }

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Niepoprawne dane." }, { status: 400 });
  }

  const data = parsed.data;
  const target = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, role: true },
  });

  if (!target) {
    return Response.json({ error: "Użytkownik nie istnieje." }, { status: 404 });
  }

  const modifiesIdentity = ["set-role", "ban", "delete"].includes(data.action);
  if (target.id === admin.id && modifiesIdentity) {
    return Response.json(
      { error: "Nie możesz zablokować, zdegradować ani usunąć własnego konta." },
      { status: 400 },
    );
  }

  const requestHeaders = await headers();

  switch (data.action) {
    case "set-limit":
      await prisma.user.update({
        where: { id: target.id },
        data: { dailyLimit: data.dailyLimit },
      });
      break;
    case "reset-usage":
      await prisma.generationUsage.deleteMany({
        where: {
          identifier: `user:${target.id}`,
          windowStart: startOfUtcDay(),
        },
      });
      break;
    case "set-role":
      await prisma.user.update({
        where: { id: target.id },
        data: { role: data.role },
      });
      break;
    case "ban":
      await auth.api.banUser({
        headers: requestHeaders,
        body: {
          userId: target.id,
          banReason: data.reason || "Zablokowany przez administratora",
        },
      });
      break;
    case "unban":
      await auth.api.unbanUser({
        headers: requestHeaders,
        body: { userId: target.id },
      });
      break;
    case "delete":
      await prisma.$transaction([
        prisma.generationUsage.deleteMany({
          where: { identifier: `user:${target.id}` },
        }),
        prisma.user.delete({ where: { id: target.id } }),
      ]);
      break;
  }

  return Response.json({ ok: true });
}
