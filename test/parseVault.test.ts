import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultGraph } from "../src/lib/graph/parseVault";
import type { VaultFile } from "../src/lib/graph/types";

const files: VaultFile[] = [
  {
    relativePath: "Meta.md",
    title: "Meta",
    raw: "---\ntype: concept\n---\n\nMeta is discussed alongside [[Mark Zuckerberg]] and [[Reality Labs]].",
  },
  {
    relativePath: "Mark Zuckerberg.md",
    title: "Mark Zuckerberg",
    raw: "---\ntype: concept\n---\n\nRuns [[Meta]].",
  },
];

test("parses notes into nodes with frontmatter and body", () => {
  const vault = buildVaultGraph(files);
  const meta = vault.nodes.find((n) => n.id === "Meta");
  assert.ok(meta);
  assert.equal(meta?.frontmatter.type, "concept");
  assert.match(meta?.body ?? "", /Meta is discussed/);
});

test("creates edges for resolved wikilinks", () => {
  const vault = buildVaultGraph(files);
  const fromMeta = vault.edges.filter((e) => e.sourceId === "Meta");
  assert.equal(fromMeta.length, 2);
  assert.deepEqual(
    fromMeta.map((e) => e.targetId).sort(),
    ["Mark Zuckerberg", "Reality Labs"]
  );
});

test("creates a placeholder node for unresolved links", () => {
  const vault = buildVaultGraph(files);
  const placeholder = vault.nodes.find((n) => n.id === "Reality Labs");
  assert.ok(placeholder);
  assert.equal(placeholder?.frontmatter.unresolved, true);
});
