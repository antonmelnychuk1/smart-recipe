"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUserActionsProps = {
  userId: string;
  userName: string;
  role: string;
  banned: boolean;
  dailyLimit: number;
  isCurrentAdmin: boolean;
};

export function AdminUserActions({
  userId,
  userName,
  role,
  banned,
  dailyLimit,
  isCurrentAdmin,
}: AdminUserActionsProps) {
  const router = useRouter();
  const [limit, setLimit] = useState(String(dailyLimit));
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function run(
    action: Record<string, unknown>,
    confirmation?: string,
  ) {
    if (confirmation && !window.confirm(confirmation)) return;

    setPending(String(action.action));
    setError("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...action, userId }),
    });
    const result = (await response.json()) as { error?: string };
    setPending("");

    if (!response.ok) {
      setError(result.error ?? "Operacja nie powiodła się.");
      return;
    }

    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded-lg border border-[#d8d7d0] bg-white px-3 py-2 text-xs font-semibold"
      >
        Zarządzaj
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#18241e]/60 p-4 text-left backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Zarządzaj kontem ${userName}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#d26849]">
                  Zarządzanie kontem
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold">
                  {userName}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Zamknij"
                className="grid size-9 place-items-center rounded-full bg-[#eeeae2] text-xl"
              >
                ×
              </button>
            </div>

            <label className="mt-5 block text-xs font-semibold text-[#68736b]">
              Dzienny limit
              <div className="mt-1.5 flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                  disabled={role === "admin"}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[#d8d7d0] px-3 outline-none disabled:bg-[#f1eee7]"
                />
                <button
                  disabled={pending !== "" || role === "admin"}
                  onClick={() =>
                    run({
                      action: "set-limit",
                      dailyLimit: Number(limit),
                    })
                  }
                  className="rounded-lg bg-[#356248] px-4 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Zapisz
                </button>
              </div>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                disabled={pending !== ""}
                onClick={() => run({ action: "reset-usage" })}
                className="rounded-lg bg-[#edf1ec] px-3 py-2.5 text-xs font-semibold text-[#365a46] disabled:opacity-40"
              >
                Resetuj limit
              </button>
              <button
                disabled={pending !== "" || isCurrentAdmin}
                onClick={() =>
                  run({
                    action: "set-role",
                    role: role === "admin" ? "user" : "admin",
                  })
                }
                className="rounded-lg bg-[#edf1ec] px-3 py-2.5 text-xs font-semibold text-[#365a46] disabled:opacity-40"
              >
                {role === "admin" ? "Odbierz admina" : "Nadaj admina"}
              </button>
              <button
                disabled={pending !== "" || isCurrentAdmin}
                onClick={() =>
                  run(
                    { action: banned ? "unban" : "ban" },
                    banned
                      ? undefined
                      : `Zablokować konto użytkownika ${userName}? Aktywne sesje zostaną zakończone.`,
                  )
                }
                className="rounded-lg bg-[#fff0e8] px-3 py-2.5 text-xs font-semibold text-[#a45c45] disabled:opacity-40"
              >
                {banned ? "Odblokuj" : "Zablokuj"}
              </button>
              <button
                disabled={pending !== "" || isCurrentAdmin}
                onClick={() =>
                  run(
                    { action: "delete" },
                    `Trwale usunąć konto ${userName} i wszystkie jego dane? Tej operacji nie można cofnąć.`,
                  )
                }
                className="rounded-lg bg-[#b44f3d] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                Usuń konto
              </button>
            </div>

            {isCurrentAdmin && (
              <p className="mt-3 text-[11px] leading-4 text-[#8a948e]">
                Własnego konta administratora nie można zablokować, usunąć ani
                zdegradować.
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-lg bg-[#fff0e8] p-2 text-xs text-[#a45c45]">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
