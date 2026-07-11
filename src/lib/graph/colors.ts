// A fixed, distinguishable palette so cluster colors are stable across renders (cycles if there are more clusters than colors).
const CLUSTER_PALETTE = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export function colorForCluster(clusterId: number): string {
  return CLUSTER_PALETTE[clusterId % CLUSTER_PALETTE.length];
}
