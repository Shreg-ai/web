"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readVaultFileList, buildVaultGraph } from "@/lib/graph/parseVault";
import { computeStructuralMetrics } from "@/lib/graph/structural";
import { saveGraphVersion } from "@/app/g/[id]/actions";
import { Spinner } from "@/components/Spinner";
import type { GraphVersionRow } from "@/lib/supabase/dbTypes";

// webkitdirectory/directory are non-standard but widely supported folder-picker attributes.
const folderInputProps = {
  webkitdirectory: "",
  directory: "",
} as unknown as React.InputHTMLAttributes<HTMLInputElement>;

export function VersionHistoryPanel({
  graphId,
  initialVersions,
  isOwner,
}: {
  graphId: string;
  initialVersions: GraphVersionRow[];
  isOwner: boolean;
}) {
  const [versions, setVersions] = useState(initialVersions);
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setUploading(true);
      setError(null);
      try {
        const files = await readVaultFileList(fileList);
        if (files.length === 0) {
          setError("No Markdown (.md) files found in that folder.");
          setUploading(false);
          return;
        }
        const vault = buildVaultGraph(files);
        const metrics = computeStructuralMetrics(vault);
        const result = await saveGraphVersion(graphId, { vault, metrics });
        setUploading(false);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.versionId && result.versionNumber) {
          setVersions((prev) => [
            {
              id: result.versionId!,
              graph_id: graphId,
              version_number: result.versionNumber!,
              graph_data: { vault, metrics },
              scenarios: [],
              node_count: vault.nodes.length,
              edge_count: vault.edges.length,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
          setExpanded(true);
        }
      } catch (err) {
        setUploading(false);
        setError(err instanceof Error ? err.message : "Failed to parse vault.");
      }
    },
    [graphId]
  );

  function handleCopy(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const latestVersionNumber = versions[0]?.version_number;

  return (
    <div className="border-t border-violet-100 p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-violet-950"
        >
          Versions ({versions.length})
          <svg
            viewBox="0 0 20 20"
            className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M5 7.5 10 13l5-5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {isOwner && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:underline disabled:opacity-50"
            >
              {uploading && <Spinner className="h-3.5 w-3.5" />}
              {uploading ? "Uploading…" : "Upload new version"}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              {...folderInputProps}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {expanded && (
        <ul className="flex flex-col gap-2">
          {versions.map((v) => {
            const url = `${origin}/api/mcp/v/${v.id}`;
            const isCurrent = v.version_number === latestVersionNumber;
            return (
              <li key={v.id} className="rounded-md border border-violet-100 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium text-neutral-900">v{v.version_number}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">Current</span>
                  )}
                  <span className="text-xs text-neutral-400">{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mb-2 text-xs text-neutral-500">
                  {v.node_count} nodes · {v.edge_count} edges
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-700">{url}</code>
                  <button onClick={() => handleCopy(url, v.id)} className="shrink-0 text-xs text-violet-600 hover:underline">
                    {copiedId === v.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
