import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedPostCard } from "@/components/FeedPostCard";
import type { GraphEvaluationRow, GraphRow, PostRow, ProfileRow } from "@/lib/supabase/dbTypes";

export default async function MyPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/posts");

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const postRows = (posts ?? []) as PostRow[];

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const author = profile as ProfileRow | null;

  if (postRows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6 text-center">
        <h1 className="mb-6 text-left text-xl font-medium text-violet-950">My Posts</h1>
        <p className="mt-16 text-sm text-neutral-500">
          You haven&apos;t posted anything yet. Share a graph from its page to get started.
        </p>
      </div>
    );
  }

  const graphIds = [...new Set(postRows.map((p) => p.graph_id))];
  const [{ data: graphs }, { data: evaluations }] = await Promise.all([
    supabase.from("graphs").select("*").in("id", graphIds),
    supabase.from("graph_evaluations").select("*").in("graph_id", graphIds),
  ]);

  const graphById = new Map((graphs as GraphRow[] | null)?.map((g) => [g.id, g]) ?? []);
  const evaluationsByGraphId = new Map<string, GraphEvaluationRow[]>();
  for (const evaluation of (evaluations as GraphEvaluationRow[] | null) ?? []) {
    const list = evaluationsByGraphId.get(evaluation.graph_id) ?? [];
    list.push(evaluation);
    evaluationsByGraphId.set(evaluation.graph_id, list);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <h1 className="mb-6 text-xl font-medium text-violet-950">My Posts</h1>
      <ul className="flex flex-col gap-4">
        {postRows.map((post) => {
          const graph = graphById.get(post.graph_id);
          if (!graph) return null;
          return (
            <li key={post.id}>
              <FeedPostCard
                post={post}
                graph={graph}
                username={author?.username ?? "unknown"}
                avatarUrl={author?.avatar_url}
                evaluations={evaluationsByGraphId.get(post.graph_id) ?? []}
                isOwner
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
