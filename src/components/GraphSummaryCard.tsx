"use client";

import { useEffect, useState } from "react";
import type { GraphEvaluationRow, GraphRow } from "@/lib/supabase/dbTypes";

interface GraphSummaryCardProps {
  graph: GraphRow;
  evaluations: GraphEvaluationRow[];
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/**
 * What a non-owner sees for someone else's graph: description and eval
 * scores only, no interactive canvas. The full graph is reachable only by
 * connecting an agent to the MCP endpoint below -- browsing the feed is for
 * deciding whether it's worth connecting to, not for exploring node-by-node.
 */
export function GraphSummaryCard({ graph, evaluations }: GraphSummaryCardProps) {
  const [mcpUrl, setMcpUrl] = useState(`/api/mcp/${graph.id}`);
  useEffect(() => {
    setMcpUrl(`${window.location.origin}/api/mcp/${graph.id}`);
  }, []);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const winCounts = { baseline: 0, graph: 0, tie: 0 };
  for (const e of evaluations) winCounts[e.winner] += 1;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-medium text-violet-950">{graph.title}</h1>
        <p className="text-xs text-neutral-500">
          {graph.node_count} nodes · {graph.edge_count} edges
        </p>
      </div>

      {graph.description ? (
        <p className="text-sm text-neutral-700">{graph.description}</p>
      ) : (
        <p className="text-sm text-neutral-500">The author hasn&apos;t written a description for this graph yet.</p>
      )}

      <div className="rounded-md bg-violet-50/60 p-3">
        <p className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">Connect via MCP</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate text-xs text-neutral-700">{mcpUrl}</code>
          <button onClick={handleCopy} className="shrink-0 text-xs text-violet-600 hover:underline">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-500">Point your MCP client at this URL to query the full graph directly.</p>
      </div>

      {evaluations.length > 0 ? (
        <div>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">
            Does it actually help? ({evaluations.length} test question{evaluations.length === 1 ? "" : "s"})
          </h2>
          <div className="mb-3 flex gap-3 text-sm">
            <div className="rounded-md bg-violet-50/60 px-3 py-2">
              <div className="text-lg font-medium text-violet-950">
                {winCounts.graph}/{evaluations.length}
              </div>
              <div className="text-xs text-neutral-500">Graph-augmented wins</div>
            </div>
            <div className="rounded-md bg-neutral-50 px-3 py-2">
              <div className="text-lg font-medium text-neutral-900">
                {winCounts.baseline}/{evaluations.length}
              </div>
              <div className="text-xs text-neutral-500">Baseline wins</div>
            </div>
            <div className="rounded-md bg-neutral-50 px-3 py-2">
              <div className="text-lg font-medium text-neutral-900">
                {winCounts.tie}/{evaluations.length}
              </div>
              <div className="text-xs text-neutral-500">Ties</div>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Avg scores (groundedness/framework/specificity) — baseline {average(evaluations.map((e) => e.baseline_groundedness)).toFixed(1)}/
            {average(evaluations.map((e) => e.baseline_framework_consistency)).toFixed(1)}/
            {average(evaluations.map((e) => e.baseline_specificity)).toFixed(1)}, graph{" "}
            {average(evaluations.map((e) => e.graph_groundedness)).toFixed(1)}/
            {average(evaluations.map((e) => e.graph_framework_consistency)).toFixed(1)}/
            {average(evaluations.map((e) => e.graph_specificity)).toFixed(1)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">The author hasn&apos;t run an evaluation on this graph yet.</p>
      )}
    </div>
  );
}
