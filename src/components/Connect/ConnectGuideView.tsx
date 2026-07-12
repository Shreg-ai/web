"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyableCode } from "@/components/CopyableCode";
import { MCP_CLIENTS } from "@/lib/mcpClients";
import type { GraphRow } from "@/lib/supabase/dbTypes";

const PLACEHOLDER_ID = "your-graph-id";

export function ConnectGuideView({ graphs }: { graphs: Pick<GraphRow, "id" | "title" | "visibility">[] }) {
  const [origin, setOrigin] = useState("https://shreg.ai");
  useEffect(() => setOrigin(window.location.origin), []);

  const [selectedGraphId, setSelectedGraphId] = useState<string>(graphs[0]?.id ?? PLACEHOLDER_ID);
  const selectedGraph = graphs.find((g) => g.id === selectedGraphId) ?? null;
  const mcpUrl = `${origin}/api/mcp/${selectedGraphId}`;

  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const isPlaceholder = selectedGraphId === PLACEHOLDER_ID;
  const isPrivateSelected = selectedGraph?.visibility === "private";

  const clientsById = useMemo(() => new Map(MCP_CLIENTS.map((c) => [c.id, c])), []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-medium text-violet-950">Connect your graph to an AI agent</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Every graph on Shreg is also a live MCP (Model Context Protocol) server -- a small set of tools an AI agent
          can call to search, read, and traverse that graph directly, instead of just guessing from its training
          data. Any client that speaks MCP can connect to it: Claude Code, Claude Desktop, ChatGPT, Cursor,
          Windsurf, VS Code, Gemini CLI, Cline, and more.
        </p>
      </div>

      <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-4 text-sm text-neutral-700">
        <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">A few things worth knowing</h2>
        <ul className="flex flex-col gap-1.5 list-disc pl-4">
          <li>Each graph has its own endpoint URL -- one URL per graph, not one for your whole account.</li>
          <li>
            Public graphs work with any client out of the box. Private graphs only respond to requests carrying{" "}
            <em>your</em>{" "}
            logged-in session -- since remote clients (Claude Desktop, ChatGPT, and most others) call this URL from
            their own servers, not your browser, they generally can&apos;t authenticate as you. If you want an agent
            to reach a graph, make it public first.
          </li>
          <li>Connecting an agent doesn&apos;t change who can see the graph on Shreg -- it&apos;s a separate, additional way in.</li>
        </ul>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">Pick which graph&apos;s endpoint to use below</h2>
        {graphs.length > 0 ? (
          <select
            value={selectedGraphId}
            onChange={(e) => setSelectedGraphId(e.target.value)}
            className="w-full rounded-md border border-violet-200 px-3 py-2 text-sm"
          >
            {graphs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} {g.visibility === "private" ? "(private)" : ""}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-neutral-500">
            Log in and upload a graph to get your own copy-pasteable endpoint -- for now, the instructions below use a
            placeholder URL you can swap your real one into.
          </p>
        )}
        <div className="mt-2">
          <CopyableCode code={mcpUrl} />
        </div>
        {isPrivateSelected && !isPlaceholder && (
          <p className="mt-1.5 text-xs text-amber-700">
            This graph is private -- most remote clients below won&apos;t be able to authenticate as you and will see it
            as not found. Make it public from the graph page if you want an agent to actually reach it.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-xs font-medium tracking-wide text-neutral-400 uppercase">Choose where you want to connect it</h2>
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
                <span className="mt-0.5 block text-xs font-normal text-neutral-400">{client.kind}</span>
              </button>
            );
          })}
        </div>

        {openClientId && (
          <div className="mt-4 rounded-lg border border-violet-100 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium text-violet-950">Set up {clientsById.get(openClientId)?.name}</h3>
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
