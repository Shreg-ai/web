import { parseFrontmatter } from "./frontmatter";
import { extractWikilinks } from "./wikilinks";
import type { ParsedEdge, ParsedNode, ParsedVault, VaultFile } from "./types";

/**
 * Builds a graph of nodes and edges from a list of already-read vault files.
 * Node identity is the note title, matching how Obsidian itself resolves
 * [[wikilinks]]. A link that targets a title with no corresponding file
 * becomes a placeholder node (frontmatter.unresolved = true), so the graph
 * stays referentially complete instead of silently dropping the edge.
 *
 * Mirrors compiler/src/parser/index.ts, adapted to take pre-read files
 * (from browser File objects) instead of walking a real filesystem.
 */
export function buildVaultGraph(files: VaultFile[]): ParsedVault {
  const nodes: ParsedNode[] = files.map((file) => {
    const { data, content } = parseFrontmatter(file.raw);
    return {
      id: file.title,
      title: file.title,
      body: content,
      frontmatter: data,
      sourcePath: file.relativePath,
    };
  });

  const knownTitles = new Set(nodes.map((n) => n.title));
  const placeholderNodes = new Map<string, ParsedNode>();
  const edges: ParsedEdge[] = [];

  for (const node of nodes) {
    for (const link of extractWikilinks(node.body)) {
      if (!knownTitles.has(link.target) && !placeholderNodes.has(link.target)) {
        placeholderNodes.set(link.target, {
          id: link.target,
          title: link.target,
          body: "",
          frontmatter: { unresolved: true },
          sourcePath: "",
        });
      }

      edges.push({
        sourceId: node.id,
        targetId: link.target,
        context: link.context,
      });
    }
  }

  return {
    nodes: [...nodes, ...placeholderNodes.values()],
    edges,
  };
}

const IGNORED_SEGMENTS = new Set([".git", ".obsidian", "node_modules", ".trash"]);

/** Reads a browser FileList (from a webkitdirectory input) into VaultFile objects, skipping non-Markdown and hidden-folder files. */
export async function readVaultFileList(fileList: FileList): Promise<VaultFile[]> {
  const files: VaultFile[] = [];

  for (const file of Array.from(fileList)) {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const segments = relativePath.split("/");

    if (!file.name.endsWith(".md")) continue;
    if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) continue;

    const raw = await file.text();
    const title = file.name.slice(0, -3);
    files.push({ relativePath, title, raw });
  }

  return files;
}
