import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GraphEvaluationRow, GraphRow, GraphVersionRow, PostRow, ProfileRow } from "@/lib/supabase/dbTypes";
import { PublicGraphView } from "./PublicGraphView";

export default async function GraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS scopes this to public graphs, or the caller's own graphs if logged in.
  // A private graph belonging to someone else simply returns no row here.
  const [{ data: graph }, { data: userData }] = await Promise.all([
    supabase.from("graphs").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!graph) notFound();

  const row = graph as GraphRow;
  const isOwner = userData.user?.id === row.user_id;

  const [{ data: evaluations }, { data: versions }, { data: posts }] = await Promise.all([
    supabase.from("graph_evaluations").select("*").eq("graph_id", id).order("created_at", { ascending: true }),
    supabase.from("graph_versions").select("*").eq("graph_id", id).order("version_number", { ascending: false }),
    supabase.from("posts").select("*").eq("graph_id", id).order("created_at", { ascending: false }),
  ]);

  const postRows = (posts ?? []) as PostRow[];
  const authorIds = [...new Set(postRows.map((p) => p.user_id))];
  const { data: authors } = authorIds.length ? await supabase.from("profiles").select("*").in("id", authorIds) : { data: [] };

  return (
    <PublicGraphView
      graph={row}
      isOwner={isOwner}
      evaluations={(evaluations ?? []) as GraphEvaluationRow[]}
      versions={(versions ?? []) as GraphVersionRow[]}
      posts={postRows}
      authors={(authors ?? []) as ProfileRow[]}
    />
  );
}
