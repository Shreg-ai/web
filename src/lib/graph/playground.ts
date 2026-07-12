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
}

/** Which imported graph a node came from, so the canvas can color/group by source and a removed import can be filtered back out. */
export const SOURCE_GRAPH_FIELD = "__sourceGraphId";
export const SOURCE_GRAPH_TITLE_FIELD = "__sourceGraphTitle";

/**
 * Merges every imported graph's nodes/edges (namespaced per source) plus any
 * manually-drawn cross-graph links into one combined vault, so the existing
 * structural-metrics and layout code can run over it unmodified.
 */
export function buildCombinedVault(sources: PlaygroundSource[], manualLinks: ManualLink[]): ParsedVault {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];

  for (const source of sources) {
    for (const n of source.vault.nodes) {
      nodes.push({
        ...n,
        id: namespacedId(source.graphId, n.id),
        frontmatter: {
          ...n.frontmatter,
          [SOURCE_GRAPH_FIELD]: source.graphId,
          [SOURCE_GRAPH_TITLE_FIELD]: source.graphTitle,
        },
      });
    }
    for (const e of source.vault.edges) {
      edges.push({
        sourceId: namespacedId(source.graphId, e.sourceId),
        targetId: namespacedId(source.graphId, e.targetId),
        context: e.context,
      });
    }
  }

  for (const link of manualLinks) {
    edges.push({ sourceId: link.sourceId, targetId: link.targetId, context: "Manually linked in the Knowledge Playground" });
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
