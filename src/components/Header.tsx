import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-violet-100 bg-white px-5 py-3">
      <Link href="/" className="text-sm font-semibold text-violet-950">
        Shreg
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/dashboard" className="text-neutral-600 hover:text-violet-700">
              My graphs
            </Link>
            <form action={logout}>
              <button type="submit" className="text-neutral-500 hover:text-violet-700">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-neutral-600 hover:text-violet-700">
              Log in
            </Link>
            <Link href="/signup" className="rounded-md bg-violet-600 px-3 py-1.5 text-white hover:bg-violet-700">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
