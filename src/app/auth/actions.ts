"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** The deployed origin (works across localhost, the .vercel.app URL, and the custom domain) from request headers. */
async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "") || "/";

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    redirect(`/signup?error=${encodeURIComponent("Username must be 3-30 characters: letters, numbers, - or _.")}`);
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user || !data.session) {
    // No active session means email confirmation is required before this
    // account can do anything -- there's no session yet to authorize the
    // profile insert with, so it happens later (see /profile's self-recovery
    // form) once they confirm and log in for the first time.
    redirect(`/login?error=${encodeURIComponent("Account created. Check your email to confirm it, then log in.")}`);
  }

  const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, username });
  if (profileError) {
    // 23505 = unique_violation; anything else (e.g. an RLS policy failure) is a
    // real bug, and should say so instead of being misreported as a taken name.
    const message =
      profileError.code === "23505"
        ? "That username is taken — please choose another."
        : `Could not create your profile: ${profileError.message}`;
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Sends a password reset email. Always shows the same "check your email"
 * result whether or not the address is registered -- confirming/denying
 * that would let someone enumerate which emails have accounts.
 */
export async function requestPasswordReset(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/update-password")}`,
  });

  // Supabase returns an error for things like rate limiting, but never for
  // "no such user" -- so surfacing errors here doesn't leak account existence.
  if (error) return { error: error.message };
  return {};
}

/** Sets a new password. Only works within the short-lived recovery session created by clicking the reset email link. */
export async function updatePassword(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    redirect(`/update-password?error=${encodeURIComponent("Password must be at least 6 characters.")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
