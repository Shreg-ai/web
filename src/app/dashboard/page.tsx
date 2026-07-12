import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GraphRow, ProfileRow } from "@/lib/supabase/dbTypes";
import { GraphList } from "./GraphList";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: graphs }, { data: profile }] = await Promise.all([
    supabase.from("graphs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  const username = (profile as ProfileRow | null)?.username;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">My graphs</h1>
          {username && (
            <Link href={`/u/${username}`} className="text-sm text-blue-600 hover:underline">
              View my public profile
            </Link>
          )}
        </div>
        <Link href="/" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white">
          Upload a new vault
        </Link>
      </div>
      <GraphList graphs={(graphs ?? []) as GraphRow[]} />
    </div>
  );
}
