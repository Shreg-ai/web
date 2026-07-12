import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signup } from "@/app/auth/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const t = await getTranslations("auth.signup");

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-violet-50 to-white p-6">
      <form action={signup} className="w-full max-w-sm rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-medium text-violet-950">{t("title")}</h1>
        <div className="flex flex-col gap-3">
          <input
            name="username"
            type="text"
            placeholder={t("username")}
            required
            pattern="[a-zA-Z0-9_-]{3,30}"
            title={t("usernameHint")}
            className="rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
          />
          <input
            name="email"
            type="email"
            placeholder={t("email")}
            required
            className="rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
          />
          <PasswordInput name="password" placeholder={t("password")} required minLength={6} />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <SubmitButton
          pendingText={t("submitting")}
          className="mt-4 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {t("submit")}
        </SubmitButton>
        <p className="mt-4 text-center text-sm text-neutral-500">
          {t("haveAccount")}{" "}
          <Link href="/login" className="text-violet-600 hover:underline">
            {t("logIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
