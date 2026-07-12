"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicClient } from "@/lib/llm/client";
import { generateGraphProfile } from "@/lib/llm/profile";
import { buildGraphSummary } from "@/lib/graph/summary";
import { runBaselineAgent, runGraphAgent } from "@/lib/eval/agents";
import { judgeComparison } from "@/lib/eval/judge";
import type { GraphEvaluationRow, GraphRow, PostRow } from "@/lib/supabase/dbTypes";
import type { Scenario } from "@/lib/graph/types";
import { isPostCategory, type PostCategory } from "@/lib/categories";

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

/**
 * Runs every saved scenario through a baseline (no-tools) agent and a
 * graph-augmented agent, judges both, and persists each result as it
 * completes -- so a failure partway through doesn't lose earlier runs.
 */
export async function runEvaluation(graphId: string): Promise<{ error?: string; results?: GraphEvaluationRow[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: graph, error: fetchError } = await supabase.from("graphs").select("*").eq("id", graphId).single();
  if (fetchError || !graph) return { error: "Graph not found." };

  const row = graph as GraphRow;
  if (row.user_id !== user.id) return { error: "You can only evaluate your own graphs." };
  if (row.scenarios.length === 0) return { error: "Generate or write test questions first." };

  let llm;
  try {
    llm = createAnthropicClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "LLM is not configured on the server." };
  }

  // Clear prior runs first: they're tied to whatever the scenario set looked
  // like when they ran, so mixing them with a fresh run against the current
  // scenarios would be misleading.
  await supabase.from("graph_evaluations").delete().eq("graph_id", graphId);

  const results: GraphEvaluationRow[] = [];

  for (const scenario of row.scenarios) {
    const baselineAnswer = await runBaselineAgent(llm, scenario.question);
    const { answer: graphAnswer, toolCalls } = await runGraphAgent(llm, row.graph_data.vault, scenario.question, {
      graphDescription: row.description ?? undefined,
    });
    const judge = await judgeComparison(llm, scenario.question, scenario.whyRelevant, baselineAnswer, graphAnswer);

    const { data: inserted, error: insertError } = await supabase
      .from("graph_evaluations")
      .insert({
        graph_id: graphId,
        question: scenario.question,
        why_relevant: scenario.whyRelevant,
        baseline_answer: baselineAnswer,
        graph_answer: graphAnswer,
        graph_tool_calls: toolCalls,
        baseline_groundedness: judge.baselineScores.groundedness,
        baseline_framework_consistency: judge.baselineScores.frameworkConsistency,
        baseline_specificity: judge.baselineScores.specificity,
        graph_groundedness: judge.graphScores.groundedness,
        graph_framework_consistency: judge.graphScores.frameworkConsistency,
        graph_specificity: judge.graphScores.specificity,
        winner: judge.winner,
        judge_reasoning: judge.reasoning,
      })
      .select("*")
      .single();

    if (insertError) return { error: insertError.message, results };
    results.push(inserted as GraphEvaluationRow);
  }

  revalidatePath(`/g/${graphId}`);
  return { results };
}

/** Clears prior evaluation runs for a graph, e.g. before re-running after editing scenarios. */
export async function clearEvaluations(graphId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.from("graph_evaluations").delete().eq("graph_id", graphId);
  if (error) return { error: error.message };

  revalidatePath(`/g/${graphId}`);
  return {};
}

/**
 * Publishes a feed post promoting this graph. A post about a private graph
 * would never be visible to anyone else (RLS ties post visibility to the
 * graph's), so posting also makes the graph public -- promoting something
 * you can't see defeats the point.
 */
export async function createPost(
  graphId: string,
  content: string,
  category: PostCategory
): Promise<{ error?: string; post?: PostRow }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Write something first." };
  if (!isPostCategory(category)) return { error: "Choose a valid category." };

  const { error: visibilityError } = await supabase
    .from("graphs")
    .update({ visibility: "public" })
    .eq("id", graphId)
    .eq("user_id", user.id);
  if (visibilityError) return { error: visibilityError.message };

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, graph_id: graphId, content: trimmed, category })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/feed");
  revalidatePath(`/g/${graphId}`);
  return { post: post as PostRow };
}

export async function deletePost(postId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return {};
}
