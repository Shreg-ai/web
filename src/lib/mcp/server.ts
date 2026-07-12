import "server-only";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GRAPH_TOOLS, runGraphTool } from "@/lib/llm/graphTools";
import { toMcpTool, validateRequiredFields } from "./tools";
import type { ParsedVault } from "@/lib/graph/types";

/**
 * Builds an MCP server exposing one compiled graph's search_concepts/
 * get_node/get_related tools. A fresh instance is created per HTTP request
 * (see api/mcp/[id]/route.ts) since Vercel's serverless functions don't hold
 * long-lived state between invocations -- this mirrors the compiler
 * package's createGraphMcpServer, adapted to take an in-memory vault
 * instead of a SQLite GraphStore.
 *
 * Every response path is defensive: an unknown tool name, missing/invalid
 * arguments, or an unexpected error all produce isError: true rather than
 * throwing, so a bad call from a client can't crash the request.
 */
export function createGraphMcpServer(vault: ParsedVault, options: { name?: string; version?: string; instructions?: string } = {}): Server {
  const server = new Server(
    { name: options.name ?? "shreg-graph", version: options.version ?? "0.1.0" },
    { capabilities: { tools: {} }, instructions: options.instructions }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: GRAPH_TOOLS.map(toMcpTool),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = GRAPH_TOOLS.find((t) => t.name === name);

    if (!tool) {
      return {
        content: [{ type: "text" as const, text: `Unknown tool "${name}". Available tools: ${GRAPH_TOOLS.map((t) => t.name).join(", ")}.` }],
        isError: true,
      };
    }

    const validationErrors = validateRequiredFields(tool, args ?? {});
    if (validationErrors.length > 0) {
      return {
        content: [{ type: "text" as const, text: `Invalid input for "${name}": ${validationErrors.join(" ")}` }],
        isError: true,
      };
    }

    try {
      const { resultText } = runGraphTool(vault, name, (args ?? {}) as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: resultText }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text" as const, text: `Tool "${name}" failed: ${message}` }], isError: true };
    }
  });

  return server;
}
