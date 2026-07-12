import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedPostCard } from "@/components/FeedPostCard";
import type { GraphEvaluationRow, GraphRow, PostRow, ProfileRow } from "@/lib/supabase/dbTypes";

export default async function MyFollowsPage() {
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) redirect("/login?redirectTo=/follows");

  const { data: follows } = await supabase.from("follows").select("followee_id").eq("follower_id", viewer.id);
  const followedIds = (follows ?? []).map((f) => f.followee_id);

  if (followedIds.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6 text-center">
        <h1 className="mb-6 text-left text-xl font-medium text-violet-950">My Follows</h1>
        <p className="mt-16 text-sm text-neutral-500">
          You&apos;re not following anyone yet.{" "}
          <Link href="/feed" className="text-violet-600 hover:underline">
            Explore
          </Link>{" "}
          to find people to follow.
        </p>
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .in("user_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(50);

  const postRows = (posts ?? []) as PostRow[];

  if (postRows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6 text-center">
        <h1 className="mb-6 text-left text-xl font-medium text-violet-950">My Follows</h1>
        <p className="mt-16 text-sm text-neutral-500">No posts yet from people you follow.</p>
      </div>
    );
  }

  const graphIds = [...new Set(postRows.map((p) => p.graph_id))];
  const [{ data: graphs }, { data: profiles }, { data: evaluations }] = await Promise.all([
    supabase.from("graphs").select("*").in("id", graphIds),
    supabase.from("profiles").select("*").in("id", followedIds),
    supabase.from("graph_evaluations").select("*").in("graph_id", graphIds),
  ]);

  const graphById = new Map((graphs as GraphRow[] | null)?.map((g) => [g.id, g]) ?? []);
  const profileById = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]) ?? []);
  const evaluationsByGraphId = new Map<string, GraphEvaluationRow[]>();
  for (const evaluation of (evaluations as GraphEvaluationRow[] | null) ?? []) {
    const list = evaluationsByGraphId.get(evaluation.graph_id) ?? [];
    list.push(evaluation);
    evaluationsByGraphId.set(evaluation.graph_id, list);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <h1 className="mb-6 text-xl font-medium text-violet-950">My Follows</h1>
      <ul className="flex flex-col gap-4">
        {postRows.map((post) => {
          const graph = graphById.get(post.graph_id);
          if (!graph) return null;
          const author = profileById.get(post.user_id);
          return (
            <li key={post.id}>
              <FeedPostCard
                post={post}
                graph={graph}
                username={author?.username ?? "unknown"}
                avatarUrl={author?.avatar_url}
                evaluations={evaluationsByGraphId.get(post.graph_id) ?? []}
                isOwner={viewer.id === post.user_id}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
