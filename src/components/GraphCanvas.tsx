"use client";

import { useMemo } from "react";
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { computeForceLayout } from "@/lib/graph/layout";
import { colorForCluster } from "@/lib/graph/colors";
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
  const metricsById = useMemo(() => new Map(metrics.map((m) => [m.nodeId, m])), [metrics]);

  const { nodes, edges } = useMemo(() => {
    const positions = computeForceLayout(vault, metrics, CANVAS_WIDTH, CANVAS_HEIGHT);

    const flowNodes: Node[] = vault.nodes.map((n) => {
      const m = metricsById.get(n.id);
      const degree = (m?.inDegree ?? 0) + (m?.outDegree ?? 0);
      const size = Math.min(80, 32 + degree * 3);
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      const isUnresolved = n.frontmatter.unresolved === true;

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
          background: isUnresolved ? "#e5e5e5" : colorForCluster(m?.clusterId ?? 0),
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
  }, [vault, metrics, metricsById, selectedNodeId]);

  return (
    <div className="h-full w-full">
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
    </div>
  );
}
