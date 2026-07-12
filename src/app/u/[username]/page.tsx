import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { FriendButton, type FriendStatus } from "@/components/FriendButton";
import { FeedPostCard } from "@/components/FeedPostCard";
import type { FriendRequestRow, GraphEvaluationRow, GraphRow, PostRow, ProfileRow } from "@/lib/supabase/dbTypes";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (!profile) notFound();
  const row = profile as ProfileRow;
  const t = await getTranslations("publicProfile");
  const tCommon = await getTranslations("common");

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const isOwnProfile = viewer?.id === row.id;

  const [{ data: graphs }, { count: followerCount }, { count: followingCount }, { count: friendCount }] = await Promise.all([
    supabase.from("graphs").select("*").eq("user_id", row.id).eq("visibility", "public").order("created_at", { ascending: false }),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", row.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", row.id),
    supabase
      .from("friend_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${row.id},recipient_id.eq.${row.id}`),
  ]);

  const publicGraphs = (graphs ?? []) as GraphRow[];

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", row.id)
    .order("created_at", { ascending: false });
  const postRows = (posts ?? []) as PostRow[];

  const postGraphIds = [...new Set(postRows.map((p) => p.graph_id))];
  const [{ data: postGraphs }, { data: postEvaluations }] = await Promise.all([
    postGraphIds.length ? supabase.from("graphs").select("*").in("id", postGraphIds) : Promise.resolve({ data: [] }),
    postGraphIds.length ? supabase.from("graph_evaluations").select("*").in("graph_id", postGraphIds) : Promise.resolve({ data: [] }),
  ]);
  const postGraphById = new Map((postGraphs as GraphRow[] | null)?.map((g) => [g.id, g]) ?? []);
  const postEvaluationsByGraphId = new Map<string, GraphEvaluationRow[]>();
  for (const evaluation of (postEvaluations as GraphEvaluationRow[] | null) ?? []) {
    const list = postEvaluationsByGraphId.get(evaluation.graph_id) ?? [];
    list.push(evaluation);
    postEvaluationsByGraphId.set(evaluation.graph_id, list);
  }

  let isFollowing = false;
  let friendStatus: FriendStatus = "none";
  let friendRequestId: string | null = null;

  if (viewer && !isOwnProfile) {
    const [{ data: followRow }, { data: friendRow }] = await Promise.all([
      supabase.from("follows").select("follower_id").eq("follower_id", viewer.id).eq("followee_id", row.id).maybeSingle(),
      supabase
        .from("friend_requests")
        .select("*")
        .or(`and(requester_id.eq.${viewer.id},recipient_id.eq.${row.id}),and(requester_id.eq.${row.id},recipient_id.eq.${viewer.id})`)
        .maybeSingle(),
    ]);

    isFollowing = Boolean(followRow);

    if (friendRow) {
      const fr = friendRow as FriendRequestRow;
      friendRequestId = fr.id;
      if (fr.status === "accepted") friendStatus = "friends";
      else friendStatus = fr.requester_id === viewer.id ? "pending_sent" : "pending_received";
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <div className="mb-4 flex items-center gap-4">
        <Avatar url={row.avatar_url} username={row.username} size={80} />
        <div className="flex-1">
          <h1 className="text-xl font-medium text-violet-950">@{row.username}</h1>
          {row.bio ? (
            <p className="mt-1 text-sm text-neutral-600">{row.bio}</p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400">{t("noBio")}</p>
          )}
        </div>
        {viewer && !isOwnProfile && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <FollowButton targetUserId={row.id} username={row.username} initialIsFollowing={isFollowing} />
            <FriendButton
              targetUserId={row.id}
              username={row.username}
              initialStatus={friendStatus}
              initialRequestId={friendRequestId}
            />
          </div>
        )}
      </div>

      <div className="mb-6 flex gap-5 text-sm">
        <Link href={`/u/${row.username}/followers`} className="text-neutral-600 hover:text-violet-700">
          <span className="font-medium text-violet-950">{followerCount ?? 0}</span> {t("followers")}
        </Link>
        <Link href={`/u/${row.username}/following`} className="text-neutral-600 hover:text-violet-700">
          <span className="font-medium text-violet-950">{followingCount ?? 0}</span> {t("following")}
        </Link>
        <Link href={`/u/${row.username}/friends`} className="text-neutral-600 hover:text-violet-700">
          <span className="font-medium text-violet-950">{friendCount ?? 0}</span> {t("friends")}
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-medium tracking-wide text-neutral-400 uppercase">{t("publicGraphs")}</h2>
      {publicGraphs.length === 0 ? (
        <p className="mb-8 text-sm text-neutral-500">{t("noPublicGraphs")}</p>
      ) : (
        <ul className="mb-8 flex flex-col gap-3">
          {publicGraphs.map((g) => (
            <li key={g.id} className="rounded-lg border border-violet-100 bg-white p-4 shadow-sm">
              <Link href={`/g/${g.id}`} className="font-medium text-violet-950 hover:underline">
                {g.title}
              </Link>
              <p className="text-xs text-neutral-500">
                {g.node_count} {tCommon("nodes")} · {g.edge_count} {tCommon("edges")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-sm font-medium tracking-wide text-neutral-400 uppercase">{t("posts")}</h2>
      {postRows.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("noPosts")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {postRows.map((post) => {
            const graph = postGraphById.get(post.graph_id);
            if (!graph) return null;
            return (
              <li key={post.id}>
                <FeedPostCard
                  post={post}
                  graph={graph}
                  username={row.username}
                  avatarUrl={row.avatar_url}
                  evaluations={postEvaluationsByGraphId.get(post.graph_id) ?? []}
                  isOwner={isOwnProfile}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
