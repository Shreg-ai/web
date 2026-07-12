"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicClient } from "@/lib/llm/client";
import { generateGraphProfile } from "@/lib/llm/profile";
import { buildGraphSummary } from "@/lib/graph/summary";
import type { GraphRow } from "@/lib/supabase/dbTypes";
import type { Scenario } from "@/lib/graph/types";

export async function generateProfile(
  graphId: string
): Promise<{ error?: string; description?: string; scenarios?: Scenario[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: graph, error: fetchError } = await supabase.from("graphs").select("*").eq("id", graphId).single();
  if (fetchError || !graph) return { error: "Graph not found." };

  const row = graph as GraphRow;
  if (row.user_id !== user.id) return { error: "You can only analyze your own graphs." };

  let llm;
  try {
    llm = createAnthropicClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "LLM is not configured on the server." };
  }

  const summary = buildGraphSummary(row.graph_data.vault, row.graph_data.metrics);

  let profile;
  try {
    profile = await generateGraphProfile(llm, summary, 5);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to generate profile." };
  }

  const { error: updateError } = await supabase
    .from("graphs")
    .update({ description: profile.description, scenarios: profile.scenarios })
    .eq("id", graphId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/g/${graphId}`);
  return { description: profile.description, scenarios: profile.scenarios };
}

export async function saveProfile(graphId: string, description: string, scenarios: Scenario[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("graphs")
    .update({ description, scenarios })
    .eq("id", graphId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/g/${graphId}`);
  return {};
}
