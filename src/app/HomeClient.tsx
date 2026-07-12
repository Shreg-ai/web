"use client";

import { useState } from "react";
import { VaultUploader } from "@/components/VaultUploader";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { SaveGraphPanel } from "@/components/SaveGraphPanel";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

export function HomeClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [vault, setVault] = useState<ParsedVault | null>(null);
  const [metrics, setMetrics] = useState<NodeMetrics[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const clusterCount = new Set(metrics.map((m) => m.clusterId)).size;

  if (!vault) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-violet-50 to-white p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-violet-950">Shreg</h1>
          <p className="mt-1 text-sm text-neutral-500">Turn a knowledge graph into something an AI agent can query.</p>
        </div>
        <div className="w-full max-w-lg">
          <VaultUploader
            onParsed={(v, m) => {
              setVault(v);
              setMetrics(m);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-violet-100 bg-white px-5 py-3">
        <div className="text-sm text-neutral-600">
          <span className="font-medium text-violet-900">{vault.nodes.length}</span> nodes ·{" "}
          <span className="font-medium text-violet-900">{vault.edges.length}</span> edges ·{" "}
          <span className="font-medium text-violet-900">{clusterCount}</span> clusters
        </div>
        <button
          onClick={() => {
            setVault(null);
            setMetrics([]);
            setSelectedNodeId(null);
          }}
          className="text-sm text-neutral-500 hover:text-violet-700"
        >
          Upload a different vault
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 bg-violet-50/30">
          <GraphCanvas vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        </div>
        <div className="flex w-80 shrink-0 flex-col border-l border-violet-100 bg-white">
          <div className="flex-1 overflow-y-auto">
            <NodeDetailPanel vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
          </div>
          <SaveGraphPanel vault={vault} metrics={metrics} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </div>
  );
}
