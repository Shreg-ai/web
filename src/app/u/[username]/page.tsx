import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import type { GraphRow, ProfileRow } from "@/lib/supabase/dbTypes";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (!profile) notFound();
  const row = profile as ProfileRow;

  const { data: graphs } = await supabase
    .from("graphs")
    .select("*")
    .eq("user_id", row.id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  const publicGraphs = (graphs ?? []) as GraphRow[];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <div className="mb-6 flex items-center gap-4">
        <Avatar url={row.avatar_url} username={row.username} size={80} />
        <div>
          <h1 className="text-xl font-medium text-violet-950">@{row.username}</h1>
          {row.bio ? (
            <p className="mt-1 text-sm text-neutral-600">{row.bio}</p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400">No bio yet.</p>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium tracking-wide text-neutral-400 uppercase">Public knowledge graphs</h2>
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
