import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested SmartRecipe page could not be found.",
};

const notFoundCopy = {
  eyebrow: "404",
  title: "We could not find this page",
  description:
    "This link may no longer exist or may have been typed incorrectly. Return to the app and generate something tasty.",
  home: "Back to app",
  recipes: "Saved recipes",
};

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ed] px-4 py-8 text-[#25322b]">
      <section className="w-full max-w-lg rounded-[2rem] border border-[#e2dfd6] bg-[#fffdf8] p-6 text-center shadow-xl sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fff0e8] text-2xl font-bold text-[#a45c45]">
          {notFoundCopy.eyebrow}
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#d26849]">
          SmartRecipe
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">
          {notFoundCopy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#68736b]">
          {notFoundCopy.description}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2f684f] px-4 text-sm font-semibold text-white"
          >
            {notFoundCopy.home}
          </Link>
          <Link
            href="/recipes"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8d7d0] bg-white px-4 text-sm font-semibold text-[#356248]"
          >
            {notFoundCopy.recipes}
          </Link>
        </div>
      </section>
    </main>
  );
}
