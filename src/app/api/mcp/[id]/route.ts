import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createClient } from "@/lib/supabase/server";
import { createGraphMcpServer } from "@/lib/mcp/server";
import type { GraphRow } from "@/lib/supabase/dbTypes";

/**
 * Hosted MCP endpoint for a single graph: POST/GET/DELETE https://.../api/mcp/<graphId>
 *
 * Any MCP client can point at this URL directly -- no local install needed.
 * A fresh Server + stateless Streamable HTTP transport is created per
 * request (sessionIdGenerator: undefined) since this runs as a serverless
 * function with no guaranteed state between invocations; every handler here
 * is already pure over the fetched graph row, so statelessness costs
 * nothing.
 *
 * Access follows the same Row Level Security as the rest of the app: only
 * public graphs (or the owner's own, if the request carries their session
 * cookie) are servable -- anything else 404s rather than leaking existence.
 */
async function handleRequest(req: Request, id: string): Promise<Response> {
  const supabase = await createClient();
  const { data: graph } = await supabase.from("graphs").select("*").eq("id", id).single();

  if (!graph) {
    return new Response(JSON.stringify({ error: "Graph not found, or not public." }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const row = graph as GraphRow;
  const server = createGraphMcpServer(row.graph_data.vault, {
    name: `shreg-graph-${row.id}`,
    instructions: row.description ?? "This knowledge graph has no generated description yet.",
  });

  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRequest(req, id);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRequest(req, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRequest(req, id);
}
