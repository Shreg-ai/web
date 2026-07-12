import Link from "next/link";
import { login } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 p-6">
      <form action={login} className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="mb-4 text-lg font-medium">Log in</h1>
        <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />
        <div className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" className="mt-4 w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Log in
        </button>
        <p className="mt-4 text-center text-sm text-neutral-500">
          No account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
