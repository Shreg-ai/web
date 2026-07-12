"use client";

import { useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { GraphAnalysisPanel } from "@/components/GraphAnalysisPanel";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { PostComposer } from "@/components/PostComposer";
import { GraphSummaryCard } from "@/components/GraphSummaryCard";
import { BackButton } from "@/components/BackButton";
import { Spinner } from "@/components/Spinner";
import { VersionHistoryPanel } from "@/components/VersionHistoryPanel";
import { GraphPostsList } from "@/components/GraphPostsList";
import type { GraphEvaluationRow, GraphRow, GraphVersionRow, PostRow, ProfileRow } from "@/lib/supabase/dbTypes";

const HANDLE_H = "h-1 shrink-0 bg-violet-100 transition-colors hover:bg-violet-300 active:bg-violet-400 data-[resize-handle-active]:bg-violet-400";
const HANDLE_V = "w-1 shrink-0 bg-violet-100 transition-colors hover:bg-violet-300 active:bg-violet-400 data-[resize-handle-active]:bg-violet-400";

function PanelHeader({ label, collapsed, onToggle }: { label: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full shrink-0 items-center justify-between border-b border-violet-100 bg-white px-3 py-1.5 text-left"
    >
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <span className="text-xs text-violet-600">{collapsed ? "Expand ▸" : "Collapse ▾"}</span>
    </button>
  );
}

export function PublicGraphView({
  graph,
  isOwner,
  evaluations,
  versions,
  posts,
  authors,
}: {
  graph: GraphRow;
  isOwner: boolean;
  evaluations: GraphEvaluationRow[];
  versions: GraphVersionRow[];
  posts: PostRow[];
  authors: ProfileRow[];
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { vault, metrics } = graph.graph_data;

  const canvasPanelRef = usePanelRef();
  const nodePanelRef = usePanelRef();
  const [canvasCollapsed, setCanvasCollapsed] = useState(false);
  const [nodeCollapsed, setNodeCollapsed] = useState(false);
  const [evaluationRunning, setEvaluationRunning] = useState(false);

  // Non-owners never get the interactive canvas -- only description + eval
  // scores + the MCP endpoint. The full graph is only reachable by actually
  // connecting an agent to it.
  if (!isOwner) {
    return <GraphSummaryCard graph={graph} evaluations={evaluations} versions={versions} posts={posts} authors={authors} />;
  }

  function toggleCanvas() {
    if (canvasPanelRef.current?.isCollapsed()) {
      canvasPanelRef.current.expand();
    } else {
      canvasPanelRef.current?.collapse();
    }
  }

  function toggleNode() {
    if (nodePanelRef.current?.isCollapsed()) {
      nodePanelRef.current.expand();
    } else {
      nodePanelRef.current?.collapse();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-violet-100 bg-white px-3 py-3">
        <BackButton />
        <div>
          <h1 className="text-base font-medium text-violet-950">{graph.title}</h1>
          <p className="text-xs text-neutral-500">
            {graph.node_count} nodes · {graph.edge_count} edges · {graph.visibility === "public" ? "Public" : "Private"}
          </p>
        </div>
      </div>
      <Group orientation="horizontal" className="flex-1">
        <Panel defaultSize={60} minSize={30} className="overflow-y-auto bg-white">
          {evaluationRunning && (
            <div className="sticky top-0 z-10 flex items-center gap-2 bg-violet-600 px-4 py-2 text-sm font-medium text-white">
              <Spinner className="h-4 w-4" />
              Evaluation running — this takes about a minute. You can keep browsing or post while you wait.
            </div>
          )}
          <GraphAnalysisPanel graphId={graph.id} initialDescription={graph.description} initialScenarios={graph.scenarios} />
          <EvaluationPanel
            graphId={graph.id}
            hasScenarios={graph.scenarios.length > 0}
            initialEvaluations={evaluations}
            onRunningChange={setEvaluationRunning}
          />
          <PostComposer graphId={graph.id} graphIsPublic={graph.visibility === "public"} />
          {posts.length > 0 && (
            <div className="border-t border-violet-100 p-5">
              <GraphPostsList graph={graph} posts={posts} authors={authors} evaluations={evaluations} currentUserId={graph.user_id} />
            </div>
          )}
          <VersionHistoryPanel graphId={graph.id} initialVersions={versions} isOwner />
        </Panel>
        <Separator className={HANDLE_V} />
        <Panel defaultSize={40} minSize={15}>
          <Group orientation="vertical" className="h-full">
            <Panel
              panelRef={canvasPanelRef}
              collapsible
              collapsedSize={32}
              defaultSize={55}
              minSize={15}
              onResize={() => setCanvasCollapsed(Boolean(canvasPanelRef.current?.isCollapsed()))}
              className="flex flex-col bg-violet-50/30"
            >
              <PanelHeader label="Graph" collapsed={canvasCollapsed} onToggle={toggleCanvas} />
              {!canvasCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <GraphCanvas vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
                </div>
              )}
            </Panel>
            <Separator className={HANDLE_H} />
            <Panel
              panelRef={nodePanelRef}
              collapsible
              collapsedSize={32}
              defaultSize={45}
              minSize={15}
              onResize={() => setNodeCollapsed(Boolean(nodePanelRef.current?.isCollapsed()))}
              className="flex flex-col overflow-hidden bg-white"
            >
              <PanelHeader label="Node content" collapsed={nodeCollapsed} onToggle={toggleNode} />
              {!nodeCollapsed && (
                <div className="flex-1 overflow-y-auto">
                  <NodeDetailPanel vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
                </div>
              )}
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  );
}
