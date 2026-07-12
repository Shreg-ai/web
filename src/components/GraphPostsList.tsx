"use client";

import { useTranslations } from "next-intl";
import { FeedPostCard } from "@/components/FeedPostCard";
import type { GraphEvaluationRow, GraphRow, PostRow, ProfileRow } from "@/lib/supabase/dbTypes";

/** Compact "posts about this graph" list, shown on the graph page itself -- the graph mini-card in each post would be redundant here, so it's hidden and content is clamped. */
export function GraphPostsList({
  graph,
  posts,
  authors,
  evaluations,
  currentUserId,
}: {
  graph: GraphRow;
  posts: PostRow[];
  authors: ProfileRow[];
  evaluations: GraphEvaluationRow[];
  currentUserId?: string | null;
}) {
  const t = useTranslations("graphPostsList");
  if (posts.length === 0) return null;

  const authorById = new Map(authors.map((a) => [a.id, a]));

  return (
    <div>
      <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">
        {t("heading", { count: posts.length })}
      </h2>
      <ul className="flex flex-col gap-3">
        {posts.map((post) => {
          const author = authorById.get(post.user_id);
          return (
            <li key={post.id}>
              <FeedPostCard
                post={post}
                graph={graph}
                username={author?.username ?? "unknown"}
                avatarUrl={author?.avatar_url}
                evaluations={evaluations}
                isOwner={currentUserId === post.user_id}
                showGraphCard={false}
                truncate
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
