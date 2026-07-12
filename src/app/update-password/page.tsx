import { getTranslations } from "next-intl/server";
import { updatePassword } from "@/app/auth/actions";
import { PasswordInput } from "@/components/PasswordInput";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const t = await getTranslations("auth.updatePassword");

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-violet-50 to-white p-6">
      <form action={updatePassword} className="w-full max-w-sm rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-lg font-medium text-violet-950">{t("title")}</h1>
        <p className="mb-4 text-sm text-neutral-500">{t("description")}</p>
        <PasswordInput name="password" placeholder={t("newPassword")} required minLength={6} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" className="mt-4 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
