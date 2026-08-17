"use client";

import { InputHTMLAttributes, useState } from "react";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement>;

export function PasswordInput({
  className = "",
  disabled,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative mt-2">
      <input
        {...props}
        disabled={disabled}
        type={isVisible ? "text" : "password"}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsVisible((value) => !value)}
        aria-label={isVisible ? "Ukryj hasło" : "Pokaż hasło"}
        aria-pressed={isVisible}
        className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#59675f] transition hover:bg-[#eef2ea] hover:text-[#254c39] disabled:pointer-events-none disabled:opacity-40"
      >
        {isVisible ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="M3 3l18 18" />
            <path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c5.2 0 8.5 4.4 9.5 6.3a1.4 1.4 0 0 1 0 1.4 15.3 15.3 0 0 1-3.1 3.9" />
            <path d="M6.6 6.6a15.4 15.4 0 0 0-4.1 4.7 1.4 1.4 0 0 0 0 1.4C3.5 14.6 6.8 19 12 19a10.4 10.4 0 0 0 4.1-.8" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            <path d="M14.1 9.9A3 3 0 0 0 12 9" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="M2.5 11.3a1.4 1.4 0 0 0 0 1.4C3.5 14.6 6.8 19 12 19s8.5-4.4 9.5-6.3a1.4 1.4 0 0 0 0-1.4C20.5 9.4 17.2 5 12 5S3.5 9.4 2.5 11.3Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
