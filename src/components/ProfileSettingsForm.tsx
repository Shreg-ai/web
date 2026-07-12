"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { updateBio, uploadAvatar, changePassword, updatePreferredLanguage } from "@/app/profile/actions";
import { Avatar } from "@/components/Avatar";
import { PasswordInput } from "@/components/PasswordInput";
import { resizeImageFile } from "@/lib/image/resize";
import { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/locales";
import type { ProfileRow } from "@/lib/supabase/dbTypes";

export function ProfileSettingsForm({ profile }: { profile: ProfileRow }) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(profile.bio ?? "");
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [bioSaved, setBioSaved] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [language, setLanguage] = useState<Locale>(profile.preferred_language ?? DEFAULT_LOCALE);
  const [languageBusy, setLanguageBusy] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      // Downscale before it ever leaves the browser -- a phone photo can be
      // several megabytes, well past what an avatar needs and past size
      // limits enforced ahead of our own code (proxies, the host platform).
      const resized = await resizeImageFile(file);
      const result = await uploadAvatar(resized);
      if (result.error) {
        setAvatarError(result.error);
        return;
      }
      if (result.avatarUrl) setAvatarUrl(result.avatarUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed -- please try again.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSaveBio() {
    setBioBusy(true);
    setBioError(null);
    try {
      const result = await updateBio(bio);
      if (result.error) {
        setBioError(result.error);
        return;
      }
      setBioSaved(true);
      setTimeout(() => setBioSaved(false), 2000);
    } catch {
      setBioError("Save failed -- please try again.");
    } finally {
      setBioBusy(false);
    }
  }

  async function handleChangePassword() {
    setPasswordBusy(true);
    setPasswordError(null);
    try {
      const result = await changePassword(password);
      if (result.error) {
        setPasswordError(result.error);
        return;
      }
      setPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch {
      setPasswordError("Update failed -- please try again.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleLanguageChange(next: Locale) {
    const prev = language;
    setLanguage(next);
    setLanguageBusy(true);
    setLanguageError(null);
    const result = await updatePreferredLanguage(next);
    setLanguageBusy(false);
    if (result.error) {
      setLanguage(prev);
      setLanguageError(result.error);
      return;
    }
    // The server action already updated the cookie next-intl reads on every
    // request -- refresh so the layout (and every Server Component under it)
    // re-renders with the new locale's messages right away.
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-medium text-violet-950">{t("pictureHeading")}</h2>
        <div className="flex items-center gap-4">
          <Avatar url={avatarUrl} username={profile.username} size={64} />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={avatarBusy}
              className="text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-violet-700"
            />
            <p className="mt-1 text-xs text-neutral-500">{avatarBusy ? t("pictureUploading") : t("pictureHint")}</p>
            {avatarError && <p className="mt-1 text-sm text-red-600">{avatarError}</p>}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-violet-950">{t("aboutHeading")}</h2>
        <p className="mb-2 text-xs text-neutral-500">{t("aboutHint")}</p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder={t("aboutPlaceholder")}
          className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleSaveBio}
            disabled={bioBusy}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {bioBusy ? t("saving") : tCommon("save")}
          </button>
          {bioSaved && <span className="text-sm text-green-700">{t("saved")}</span>}
        </div>
        {bioError && <p className="mt-2 text-sm text-red-600">{bioError}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-violet-950">{t("languageHeading")}</h2>
        <p className="mb-2 text-xs text-neutral-500">{t("languageHint")}</p>
        <select
          value={language}
          disabled={languageBusy}
          onChange={(e) => handleLanguageChange(e.target.value as Locale)}
          className="rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none disabled:opacity-50"
        >
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {LOCALE_LABELS[locale]}
            </option>
          ))}
        </select>
        {languageError && <p className="mt-2 text-sm text-red-600">{languageError}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-violet-950">{t("passwordHeading")}</h2>
        <div className="max-w-sm">
          <PasswordInput value={password} onChange={setPassword} placeholder={t("passwordPlaceholder")} minLength={6} />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleChangePassword}
            disabled={passwordBusy || password.length === 0}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {passwordBusy ? t("updating") : t("updatePassword")}
          </button>
          {passwordSaved && <span className="text-sm text-green-700">{t("passwordUpdated")}</span>}
        </div>
        {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
      </section>
    </div>
  );
}
