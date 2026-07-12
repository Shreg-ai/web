"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { computeForceLayout, type LayoutNode } from "@/lib/graph/layout";
import { colorForCluster, colorForType, UNTYPED_NODE_COLOR } from "@/lib/graph/colors";
import type { NodeMetrics, ParsedNode, ParsedVault } from "@/lib/graph/types";

interface GraphCanvasProps {
  vault: ParsedVault;
  metrics: NodeMetrics[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1800;

// "Auto-arrange" tightens link/charge forces (pulling connected nodes closer
// together instead of spreading across the whole canvas) while scaling up
// the collision radius to match the bigger node size, so tighter never means
// overlapping.
const NORMAL_SIZE = (degree: number) => Math.min(80, 32 + degree * 3);
const BIG_SIZE = (degree: number) => Math.min(112, 48 + degree * 4);

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
  const nodeTypes = useMemo(() => {
    const types = new Set<string>();
    for (const n of vault.nodes) {
      if (typeof n.frontmatter.type === "string") types.add(n.frontmatter.type);
    }
    return types;
  }, [vault]);
  const useTypeColoring = nodeTypes.size > 0;
  const hasUntypedNodes = useMemo(
    () => vault.nodes.some((n) => n.frontmatter.unresolved !== true && typeof n.frontmatter.type !== "string"),
    [vault]
  );

  // Nodes/edges live in React Flow's own controlled state (not a plain
  // useMemo) specifically so dragging actually sticks: onNodesChange is what
  // writes a drag's new position back in, and without it every unrelated
  // re-render (e.g. clicking a different node to view its content, which
  // changes selectedNodeId) would recompute positions from scratch and
  // silently discard whatever the user just dragged.
  const [baseNodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [enlarged, setEnlarged] = useState(false);

  function buildNode(n: ParsedNode, position: { x: number; y: number }): Node {
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

    return {
      id: n.id,
      position,
      // Telling React Flow the dimensions upfront (not just via style) skips
      // its ResizeObserver-based "measurement" pass -- without this, nodes
      // never get marked measured in this environment, leaving them stuck
      // invisible and undraggable.
      width: size,
      height: size,
      data: { label: n.title },
      style: {
        width: size,
        height: size,
        borderRadius: "9999px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: enlarged ? 13 : 11,
        textAlign: "center",
        padding: 4,
        background,
        color: isUnresolved ? "#525252" : "white",
        border: "1px solid rgba(0,0,0,0.1)",
      },
    };
  }

  useEffect(() => {
    const positions = computeForceLayout(vault, metrics, CANVAS_WIDTH, CANVAS_HEIGHT);

    setNodes((current) => {
      const currentById = new Map(current.map((n) => [n.id, n]));
      return vault.nodes.map((n) => {
        // Keep the node's current position if it already exists (possibly
        // dragged by the user) -- only brand-new nodes get a fresh layout
        // position.
        const existing = currentById.get(n.id);
        const pos = existing?.position ?? positions.get(n.id) ?? { x: 0, y: 0 };
        return buildNode(n, pos);
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

  function handleAutoArrange() {
    const positions: Map<string, LayoutNode> = computeForceLayout(vault, metrics, CANVAS_WIDTH, CANVAS_HEIGHT, {
      linkDistance: 70,
      chargeStrength: -130,
      collideRadius: (degree) => BIG_SIZE(degree) / 2 + 10,
    });
    setEnlarged(true);
    setNodes(vault.nodes.map((n) => buildNode(n, positions.get(n.id) ?? { x: 0, y: 0 })));
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        minZoom={0.05}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <button
        onClick={handleAutoArrange}
        title={t("autoArrangeHint")}
        className="absolute top-3 left-3 z-10 rounded-md border border-violet-100 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-violet-700 shadow-sm backdrop-blur-sm hover:bg-violet-50"
      >
        {t("autoArrange")}
      </button>
      {useTypeColoring && (
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex max-w-[12rem] flex-col gap-1 rounded-lg border border-violet-100 bg-white/90 p-2.5 text-xs shadow-sm backdrop-blur-sm">
          <span className="mb-0.5 font-medium text-neutral-500">{t("nodeType")}</span>
          {[...nodeTypes].sort().map((type) => (
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
