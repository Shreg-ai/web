import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GraphRow } from "@/lib/supabase/dbTypes";
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

  return <PublicGraphView graph={row} isOwner={isOwner} />;
}
