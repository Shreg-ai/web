import "server-only";
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";
import type { GraphToolDefinition } from "@/lib/llm/graphTools";

/** Converts our JSON-Schema-shaped tool definition to the MCP wire format (input_schema -> inputSchema). */
export function toMcpTool(tool: GraphToolDefinition): McpTool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.input_schema,
  };
}

/**
 * Schema-driven validation of a tool call's arguments against its declared
 * input_schema, generic over whatever tools are registered. Ported from the
 * compiler package's mcp/tools.ts.
 */
export function validateRequiredFields(tool: GraphToolDefinition, input: unknown): string[] {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return ["Tool input must be an object."];
  }

  const record = input as Record<string, unknown>;
  const errors: string[] = [];

  for (const field of tool.input_schema.required) {
    const value = record[field];
    if (value === undefined || value === null) {
      errors.push(`Missing required field "${field}".`);
      continue;
    }

    const propType = tool.input_schema.properties[field]?.type;
    if (propType === "string" && typeof value !== "string") {
      errors.push(`Field "${field}" must be a string.`);
    } else if (propType === "array" && !Array.isArray(value)) {
      errors.push(`Field "${field}" must be an array.`);
    } else if ((propType === "integer" || propType === "number") && typeof value !== "number") {
      errors.push(`Field "${field}" must be a number.`);
    }
  }

  return errors;
}
