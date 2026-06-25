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
};

export async function consumeGenerationLimit(): Promise<GenerationLimit> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  const identifier = session?.user.id
    ? `user:${session.user.id}`
    : `guest:${hashIp(ip)}`;
  const limit = session?.user.id ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  const windowStart = startOfUtcDay();

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
