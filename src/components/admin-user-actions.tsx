"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUiLanguage, type AppLanguage, type UiLanguage } from "@/lib/i18n";

type AdminUserActionsProps = {
  userId: string;
  userName: string;
  role: string;
  banned: boolean;
  dailyLimit: number;
  isCurrentAdmin: boolean;
  language?: AppLanguage;
};

const adminActionCopy = {
  pl: {
    genericError: "Operacja nie powiodła się.",
    manage: "Zarządzaj",
    ariaManage: (name: string) => `Zarządzaj kontem ${name}`,
    accountManagement: "Zarządzanie kontem",
    close: "Zamknij",
    dailyLimit: "Dzienny limit",
    save: "Zapisz",
    resetLimit: "Resetuj limit",
    removeAdmin: "Odbierz admina",
    makeAdmin: "Nadaj admina",
    unban: "Odblokuj",
    ban: "Zablokuj",
    deleteAccount: "Usuń konto",
    banConfirm: (name: string) =>
      `Zablokować konto użytkownika ${name}? Aktywne sesje zostaną zakończone.`,
    deleteConfirm: (name: string) =>
      `Trwale usunąć konto ${name} i wszystkie jego dane? Tej operacji nie można cofnąć.`,
    currentAdminInfo:
      "Własnego konta administratora nie można zablokować, usunąć ani zdegradować.",
  },
  en: {
    genericError: "Operation failed.",
    manage: "Manage",
    ariaManage: (name: string) => `Manage account ${name}`,
    accountManagement: "Account management",
    close: "Close",
    dailyLimit: "Daily limit",
    save: "Save",
    resetLimit: "Reset limit",
    removeAdmin: "Remove admin",
    makeAdmin: "Make admin",
    unban: "Unban",
    ban: "Ban",
    deleteAccount: "Delete account",
    banConfirm: (name: string) =>
      `Ban ${name}? Active sessions will be ended.`,
    deleteConfirm: (name: string) =>
      `Permanently delete ${name} and all their data? This cannot be undone.`,
    currentAdminInfo:
      "Your own admin account cannot be banned, deleted or downgraded.",
  },
  uk: {
    genericError: "Операція не вдалася.",
    manage: "Керувати",
    ariaManage: (name: string) => `Керувати акаунтом ${name}`,
    accountManagement: "Керування акаунтом",
    close: "Закрити",
    dailyLimit: "Денний ліміт",
    save: "Зберегти",
    resetLimit: "Скинути ліміт",
    removeAdmin: "Забрати адміна",
    makeAdmin: "Надати адміна",
    unban: "Розблокувати",
    ban: "Заблокувати",
    deleteAccount: "Видалити акаунт",
    banConfirm: (name: string) =>
      `Заблокувати акаунт користувача ${name}? Активні сесії будуть завершені.`,
    deleteConfirm: (name: string) =>
      `Назавжди видалити акаунт ${name} і всі його дані? Цю операцію не можна скасувати.`,
    currentAdminInfo:
      "Власний акаунт адміністратора не можна заблокувати, видалити або понизити.",
  },
} as const satisfies Record<
  UiLanguage,
  Record<string, string | ((value: string) => string)>
>;

export function AdminUserActions({
  userId,
  userName,
  role,
  banned,
  dailyLimit,
  isCurrentAdmin,
  language = "pl",
}: AdminUserActionsProps) {
  const copy = adminActionCopy[getUiLanguage(language)];
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
      setError(result.error ?? copy.genericError);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full whitespace-nowrap rounded-xl border border-[#d8d7d0] bg-white px-3 py-2.5 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-[#c9c3b8] hover:shadow-md sm:w-auto"
      >
        {copy.manage}
      </button>
      {open && (
        <div
          className="modal-safe-area fixed inset-0 z-50 grid place-items-center bg-[#18241e]/60 text-left backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={copy.ariaManage(userName)}
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-panel-safe w-full max-w-md overflow-y-auto rounded-[1.7rem] border border-[#dedbd2] bg-white p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#d26849]">
                  {copy.accountManagement}
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold">
                  {userName}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={copy.close}
                className="grid size-9 place-items-center rounded-full bg-[#eeeae2] text-xl"
              >
                ×
              </button>
            </div>

            <label className="mt-5 block text-xs font-semibold text-[#68736b]">
              {copy.dailyLimit}
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
                  {copy.save}
                </button>
              </div>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                disabled={pending !== ""}
                onClick={() => run({ action: "reset-usage" })}
                className="rounded-lg bg-[#edf1ec] px-3 py-2.5 text-xs font-semibold text-[#365a46] disabled:opacity-40"
              >
                {copy.resetLimit}
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
                {role === "admin" ? copy.removeAdmin : copy.makeAdmin}
              </button>
              <button
                disabled={pending !== "" || isCurrentAdmin}
                onClick={() =>
                  run(
                    { action: banned ? "unban" : "ban" },
                    banned
                      ? undefined
                      : copy.banConfirm(userName),
                  )
                }
                className="rounded-lg bg-[#fff0e8] px-3 py-2.5 text-xs font-semibold text-[#a45c45] disabled:opacity-40"
              >
                {banned ? copy.unban : copy.ban}
              </button>
              <button
                disabled={pending !== "" || isCurrentAdmin}
                onClick={() =>
                  run(
                    { action: "delete" },
                    copy.deleteConfirm(userName),
                  )
                }
                className="rounded-lg bg-[#b44f3d] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                {copy.deleteAccount}
              </button>
            </div>

            {isCurrentAdmin && (
              <p className="mt-3 text-[11px] leading-4 text-[#8a948e]">
                {copy.currentAdminInfo}
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
