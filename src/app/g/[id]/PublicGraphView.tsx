"use client";

import { useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { GraphAnalysisPanel } from "@/components/GraphAnalysisPanel";
import type { GraphRow } from "@/lib/supabase/dbTypes";

export function PublicGraphView({ graph, isOwner }: { graph: GraphRow; isOwner: boolean }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { vault, metrics } = graph.graph_data;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-neutral-200 px-5 py-3">
        <h1 className="text-base font-medium">{graph.title}</h1>
        <p className="text-xs text-neutral-500">
          {graph.node_count} nodes · {graph.edge_count} edges
        </p>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <GraphCanvas vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        </div>
        <div className="flex w-96 shrink-0 flex-col overflow-y-auto border-l border-neutral-200 bg-white">
          <NodeDetailPanel vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
          {isOwner && (
            <GraphAnalysisPanel graphId={graph.id} initialDescription={graph.description} initialScenarios={graph.scenarios} />
          )}
        </div>
      </div>
    </div>
  );
}
