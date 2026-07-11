"use client";

import { useCallback, useRef, useState } from "react";
import { buildVaultGraph, readVaultFileList } from "@/lib/graph/parseVault";
import { computeStructuralMetrics } from "@/lib/graph/structural";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";

interface VaultUploaderProps {
  onParsed: (vault: ParsedVault, metrics: NodeMetrics[]) => void;
}

// webkitdirectory/directory are non-standard but widely supported (Chrome, Edge, Safari)
// folder-picker attributes that aren't in React's built-in input typings.
const folderInputProps = {
  webkitdirectory: "",
  directory: "",
} as unknown as React.InputHTMLAttributes<HTMLInputElement>;

export function VaultUploader({ onParsed }: VaultUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setStatus("parsing");
      setError(null);
      try {
        const files = await readVaultFileList(fileList);
        if (files.length === 0) {
          setStatus("error");
          setError("No Markdown (.md) files found in that folder.");
          return;
        }
        const vault = buildVaultGraph(files);
        const metrics = computeStructuralMetrics(vault);
        onParsed(vault, metrics);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to parse vault.");
      }
    },
    [onParsed]
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 p-16 text-center">
      <h2 className="text-lg font-medium">Visualize your knowledge graph</h2>
      <p className="max-w-md text-sm text-neutral-500">
        Select an Obsidian vault folder. Parsing happens entirely in your browser — your notes are never uploaded
        anywhere.
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "parsing"}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "parsing" ? "Parsing…" : "Choose vault folder"}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        {...folderInputProps}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
