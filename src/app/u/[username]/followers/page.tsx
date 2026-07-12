import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { UserList } from "@/components/UserList";
import type { ProfileRow } from "@/lib/supabase/dbTypes";

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (!profile) notFound();
  const row = profile as ProfileRow;

  const { data: follows } = await supabase.from("follows").select("follower_id").eq("followee_id", row.id);
  const followerIds = (follows ?? []).map((f) => f.follower_id);

  const { data: profiles } = followerIds.length
    ? await supabase.from("profiles").select("*").in("id", followerIds)
    : { data: [] };
  const t = await getTranslations("profileSubpages");

  return (
    <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <Link href={`/u/${row.username}`} className="mb-4 inline-block text-sm text-violet-600 hover:underline">
        ← @{row.username}
      </Link>
      <h1 className="mb-4 text-lg font-medium text-violet-950">{t("followersTitle")}</h1>
      <UserList users={(profiles ?? []) as ProfileRow[]} emptyMessage={t("noFollowersYet")} />
    </div>
  );
}
