import Link from "next/link";
import { login } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-violet-50 to-white p-6">
      <form action={login} className="w-full max-w-sm rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-medium text-violet-950">Log in</h1>
        <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />
        <div className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" className="mt-4 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
          Log in
        </button>
        <p className="mt-4 text-center text-sm text-neutral-500">
          No account?{" "}
          <Link href="/signup" className="text-violet-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
