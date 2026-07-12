"use client";

import { useState } from "react";
import Link from "next/link";
import { saveGraph } from "@/app/dashboard/actions";
import type { NodeMetrics, ParsedVault } from "@/lib/graph/types";
import type { GraphVisibility } from "@/lib/supabase/dbTypes";

interface SaveGraphPanelProps {
  vault: ParsedVault;
  metrics: NodeMetrics[];
  isLoggedIn: boolean;
}

export function SaveGraphPanel({ vault, metrics, isLoggedIn }: SaveGraphPanelProps) {
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<GraphVisibility>("private");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="border-t border-violet-100 p-4 text-sm text-neutral-500">
        <Link href="/login" className="text-violet-600 hover:underline">
          Log in
        </Link>{" "}
        to save and share this graph.
      </div>
    );
  }

  if (savedId) {
    return (
      <div className="border-t border-violet-100 p-4 text-sm">
        <p className="mb-1 text-green-700">Saved.</p>
        <Link href={`/g/${savedId}`} className="text-violet-600 hover:underline">
          View saved graph →
        </Link>
      </div>
    );
  }

  async function handleSave() {
    setStatus("saving");
    setError(null);
    const result = await saveGraph({ title, visibility, payload: { vault, metrics } });
    if (result.error) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setStatus("idle");
    setSavedId(result.id ?? null);
  }

  return (
    <div className="flex flex-col gap-2 border-t border-violet-100 p-4">
      <p className="text-xs text-neutral-500">Saving stores this graph (including note contents) in our database.</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give this graph a title"
        className="rounded-md border border-violet-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none"
      />
      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={visibility === "public"}
          onChange={(e) => setVisibility(e.target.checked ? "public" : "private")}
          className="accent-violet-600"
        />
        Make this graph public (shareable link)
      </label>
      <button
        onClick={handleSave}
        disabled={status === "saving" || !title.trim()}
        className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
