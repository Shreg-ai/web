"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { clearEvaluations, runEvaluation } from "@/app/g/[id]/actions";
import { Spinner } from "@/components/Spinner";
import { EvaluationResultsList } from "@/components/EvaluationResultsList";
import type { GraphEvaluationRow } from "@/lib/supabase/dbTypes";

interface EvaluationPanelProps {
  graphId: string;
  hasScenarios: boolean;
  initialEvaluations: GraphEvaluationRow[];
  onRunningChange?: (running: boolean) => void;
}

export function EvaluationPanel({ graphId, hasScenarios, initialEvaluations, onRunningChange }: EvaluationPanelProps) {
  const t = useTranslations("evaluation");
  const tCommon = useTranslations("common");
  const [evaluations, setEvaluations] = useState<GraphEvaluationRow[]>(initialEvaluations);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Relative path on first render (matches what the server rendered, avoiding
  // a hydration mismatch), then filled in with the real origin post-mount.
  const [mcpUrl, setMcpUrl] = useState(`/api/mcp/${graphId}`);
  useEffect(() => {
    setMcpUrl(`${window.location.origin}/api/mcp/${graphId}`);
  }, [graphId]);

  async function handleRun() {
    setRunning(true);
    onRunningChange?.(true);
    setError(null);
    const result = await runEvaluation(graphId);
    setRunning(false);
    onRunningChange?.(false);
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

  return (
    <div className="border-t border-violet-100 p-5">
      <h2 className="mb-3 text-sm font-medium text-violet-950">{t("heading")}</h2>

      <div className="mb-4 rounded-md bg-violet-50/60 p-3">
        <p className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("endpointLabel")}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate text-xs text-neutral-700">{mcpUrl}</code>
          <button onClick={handleCopyUrl} className="shrink-0 text-xs text-violet-600 hover:underline">
            {copied ? tCommon("copied") : tCommon("copy")}
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-500">{t("mcpHint")}</p>
      </div>

      {!hasScenarios ? (
        <p className="text-sm text-neutral-500">{t("noScenarios")}</p>
      ) : (
        <div className="mb-4 flex gap-3">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {running && <Spinner className="h-4 w-4" />}
            {running ? t("running") : evaluations.length > 0 ? t("rerun") : t("run")}
          </button>
          {evaluations.length > 0 && (
            <button onClick={handleClear} className="text-sm text-neutral-500 hover:text-neutral-900">
              {t("clearResults")}
            </button>
          )}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <EvaluationResultsList evaluations={evaluations} />
    </div>
  );
}
