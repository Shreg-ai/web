import { useEffect, useRef } from "react";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type Simulation } from "d3-force";

interface SimNode {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
}

export interface LiveForceSimulationParams {
  nodeIds: string[];
  links: { sourceId: string; targetId: string }[];
  width: number;
  height: number;
  linkDistance: number;
  chargeStrength: number;
  radiusById: Map<string, number>;
  /** Include anything (like an "enlarged" toggle) that should force a reconfigure + reheat even when nodeIds/links/width/height/linkDistance/chargeStrength are otherwise unchanged -- e.g. only radiusById's values changed for the same node set. */
  extraDep?: string | number | boolean;
  onTick: (positions: Map<string, { x: number; y: number }>) => void;
}

export interface LiveForceSimulationHandle {
  pin: (id: string, x: number, y: number) => void;
  /** Cools the simulation back down after a drag -- the dragged node stays pinned (fx/fy are never cleared), Obsidian-style. */
  release: () => void;
  reheat: (alpha?: number) => void;
}

/**
 * Keeps a continuously-running d3-force simulation (the same technique
 * Obsidian's own graph view uses -- centering, link, and repulsion forces
 * that keep gently nudging nodes toward a comfortable arrangement) instead
 * of computing a layout once and freezing it. Nodes drift into place, new
 * imports fly in from wherever they're seeded, and dragging one node
 * visibly nudges its neighbors.
 */
export function useLiveForceSimulation(params: LiveForceSimulationParams): LiveForceSimulationHandle {
  const simulationRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const onTickRef = useRef(params.onTick);
  onTickRef.current = params.onTick;

  const nodeIdsKey = params.nodeIds.join(",");
  const linksKey = params.links.map((l) => `${l.sourceId}>${l.targetId}`).join(",");

  useEffect(() => {
    const priorById = simNodesRef.current;
    const nodeIdSet = new Set(params.nodeIds);

    // Keep already-known nodes at their current (possibly settled or
    // dragged) position and velocity; brand-new nodes start near the
    // canvas center with a little random jitter so they visibly fly into
    // place instead of all stacking on the exact same point.
    const nextNodes: SimNode[] = params.nodeIds.map((id) => {
      const prior = priorById.get(id);
      if (prior) return prior;
      return {
        id,
        x: params.width / 2 + (Math.random() - 0.5) * 120,
        y: params.height / 2 + (Math.random() - 0.5) * 120,
      };
    });
    simNodesRef.current = new Map(nextNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = params.links
      .filter((l) => nodeIdSet.has(l.sourceId) && nodeIdSet.has(l.targetId))
      .map((l) => ({ source: l.sourceId, target: l.targetId }));

    let sim = simulationRef.current;
    const isNewSim = !sim;
    if (!sim) {
      sim = forceSimulation<SimNode>();
      simulationRef.current = sim;
    }

    sim
      .nodes(nextNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(params.linkDistance)
      )
      .force("charge", forceManyBody().strength(params.chargeStrength))
      .force("center", forceCenter(params.width / 2, params.height / 2).strength(0.05))
      .force(
        "collide",
        // Extra iterations resolve overlaps more thoroughly per tick --
        // matters most right after a sudden radius jump (e.g. "Tidy &
        // enlarge"), where the default of 1 can leave nodes settling into a
        // still-slightly-overlapping equilibrium instead of fully resolving.
        forceCollide<SimNode>((d) => params.radiusById.get(d.id) ?? 20).iterations(4)
      )
      .on("tick", () => {
        const positions = new Map<string, { x: number; y: number }>();
        for (const n of nextNodes) positions.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
        onTickRef.current(positions);
      });

    // A brand-new simulation starts hot automatically (alpha=1). Every
    // other dependency in this effect's array only changes for a reason
    // that genuinely affects the arrangement (new/removed nodes or links,
    // resized canvas, tightened forces), so any rerun past the first one
    // deserves a reheat too.
    if (!isNewSim) {
      sim.alpha(Math.max(sim.alpha(), 0.5)).restart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeIdsKey, linksKey, params.width, params.height, params.linkDistance, params.chargeStrength, params.extraDep]);

  useEffect(() => {
    return () => {
      simulationRef.current?.stop();
    };
  }, []);

  return {
    pin(id, x, y) {
      const node = simNodesRef.current.get(id);
      if (!node) return;
      node.fx = x;
      node.fy = y;
      simulationRef.current?.alphaTarget(0.3).restart();
    },
    release() {
      // Deliberately not clearing fx/fy -- like Obsidian, a node you drag
      // stays where you drop it while the rest keeps reacting around it.
      simulationRef.current?.alphaTarget(0);
    },
    reheat(alpha = 0.8) {
      simulationRef.current?.alpha(alpha).restart();
    },
  };
}
