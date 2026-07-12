"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/app/auth/actions";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSending(true);
    setError(null);
    const result = await requestPasswordReset(formData);
    setSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-violet-100 bg-white p-6 text-center shadow-sm">
        <h1 className="mb-2 text-lg font-medium text-violet-950">{t("sentTitle")}</h1>
        <p className="text-sm text-neutral-600">{t("sentDescription")}</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="w-full max-w-sm rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-lg font-medium text-violet-950">{t("title")}</h1>
      <p className="mb-4 text-sm text-neutral-500">{t("description")}</p>
      <input
        name="email"
        type="email"
        placeholder={t("email")}
        required
        className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
      />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="mt-4 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {sending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
