import { load } from "js-yaml";

export interface FrontmatterResult {
  data: Record<string, unknown>;
  content: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Splits a Markdown file's YAML frontmatter from its body. Uses js-yaml
 * directly (rather than gray-matter, which pulls in Node's Buffer) since
 * this runs in the browser.
 */
export function parseFrontmatter(raw: string): FrontmatterResult {
  const match = raw.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { data: {}, content: raw.trim() };
  }

  let data: Record<string, unknown> = {};
  try {
    const parsed = load(match[1]);
    if (parsed && typeof parsed === "object") {
      data = parsed as Record<string, unknown>;
    }
  } catch {
    // Malformed frontmatter: treat as no frontmatter rather than failing the whole parse.
    data = {};
  }

  return { data, content: raw.slice(match[0].length).trim() };
}
