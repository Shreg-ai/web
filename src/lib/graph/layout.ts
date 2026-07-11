import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import type { NodeMetrics, ParsedVault } from "./types";

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

interface SimNode {
  id: string;
  x?: number;
  y?: number;
}

/**
 * Force-directed layout (the classic "knowledge graph" look), computed
 * synchronously to convergence rather than animated tick-by-tick — simpler
 * for a first version, and instant enough for graphs in the hundreds of
 * nodes that this tool targets.
 */
export function computeForceLayout(
  vault: ParsedVault,
  metrics: NodeMetrics[],
  width: number,
  height: number
): Map<string, LayoutNode> {
  const degreeById = new Map(metrics.map((m) => [m.nodeId, m.inDegree + m.outDegree]));

  const simNodes: SimNode[] = vault.nodes.map((n) => ({ id: n.id }));
  const simLinks = vault.edges.map((e) => ({ source: e.sourceId, target: e.targetId }));

  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink(simLinks)
        .id((d: unknown) => (d as SimNode).id)
        .distance(120)
    )
    .force("charge", forceManyBody().strength(-250))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "collide",
      forceCollide((d: unknown) => 24 + Math.min(40, (degreeById.get((d as SimNode).id) ?? 0) * 4))
    )
    .stop();

  const tickCount = Math.min(500, Math.max(150, simNodes.length * 3));
  for (let i = 0; i < tickCount; i++) {
    simulation.tick();
  }

  const positions = new Map<string, LayoutNode>();
  for (const node of simNodes) {
    positions.set(node.id, { id: node.id, x: node.x ?? 0, y: node.y ?? 0 });
  }
  return positions;
}
