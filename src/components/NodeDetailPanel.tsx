"use client";

import { useTranslations } from "next-intl";
import { splitBodyWithWikilinks } from "@/lib/graph/wikilinks";
import { colorForType } from "@/lib/graph/colors";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

function formatFrontmatterValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

interface NodeDetailPanelProps {
  vault: ParsedVault;
  metrics: NodeMetrics[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export function NodeDetailPanel({ vault, metrics, selectedNodeId, onSelectNode }: NodeDetailPanelProps) {
  const t = useTranslations("nodeDetail");

  if (!selectedNodeId) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-400">
        {t("emptyState")}
      </div>
    );
  }

  const node = vault.nodes.find((n) => n.id === selectedNodeId);
  const nodeMetrics = metrics.find((m) => m.nodeId === selectedNodeId);
  if (!node) return null;

  const outgoing = vault.edges.filter((e) => e.sourceId === selectedNodeId);
  const incoming = vault.edges.filter((e) => e.targetId === selectedNodeId);
  const isUnresolved = node.frontmatter.unresolved === true;
  const frontmatterEntries = Object.entries(node.frontmatter).filter(([key]) => key !== "unresolved");

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-medium text-violet-950">{node.title}</h3>
        <button onClick={() => onSelectNode(null)} className="text-sm text-neutral-400 hover:text-neutral-700">
          ✕
        </button>
      </div>

      {isUnresolved ? (
        <p className="text-sm text-neutral-500">{t("unresolvedNote")}</p>
      ) : (
        <>
          <div className="flex gap-3 text-xs text-neutral-500">
            <span>{t("incoming", { count: nodeMetrics?.inDegree ?? 0 })}</span>
            <span>{t("outgoing", { count: nodeMetrics?.outDegree ?? 0 })}</span>
          </div>

          {frontmatterEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {frontmatterEntries.map(([key, value]) => {
                const isType = key === "type" && typeof value === "string";
                return (
                  <span
                    key={key}
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={
                      isType
                        ? { background: colorForType(value as string), color: "white" }
                        : { background: "#f5f3ff", color: "#6d28d9" }
                    }
                  >
                    {!isType && <span className="opacity-60">{key}: </span>}
                    {formatFrontmatterValue(value)}
                  </span>
                );
              })}
            </div>
          )}

          {node.body && (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
              {splitBodyWithWikilinks(node.body.length > 1500 ? `${node.body.slice(0, 1500)}…` : node.body).map((seg, i) =>
                seg.type === "link" ? (
                  <button
                    key={i}
                    onClick={() => onSelectNode(seg.target!)}
                    className="text-violet-600 hover:underline"
                  >
                    {seg.text}
                  </button>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </div>
          )}
        </>
      )}

      {outgoing.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("linksTo")}</h4>
          <ul className="flex flex-col gap-1">
            {outgoing.map((e, i) => (
              <li key={i}>
                <button onClick={() => onSelectNode(e.targetId)} className="text-sm text-violet-600 hover:underline">
                  {e.targetId}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {incoming.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("linkedFrom")}</h4>
          <ul className="flex flex-col gap-1">
            {incoming.map((e, i) => (
              <li key={i}>
                <button onClick={() => onSelectNode(e.sourceId)} className="text-sm text-violet-600 hover:underline">
                  {e.sourceId}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
