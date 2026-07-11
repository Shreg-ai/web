import { test } from "node:test";
import assert from "node:assert/strict";
import { extractWikilinks } from "../src/lib/graph/wikilinks";

test("extracts a plain wikilink", () => {
  const matches = extractWikilinks("See [[Meta]] for details.");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].target, "Meta");
  assert.equal(matches[0].alias, null);
});

test("extracts an aliased wikilink", () => {
  const matches = extractWikilinks("See [[Reality Labs|the metaverse bet]].");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].target, "Reality Labs");
  assert.equal(matches[0].alias, "the metaverse bet");
});

test("strips heading anchors from the target", () => {
  const matches = extractWikilinks("See [[Moat Pillars#Definition|pillars]].");
  assert.equal(matches[0].target, "Moat Pillars");
  assert.equal(matches[0].alias, "pillars");
});

test("captures the enclosing line as context", () => {
  const body = "Intro line.\n見 [[FICO]] 案例。\nOutro line.";
  const matches = extractWikilinks(body);
  assert.equal(matches[0].context, "見 [[FICO]] 案例。");
});

test("finds multiple links in one document", () => {
  const matches = extractWikilinks("[[A]] and [[B|b-alias]] and [[C]]");
  assert.deepEqual(
    matches.map((m) => m.target),
    ["A", "B", "C"]
  );
});
