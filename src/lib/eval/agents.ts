import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { extractText, type LlmClient, type LlmMessage } from "@/lib/llm/client";
import { GRAPH_TOOLS, runGraphTool, type ToolCallLog } from "@/lib/llm/graphTools";
import type { ParsedVault } from "@/lib/graph/types";

/** The baseline: answers cold, no graph access, no tools. Ported from the compiler's eval/agents.ts. */
export async function runBaselineAgent(llm: LlmClient, question: string): Promise<string> {
  const response = await llm.complete({
    system: "Answer the user's question as well as you can from your own knowledge.",
    messages: [{ role: "user", content: question }],
    maxTokens: 1024,
  });
  return extractText(response);
}

/** The graph-augmented agent: can call search_concepts/get_node/get_related against the in-memory vault. */
export async function runGraphAgent(
  llm: LlmClient,
  vault: ParsedVault,
  question: string,
  options?: { graphDescription?: string; maxSteps?: number }
): Promise<{ answer: string; toolCalls: ToolCallLog[] }> {
  const maxSteps = options?.maxSteps ?? 6;
  const messages: LlmMessage[] = [{ role: "user", content: question }];
  const toolCalls: ToolCallLog[] = [];

  const system =
    "Answer the user's question using the search_concepts, get_node, and get_related tools to look up " +
    "relevant information in the connected knowledge graph before answering. Ground your answer in what you " +
    "find there where relevant. Try multiple search terms, including the graph's own terminology below, before " +
    "concluding nothing relevant exists.\n\n" +
    (options?.graphDescription ? `What this graph covers:\n${options.graphDescription}` : "");

  for (let step = 0; step < maxSteps; step++) {
    const response = await llm.complete({
      system,
      messages,
      tools: GRAPH_TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema })),
      maxTokens: 1024,
    });

    if (response.stop_reason !== "tool_use") {
      return { answer: extractText(response), toolCalls };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const { resultText, log } = runGraphTool(vault, block.name, block.input as Record<string, unknown>);
      toolCalls.push(log);
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: resultText });
    }
    messages.push({ role: "user", content: toolResults });
  }

  const finalResponse = await llm.complete({
    system: "Give your best final answer now based on the information gathered so far.",
    messages,
    maxTokens: 1024,
  });
  return { answer: extractText(finalResponse), toolCalls };
}
