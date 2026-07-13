import type { ParsedEdge, ParsedNode, ParsedVault } from "./types";

/** Node ids are just titles within one vault, so importing multiple graphs into the same canvas needs namespacing to avoid collisions. */
export function namespacedId(graphId: string, nodeId: string): string {
  return `${graphId}::${nodeId}`;
}

export interface PlaygroundSource {
  graphId: string;
  graphTitle: string;
  vault: ParsedVault;
}

export interface ManualLink {
  sourceId: string;
  targetId: string;
  /** Undirected by default -- an arrow is only drawn when this is true. */
  directed: boolean;
  label?: string;
}

export interface NodeOverride {
  title?: string;
  type?: string;
}

/** Which imported graph a node came from, so the canvas can color/group by source and a removed import can be filtered back out. */
export const SOURCE_GRAPH_FIELD = "__sourceGraphId";
export const SOURCE_GRAPH_TITLE_FIELD = "__sourceGraphTitle";
export const MANUAL_NODE_PREFIX = "manual::";

export function createManualNode(title: string): ParsedNode {
  const id = `${MANUAL_NODE_PREFIX}${crypto.randomUUID()}`;
  return { id, title, body: "", frontmatter: {}, sourcePath: "" };
}

/**
 * Merges every imported graph's nodes/edges (namespaced per source), any
 * nodes added directly in the Playground, and manually-drawn links into one
 * combined vault -- applying renames/retypes and dropping deleted nodes
 * (and anything touching them) along the way -- so the existing
 * structural-metrics and layout code can run over it unmodified.
 */
export function buildCombinedVault(
  sources: PlaygroundSource[],
  manualLinks: ManualLink[],
  manualNodes: ParsedNode[],
  hiddenNodeIds: Set<string>,
  nodeOverrides: Map<string, NodeOverride>
): ParsedVault {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];

  function applyOverride(n: ParsedNode): ParsedNode {
    const override = nodeOverrides.get(n.id);
    if (!override) return n;
    return {
      ...n,
      title: override.title ?? n.title,
      frontmatter: override.type !== undefined ? { ...n.frontmatter, type: override.type || undefined } : n.frontmatter,
    };
  }

  for (const source of sources) {
    for (const n of source.vault.nodes) {
      const id = namespacedId(source.graphId, n.id);
      if (hiddenNodeIds.has(id)) continue;
      nodes.push(
        applyOverride({
          ...n,
          id,
          frontmatter: {
            ...n.frontmatter,
            [SOURCE_GRAPH_FIELD]: source.graphId,
            [SOURCE_GRAPH_TITLE_FIELD]: source.graphTitle,
          },
        })
      );
    }
    for (const e of source.vault.edges) {
      const sourceId = namespacedId(source.graphId, e.sourceId);
      const targetId = namespacedId(source.graphId, e.targetId);
      if (hiddenNodeIds.has(sourceId) || hiddenNodeIds.has(targetId)) continue;
      edges.push({ sourceId, targetId, context: e.context });
    }
  }

  for (const n of manualNodes) {
    if (hiddenNodeIds.has(n.id)) continue;
    nodes.push(applyOverride(n));
  }

  for (const link of manualLinks) {
    if (hiddenNodeIds.has(link.sourceId) || hiddenNodeIds.has(link.targetId)) continue;
    edges.push({
      sourceId: link.sourceId,
      targetId: link.targetId,
      context: link.label || "Manually linked in the Knowledge Playground",
    });
  }

  return { nodes, edges };
}

/** Breadth-first shortest path over the combined graph, treating every edge (original or manual) as undirected. */
export function findShortestPath(vault: ParsedVault, startId: string, endId: string): string[] | null {
  if (startId === endId) return [startId];

  const adjacency = new Map<string, Set<string>>();
  for (const n of vault.nodes) adjacency.set(n.id, new Set());
  for (const e of vault.edges) {
    adjacency.get(e.sourceId)?.add(e.targetId);
    adjacency.get(e.targetId)?.add(e.sourceId);
  }

  const visited = new Set<string>([startId]);
  const queue: string[][] = [[startId]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    for (const neighbor of adjacency.get(node) ?? []) {
      if (neighbor === endId) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}
