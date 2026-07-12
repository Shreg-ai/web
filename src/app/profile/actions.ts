"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/locales";

/**
 * Creates the missing profile row for an authenticated user who somehow
 * doesn't have one -- e.g. signup succeeded in creating the auth user but
 * the profile insert failed partway through (username collision, network
 * blip, etc.), leaving them stuck: logged in, but with no profile to load.
 */
export async function completeProfile(username: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const cleaned = username.trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,30}$/.test(cleaned)) {
    return { error: "Username must be 3-30 characters: letters, numbers, - or _." };
  }

  const { error } = await supabase.from("profiles").insert({ id: user.id, username: cleaned });
  if (error) {
    const message = error.code === "23505" ? "That username is taken — please choose another." : error.message;
    return { error: message };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return {};
}

export async function updateBio(bio: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ bio: bio.trim() || null })
      .eq("id", user.id)
      .select("username")
      .single();
    if (error) return { error: error.message };

    revalidatePath("/profile");
    if (updated?.username) revalidatePath(`/u/${updated.username}`);
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Unexpected error: ${message}` };
  }
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function uploadAvatar(file: File): Promise<{ error?: string; avatarUrl?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    if (!file || file.size === 0) return { error: "Choose an image first." };
    if (!file.type.startsWith("image/")) return { error: "Please upload an image file." };
    if (file.size > MAX_AVATAR_BYTES) return { error: "Image must be smaller than 2MB." };

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: `Storage upload failed: ${uploadError.message}` };

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust: the path is stable across re-uploads, so without this the
    // browser (and any cached <img> elsewhere) would keep showing the old image.
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id)
      .select("username")
      .single();
    if (updateError) return { error: `Profile update failed: ${updateError.message}` };

    revalidatePath("/profile");
    if (updated?.username) revalidatePath(`/u/${updated.username}`);
    revalidatePath("/", "layout");
    return { avatarUrl };
  } catch (err) {
    // Thrown (rather than returned) errors get redacted by Next.js in
    // production -- catch explicitly so the real cause reaches the client
    // instead of a generic, undiagnosable digest.
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Unexpected error: ${message}` };
  }
}

export async function changePassword(password: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    if (password.length < 6) return { error: "Password must be at least 6 characters." };

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Unexpected error: ${message}` };
  }
}

/**
 * Updates the account's saved language preference and, since that's what
 * every request actually reads (see i18n/request.ts), the locale cookie too
 * -- so the switch takes effect immediately, not just on the next login.
 */
export async function updatePreferredLanguage(locale: Locale): Promise<{ error?: string }> {
  try {
    if (!isLocale(locale)) return { error: "Unsupported language." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in." };

    const { error } = await supabase.from("profiles").update({ preferred_language: locale }).eq("id", user.id);
    if (error) return { error: error.message };

    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });

    revalidatePath("/", "layout");
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Unexpected error: ${message}` };
  }
}
