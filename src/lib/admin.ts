import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) return null;

  return prisma.user.findFirst({
    where: {
      id: session.user.id,
      role: "admin",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}
