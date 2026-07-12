"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { VaultUploader } from "@/components/VaultUploader";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { SaveGraphPanel } from "@/components/SaveGraphPanel";
import { LandingExplainer } from "@/components/LandingExplainer";
import { ConnectGuideView } from "@/components/Connect/ConnectGuideView";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";
import type { GraphRow } from "@/lib/supabase/dbTypes";

export function HomeClient({
  isLoggedIn,
  graphs,
}: {
  isLoggedIn: boolean;
  graphs: Pick<GraphRow, "id" | "title" | "visibility">[];
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [vault, setVault] = useState<ParsedVault | null>(null);
  const [metrics, setMetrics] = useState<NodeMetrics[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const clusterCount = new Set(metrics.map((m) => m.clusterId)).size;

  if (!vault) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-b from-violet-50 to-white">
        <div className="flex flex-col items-center px-6 pt-16 pb-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-violet-950">Shreg</h1>
            <p className="mt-1 text-sm text-neutral-500">{t("tagline")}</p>
          </div>
          <div className="flex max-w-lg items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
            <span className="mt-0.5 shrink-0 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
              {t("betaBadge")}
            </span>
            <span>{t("betaNotice")}</span>
          </div>
        </div>

        <LandingExplainer />

        <div className="flex flex-col items-center px-6 pt-2 pb-10">
          <div className="w-full max-w-lg">
            <VaultUploader
              onParsed={(v, m) => {
                setVault(v);
                setMetrics(m);
              }}
            />
          </div>
          <Link href="/feed" className="mt-6 text-sm text-neutral-500 hover:text-violet-700">
            {t("browseExplore")}
          </Link>
        </div>

        <div className="border-t border-violet-100 bg-white pt-10">
          <ConnectGuideView graphs={graphs} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-violet-100 bg-white px-5 py-3">
        <div className="text-sm text-neutral-600">
          <span className="font-medium text-violet-900">{vault.nodes.length}</span> {tCommon("nodes")} ·{" "}
          <span className="font-medium text-violet-900">{vault.edges.length}</span> {tCommon("edges")} ·{" "}
          <span className="font-medium text-violet-900">{clusterCount}</span> {tCommon("clusters")}
        </div>
        <button
          onClick={() => {
            setVault(null);
            setMetrics([]);
            setSelectedNodeId(null);
          }}
          className="text-sm text-neutral-500 hover:text-violet-700"
        >
          {t("uploadDifferent")}
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
