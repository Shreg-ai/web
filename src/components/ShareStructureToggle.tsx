"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { setShareFullStructure } from "@/app/playground/actions";

export function ShareStructureToggle({ graphId, initialShared }: { graphId: string; initialShared: boolean }) {
  const t = useTranslations("shareStructure");
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
          <span className="font-medium text-violet-950">{t("heading")}</span>
          <p className="mt-0.5 text-xs text-neutral-500">{t("description")}</p>
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
