"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, type Edge, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveForceSimulation } from "@/lib/graph/useLiveForceSimulation";
import { colorForCluster, colorForType, UNTYPED_NODE_COLOR } from "@/lib/graph/colors";
import { CircleNodeLabel, type CircleNode } from "@/components/graph/CircleNodeLabel";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

interface GraphCanvasProps {
  vault: ParsedVault;
  metrics: NodeMetrics[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1800;

// "Tidy & enlarge" tightens link/charge forces (pulling connected nodes
// closer together instead of spreading across the whole canvas) while
// scaling up the collision radius to match the bigger node size, so
// tighter never means overlapping.
const NORMAL_SIZE = (degree: number) => Math.min(80, 32 + degree * 3);
const BIG_SIZE = (degree: number) => Math.min(112, 48 + degree * 4);

const NODE_TYPES: NodeTypes = { circleLabel: CircleNodeLabel };

export function GraphCanvas({ vault, metrics, selectedNodeId, onSelectNode }: GraphCanvasProps) {
  const t = useTranslations("graphCanvas");
  // d3-force seeds initial node positions with Math.random() when a node has
  // no preset x/y, so the server-rendered layout necessarily differs from
  // the client's, causing a hydration mismatch. Skipping SSR for this
  // component entirely (standard for physics/canvas libraries) avoids that
  // instead of fighting it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const metricsById = useMemo(() => new Map(metrics.map((m) => [m.nodeId, m])), [metrics]);

  // If any node declares a frontmatter `type`, color the whole graph by type
  // instead of by structural cluster -- type is a user-authored, meaningful
  // grouping (e.g. "framework" vs "case"), so it takes priority over the
  // purely structural clustering when both are available.
  const frontmatterTypes = useMemo(() => {
    const types = new Set<string>();
    for (const n of vault.nodes) {
      if (typeof n.frontmatter.type === "string") types.add(n.frontmatter.type);
    }
    return types;
  }, [vault]);
  const useTypeColoring = frontmatterTypes.size > 0;
  const hasUntypedNodes = useMemo(
    () => vault.nodes.some((n) => n.frontmatter.unresolved !== true && typeof n.frontmatter.type !== "string"),
    [vault]
  );

  const [baseNodes, setNodes, onNodesChange] = useNodesState<CircleNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [enlarged, setEnlarged] = useState(false);

  const nodeIds = useMemo(() => vault.nodes.map((n) => n.id), [vault]);
  const simLinks = useMemo(() => vault.edges.map((e) => ({ sourceId: e.sourceId, targetId: e.targetId })), [vault]);
  const radiusById = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of vault.nodes) {
      const m = metricsById.get(n.id);
      const degree = (m?.inDegree ?? 0) + (m?.outDegree ?? 0);
      const size = enlarged ? BIG_SIZE(degree) : NORMAL_SIZE(degree);
      // Just the circle plus a little breathing room -- sizing this to
      // fully clear each label's own footprint pushed nodes so far apart
      // that fitting the whole graph in view shrank everything down to
      // unreadable. Some label overlap in dense areas is an acceptable
      // trade for a graph that isn't mostly empty space.
      map.set(n.id, size / 2 + 8);
    }
    return map;
  }, [vault, metricsById, enlarged]);

  // A continuously-running physics simulation (the same technique Obsidian's
  // graph view uses) instead of a one-shot layout computed once and frozen
  // -- nodes keep gently nudging toward a comfortable arrangement, new
  // nodes fly into place, and dragging one visibly moves its neighbors.
  const { pin, release, reheat } = useLiveForceSimulation({
    nodeIds,
    links: simLinks,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    linkDistance: enlarged ? 70 : 120,
    chargeStrength: enlarged ? -130 : -250,
    radiusById,
    extraDep: enlarged,
    onTick: (positions) => {
      setNodes((current) =>
        current.map((n) => {
          const p = positions.get(n.id);
          return p ? { ...n, position: p } : n;
        })
      );
    },
  });

  // Size, color, and label are rebuilt here whenever the underlying data
  // changes -- kept entirely separate from position, which the simulation's
  // tick handler above owns, so neither ever clobbers the other.
  useEffect(() => {
    setNodes((current) => {
      const currentById = new Map(current.map((n) => [n.id, n]));
      return vault.nodes.map((n) => {
        const m = metricsById.get(n.id);
        const degree = (m?.inDegree ?? 0) + (m?.outDegree ?? 0);
        const size = enlarged ? BIG_SIZE(degree) : NORMAL_SIZE(degree);
        const isUnresolved = n.frontmatter.unresolved === true;
        const type = typeof n.frontmatter.type === "string" ? n.frontmatter.type : undefined;

        const background = isUnresolved
          ? "#e5e5e5"
          : useTypeColoring
            ? type
              ? colorForType(type)
              : UNTYPED_NODE_COLOR
            : colorForCluster(m?.clusterId ?? 0);

        const existing = currentById.get(n.id);
        const position = existing?.position ?? { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

        return {
          id: n.id,
          type: "circleLabel" as const,
          position,
          // Telling React Flow the dimensions upfront (not just via style) skips
          // its ResizeObserver-based "measurement" pass -- without this, nodes
          // never get marked measured in this environment, leaving them stuck
          // invisible and undraggable.
          width: size,
          height: size,
          data: { label: n.title, labelFontSize: enlarged ? 13 : 11 },
          style: {
            width: size,
            height: size,
            borderRadius: "9999px",
            background,
            border: "1px solid rgba(0,0,0,0.1)",
          },
        };
      });
    });
    // setNodes is stable (from useNodesState) and intentionally omitted so
    // this only reruns when the underlying graph data actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault, metrics, metricsById, useTypeColoring, enlarged]);

  useEffect(() => {
    setEdges(
      vault.edges.map((e, i) => ({
        id: `${e.sourceId}--${e.targetId}--${i}`,
        source: e.sourceId,
        target: e.targetId,
        style: { stroke: "#d4d4d4" },
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault]);

  function handleTidyAndEnlarge() {
    setEnlarged(true);
    // Full reheat (not a partial nudge) -- the bigger radius can put many
    // node pairs into collision at once, and that needs real energy/time to
    // fully resolve rather than settling into a still-overlapping state.
    reheat(1);
  }

  // Selection is overlaid separately from the effect above so that clicking
  // a node to view its content never touches position -- only the border/
  // selected flag change.
  const nodes = useMemo(
    () =>
      baseNodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
        style: {
          ...n.style,
          border: n.id === selectedNodeId ? "3px solid #4c1d95" : "1px solid rgba(0,0,0,0.1)",
        },
      })),
    [baseNodes, selectedNodeId]
  );

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        onNodeDragStart={(_, node) => pin(node.id, node.position.x, node.position.y)}
        onNodeDrag={(_, node) => pin(node.id, node.position.x, node.position.y)}
        onNodeDragStop={() => release()}
        fitView
        minZoom={0.05}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <button
        onClick={handleTidyAndEnlarge}
        title={t("autoArrangeHint")}
        className="absolute top-3 left-3 z-10 rounded-md border border-violet-100 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-violet-700 shadow-sm backdrop-blur-sm hover:bg-violet-50"
      >
        {t("autoArrange")}
      </button>
      {useTypeColoring && (
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex max-w-[12rem] flex-col gap-1 rounded-lg border border-violet-100 bg-white/90 p-2.5 text-xs shadow-sm backdrop-blur-sm">
          <span className="mb-0.5 font-medium text-neutral-500">{t("nodeType")}</span>
          {[...frontmatterTypes].sort().map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorForType(type) }} />
              <span className="truncate text-neutral-700">{type}</span>
            </div>
          ))}
          {hasUntypedNodes && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: UNTYPED_NODE_COLOR }} />
              <span className="truncate text-neutral-500">{t("untyped")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
