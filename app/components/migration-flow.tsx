"use client";

import {
  Background,
  BackgroundVariant,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useMemo, useState } from "react";

import "@xyflow/react/dist/style.css";

const baseNodes: Node[] = [
  { id: "history", position: { x: 0, y: 104 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Migration history" } },
  { id: "candidate", position: { x: 228, y: 104 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Candidate SQL" } },
  { id: "sandbox", position: { x: 474, y: 28 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "PostgreSQL sandbox" } },
  { id: "failure", position: { x: 474, y: 180 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Failure injection" } },
  { id: "evidence", position: { x: 728, y: 104 }, sourcePosition: Position.Right, targetPosition: Position.Left, data: { label: "Verified evidence" } },
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

type PipelineState = {
  migrationCount: number;
  candidate: string | null;
  findingCount: number;
  timelineCount: number;
  evidenceCount: number;
  planState: string | null;
};

const sectionByNode: Record<string, string> = {
  history: "product",
  candidate: "risks",
  sandbox: "simulation",
  failure: "simulation",
  evidence: "evidence",
};

export default function MigrationFlow({ state, onNavigate }: { state: PipelineState; onNavigate: (section: string) => void }) {
  const [selected, setSelected] = useState("candidate");
  const statusByNode = useMemo<Record<string, string>>(() => ({
    history: state.migrationCount ? `${state.migrationCount} migrations loaded` : "Waiting for bundle",
    candidate: state.candidate ?? "No candidate selected",
    sandbox: state.timelineCount ? `${state.timelineCount} execution events` : "Not executed",
    failure: state.findingCount ? `${state.findingCount} findings` : state.candidate ? "No findings" : "Not evaluated",
    evidence: state.planState ?? (state.evidenceCount ? `${state.evidenceCount} dimensions` : "No evidence"),
  }), [state.candidate, state.evidenceCount, state.findingCount, state.migrationCount, state.planState, state.timelineCount]);
  const nodes = useMemo(
    () =>
      baseNodes.map((node) => ({
        ...node,
        className: `${node.id === selected ? "flow-node flow-node-active" : "flow-node"}${statusByNode[node.id] && !statusByNode[node.id].startsWith("No ") && !statusByNode[node.id].startsWith("Not ") && !statusByNode[node.id].startsWith("Waiting") ? " flow-node-ready" : ""}`,
      })),
    [selected, statusByNode],
  );
  const edges = useMemo(
    () =>
      baseEdges.map((edge) => {
        const active = edge.source === selected || edge.target === selected;
        return {
          ...edge,
          type: "default",
          animated: false,
          className: active ? "flow-edge flow-edge-active" : "flow-edge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: active ? "#36f1ff" : "rgba(113,139,154,.72)",
            width: 14,
            height: 14,
          },
          style: {
            stroke: active ? "rgba(54,241,255,.86)" : "rgba(113,139,154,.46)",
            strokeWidth: active ? 1.7 : 1.15,
          },
        };
      }),
    [selected],
  );

  return (
    <div className="flow-shell">
      <div className="flow-canvas" aria-label="Interactive dbsentinal migration analysis pipeline">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(_, node) => setSelected(node.id)}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          fitView
          fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
          minZoom={0.4}
          maxZoom={1}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(255,255,255,.08)" gap={24} size={1} variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </div>
      <div className="flow-inspector" role="status" aria-live="polite">
        <span>Selected node</span>
        <strong>{baseNodes.find((node) => node.id === selected)?.data.label as string}</strong>
        <p>{descriptions[selected]}</p>
        <div className="flow-live-state"><span>Live state</span><strong>{statusByNode[selected]}</strong></div>
        <button type="button" onClick={() => onNavigate(sectionByNode[selected])}>Open related evidence</button>
        <div className="flow-signal"><i /> Deterministic boundary</div>
      </div>
    </div>
  );
}
