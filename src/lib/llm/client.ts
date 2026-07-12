import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export type LlmMessage = Anthropic.MessageParam;
export type LlmTool = Anthropic.Tool;
export type LlmResponse = Anthropic.Message;

export interface LlmClient {
  complete(params: {
    system?: string;
    messages: LlmMessage[];
    tools?: LlmTool[];
    toolChoice?: Anthropic.ToolChoice;
    maxTokens?: number;
  }): Promise<LlmResponse>;
}

/**
 * Thin wrapper around the Anthropic SDK, ported from the compiler package
 * (src/llm/client.ts). Marked server-only since ANTHROPIC_API_KEY must never
 * reach the browser bundle.
 */
export function createAnthropicClient(options?: { apiKey?: string; model?: string }): LlmClient {
  const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set on the server.");
  }
  const model = options?.model ?? process.env.SHREG_LLM_MODEL ?? DEFAULT_MODEL;
  const client = new Anthropic({ apiKey });

  return {
    async complete({ system, messages, tools, toolChoice, maxTokens = 1536 }) {
      return client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages,
        tools,
        tool_choice: toolChoice,
      });
    },
  };
}

/** Concatenates all text blocks in a response. Ignores tool_use blocks. */
export function extractText(response: LlmResponse): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

/** Returns the input of the first tool_use block matching `toolName`, if any. */
export function extractToolInput<T>(response: LlmResponse, toolName: string): T | undefined {
  const block = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === toolName);
  return block?.input as T | undefined;
}
