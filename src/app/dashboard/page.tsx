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
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-violet-950">My graphs</h1>
          {username && (
            <Link href={`/u/${username}`} className="text-sm text-violet-600 hover:underline">
              View my public profile
            </Link>
          )}
        </div>
        <Link href="/" className="rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-700">
          Upload a new vault
        </Link>
      </div>
      <GraphList graphs={(graphs ?? []) as GraphRow[]} />
    </div>
  );
}
