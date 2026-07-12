import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GraphRow, ProfileRow } from "@/lib/supabase/dbTypes";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (!profile) notFound();

  const { data: graphs } = await supabase
    .from("graphs")
    .select("*")
    .eq("user_id", (profile as ProfileRow).id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  const publicGraphs = (graphs ?? []) as GraphRow[];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <h1 className="mb-1 text-xl font-medium text-violet-950">@{(profile as ProfileRow).username}</h1>
      <p className="mb-6 text-sm text-neutral-500">Public knowledge graphs</p>
      {publicGraphs.length === 0 ? (
        <p className="text-sm text-neutral-500">No public graphs yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {publicGraphs.map((g) => (
            <li key={g.id} className="rounded-lg border border-violet-100 bg-white p-4 shadow-sm">
              <Link href={`/g/${g.id}`} className="font-medium text-violet-950 hover:underline">
                {g.title}
              </Link>
              <p className="text-xs text-neutral-500">
                {g.node_count} nodes · {g.edge_count} edges
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
