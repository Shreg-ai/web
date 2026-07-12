"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { deleteGraph, setGraphVisibility } from "./actions";
import type { GraphRow, GraphVisibility } from "@/lib/supabase/dbTypes";

export function GraphList({ graphs }: { graphs: GraphRow[] }) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [items, setItems] = useState(graphs);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
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
    return <p className="text-sm text-neutral-500">{t("empty")}</p>;
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
              {g.node_count} {tCommon("nodes")} · {g.edge_count} {tCommon("edges")} ·{" "}
              {g.visibility === "public" ? tCommon("public") : tCommon("private")}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => handleToggleVisibility(g.id, g.visibility)} className="text-neutral-600 hover:text-violet-700">
              {g.visibility === "public" ? t("makePrivate") : t("makePublic")}
            </button>
            {g.visibility === "public" && (
              <button onClick={() => handleCopyLink(g.id)} className="text-violet-600 hover:underline">
                {copiedId === g.id ? tCommon("copied") : t("copyLink")}
              </button>
            )}
            <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:underline">
              {tCommon("delete")}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
