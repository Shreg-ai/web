"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { EvaluationResultsList } from "@/components/EvaluationResultsList";
import type { GraphEvaluationRow, GraphRow } from "@/lib/supabase/dbTypes";

interface GraphSummaryCardProps {
  graph: GraphRow;
  evaluations: GraphEvaluationRow[];
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 overflow-y-auto p-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-xl font-medium text-violet-950">{graph.title}</h1>
          <p className="text-xs text-neutral-500">
            {graph.node_count} nodes · {graph.edge_count} edges
          </p>
        </div>
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
          <EvaluationResultsList evaluations={evaluations} />
        </div>
      ) : (
        <p className="text-sm text-neutral-500">The author hasn&apos;t run an evaluation on this graph yet.</p>
      )}
    </div>
  );
}
