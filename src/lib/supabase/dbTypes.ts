import type { NodeMetrics, ParsedVault, Scenario } from "@/lib/graph/types";
import type { PostCategory } from "@/lib/categories";

export interface StoredGraphPayload {
  vault: ParsedVault;
  metrics: NodeMetrics[];
}

export type GraphVisibility = "private" | "public";

export interface GraphRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  visibility: GraphVisibility;
  node_count: number;
  edge_count: number;
  graph_data: StoredGraphPayload;
  scenarios: Scenario[];
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface GraphEvaluationRow {
  id: string;
  graph_id: string;
  question: string;
  why_relevant: string;
  baseline_answer: string;
  graph_answer: string;
  graph_tool_calls: Array<{ tool: string; input: Record<string, unknown>; resultSummary: string }>;
  baseline_groundedness: number;
  baseline_framework_consistency: number;
  baseline_specificity: number;
  graph_groundedness: number;
  graph_framework_consistency: number;
  graph_specificity: number;
  winner: "baseline" | "graph" | "tie";
  judge_reasoning: string;
  created_at: string;
}

export interface PostRow {
  id: string;
  user_id: string;
  graph_id: string;
  content: string;
  category: PostCategory;
  created_at: string;
}
