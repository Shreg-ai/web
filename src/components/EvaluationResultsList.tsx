"use client";

import { useState } from "react";
import type { GraphEvaluationRow } from "@/lib/supabase/dbTypes";

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/**
 * Shared by the owner's EvaluationPanel and the non-owner GraphSummaryCard --
 * test questions and answer comparisons are transparent to everyone who can
 * see the post, even though the interactive graph itself is owner-only.
 */
export function EvaluationResultsList({ evaluations }: { evaluations: GraphEvaluationRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (evaluations.length === 0) return null;

  const winCounts = { baseline: 0, graph: 0, tie: 0 };
  for (const e of evaluations) winCounts[e.winner] += 1;

  return (
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
  );
}
