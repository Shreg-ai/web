"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteGraph, setGraphVisibility } from "./actions";
import type { GraphRow, GraphVisibility } from "@/lib/supabase/dbTypes";

export function GraphList({ graphs }: { graphs: GraphRow[] }) {
  const [items, setItems] = useState(graphs);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this graph? This can't be undone.")) return;
    setItems((prev) => prev.filter((g) => g.id !== id));
    await deleteGraph(id);
  }

  async function handleToggleVisibility(id: string, current: GraphVisibility) {
    const next: GraphVisibility = current === "public" ? "private" : "public";
    setItems((prev) => prev.map((g) => (g.id === id ? { ...g, visibility: next } : g)));
    await setGraphVisibility(id, next);
  }

  function handleCopyLink(id: string) {
    const url = `${window.location.origin}/g/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No graphs saved yet. Upload a vault to get started.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((g) => (
        <li key={g.id} className="flex items-center justify-between rounded-lg border border-violet-100 bg-white p-4 shadow-sm">
          <div>
            <Link href={`/g/${g.id}`} className="font-medium text-violet-950 hover:underline">
              {g.title}
            </Link>
            <p className="text-xs text-neutral-500">
              {g.node_count} nodes · {g.edge_count} edges · {g.visibility === "public" ? "Public" : "Private"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => handleToggleVisibility(g.id, g.visibility)} className="text-neutral-600 hover:text-violet-700">
              {g.visibility === "public" ? "Make private" : "Make public"}
            </button>
            {g.visibility === "public" && (
              <button onClick={() => handleCopyLink(g.id)} className="text-violet-600 hover:underline">
                {copiedId === g.id ? "Copied!" : "Copy link"}
              </button>
            )}
            <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:underline">
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
