const WIKILINK_PATTERN = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;

export interface WikilinkMatch {
  target: string;
  alias: string | null;
  index: number;
  context: string;
}

/**
 * Extracts [[Target]], [[Target|Alias]] and [[Target#Heading|Alias]] links from a
 * note body, along with the enclosing line as context for why the link exists.
 *
 * Kept identical in behavior to the compiler package's version
 * (compiler/src/parser/wikilinks.ts) — this is pure string manipulation with
 * no Node dependency, so it runs the same way in the browser.
 */
export function extractWikilinks(body: string): WikilinkMatch[] {
  const lines = body.split("\n");
  const lineStartOffsets: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineStartOffsets.push(offset);
    offset += line.length + 1;
  }

  const matches: WikilinkMatch[] = [];
  for (const match of body.matchAll(WIKILINK_PATTERN)) {
    const target = match[1].trim();
    const alias = match[2] ? match[2].trim() : null;
    const index = match.index ?? 0;

    let lineIndex = 0;
    for (let i = 0; i < lineStartOffsets.length; i++) {
      if (lineStartOffsets[i] <= index) {
        lineIndex = i;
      } else {
        break;
      }
    }

    matches.push({
      target,
      alias,
      index,
      context: lines[lineIndex].trim(),
    });
  }

  return matches;
}

export interface BodySegment {
  type: "text" | "link";
  text: string;
  target?: string;
}

/**
 * Splits a note body into plain-text and wikilink segments, for rendering
 * [[wikilinks]] as clickable links (matching how Obsidian renders note
 * content) instead of showing the raw [[Target|Alias]] syntax.
 */
export function splitBodyWithWikilinks(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(WIKILINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", text: body.slice(lastIndex, index) });
    }
    const target = match[1].trim();
    const alias = match[2] ? match[2].trim() : null;
    segments.push({ type: "link", text: alias ?? target, target });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", text: body.slice(lastIndex) });
  }

  return segments;
}
