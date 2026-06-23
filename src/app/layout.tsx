import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartRecipe — gotuj z tego, co masz",
  description:
    "Inteligentny generator przepisów, który pomaga wykorzystać produkty i ograniczyć marnowanie jedzenia.",
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
