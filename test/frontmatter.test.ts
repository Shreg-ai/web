import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrontmatter } from "../src/lib/graph/frontmatter";

test("splits frontmatter and body", () => {
  const raw = "---\ntype: concept\ntags: [a, b]\n---\n\nBody text here.";
  const { data, content } = parseFrontmatter(raw);
  assert.equal(data.type, "concept");
  assert.deepEqual(data.tags, ["a", "b"]);
  assert.equal(content, "Body text here.");
});

test("returns empty frontmatter when none is present", () => {
  const { data, content } = parseFrontmatter("Just a body, no frontmatter.");
  assert.deepEqual(data, {});
  assert.equal(content, "Just a body, no frontmatter.");
});

test("does not throw on malformed YAML, falls back to empty frontmatter", () => {
  const raw = "---\n: not valid yaml: [\n---\nBody.";
  const { data } = parseFrontmatter(raw);
  assert.deepEqual(data, {});
});
