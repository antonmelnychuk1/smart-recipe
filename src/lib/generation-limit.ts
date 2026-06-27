import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GUEST_DAILY_LIMIT = 3;
const USER_DAILY_LIMIT = 20;

function startOfNextUtcDay() {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
    ),
  );
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.BETTER_AUTH_SECRET}:${ip}`)
    .digest("hex");
}

export type GenerationLimit = {
  allowed: boolean;
  identifier: string;
  limit: number;
  remaining: number;
  resetAt: string;
  unlimited: boolean;
};

export async function consumeGenerationLimit(): Promise<GenerationLimit> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  const account = session?.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, dailyLimit: true },
      })
    : null;
  const identifier = session?.user.id
    ? `user:${session.user.id}`
    : `guest:${hashIp(ip)}`;
  const limit = session?.user.id
    ? (account?.dailyLimit ?? USER_DAILY_LIMIT)
    : GUEST_DAILY_LIMIT;
  const windowStart = startOfUtcDay();

  if (account?.role === "admin") {
    return {
      allowed: true,
      identifier,
      limit: 0,
      remaining: 0,
      resetAt: startOfNextUtcDay().toISOString(),
      unlimited: true,
    };
  }

  const usage = await prisma.generationUsage.upsert({
    where: {
      identifier_windowStart: {
        identifier,
        windowStart,
      },
    },
    create: {
      identifier,
      windowStart,
    },
    update: {
      count: { increment: 1 },
    },
  });

  return {
    allowed: usage.count <= limit,
    identifier,
    limit,
    remaining: Math.max(0, limit - usage.count),
    resetAt: startOfNextUtcDay().toISOString(),
    unlimited: false,
  };
}

export async function refundGenerationLimit(identifier: string) {
  await prisma.generationUsage.updateMany({
    where: {
      identifier,
      windowStart: startOfUtcDay(),
      count: { gt: 0 },
    },
    data: {
      count: { decrement: 1 },
    },
  });
}
