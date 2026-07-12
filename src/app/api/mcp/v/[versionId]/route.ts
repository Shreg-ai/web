import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createClient } from "@/lib/supabase/server";
import { createGraphMcpServer } from "@/lib/mcp/server";
import type { GraphRow, GraphVersionRow } from "@/lib/supabase/dbTypes";

/**
 * Hosted MCP endpoint pinned to one specific graph version:
 * POST/GET/DELETE https://.../api/mcp/v/<versionId>
 *
 * Unlike /api/mcp/<graphId> (which always serves the graph's current/latest
 * data), this endpoint always serves the exact snapshot saved under this
 * version id, forever -- so a link handed out for version 2 keeps answering
 * from version 2's content even after version 5 is published.
 *
 * Access follows the same RLS as the rest of the app: a version is only
 * servable if its parent graph is public, or the request carries the
 * owner's session cookie.
 */
async function handleRequest(req: Request, versionId: string): Promise<Response> {
  const supabase = await createClient();
  const { data: version } = await supabase.from("graph_versions").select("*").eq("id", versionId).single();

  if (!version) {
    return new Response(JSON.stringify({ error: "Graph version not found, or not public." }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const versionRow = version as GraphVersionRow;
  const { data: graph } = await supabase.from("graphs").select("description").eq("id", versionRow.graph_id).single();
  const description = (graph as Pick<GraphRow, "description"> | null)?.description;

  const server = createGraphMcpServer(versionRow.graph_data.vault, {
    name: `shreg-graph-${versionRow.graph_id}-v${versionRow.version_number}`,
    instructions: description ?? "This knowledge graph has no generated description yet.",
  });

  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  return handleRequest(req, versionId);
}

export async function POST(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  return handleRequest(req, versionId);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  return handleRequest(req, versionId);
}
