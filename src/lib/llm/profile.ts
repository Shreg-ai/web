import "server-only";
import type { GraphProfile, GraphSummary } from "@/lib/graph/types";
import { extractToolInput, type LlmClient } from "./client";

const SUBMIT_PROFILE_TOOL = {
  name: "submit_profile",
  description: "Submit the graph profile and usage scenarios.",
  input_schema: {
    type: "object" as const,
    properties: {
      description: {
        type: "string",
        description:
          "2-4 sentences describing what this knowledge graph is useful for. This is read by an AI agent " +
          "deciding whether to query the graph at all, so it must say what kinds of questions it helps " +
          "answer, not just what topic it covers.",
      },
      scenarios: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description:
                "A general question in the graph's subject domain, phrased the way a real user would ask an AI " +
                "assistant BEFORE knowing this graph exists. It must NOT name a single specific company/entity/" +
                "event from the graph as its subject — that makes it trivia, not a useful scenario. Ask about " +
                "the underlying framework or judgment call instead, and let a graph-aware agent bring in the " +
                "specific case studies on its own.",
            },
            whyRelevant: {
              type: "string",
              description:
                "One sentence on why a graph-aware agent has an edge answering this general question — " +
                "i.e. which specific frameworks or precedents in the graph let it go beyond a generic answer.",
            },
            relevantNodeIds: {
              type: "array",
              items: { type: "string" },
              description: "IDs of the nodes most relevant to answering this question.",
            },
          },
          required: ["question", "whyRelevant", "relevantNodeIds"],
        },
      },
    },
    required: ["description", "scenarios"],
  },
};

function renderSummary(summary: GraphSummary): string {
  const hubSection = summary.hubNodes
    .map((n) => `- [${n.id}] "${n.title}" (in=${n.inDegree}, out=${n.outDegree})\n  ${n.snippet.replace(/\n/g, " ")}`)
    .join("\n");

  return [
    `Total nodes: ${summary.totalNodes}, total edges: ${summary.totalEdges}, clusters: ${summary.clusterCount}`,
    "",
    "Highest-connectivity nodes (hubs), with a snippet of each:",
    hubSection,
    "",
    "Other node titles in the graph:",
    summary.otherTitles.join(", "),
  ].join("\n");
}

/**
 * Generates the tool-facing description and concrete usage scenarios for a
 * compiled graph. Ported from the compiler package's llm/profile.ts.
 */
export async function generateGraphProfile(llm: LlmClient, summary: GraphSummary, scenarioCount = 5): Promise<GraphProfile> {
  const response = await llm.complete({
    system:
      "You analyze a personal/expert knowledge graph (extracted from someone's notes) and describe what it's " +
      "useful for. Be concrete and specific to the actual content shown, not generic. Assume the reader is an " +
      "AI agent deciding in real time whether this graph is worth querying for a given user question.\n\n" +
      "The scenarios you generate are the most important output: they should be general, broadly useful " +
      "questions that pertain to the overall themes described in the profile, not trivia about one specific " +
      "node. Picture a real user asking an AI assistant a question they actually care about, with no idea this " +
      "graph exists. The graph should then give the answering agent an edge — richer frameworks, named " +
      "precedents, specific terminology — not be a precondition for the question to make sense at all.",
    messages: [
      {
        role: "user",
        content:
          `Here is a summary of the knowledge graph:\n\n${renderSummary(summary)}\n\n` +
          `Generate the profile and exactly ${scenarioCount} usage scenarios. Each scenario question should be ` +
          `general enough to stand on its own as something a real user would ask, while still being a question ` +
          `this graph's frameworks and case studies can answer unusually well.`,
      },
    ],
    tools: [SUBMIT_PROFILE_TOOL],
    toolChoice: { type: "tool", name: "submit_profile" },
    maxTokens: 2048,
  });

  const result = extractToolInput<GraphProfile>(response, "submit_profile");
  if (!result) {
    throw new Error("Model did not return a submit_profile tool call");
  }
  return result;
}
