"use client";

import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

interface NodeDetailPanelProps {
  vault: ParsedVault;
  metrics: NodeMetrics[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export function NodeDetailPanel({ vault, metrics, selectedNodeId, onSelectNode }: NodeDetailPanelProps) {
  if (!selectedNodeId) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-400">
        Click a node to see its content and connections.
      </div>
    );
  }

  const node = vault.nodes.find((n) => n.id === selectedNodeId);
  const nodeMetrics = metrics.find((m) => m.nodeId === selectedNodeId);
  if (!node) return null;

  const outgoing = vault.edges.filter((e) => e.sourceId === selectedNodeId);
  const incoming = vault.edges.filter((e) => e.targetId === selectedNodeId);
  const isUnresolved = node.frontmatter.unresolved === true;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-medium text-violet-950">{node.title}</h3>
        <button onClick={() => onSelectNode(null)} className="text-sm text-neutral-400 hover:text-neutral-700">
          ✕
        </button>
      </div>

      {isUnresolved ? (
        <p className="text-sm text-neutral-500">
          This node is referenced by a [[wikilink]] but has no corresponding note in the vault.
        </p>
      ) : (
        <>
          <div className="flex gap-3 text-xs text-neutral-500">
            <span>{nodeMetrics?.inDegree ?? 0} incoming</span>
            <span>{nodeMetrics?.outDegree ?? 0} outgoing</span>
          </div>

          {node.body && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
              {node.body.length > 1500 ? `${node.body.slice(0, 1500)}…` : node.body}
            </p>
          )}
        </>
      )}

      {outgoing.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">Links to</h4>
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
          <h4 className="mb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">Linked from</h4>
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
