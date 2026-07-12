import "server-only";
import { extractToolInput, type LlmClient } from "@/lib/llm/client";

export interface RubricScores {
  groundedness: number;
  frameworkConsistency: number;
  specificity: number;
}

export interface JudgeResult {
  baselineScores: RubricScores;
  graphScores: RubricScores;
  winner: "baseline" | "graph" | "tie";
  reasoning: string;
}

const scoreSchema = {
  type: "object" as const,
  properties: {
    groundedness: { type: "integer", minimum: 1, maximum: 5, description: "Is the answer backed by specific facts rather than generic statements?" },
    frameworkConsistency: {
      type: "integer",
      minimum: 1,
      maximum: 5,
      description: "Does the answer use the specific mental models/frameworks relevant to this domain, rather than generic reasoning?",
    },
    specificity: { type: "integer", minimum: 1, maximum: 5, description: "Does the answer name specific entities, precedents, or numbers rather than staying abstract?" },
  },
  required: ["groundedness", "frameworkConsistency", "specificity"],
};

const SUBMIT_JUDGMENT_TOOL = {
  name: "submit_judgment",
  description: "Submit rubric scores and a pairwise winner for the two answers.",
  input_schema: {
    type: "object" as const,
    properties: {
      baselineScores: scoreSchema,
      graphScores: scoreSchema,
      winner: { type: "string", enum: ["baseline", "graph", "tie"] },
      reasoning: { type: "string", description: "2-3 sentences explaining the scores and winner." },
    },
    required: ["baselineScores", "graphScores", "winner", "reasoning"],
  },
};

/** Scores the baseline answer against the graph-augmented answer. Ported from the compiler's eval/judge.ts. */
export async function judgeComparison(
  llm: LlmClient,
  question: string,
  whyRelevant: string,
  baselineAnswer: string,
  graphAnswer: string
): Promise<JudgeResult> {
  const response = await llm.complete({
    system:
      "You are an impartial judge comparing two AI answers to the same question: one from an agent with no " +
      "extra context, one from an agent with access to a domain-specific knowledge graph. Score both on the " +
      "rubric, then say which is better overall for this specific question. Do not favor length; favor " +
      "accuracy, specificity, and fit to what the question actually needs.",
    messages: [
      {
        role: "user",
        content:
          `Question: ${question}\n\nWhy this question is a meaningful test: ${whyRelevant}\n\n` +
          `Answer A (baseline, no tools):\n${baselineAnswer}\n\n` +
          `Answer B (graph-augmented):\n${graphAnswer}\n\n` +
          `Score Answer A as baselineScores and Answer B as graphScores.`,
      },
    ],
    tools: [SUBMIT_JUDGMENT_TOOL],
    toolChoice: { type: "tool", name: "submit_judgment" },
    maxTokens: 1024,
  });

  const result = extractToolInput<JudgeResult>(response, "submit_judgment");
  if (!result) {
    throw new Error("Model did not return a submit_judgment tool call");
  }
  return result;
}
