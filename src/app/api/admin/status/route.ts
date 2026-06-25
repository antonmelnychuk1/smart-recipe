import { getCurrentAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await getCurrentAdmin();
  return Response.json({ isAdmin: Boolean(admin) });
}
