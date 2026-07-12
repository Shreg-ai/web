"use client";

import { useRef, useState } from "react";
import { updateBio, uploadAvatar, changePassword } from "@/app/profile/actions";
import { Avatar } from "@/components/Avatar";
import { PasswordInput } from "@/components/PasswordInput";
import type { ProfileRow } from "@/lib/supabase/dbTypes";

export function ProfileSettingsForm({ profile }: { profile: ProfileRow }) {
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const result = await uploadAvatar(file);
      if (result.error) {
        setAvatarError(result.error);
        return;
      }
      if (result.avatarUrl) setAvatarUrl(result.avatarUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setAvatarError("Upload failed -- please try again.");
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

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-medium text-violet-950">Profile picture</h2>
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
            <p className="mt-1 text-xs text-neutral-500">{avatarBusy ? "Uploading…" : "PNG or JPG, up to 2MB."}</p>
            {avatarError && <p className="mt-1 text-sm text-red-600">{avatarError}</p>}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-violet-950">About you</h2>
        <p className="mb-2 text-xs text-neutral-500">Shown on your public profile page.</p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Tell people what you work on and what your graphs are about."
          className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleSaveBio}
            disabled={bioBusy}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {bioBusy ? "Saving…" : "Save"}
          </button>
          {bioSaved && <span className="text-sm text-green-700">Saved.</span>}
        </div>
        {bioError && <p className="mt-2 text-sm text-red-600">{bioError}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-violet-950">Change password</h2>
        <div className="max-w-sm">
          <PasswordInput value={password} onChange={setPassword} placeholder="New password" minLength={6} />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleChangePassword}
            disabled={passwordBusy || password.length === 0}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {passwordBusy ? "Updating…" : "Update password"}
          </button>
          {passwordSaved && <span className="text-sm text-green-700">Password updated.</span>}
        </div>
        {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
      </section>
    </div>
  );
}
