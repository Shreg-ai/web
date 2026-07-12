import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { GraphEvaluationRow, GraphRow, PostRow, ProfileRow } from "@/lib/supabase/dbTypes";
import { FeedPostCard } from "@/components/FeedPostCard";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);

  const postRows = (posts ?? []) as PostRow[];

  if (postRows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6 text-center">
        <p className="mt-16 text-sm text-neutral-500">
          No posts yet. Be the first — save a graph, generate a description, and share it to the feed.
        </p>
      </div>
    );
  }

  const graphIds = [...new Set(postRows.map((p) => p.graph_id))];
  const userIds = [...new Set(postRows.map((p) => p.user_id))];

  const [{ data: graphs }, { data: profiles }, { data: evaluations }] = await Promise.all([
    supabase.from("graphs").select("*").in("id", graphIds),
    supabase.from("profiles").select("*").in("id", userIds),
    supabase.from("graph_evaluations").select("*").in("graph_id", graphIds),
  ]);

  const graphById = new Map((graphs as GraphRow[] | null)?.map((g) => [g.id, g]) ?? []);
  const usernameById = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p.username]) ?? []);
  const evaluationsByGraphId = new Map<string, GraphEvaluationRow[]>();
  for (const evaluation of (evaluations as GraphEvaluationRow[] | null) ?? []) {
    const list = evaluationsByGraphId.get(evaluation.graph_id) ?? [];
    list.push(evaluation);
    evaluationsByGraphId.set(evaluation.graph_id, list);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <h1 className="mb-6 text-xl font-medium text-violet-950">Feed</h1>
      <ul className="flex flex-col gap-4">
        {postRows.map((post) => {
          const graph = graphById.get(post.graph_id);
          if (!graph) return null; // graph went private/deleted since the post was made
          return (
            <li key={post.id}>
              <FeedPostCard
                post={post}
                graph={graph}
                username={usernameById.get(post.user_id) ?? "unknown"}
                evaluations={evaluationsByGraphId.get(post.graph_id) ?? []}
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-center text-xs text-neutral-400">
        Have your own knowledge graph? <Link href="/" className="text-violet-600 hover:underline">Upload one</Link> and share it.
      </p>
    </div>
  );
}
