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
