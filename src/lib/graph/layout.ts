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

export interface ForceLayoutOptions {
  /** Target distance along links -- lower pulls connected nodes closer together. */
  linkDistance?: number;
  /** d3-force "charge" (repulsion) strength -- less negative means less push-apart, so nodes cluster tighter. */
  chargeStrength?: number;
  /** Minimum center-to-center distance per node, keyed by degree -- the hard floor that keeps "tighter" from turning into "overlapping". */
  collideRadius?: (degree: number) => number;
}

const DEFAULT_COLLIDE_RADIUS = (degree: number) => 24 + Math.min(40, degree * 4);

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
  height: number,
  options?: ForceLayoutOptions
): Map<string, LayoutNode> {
  const degreeById = new Map(metrics.map((m) => [m.nodeId, m.inDegree + m.outDegree]));
  const collideRadius = options?.collideRadius ?? DEFAULT_COLLIDE_RADIUS;

  const simNodes: SimNode[] = vault.nodes.map((n) => ({ id: n.id }));
  const simLinks = vault.edges.map((e) => ({ source: e.sourceId, target: e.targetId }));

  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink(simLinks)
        .id((d: unknown) => (d as SimNode).id)
        .distance(options?.linkDistance ?? 120)
    )
    .force("charge", forceManyBody().strength(options?.chargeStrength ?? -250))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "collide",
      forceCollide((d: unknown) => collideRadius(degreeById.get((d as SimNode).id) ?? 0))
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
