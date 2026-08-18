import type { Metadata, Viewport } from "next";
import "./globals.css";

const appUrl = new URL("https://smartrecipeapp.com");
const appTitle = "SmartRecipe — AI recipe generator";
const appDescription =
  "Create recipes from ingredients you already have, plan meals, build shopping lists and reduce food waste with AI.";

export const metadata: Metadata = {
  metadataBase: appUrl,
  title: {
    default: appTitle,
    template: "%s · SmartRecipe",
  },
  description: appDescription,
  applicationName: "SmartRecipe",
  authors: [{ name: "SmartRecipe" }],
  creator: "SmartRecipe",
  publisher: "SmartRecipe",
  category: "Food & Drink",
  keywords: [
    "AI recipe generator",
    "smart recipe",
    "meal planner",
    "shopping list",
    "food waste",
    "recipe app",
    "healthy recipes",
  ],
  alternates: {
    canonical: "/",
    languages: {
      en: "/?lang=en",
      pl: "/?lang=pl",
      "x-default": "/",
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartRecipe",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "SmartRecipe",
    title: appTitle,
    description: appDescription,
    locale: "en_US",
    alternateLocale: ["pl_PL"],
  },
  twitter: {
    card: "summary",
    title: appTitle,
    description: appDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      {
        url: "/smart-recipe-icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/smart-recipe-icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2f684f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
