import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destination of email links (password reset, email confirmation) that use
 * the PKCE flow: exchanges the one-time `code` for a real session, then
 * redirects to wherever the link was meant to send the user.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // No explicit `next` means this is a signup-confirmation link (password
  // reset always sets one) -- /profile is where a first-time confirmed user
  // finishes choosing a username, via the same self-recovery form used for
  // any account that's authenticated but has no profile row yet.
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link is invalid or has expired.")}`);
}
