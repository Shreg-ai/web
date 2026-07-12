"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function uploadAvatar(file: File): Promise<{ error?: string; avatarUrl?: string }> {
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
  if (uploadError) return { error: uploadError.message };

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
  if (updateError) return { error: updateError.message };

  revalidatePath("/profile");
  if (updated?.username) revalidatePath(`/u/${updated.username}`);
  revalidatePath("/", "layout");
  return { avatarUrl };
}

export async function changePassword(password: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return {};
}
