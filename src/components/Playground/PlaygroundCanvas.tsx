"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { computeForceLayout } from "@/lib/graph/layout";
import { colorForCluster, colorForType, UNTYPED_NODE_COLOR } from "@/lib/graph/colors";
import { SOURCE_GRAPH_FIELD, SOURCE_GRAPH_TITLE_FIELD, type ManualLink } from "@/lib/graph/playground";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

export type PlaygroundColorMode = "source" | "type" | "cluster";

interface PlaygroundCanvasProps {
  vault: ParsedVault;
  metrics: NodeMetrics[] | null;
  colorMode: PlaygroundColorMode;
  pathNodeIds: string[] | null;
  manualLinks: ManualLink[];
  onSelectNode: (nodeId: string | null) => void;
  onConnect: (source: string, target: string) => void;
  onDisconnect: (source: string, target: string) => void;
}

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1800;

export function PlaygroundCanvas({
  vault,
  metrics,
  colorMode,
  pathNodeIds,
  manualLinks,
  onSelectNode,
  onConnect,
  onDisconnect,
}: PlaygroundCanvasProps) {
  const t = useTranslations("graphCanvas");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const metricsById = useMemo(() => new Map((metrics ?? []).map((m) => [m.nodeId, m])), [metrics]);
  const manualLinkKeys = useMemo(
    () => new Set(manualLinks.map((l) => [l.sourceId, l.targetId].sort().join("::"))),
    [manualLinks]
  );
  const pathSet = useMemo(() => new Set(pathNodeIds ?? []), [pathNodeIds]);

  // Distinct color per source graph, keyed off the same deterministic hash
  // used for frontmatter `type` coloring elsewhere.
  const sourceGraphIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of vault.nodes) {
      const id = n.frontmatter[SOURCE_GRAPH_FIELD];
      if (typeof id === "string") ids.add(id);
    }
    return [...ids];
  }, [vault]);

  const nodeTypes = useMemo(() => {
    const types = new Set<string>();
    for (const n of vault.nodes) {
      if (typeof n.frontmatter.type === "string") types.add(n.frontmatter.type);
    }
    return [...types].sort();
  }, [vault]);
  const hasUntypedNodes = useMemo(
    () => vault.nodes.some((n) => n.frontmatter.unresolved !== true && typeof n.frontmatter.type !== "string"),
    [vault]
  );

  // Nodes/edges live in React Flow's own controlled state (not a plain
  // useMemo) specifically so dragging and deleting a manual link actually
  // stick: without onNodesChange/onEdgesChange wired up, every unrelated
  // re-render (switching color mode, running analysis, finding a path)
  // would recompute everything from scratch and silently discard whatever
  // the user just dragged or unlinked.
  const [baseNodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const positions = computeForceLayout(vault, metrics ?? [], CANVAS_WIDTH, CANVAS_HEIGHT);

    setNodes((current) => {
      const currentById = new Map(current.map((n) => [n.id, n]));

      return vault.nodes.map((n) => {
        const m = metricsById.get(n.id);
        const degree = (m?.inDegree ?? 0) + (m?.outDegree ?? 0);
        const size = Math.min(80, 32 + degree * 3);
        const sourceGraphId = n.frontmatter[SOURCE_GRAPH_FIELD];
        const nodeType = typeof n.frontmatter.type === "string" ? n.frontmatter.type : undefined;

        let background: string;
        if (colorMode === "source" && typeof sourceGraphId === "string") {
          background = colorForType(sourceGraphId);
        } else if (colorMode === "type") {
          background = nodeType ? colorForType(nodeType) : UNTYPED_NODE_COLOR;
        } else {
          background = colorForCluster(m?.clusterId ?? 0);
        }

        // Keep the node's current position if it already exists (possibly
        // dragged by the user) -- only brand-new (just-imported) nodes get a
        // fresh layout position.
        const existing = currentById.get(n.id);
        const pos = existing?.position ?? positions.get(n.id) ?? { x: 0, y: 0 };

        return {
          id: n.id,
          position: pos,
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
            fontSize: 10,
            textAlign: "center",
            padding: 4,
            background,
            color: "white",
          },
        };
      });
    });
    // setNodes is stable (from useNodesState) and intentionally omitted so
    // this only reruns when the underlying graph data actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault, metrics, metricsById, colorMode]);

  useEffect(() => {
    setEdges(
      vault.edges.map((e, i) => {
        const isManual = manualLinkKeys.has([e.sourceId, e.targetId].sort().join("::"));
        return {
          id: `${e.sourceId}--${e.targetId}--${i}`,
          source: e.sourceId,
          target: e.targetId,
          // Only manually-drawn links can be deleted -- the original edges
          // reflect each note's real wikilinks, so removing those here
          // wouldn't mean anything (and there's no owning graph to update).
          deletable: isManual,
          data: { isManual, sourceId: e.sourceId, targetId: e.targetId },
          style: {
            stroke: isManual ? "#7c3aed" : "#d4d4d4",
            strokeWidth: isManual ? 2 : 1,
            strokeDasharray: isManual ? "5 3" : undefined,
          },
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault, manualLinkKeys]);

  // Path highlighting is overlaid separately so that finding a path never
  // touches node/edge position or the manual-link deletable flag.
  const nodes = useMemo(
    () =>
      baseNodes.map((n) => ({
        ...n,
        style: {
          ...n.style,
          border: pathSet.has(n.id) ? "3px solid #dc2626" : "1px solid rgba(0,0,0,0.1)",
        },
      })),
    [baseNodes, pathSet]
  );

  const displayedEdges = useMemo(
    () =>
      edges.map((e) => {
        const onPathEdge = pathSet.has(e.source) && pathSet.has(e.target) && (pathNodeIds ?? []).includes(e.source);
        const isManual = Boolean((e.data as { isManual?: boolean } | undefined)?.isManual);
        return {
          ...e,
          style: {
            ...e.style,
            stroke: onPathEdge ? "#dc2626" : isManual ? "#7c3aed" : "#d4d4d4",
            strokeWidth: onPathEdge ? 3 : isManual ? 2 : 1,
          },
        };
      }),
    [edges, pathSet, pathNodeIds]
  );

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={displayedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={(changes: EdgeChange<Edge>[]) => {
          for (const change of changes) {
            if (change.type !== "remove") continue;
            const removed = edges.find((e) => e.id === change.id);
            const data = removed?.data as { isManual?: boolean; sourceId?: string; targetId?: string } | undefined;
            if (data?.isManual && data.sourceId && data.targetId) onDisconnect(data.sourceId, data.targetId);
          }
          onEdgesChange(changes);
        }}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        onConnect={(connection: Connection) => {
          if (connection.source && connection.target) onConnect(connection.source, connection.target);
        }}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        minZoom={0.05}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
      {colorMode === "source" && sourceGraphIds.length > 1 && (
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex max-w-[12rem] flex-col gap-1 rounded-lg border border-violet-100 bg-white/90 p-2.5 text-xs shadow-sm backdrop-blur-sm">
          <span className="mb-0.5 font-medium text-neutral-500">{t("sourceGraph")}</span>
          {sourceGraphIds.map((id) => {
            const title = vault.nodes.find((n) => n.frontmatter[SOURCE_GRAPH_FIELD] === id)?.frontmatter[SOURCE_GRAPH_TITLE_FIELD];
            return (
              <div key={id} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorForType(id) }} />
                <span className="truncate text-neutral-700">{typeof title === "string" ? title : id}</span>
              </div>
            );
          })}
        </div>
      )}
      {colorMode === "type" && nodeTypes.length > 0 && (
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex max-w-[12rem] flex-col gap-1 rounded-lg border border-violet-100 bg-white/90 p-2.5 text-xs shadow-sm backdrop-blur-sm">
          <span className="mb-0.5 font-medium text-neutral-500">{t("nodeType")}</span>
          {nodeTypes.map((type) => (
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
      <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md bg-white/90 px-2 py-1 text-xs text-neutral-500 shadow-sm backdrop-blur-sm">
        {t("dragHint")}
      </p>
    </div>
  );
}
