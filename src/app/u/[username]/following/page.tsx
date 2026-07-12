import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserList } from "@/components/UserList";
import type { ProfileRow } from "@/lib/supabase/dbTypes";

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (!profile) notFound();
  const row = profile as ProfileRow;

  const { data: follows } = await supabase.from("follows").select("followee_id").eq("follower_id", row.id);
  const followeeIds = (follows ?? []).map((f) => f.followee_id);

  const { data: profiles } = followeeIds.length
    ? await supabase.from("profiles").select("*").in("id", followeeIds)
    : { data: [] };

  return (
    <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <Link href={`/u/${row.username}`} className="mb-4 inline-block text-sm text-violet-600 hover:underline">
        ← @{row.username}
      </Link>
      <h1 className="mb-4 text-lg font-medium text-violet-950">Following</h1>
      <UserList users={(profiles ?? []) as ProfileRow[]} emptyMessage="Not following anyone yet." />
    </div>
  );
}
