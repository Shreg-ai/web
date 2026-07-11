import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStructuralMetrics } from "../src/lib/graph/structural";
import type { ParsedVault } from "../src/lib/graph/types";

function node(id: string) {
  return { id, title: id, body: "", frontmatter: {}, sourcePath: "" };
}

test("computes in/out degree per node", () => {
  const vault: ParsedVault = {
    nodes: [node("A"), node("B"), node("C")],
    edges: [
      { sourceId: "A", targetId: "B", context: "" },
      { sourceId: "A", targetId: "C", context: "" },
      { sourceId: "B", targetId: "C", context: "" },
    ],
  };

  const metrics = computeStructuralMetrics(vault);
  const byId = Object.fromEntries(metrics.map((m) => [m.nodeId, m]));

  assert.equal(byId.A.outDegree, 2);
  assert.equal(byId.C.inDegree, 2);
});

test("groups connected nodes into the same cluster", () => {
  const vault: ParsedVault = {
    nodes: [node("A"), node("B"), node("C"), node("D")],
    edges: [{ sourceId: "A", targetId: "B", context: "" }],
  };

  const metrics = computeStructuralMetrics(vault);
  const byId = Object.fromEntries(metrics.map((m) => [m.nodeId, m]));

  assert.equal(byId.A.clusterId, byId.B.clusterId);
  assert.notEqual(byId.A.clusterId, byId.C.clusterId);
  assert.notEqual(byId.C.clusterId, byId.D.clusterId);
});
