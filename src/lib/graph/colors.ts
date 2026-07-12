// A fixed, distinguishable palette so cluster colors are stable across renders
// (cycles if there are more clusters than colors). Leads with violet to match
// the app's accent color, then falls back to a distinguishable set for
// additional clusters.
const CLUSTER_PALETTE = [
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#ef4444", // red
];

export function colorForCluster(clusterId: number): string {
  return CLUSTER_PALETTE[clusterId % CLUSTER_PALETTE.length];
}

// Deterministic string hash so the same frontmatter `type` value always maps
// to the same color across renders/reloads, without maintaining a registry.
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function colorForType(type: string): string {
  return CLUSTER_PALETTE[hashString(type) % CLUSTER_PALETTE.length];
}

// Neutral color for nodes with no `type` frontmatter when the graph is
// otherwise being colored by type (so they don't silently collide with a
// real type's color).
export const UNTYPED_NODE_COLOR = "#a3a3a3";
