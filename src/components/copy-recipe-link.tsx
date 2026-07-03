"use client";

import { useState } from "react";

export function CopyRecipeLink() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="rounded-xl bg-[#2f684f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#275b44]"
    >
      {copied ? "✓ Link skopiowany" : "Kopiuj link"}
    </button>
  );
}
