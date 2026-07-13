"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export interface CircleNodeData extends Record<string, unknown> {
  label: string;
  labelFontSize: number;
}

export type CircleNode = Node<CircleNodeData, "circleLabel">;

/**
 * Renders only the label and the (invisible, same top/bottom positions as
 * React Flow's built-in default node) connection handles -- the circle
 * itself is still drawn by the node's own `style` (background/border/size),
 * applied by React Flow to the node wrapper this component renders inside.
 * The label sits below as overflow content instead of being fit (and
 * truncated) inside the shape, so titles stay readable regardless of length.
 */
export function CircleNodeLabel({ data, isConnectable }: NodeProps<CircleNode>) {
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ opacity: 0 }} />
      <div
        className="pointer-events-none absolute top-full left-1/2 mt-1 w-max max-w-[9rem] -translate-x-1/2 text-center leading-tight text-neutral-700"
        style={{ fontSize: data.labelFontSize }}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ opacity: 0 }} />
    </>
  );
}
