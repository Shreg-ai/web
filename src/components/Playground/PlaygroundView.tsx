"use client";

import { useMemo, useState } from "react";
import { getGraphStructureForImport } from "@/app/playground/actions";
import { computeStructuralMetrics } from "@/lib/graph/structural";
import { buildCombinedVault, findShortestPath, type ManualLink, type PlaygroundSource } from "@/lib/graph/playground";
import { PlaygroundCanvas } from "./PlaygroundCanvas";
import type { ImportableGraph } from "@/app/playground/actions";
import type { NodeMetrics, ParsedNode } from "@/lib/graph/types";

export function PlaygroundView({ importableGraphs }: { importableGraphs: ImportableGraph[] }) {
  const [sources, setSources] = useState<PlaygroundSource[]>([]);
  const [manualLinks, setManualLinks] = useState<ManualLink[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<NodeMetrics[] | null>(null);
  const [colorBySource, setColorBySource] = useState(true);

  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [pathResult, setPathResult] = useState<string[] | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<ParsedNode | null>(null);

  const combinedVault = useMemo(() => buildCombinedVault(sources, manualLinks), [sources, manualLinks]);

  const importedIds = useMemo(() => new Set(sources.map((s) => s.graphId)), [sources]);

  async function handleImport(graphId: string) {
    setImportingId(graphId);
    setError(null);
    const result = await getGraphStructureForImport(graphId);
    setImportingId(null);
    if (result.error || !result.payload || !result.title) {
      setError(result.error ?? "Could not import that graph.");
      return;
    }
    setSources((prev) => [...prev, { graphId, graphTitle: result.title!, vault: result.payload!.vault }]);
    setMetrics(null);
  }

  function handleRemoveSource(graphId: string) {
    setSources((prev) => prev.filter((s) => s.graphId !== graphId));
    setManualLinks((prev) => prev.filter((l) => !l.sourceId.startsWith(`${graphId}::`) && !l.targetId.startsWith(`${graphId}::`)));
    setMetrics(null);
    setPathResult(null);
    setSelectedNode(null);
  }

  function handleConnect(source: string, target: string) {
    setManualLinks((prev) => {
      if (prev.some((l) => (l.sourceId === source && l.targetId === target) || (l.sourceId === target && l.targetId === source))) {
        return prev;
      }
      return [...prev, { sourceId: source, targetId: target }];
    });
  }

  function handleRunAnalysis() {
    setMetrics(computeStructuralMetrics(combinedVault));
    setColorBySource(false);
  }

  function handleFindPath() {
    setPathError(null);
    if (!pathStart || !pathEnd) {
      setPathError("Pick a start and end node first.");
      return;
    }
    const path = findShortestPath(combinedVault, pathStart, pathEnd);
    if (!path) {
      setPathResult(null);
      setPathError("No connection found between those nodes -- try adding a manual link.");
      return;
    }
    setPathResult(path);
  }

  const nodeTitleById = useMemo(() => new Map(combinedVault.nodes.map((n) => [n.id, n.title])), [combinedVault]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-r border-violet-100 bg-white p-4">
        <div>
          <h1 className="text-base font-medium text-violet-950">Knowledge Playground</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Import graphs, draw links between nodes from different graphs, and run analysis across all of them
            together. Nothing here is saved -- reloading starts fresh.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">Import a graph</h2>
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          {importableGraphs.length === 0 ? (
            <p className="text-xs text-neutral-500">No graphs available yet -- upload your own, or wait for others to share theirs.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {importableGraphs.map((g) => {
                const imported = importedIds.has(g.id);
                return (
                  <li key={g.id} className="flex items-center justify-between gap-2 rounded-md border border-violet-100 px-2.5 py-1.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900">{g.title}</p>
                      <p className="text-neutral-400">
                        {g.isOwn ? "You" : `@${g.username}`} · {g.node_count} nodes
                      </p>
                    </div>
                    <button
                      onClick={() => (imported ? handleRemoveSource(g.id) : handleImport(g.id))}
                      disabled={importingId === g.id}
                      className={`shrink-0 rounded-md px-2 py-1 font-medium disabled:opacity-50 ${
                        imported ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" : "bg-violet-600 text-white hover:bg-violet-700"
                      }`}
                    >
                      {importingId === g.id ? "…" : imported ? "Remove" : "Import"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {sources.length > 0 && (
          <>
            <div>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">Analysis</h2>
              <button
                onClick={handleRunAnalysis}
                className="w-full rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
              >
                Run structural analysis
              </button>
              {metrics && (
                <p className="mt-1.5 text-xs text-neutral-500">
                  Colored by cluster across all {sources.length} imported graph{sources.length === 1 ? "" : "s"}.{" "}
                  <button onClick={() => setColorBySource(true)} className="text-violet-600 hover:underline">
                    Color by source instead
                  </button>
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">Find a connection</h2>
              <div className="flex flex-col gap-1.5 text-xs">
                <select
                  value={pathStart ?? ""}
                  onChange={(e) => setPathStart(e.target.value || null)}
                  className="rounded-md border border-violet-200 px-2 py-1.5"
                >
                  <option value="">From node…</option>
                  {combinedVault.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
                <select
                  value={pathEnd ?? ""}
                  onChange={(e) => setPathEnd(e.target.value || null)}
                  className="rounded-md border border-violet-200 px-2 py-1.5"
                >
                  <option value="">To node…</option>
                  {combinedVault.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleFindPath}
                  className="rounded-md bg-violet-600 px-3 py-1.5 font-medium text-white hover:bg-violet-700"
                >
                  Find path
                </button>
                {pathError && <p className="text-red-600">{pathError}</p>}
                {pathResult && (
                  <div className="rounded-md bg-violet-50/60 p-2">
                    <p className="mb-1 font-medium text-violet-800">{pathResult.length - 1} hop(s):</p>
                    <p className="text-neutral-700">{pathResult.map((id) => nodeTitleById.get(id) ?? id).join(" → ")}</p>
                    <button onClick={() => setPathResult(null)} className="mt-1 text-neutral-400 hover:text-neutral-700">
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {selectedNode && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-medium tracking-wide text-neutral-400 uppercase">Node</h2>
              <button onClick={() => setSelectedNode(null)} className="text-xs text-neutral-400 hover:text-neutral-700">
                ✕
              </button>
            </div>
            <p className="text-sm font-medium text-violet-950">{selectedNode.title}</p>
            <p className="mt-1 text-xs text-neutral-500 whitespace-pre-wrap line-clamp-6">{selectedNode.body}</p>
          </div>
        )}
      </div>

      <div className="flex-1 bg-violet-50/30">
        {sources.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-400">
            Import a graph from the left to get started -- this field is empty until then.
          </div>
        ) : (
          <PlaygroundCanvas
            vault={combinedVault}
            metrics={metrics}
            colorBySource={colorBySource}
            pathNodeIds={pathResult}
            manualLinks={manualLinks}
            onSelectNode={(id) => setSelectedNode(combinedVault.nodes.find((n) => n.id === id) ?? null)}
            onConnect={handleConnect}
          />
        )}
      </div>
    </div>
  );
}
