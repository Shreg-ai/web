"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GraphVisibility, StoredGraphPayload } from "@/lib/supabase/dbTypes";

export async function saveGraph(input: {
  title: string;
  visibility: GraphVisibility;
  payload: StoredGraphPayload;
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to save a graph." };

  const title = input.title.trim();
  if (!title) return { error: "Title is required." };

  const nodeCount = input.payload.vault.nodes.length;
  const edgeCount = input.payload.vault.edges.length;

  const { data, error } = await supabase
    .from("graphs")
    .insert({
      user_id: user.id,
      title,
      visibility: input.visibility,
      node_count: nodeCount,
      edge_count: edgeCount,
      graph_data: input.payload,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const graphId = data.id as string;

  // Every graph starts life as version 1 of itself.
  await supabase.from("graph_versions").insert({
    graph_id: graphId,
    version_number: 1,
    graph_data: input.payload,
    node_count: nodeCount,
    edge_count: edgeCount,
  });

  revalidatePath("/dashboard");
  return { id: graphId };
}

export async function deleteGraph(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("graphs").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}

export async function setGraphVisibility(id: string, visibility: GraphVisibility): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("graphs").update({ visibility }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}
