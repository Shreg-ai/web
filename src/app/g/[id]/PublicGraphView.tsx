"use client";

import { useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { GraphAnalysisPanel } from "@/components/GraphAnalysisPanel";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { PostComposer } from "@/components/PostComposer";
import { GraphSummaryCard } from "@/components/GraphSummaryCard";
import type { GraphEvaluationRow, GraphRow } from "@/lib/supabase/dbTypes";

export function PublicGraphView({
  graph,
  isOwner,
  evaluations,
}: {
  graph: GraphRow;
  isOwner: boolean;
  evaluations: GraphEvaluationRow[];
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { vault, metrics } = graph.graph_data;

  // Non-owners never get the interactive canvas -- only description + eval
  // scores + the MCP endpoint. The full graph is only reachable by actually
  // connecting an agent to it.
  if (!isOwner) {
    return <GraphSummaryCard graph={graph} evaluations={evaluations} />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-violet-100 bg-white px-5 py-3">
        <h1 className="text-base font-medium text-violet-950">{graph.title}</h1>
        <p className="text-xs text-neutral-500">
          {graph.node_count} nodes · {graph.edge_count} edges · {graph.visibility === "public" ? "Public" : "Private"}
        </p>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 bg-violet-50/30">
          <GraphCanvas vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        </div>
        <div className="flex w-96 shrink-0 flex-col overflow-y-auto border-l border-violet-100 bg-white">
          <NodeDetailPanel vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
          <GraphAnalysisPanel graphId={graph.id} initialDescription={graph.description} initialScenarios={graph.scenarios} />
          <EvaluationPanel graphId={graph.id} hasScenarios={graph.scenarios.length > 0} initialEvaluations={evaluations} />
          <PostComposer graphId={graph.id} graphIsPublic={graph.visibility === "public"} />
        </div>
      </div>
    </div>
  );
}
