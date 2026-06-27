import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.id) {
    return Response.json({ isAdmin: false, dailyLimit: 3 });
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, dailyLimit: true },
  });

  return Response.json({
    isAdmin: account?.role === "admin",
    dailyLimit: account?.dailyLimit ?? 20,
  });
}
