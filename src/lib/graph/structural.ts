import type { NodeMetrics, ParsedVault } from "./types";

/**
 * Computes cheap, deterministic structural signals for every node: in/out
 * degree (hub detection) and connected-component membership (topic
 * clustering). Mirrors compiler/src/analysis/structural.ts.
 */
export function computeStructuralMetrics(vault: ParsedVault): NodeMetrics[] {
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  const undirected = new Map<string, Set<string>>();

  for (const node of vault.nodes) {
    inDegree.set(node.id, 0);
    outDegree.set(node.id, 0);
    undirected.set(node.id, new Set());
  }

  for (const edge of vault.edges) {
    outDegree.set(edge.sourceId, (outDegree.get(edge.sourceId) ?? 0) + 1);
    inDegree.set(edge.targetId, (inDegree.get(edge.targetId) ?? 0) + 1);
    undirected.get(edge.sourceId)?.add(edge.targetId);
    undirected.get(edge.targetId)?.add(edge.sourceId);
  }

  const clusterId = new Map<string, number>();
  let nextCluster = 0;

  for (const node of vault.nodes) {
    if (clusterId.has(node.id)) continue;

    const queue = [node.id];
    clusterId.set(node.id, nextCluster);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of undirected.get(current) ?? []) {
        if (!clusterId.has(neighbor)) {
          clusterId.set(neighbor, nextCluster);
          queue.push(neighbor);
        }
      }
    }

    nextCluster += 1;
  }

  return vault.nodes.map((node) => ({
    nodeId: node.id,
    inDegree: inDegree.get(node.id) ?? 0,
    outDegree: outDegree.get(node.id) ?? 0,
    clusterId: clusterId.get(node.id) ?? -1,
  }));
}
