"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("vaultUploader");
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
          setError(t("noMarkdownFiles"));
          return;
        }
        const vault = buildVaultGraph(files);
        const metrics = computeStructuralMetrics(vault);
        onParsed(vault, metrics);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : t("failedToParse"));
      }
    },
    [onParsed, t]
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-violet-200 bg-white p-16 text-center shadow-sm">
      <h2 className="text-lg font-medium text-violet-950">{t("heading")}</h2>
      <p className="max-w-md text-sm text-neutral-500">{t("description")}</p>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "parsing"}
        className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {status === "parsing" ? t("parsing") : t("chooseFolder")}
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
