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
