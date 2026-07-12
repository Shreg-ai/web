"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GraphRow, StoredGraphPayload } from "@/lib/supabase/dbTypes";

export interface ImportableGraph {
  id: string;
  title: string;
  node_count: number;
  edge_count: number;
  username: string;
  isOwn: boolean;
}

/** Every graph the current user can import: their own (any visibility) plus anyone's public graph that's opted into structure sharing. */
export async function listImportableGraphs(): Promise<{ error?: string; graphs?: ImportableGraph[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const [{ data: ownGraphs }, { data: sharedGraphs }] = await Promise.all([
    supabase.from("graphs").select("id, title, node_count, edge_count, user_id").eq("user_id", user.id),
    supabase
      .from("graphs")
      .select("id, title, node_count, edge_count, user_id")
      .eq("visibility", "public")
      .eq("share_full_structure", true),
  ]);

  type Row = { id: string; title: string; node_count: number; edge_count: number; user_id: string };
  const rows = [...((ownGraphs ?? []) as Row[]), ...((sharedGraphs ?? []) as Row[])];
  const rowById = new Map(rows.map((r) => [r.id, r]));

  const userIds = [...new Set([...rowById.values()].map((r) => r.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, username").in("id", userIds)
    : { data: [] };
  const usernameById = new Map(((profiles ?? []) as { id: string; username: string }[]).map((p) => [p.id, p.username]));

  const graphs: ImportableGraph[] = [...rowById.values()].map((r) => ({
    id: r.id,
    title: r.title,
    node_count: r.node_count,
    edge_count: r.edge_count,
    username: usernameById.get(r.user_id) ?? "unknown",
    isOwn: r.user_id === user.id,
  }));

  return { graphs };
}

/** Fetches a graph's actual structure for import -- only if it's the caller's own graph, or a public graph with structure sharing turned on. */
export async function getGraphStructureForImport(
  graphId: string
): Promise<{ error?: string; title?: string; payload?: StoredGraphPayload }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: graph, error } = await supabase.from("graphs").select("*").eq("id", graphId).single();
  if (error || !graph) return { error: "Graph not found." };

  const row = graph as GraphRow;
  const isOwn = row.user_id === user.id;
  const isSharedPublic = row.visibility === "public" && row.share_full_structure;
  if (!isOwn && !isSharedPublic) return { error: "This graph's structure hasn't been shared." };

  return { title: row.title, payload: row.graph_data };
}

export async function setShareFullStructure(graphId: string, share: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const update: { share_full_structure: boolean; visibility?: "public" } = { share_full_structure: share };
  if (share) update.visibility = "public"; // sharing the structure implies the graph itself must already be public

  const { error } = await supabase.from("graphs").update(update).eq("id", graphId).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/g/${graphId}`);
  return {};
}
