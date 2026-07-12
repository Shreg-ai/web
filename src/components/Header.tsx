import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
      <Link href="/" className="text-sm font-medium text-neutral-900">
        Shreg
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
              My graphs
            </Link>
            <form action={logout}>
              <button type="submit" className="text-neutral-500 hover:text-neutral-900">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
              Log in
            </Link>
            <Link href="/signup" className="rounded-md bg-neutral-900 px-3 py-1.5 text-white">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
