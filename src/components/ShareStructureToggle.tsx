"use client";

import { useState } from "react";
import { setShareFullStructure } from "@/app/playground/actions";

export function ShareStructureToggle({ graphId, initialShared }: { graphId: string; initialShared: boolean }) {
  const [shared, setShared] = useState(initialShared);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: boolean) {
    setBusy(true);
    setError(null);
    const prev = shared;
    setShared(next);
    const result = await setShareFullStructure(graphId, next);
    setBusy(false);
    if (result.error) {
      setShared(prev);
      setError(result.error);
    }
  }

  return (
    <div className="border-t border-violet-100 p-5">
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={shared}
          disabled={busy}
          onChange={(e) => handleChange(e.target.checked)}
          className="mt-0.5 accent-violet-600"
        />
        <span>
          <span className="font-medium text-violet-950">Share full structure with the Knowledge Playground</span>
          <p className="mt-0.5 text-xs text-neutral-500">
            Lets other users import this graph&apos;s actual nodes and connections into their own Playground sessions --
            separate from the AI analysis and eval results, which are already visible to anyone once this graph is
            public. Turning this on also makes the graph public.
          </p>
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
