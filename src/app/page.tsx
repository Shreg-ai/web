"use client";

import { useState } from "react";
import { VaultUploader } from "@/components/VaultUploader";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

export default function Home() {
  const [vault, setVault] = useState<ParsedVault | null>(null);
  const [metrics, setMetrics] = useState<NodeMetrics[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const clusterCount = new Set(metrics.map((m) => m.clusterId)).size;

  if (!vault) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium">Shreg</h1>
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
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
        <div className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{vault.nodes.length}</span> nodes ·{" "}
          <span className="font-medium text-neutral-900">{vault.edges.length}</span> edges ·{" "}
          <span className="font-medium text-neutral-900">{clusterCount}</span> clusters
        </div>
        <button
          onClick={() => {
            setVault(null);
            setMetrics([]);
            setSelectedNodeId(null);
          }}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Upload a different vault
        </button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <GraphCanvas vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        </div>
        <div className="w-80 shrink-0 border-l border-neutral-200 bg-white">
          <NodeDetailPanel vault={vault} metrics={metrics} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        </div>
      </div>
    </div>
  );
}
