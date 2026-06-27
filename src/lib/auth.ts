import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const emailVerificationEnabled =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED === "true";

export const auth = betterAuth({
  appName: "SmartRecipe",
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await prisma.generationUsage.deleteMany({
          where: { identifier: `user:${user.id}` },
        });
      },
    },
  },
  emailVerification: emailVerificationEnabled
    ? {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
          await sendVerificationEmail({
            email: user.email,
            name: user.name,
            verificationUrl: url,
          });
        },
      }
    : undefined,
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      bannedUserMessage:
        "To konto zostało zablokowane. Skontaktuj się z administratorem.",
    }),
  ],
});
