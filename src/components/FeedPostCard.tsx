import Link from "next/link";
import type { GraphEvaluationRow, GraphRow, PostRow } from "@/lib/supabase/dbTypes";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function FeedPostCard({
  post,
  graph,
  username,
  evaluations,
}: {
  post: PostRow;
  graph: GraphRow;
  username: string;
  evaluations: GraphEvaluationRow[];
}) {
  const graphWins = evaluations.filter((e) => e.winner === "graph").length;

  return (
    <article className="rounded-lg border border-violet-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
        <Link href={`/u/${username}`} className="font-medium text-violet-700 hover:underline">
          @{username}
        </Link>
        <span>·</span>
        <span>{timeAgo(post.created_at)}</span>
      </div>

      <p className="mb-3 text-sm whitespace-pre-wrap text-neutral-800">{post.content}</p>

      <Link href={`/g/${graph.id}`} className="block rounded-md bg-violet-50/60 p-3 hover:bg-violet-50">
        <p className="text-sm font-medium text-violet-950">{graph.title}</p>
        {graph.description && <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{graph.description}</p>}
        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
          <span>
            {graph.node_count} nodes · {graph.edge_count} edges
          </span>
          {evaluations.length > 0 && (
            <span className="font-medium text-violet-700">
              {graphWins}/{evaluations.length} eval wins
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
