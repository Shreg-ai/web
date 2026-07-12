import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

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
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  username: string;
  created_at: string;
}
