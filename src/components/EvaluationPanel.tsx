"use client";

import { useEffect, useState } from "react";
import { clearEvaluations, runEvaluation } from "@/app/g/[id]/actions";
import { Spinner } from "@/components/Spinner";
import type { GraphEvaluationRow } from "@/lib/supabase/dbTypes";

interface EvaluationPanelProps {
  graphId: string;
  hasScenarios: boolean;
  initialEvaluations: GraphEvaluationRow[];
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function EvaluationPanel({ graphId, hasScenarios, initialEvaluations }: EvaluationPanelProps) {
  const [evaluations, setEvaluations] = useState<GraphEvaluationRow[]>(initialEvaluations);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Relative path on first render (matches what the server rendered, avoiding
  // a hydration mismatch), then filled in with the real origin post-mount.
  const [mcpUrl, setMcpUrl] = useState(`/api/mcp/${graphId}`);
  useEffect(() => {
    setMcpUrl(`${window.location.origin}/api/mcp/${graphId}`);
  }, [graphId]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    const result = await runEvaluation(graphId);
    setRunning(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEvaluations(result.results ?? []);
  }

  async function handleClear() {
    setError(null);
    setEvaluations([]);
    await clearEvaluations(graphId);
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const winCounts = { baseline: 0, graph: 0, tie: 0 };
  for (const e of evaluations) winCounts[e.winner] += 1;

  return (
    <div className="border-t border-violet-100 p-5">
      <h2 className="mb-3 text-sm font-medium text-violet-950">Test as an MCP tool</h2>

      <div className="mb-4 rounded-md bg-violet-50/60 p-3">
        <p className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">MCP endpoint</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate text-xs text-neutral-700">{mcpUrl}</code>
          <button onClick={handleCopyUrl} className="shrink-0 text-xs text-violet-600 hover:underline">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-500">Point any MCP client at this URL to query this graph directly.</p>
      </div>

      {!hasScenarios ? (
        <p className="text-sm text-neutral-500">Generate or write test questions above first, then run the evaluation.</p>
      ) : (
        <div className="mb-4 flex gap-3">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {running && <Spinner className="h-4 w-4" />}
            {running ? "Running… (this takes a minute)" : evaluations.length > 0 ? "Re-run evaluation" : "Run evaluation"}
          </button>
          {evaluations.length > 0 && (
            <button onClick={handleClear} className="text-sm text-neutral-500 hover:text-neutral-900">
              Clear results
            </button>
          )}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {evaluations.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 text-sm">
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
            Avg scores (groundedness/framework/specificity) — baseline{" "}
            {average(evaluations.map((e) => e.baseline_groundedness)).toFixed(1)}/
            {average(evaluations.map((e) => e.baseline_framework_consistency)).toFixed(1)}/
            {average(evaluations.map((e) => e.baseline_specificity)).toFixed(1)}, graph{" "}
            {average(evaluations.map((e) => e.graph_groundedness)).toFixed(1)}/
            {average(evaluations.map((e) => e.graph_framework_consistency)).toFixed(1)}/
            {average(evaluations.map((e) => e.graph_specificity)).toFixed(1)}
          </p>

          <ul className="flex flex-col gap-2">
            {evaluations.map((e) => {
              const isExpanded = expandedId === e.id;
              return (
              <li key={e.id} className="rounded-md border border-violet-100 p-3 text-sm">
                <button
                  onClick={() => setExpandedId((cur) => (cur === e.id ? null : e.id))}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <span className="font-medium text-neutral-900">{e.question}</span>
                  <svg
                    viewBox="0 0 20 20"
                    className={`mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M5 7.5 10 13l5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <p className="mt-1 text-xs text-neutral-500">
                  {e.winner === "graph" ? "Graph-augmented won" : e.winner === "baseline" ? "Baseline won" : "Tie"} ·{" "}
                  <span className="text-violet-600">{isExpanded ? "Hide answers" : "Show answers"}</span>
                </p>
                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="rounded-md bg-neutral-50 p-3">
                      <p className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">Baseline</p>
                      <p className="text-xs text-neutral-700">{e.baseline_answer}</p>
                    </div>
                    <div className="rounded-md bg-violet-50/60 p-3">
                      <p className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">Graph-augmented</p>
                      <p className="text-xs text-neutral-700">{e.graph_answer}</p>
                    </div>
                    <p className="text-xs text-neutral-500">{e.judge_reasoning}</p>
                  </div>
                )}
              </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
