import "server-only";
import type { ParsedVault } from "@/lib/graph/types";

export interface GraphToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
}

export interface ToolCallLog {
  tool: string;
  input: Record<string, unknown>;
  resultSummary: string;
}

export const GRAPH_TOOLS: GraphToolDefinition[] = [
  {
    name: "search_concepts",
    description: "Search the knowledge graph for nodes matching a keyword or phrase. Returns matching titles and snippets.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword or phrase to search for." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_node",
    description: "Fetch the full content of a specific node by its exact ID/title.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The exact node ID (title) to fetch." },
      },
      required: ["id"],
    },
  },
  {
    name: "get_related",
    description: "Get nodes directly connected to a given node, in either link direction.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The exact node ID (title) to find neighbors of." },
      },
      required: ["id"],
    },
  },
];

/**
 * Tokenized, term-overlap-ranked search over the in-memory vault (ported
 * from the compiler package's GraphStore.searchNodes fix -- a literal
 * whole-phrase substring match fails on any multi-word query whose exact
 * phrase never appears verbatim, even when individual words trivially do).
 */
function searchNodes(vault: ParsedVault, query: string, limit = 5) {
  const terms = [...new Set(query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 2))];
  if (terms.length === 0) return [];

  const scored = vault.nodes
    .map((node) => {
      const title = node.title.toLowerCase();
      const body = node.body.toLowerCase();
      const titleMatches = terms.filter((t) => title.includes(t)).length;
      const bodyMatches = terms.filter((t) => body.includes(t)).length;
      return { node, score: titleMatches * 2 + bodyMatches };
    })
    .filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.node);
}

function getRelated(vault: ParsedVault, id: string, limit = 10) {
  const relatedIds = new Set<string>();
  for (const edge of vault.edges) {
    if (edge.sourceId === id) relatedIds.add(edge.targetId);
    if (edge.targetId === id) relatedIds.add(edge.sourceId);
  }
  return vault.nodes.filter((n) => relatedIds.has(n.id)).slice(0, limit);
}

/** Executes a single tool call against the in-memory vault and logs it. */
export function runGraphTool(
  vault: ParsedVault,
  name: string,
  input: Record<string, unknown>
): { resultText: string; log: ToolCallLog } {
  let resultText: string;

  if (name === "search_concepts") {
    const matches = searchNodes(vault, String(input.query ?? ""));
    resultText = matches.length
      ? matches.map((n) => `[${n.id}] ${n.title}: ${n.body.slice(0, 200).replace(/\n/g, " ")}`).join("\n")
      : "No matching nodes found.";
  } else if (name === "get_node") {
    const node = vault.nodes.find((n) => n.id === input.id);
    resultText = node
      ? `Title: ${node.title}\nFrontmatter: ${JSON.stringify(node.frontmatter)}\nBody:\n${node.body}`
      : `No node found with id "${input.id}".`;
  } else if (name === "get_related") {
    const related = getRelated(vault, String(input.id ?? ""));
    resultText = related.length ? related.map((n) => `[${n.id}] ${n.title}`).join("\n") : `No related nodes found for "${input.id}".`;
  } else {
    resultText = `Unknown tool: ${name}`;
  }

  return {
    resultText,
    log: { tool: name, input, resultSummary: resultText.slice(0, 200) },
  };
}
