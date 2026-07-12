"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CopyableCode } from "@/components/CopyableCode";
import { MCP_CLIENTS } from "@/lib/mcpClients";
import type { GraphRow } from "@/lib/supabase/dbTypes";

const PLACEHOLDER_ID = "your-graph-id";

export function ConnectGuideView({ graphs }: { graphs: Pick<GraphRow, "id" | "title" | "visibility">[] }) {
  const t = useTranslations("connect");
  const [origin, setOrigin] = useState("https://shreg.ai");
  useEffect(() => setOrigin(window.location.origin), []);

  const [selectedGraphId, setSelectedGraphId] = useState<string>(graphs[0]?.id ?? PLACEHOLDER_ID);
  const selectedGraph = graphs.find((g) => g.id === selectedGraphId) ?? null;
  const mcpUrl = `${origin}/api/mcp/${selectedGraphId}`;

  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const isPlaceholder = selectedGraphId === PLACEHOLDER_ID;
  const isPrivateSelected = selectedGraph?.visibility === "private";

  const clientsById = useMemo(() => new Map(MCP_CLIENTS.map((c) => [c.id, c])), []);
  const kindLabels: Record<string, string> = {
    CLI: t("kindCli"),
    "Desktop app": t("kindDesktopApp"),
    "Chat app": t("kindChatApp"),
    IDE: t("kindIde"),
    "IDE extension": t("kindIdeExtension"),
    Generic: t("kindGeneric"),
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-medium text-violet-950">{t("title")}</h1>
        <p className="mt-2 text-sm text-neutral-600">{t("intro")}</p>
      </div>

      <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-4 text-sm text-neutral-700">
        <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("knowingHeading")}</h2>
        <ul className="flex flex-col gap-1.5 list-disc pl-4">
          <li>{t("knowing1")}</li>
          <li>
            {t("knowing2Prefix")}{" "}
            <em>{t("knowing2Your")}</em>{" "}
            {t("knowing2Suffix")}
          </li>
          <li>{t("knowing3")}</li>
        </ul>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("pickEndpoint")}</h2>
        {graphs.length > 0 ? (
          <select
            value={selectedGraphId}
            onChange={(e) => setSelectedGraphId(e.target.value)}
            className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm"
          >
            {graphs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} {g.visibility === "private" ? t("privateLabel") : ""}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-neutral-500">{t("noGraphsMessage")}</p>
        )}
        <div className="mt-2">
          <CopyableCode code={mcpUrl} />
        </div>
        {isPrivateSelected && !isPlaceholder && <p className="mt-1.5 text-xs text-amber-700">{t("privateWarning")}</p>}
      </div>

      <div>
        <h2 className="mb-3 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("chooseWhere")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MCP_CLIENTS.map((client) => {
            const open = openClientId === client.id;
            return (
              <button
                key={client.id}
                onClick={() => setOpenClientId(open ? null : client.id)}
                className={`rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  open ? "border-violet-400 bg-violet-50 text-violet-800" : "border-violet-100 text-neutral-700 hover:border-violet-300 hover:bg-violet-50/60"
                }`}
              >
                {client.name}
                <span className="mt-0.5 block text-xs font-normal text-neutral-400">{kindLabels[client.kind] ?? client.kind}</span>
              </button>
            );
          })}
        </div>

        {openClientId && (
          <div className="mt-4 rounded-lg border border-violet-100 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium text-violet-950">{t("setUp", { name: clientsById.get(openClientId)?.name ?? "" })}</h3>
            <ol className="flex flex-col gap-3">
              {clientsById.get(openClientId)!.steps(mcpUrl).map((step, i) => (
                <li key={i} className="text-sm text-neutral-700">
                  <span className="mr-1.5 font-medium text-violet-600">{i + 1}.</span>
                  {step.text}
                  {step.code && (
                    <div className="mt-1.5">
                      <CopyableCode code={step.code} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
