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

  const { data, error } = await supabase
    .from("graphs")
    .insert({
      user_id: user.id,
      title,
      visibility: input.visibility,
      node_count: input.payload.vault.nodes.length,
      edge_count: input.payload.vault.edges.length,
      graph_data: input.payload,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { id: data.id as string };
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
