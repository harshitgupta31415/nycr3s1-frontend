"use client";

import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

import "@xyflow/react/dist/style.css";

const baseNodes: Node[] = [
  { id: "history", position: { x: 0, y: 104 }, data: { label: "Migration history" } },
  { id: "candidate", position: { x: 250, y: 104 }, data: { label: "Candidate SQL" } },
  { id: "sandbox", position: { x: 500, y: 28 }, data: { label: "PostgreSQL sandbox" } },
  { id: "failure", position: { x: 500, y: 180 }, data: { label: "Failure injection" } },
  { id: "evidence", position: { x: 760, y: 104 }, data: { label: "Verified evidence" } },
];

const baseEdges: Edge[] = [
  { id: "history-candidate", source: "history", target: "candidate" },
  { id: "candidate-sandbox", source: "candidate", target: "sandbox" },
  { id: "candidate-failure", source: "candidate", target: "failure" },
  { id: "sandbox-evidence", source: "sandbox", target: "evidence" },
  { id: "failure-evidence", source: "failure", target: "evidence" },
];

const descriptions: Record<string, string> = {
  history: "Rebuild the exact pre-candidate schema from every prior migration.",
  candidate: "Parse and classify each statement before any execution begins.",
  sandbox: "Apply against synthetic, production-shaped fixtures in disposable PostgreSQL.",
  failure: "Interrupt at statement boundaries, then retry and inspect the remaining state.",
  evidence: "Aggregate independent dimensions into a verdict scoped for human review.",
};

export default function MigrationFlow() {
  const [selected, setSelected] = useState("candidate");
  const reduceMotion = useReducedMotion();
  const nodes = useMemo(
    () =>
      baseNodes.map((node) => ({
        ...node,
        className: node.id === selected ? "flow-node flow-node-active" : "flow-node",
      })),
    [selected],
  );
  const edges = useMemo(
    () =>
      baseEdges.map((edge) => ({
        ...edge,
        animated: !reduceMotion,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#36f1ff" },
        style: { stroke: "rgba(54,241,255,.55)", strokeWidth: 1.25 },
      })),
    [reduceMotion],
  );

  return (
    <div className="flow-shell">
      <div className="flow-canvas" aria-label="Interactive RollbackReady migration analysis pipeline">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(_, node) => setSelected(node.id)}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll={false}
          zoomOnDoubleClick={false}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.72}
          maxZoom={1.2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(255,255,255,.08)" gap={24} size={1} variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </div>
      <div className="flow-inspector" role="status" aria-live="polite">
        <span>Selected node</span>
        <strong>{baseNodes.find((node) => node.id === selected)?.data.label as string}</strong>
        <p>{descriptions[selected]}</p>
        <div className="flow-signal"><i /> Deterministic boundary</div>
      </div>
    </div>
  );
}
