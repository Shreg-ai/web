"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "") || "/dashboard";

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

  if (!data.user) {
    // Email confirmation is required by the Supabase project's auth settings.
    redirect(`/login?error=${encodeURIComponent("Check your email to confirm your account, then log in.")}`);
  }

  const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, username });
  if (profileError) {
    redirect(`/signup?error=${encodeURIComponent("That username is taken — please choose another.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
