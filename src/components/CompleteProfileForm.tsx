"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { completeProfile } from "@/app/profile/actions";

export function CompleteProfileForm() {
  const router = useRouter();
  const t = useTranslations("completeProfile");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    const result = await completeProfile(username);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm flex-1 p-6">
      <div className="rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-lg font-medium text-violet-950">{t("heading")}</h1>
        <p className="mb-4 text-sm text-neutral-500">{t("description")}</p>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("usernamePlaceholder")}
          pattern="[a-zA-Z0-9_-]{3,30}"
          className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={busy || !username.trim()}
          className="mt-4 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? t("saving") : t("continue")}
        </button>
      </div>
    </div>
  );
}
