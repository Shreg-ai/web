import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { GraphEvaluationRow, GraphRow, PostRow, ProfileRow } from "@/lib/supabase/dbTypes";
import { FeedPostCard } from "@/components/FeedPostCard";
import { isPostCategory } from "@/lib/categories";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ categories?: string }>;
}) {
  const { categories: categoriesParam } = await searchParams;
  const selectedCategories = (categoriesParam ?? "").split(",").filter(isPostCategory);
  const t = await getTranslations("feed");

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  let query = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
  if (selectedCategories.length > 0) {
    query = query.in("category", selectedCategories);
  }
  const { data: posts } = await query;

  const postRows = (posts ?? []) as PostRow[];

  if (postRows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6 text-center">
        <p className="mt-16 text-sm text-neutral-500">
          {selectedCategories.length > 0 ? t("emptyFiltered") : t("emptyAll")}
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
  const profileById = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]) ?? []);
  const evaluationsByGraphId = new Map<string, GraphEvaluationRow[]>();
  for (const evaluation of (evaluations as GraphEvaluationRow[] | null) ?? []) {
    const list = evaluationsByGraphId.get(evaluation.graph_id) ?? [];
    list.push(evaluation);
    evaluationsByGraphId.set(evaluation.graph_id, list);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-white p-6">
      <h1 className="mb-6 text-xl font-medium text-violet-950">{t("title")}</h1>
      <ul className="flex flex-col gap-4">
        {postRows.map((post) => {
          const graph = graphById.get(post.graph_id);
          if (!graph) return null; // graph went private/deleted since the post was made
          const author = profileById.get(post.user_id);
          return (
            <li key={post.id}>
              <FeedPostCard
                post={post}
                graph={graph}
                username={author?.username ?? "unknown"}
                avatarUrl={author?.avatar_url}
                evaluations={evaluationsByGraphId.get(post.graph_id) ?? []}
                isOwner={viewer?.id === post.user_id}
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-center text-xs text-neutral-400">
        {t("ownGraphCta")} <Link href="/" className="text-violet-600 hover:underline">{t("uploadOne")}</Link> {t("andShareIt")}
      </p>
    </div>
  );
}
