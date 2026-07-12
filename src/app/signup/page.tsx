import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 p-6">
      <form action={signup} className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="mb-4 text-lg font-medium">Sign up</h1>
        <div className="flex flex-col gap-3">
          <input
            name="username"
            type="text"
            placeholder="Username"
            required
            pattern="[a-zA-Z0-9_-]{3,30}"
            title="3-30 characters: letters, numbers, - or _"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
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
            minLength={6}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" className="mt-4 w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Sign up
        </button>
        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
