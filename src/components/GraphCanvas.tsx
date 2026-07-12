"use client";

import { useEffect, useMemo, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { computeForceLayout } from "@/lib/graph/layout";
import { colorForCluster, colorForType, UNTYPED_NODE_COLOR } from "@/lib/graph/colors";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

interface GraphCanvasProps {
  vault: ParsedVault;
  metrics: NodeMetrics[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1800;

export function GraphCanvas({ vault, metrics, selectedNodeId, onSelectNode }: GraphCanvasProps) {
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

  const { nodes, edges } = useMemo(() => {
    const positions = computeForceLayout(vault, metrics, CANVAS_WIDTH, CANVAS_HEIGHT);

    const flowNodes: Node[] = vault.nodes.map((n) => {
      const m = metricsById.get(n.id);
      const degree = (m?.inDegree ?? 0) + (m?.outDegree ?? 0);
      const size = Math.min(80, 32 + degree * 3);
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
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
        position: { x: pos.x, y: pos.y },
        data: { label: n.title },
        selected: n.id === selectedNodeId,
        style: {
          width: size,
          height: size,
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          textAlign: "center",
          padding: 4,
          background,
          color: isUnresolved ? "#525252" : "white",
          border: n.id === selectedNodeId ? "3px solid #4c1d95" : "1px solid rgba(0,0,0,0.1)",
        },
      };
    });

    const flowEdges: Edge[] = vault.edges.map((e, i) => ({
      id: `${e.sourceId}--${e.targetId}--${i}`,
      source: e.sourceId,
      target: e.targetId,
      style: { stroke: "#d4d4d4" },
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [vault, metrics, metricsById, selectedNodeId, useTypeColoring]);

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        minZoom={0.05}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
      {useTypeColoring && (
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex max-w-[12rem] flex-col gap-1 rounded-lg border border-violet-100 bg-white/90 p-2.5 text-xs shadow-sm backdrop-blur-sm">
          <span className="mb-0.5 font-medium text-neutral-500">Node type</span>
          {[...nodeTypes].sort().map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorForType(type) }} />
              <span className="truncate text-neutral-700">{type}</span>
            </div>
          ))}
          {hasUntypedNodes && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: UNTYPED_NODE_COLOR }} />
              <span className="truncate text-neutral-500">untyped</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
