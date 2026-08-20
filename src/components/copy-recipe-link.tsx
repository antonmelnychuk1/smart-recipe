"use client";

import { useState } from "react";

type CopyButtonProps = {
  text: string | (() => string);
  idleLabel: string;
  copiedLabel?: string;
  className?: string;
};

export function CopyButton({
  text,
  idleLabel,
  copiedLabel = "✓ Skopiowano",
  className = "rounded-xl bg-[#025026] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#013d1d]",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(
      typeof text === "function" ? text() : text,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={className}
    >
      {copied ? copiedLabel : idleLabel}
    </button>
  );
}

export function CopyRecipeLink({
  idleLabel = "Kopiuj link",
  copiedLabel = "✓ Link skopiowany",
}: {
  idleLabel?: string;
  copiedLabel?: string;
}) {
  return (
    <CopyButton
      text={() => window.location.href}
      idleLabel={idleLabel}
      copiedLabel={copiedLabel}
    />
  );
}
