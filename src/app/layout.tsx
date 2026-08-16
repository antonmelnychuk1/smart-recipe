import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartRecipe — gotuj z tego, co masz",
  description:
    "Inteligentny generator przepisów, który pomaga wykorzystać produkty i ograniczyć marnowanie jedzenia.",
  applicationName: "SmartRecipe",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartRecipe",
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
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
