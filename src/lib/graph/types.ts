export interface ParsedNode {
  id: string;
  title: string;
  body: string;
  frontmatter: Record<string, unknown>;
  sourcePath: string;
}

export interface ParsedEdge {
  sourceId: string;
  targetId: string;
  context: string;
}

export interface ParsedVault {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
}

export interface NodeMetrics {
  nodeId: string;
  inDegree: number;
  outDegree: number;
  clusterId: number;
}

export interface VaultFile {
  relativePath: string;
  title: string;
  raw: string;
}

/** A compact, LLM-context-sized view of the graph used to generate the profile. */
export interface GraphSummary {
  totalNodes: number;
  totalEdges: number;
  clusterCount: number;
  /** Highest-degree nodes, with a body snippet, used to seed the profile prompt. */
  hubNodes: Array<{ id: string; title: string; snippet: string; inDegree: number; outDegree: number }>;
  /** Every other node, title only, so the LLM sees full breadth without full bodies. */
  otherTitles: string[];
}

export interface Scenario {
  question: string;
  whyRelevant: string;
  relevantNodeIds: string[];
}

export interface GraphProfile {
  description: string;
  scenarios: Scenario[];
}
