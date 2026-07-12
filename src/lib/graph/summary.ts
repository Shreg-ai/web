import type { GraphSummary, NodeMetrics, ParsedVault } from "./types";

/**
 * Builds a context-window-sized summary of the graph, used to seed the
 * profile prompt. Ported from compiler's GraphStore.buildSummary, adapted to
 * operate on an in-memory vault + metrics array instead of a SQLite query,
 * since the web app stores the graph as JSONB rather than a local db file.
 */
export function buildGraphSummary(vault: ParsedVault, metrics: NodeMetrics[], hubCount = 8): GraphSummary {
  const degreeByNodeId = new Map(metrics.map((m) => [m.nodeId, m.inDegree + m.outDegree]));
  const clusterIds = new Set(metrics.map((m) => m.clusterId));

  const sortedByDegree = [...vault.nodes].sort(
    (a, b) => (degreeByNodeId.get(b.id) ?? 0) - (degreeByNodeId.get(a.id) ?? 0)
  );
  const hubs = sortedByDegree.slice(0, hubCount);
  const hubIds = new Set(hubs.map((n) => n.id));

  return {
    totalNodes: vault.nodes.length,
    totalEdges: vault.edges.length,
    clusterCount: clusterIds.size,
    hubNodes: hubs.map((n) => {
      const m = metrics.find((metric) => metric.nodeId === n.id);
      return {
        id: n.id,
        title: n.title,
        snippet: n.body.slice(0, 300),
        inDegree: m?.inDegree ?? 0,
        outDegree: m?.outDegree ?? 0,
      };
    }),
    otherTitles: vault.nodes.filter((n) => !hubIds.has(n.id)).map((n) => n.title),
  };
}
