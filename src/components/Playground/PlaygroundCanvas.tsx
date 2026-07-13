"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveForceSimulation } from "@/lib/graph/useLiveForceSimulation";
import { colorForCluster, colorForType, UNTYPED_NODE_COLOR } from "@/lib/graph/colors";
import { SOURCE_GRAPH_FIELD, SOURCE_GRAPH_TITLE_FIELD, type ManualLink } from "@/lib/graph/playground";
import { CircleNodeLabel, type CircleNode } from "@/components/graph/CircleNodeLabel";
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
  onSelectEdge: (source: string, target: string) => void;
  onDeleteNode: (id: string) => void;
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

interface EdgeData {
  isManual: boolean;
  sourceId: string;
  targetId: string;
  directed: boolean;
}

export function PlaygroundCanvas({
  vault,
  metrics,
  colorMode,
  pathNodeIds,
  manualLinks,
  onSelectNode,
  onConnect,
  onDisconnect,
  onSelectEdge,
  onDeleteNode,
}: PlaygroundCanvasProps) {
  const t = useTranslations("graphCanvas");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const metricsById = useMemo(() => new Map((metrics ?? []).map((m) => [m.nodeId, m])), [metrics]);
  const manualLinkByKey = useMemo(() => {
    const map = new Map<string, ManualLink>();
    for (const l of manualLinks) map.set([l.sourceId, l.targetId].sort().join("::"), l);
    return map;
  }, [manualLinks]);
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

  const frontmatterTypes = useMemo(() => {
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

  const [baseNodes, setNodes, onNodesChangeInternal] = useNodesState<CircleNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [enlarged, setEnlarged] = useState(false);

  const nodeIds = useMemo(() => vault.nodes.map((n) => n.id), [vault]);
  // Manual links count as real physical connections too -- they should pull
  // their two nodes together like any other edge, not just render as lines.
  const simLinks = useMemo(
    () => vault.edges.map((e) => ({ sourceId: e.sourceId, targetId: e.targetId })),
    [vault]
  );
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
  // -- nodes keep gently nudging toward a comfortable arrangement, newly
  // imported graphs (and manually added nodes) fly into place, and dragging
  // one node visibly moves its neighbors.
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
          // Any node can be deleted here (not just manually-added ones) --
          // this is a working session, not the source graphs themselves, so
          // pruning freely and re-importing if you change your mind is fine.
          deletable: true,
          data: { label: n.title, labelFontSize: enlarged ? 12 : 10 },
          style: {
            width: size,
            height: size,
            borderRadius: "9999px",
            background,
          },
        };
      });
    });
    // setNodes is stable (from useNodesState) and intentionally omitted so
    // this only reruns when the underlying graph data actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault, metrics, metricsById, colorMode, enlarged]);

  useEffect(() => {
    setEdges(
      vault.edges.map((e, i) => {
        const manual = manualLinkByKey.get([e.sourceId, e.targetId].sort().join("::"));
        const isManual = Boolean(manual);
        const directed = manual?.directed ?? false;
        return {
          id: `${e.sourceId}--${e.targetId}--${i}`,
          source: e.sourceId,
          target: e.targetId,
          // Only manually-drawn links can be deleted -- the original edges
          // reflect each note's real wikilinks, so removing those here
          // wouldn't mean anything (and there's no owning graph to update).
          deletable: isManual,
          markerEnd: directed ? { type: MarkerType.ArrowClosed, width: 16, height: 16 } : undefined,
          data: { isManual, sourceId: e.sourceId, targetId: e.targetId, directed } satisfies EdgeData,
          style: {
            stroke: isManual ? "#7c3aed" : "#d4d4d4",
            strokeWidth: isManual ? 2 : 1,
            strokeDasharray: isManual ? "5 3" : undefined,
          },
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault, manualLinkByKey]);

  function handleTidyAndEnlarge() {
    setEnlarged(true);
    // Full reheat (not a partial nudge) -- the bigger radius can put many
    // node pairs into collision at once, and that needs real energy/time to
    // fully resolve rather than settling into a still-overlapping state.
    reheat(1);
  }

  function handleNodesChange(changes: NodeChange<CircleNode>[]) {
    for (const change of changes) {
      if (change.type === "remove") onDeleteNode(change.id);
    }
    onNodesChangeInternal(changes);
  }

  function handleEdgesChange(changes: EdgeChange<Edge>[]) {
    for (const change of changes) {
      if (change.type !== "remove") continue;
      const removed = edges.find((e) => e.id === change.id);
      const data = removed?.data as EdgeData | undefined;
      if (data?.isManual) onDisconnect(data.sourceId, data.targetId);
    }
    onEdgesChange(changes);
  }

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
        const isManual = Boolean((e.data as EdgeData | undefined)?.isManual);
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
        nodeTypes={NODE_TYPES}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onEdgeClick={(_, edge) => {
          const data = edge.data as EdgeData | undefined;
          if (data?.isManual) onSelectEdge(data.sourceId, data.targetId);
        }}
        onPaneClick={() => onSelectNode(null)}
        onNodeDragStart={(_, node) => pin(node.id, node.position.x, node.position.y)}
        onNodeDrag={(_, node) => pin(node.id, node.position.x, node.position.y)}
        onNodeDragStop={() => release()}
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
      <button
        onClick={handleTidyAndEnlarge}
        title={t("autoArrangeHint")}
        className="absolute top-3 left-3 z-10 rounded-md border border-violet-100 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-violet-700 shadow-sm backdrop-blur-sm hover:bg-violet-50"
      >
        {t("autoArrange")}
      </button>
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
      {colorMode === "type" && frontmatterTypes.length > 0 && (
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex max-w-[12rem] flex-col gap-1 rounded-lg border border-violet-100 bg-white/90 p-2.5 text-xs shadow-sm backdrop-blur-sm">
          <span className="mb-0.5 font-medium text-neutral-500">{t("nodeType")}</span>
          {frontmatterTypes.map((type) => (
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
