import React from 'react';
import { DataStructureState, TreeNodeData } from '../../types/execution';
import { GitFork } from 'lucide-react';

interface TreeVisualizerProps {
  structure: DataStructureState;
}

interface RenderNode {
  id: string;
  value: any;
  x: number;
  y: number;
  level: number;
  leftId: string | null;
  rightId: string | null;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ structure }) => {
  const treeData = structure.treeData;
  if (!treeData || !treeData.rootId) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg text-center text-xs text-[#8b949e] font-mono">
        [ Empty Tree: root is null ]
      </div>
    );
  }

  // Calculate coordinates for nodes using BFS/level layout
  const nodes = treeData.nodes;
  const renderNodes: RenderNode[] = [];
  const lines: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];

  const layoutTree = (
    nodeId: string | null,
    level: number,
    x: number,
    offset: number
  ) => {
    if (!nodeId || !nodes[nodeId]) return;
    const node: TreeNodeData = nodes[nodeId];
    const y = 40 + level * 65;

    renderNodes.push({
      id: node.id,
      value: node.value,
      x,
      y,
      level,
      leftId: node.leftId,
      rightId: node.rightId,
    });

    if (node.leftId && nodes[node.leftId]) {
      const childX = x - offset;
      const childY = 40 + (level + 1) * 65;
      lines.push({ x1: x, y1: y, x2: childX, y2: childY, id: `${node.id}->${node.leftId}` });
      layoutTree(node.leftId, level + 1, childX, offset / 2);
    }

    if (node.rightId && nodes[node.rightId]) {
      const childX = x + offset;
      const childY = 40 + (level + 1) * 65;
      lines.push({ x1: x, y1: y, x2: childX, y2: childY, id: `${node.id}->${node.rightId}` });
      layoutTree(node.rightId, level + 1, childX, offset / 2);
    }
  };

  layoutTree(treeData.rootId, 0, 240, 100);

  // Array representation if available (e.g. for Heap)
  const nodeValues = renderNodes.map((n) => n.value);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-[#d29922]" />
          <span className="font-mono font-bold text-[#d29922] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {renderNodes.length} nodes
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#d29922] bg-[#d29922]/10 px-2 py-0.5 rounded border border-[#d29922]/20">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* SVG Canvas for Tree */}
      <div className="bg-[#0d1117] rounded-lg p-2 flex justify-center overflow-x-auto min-h-[220px]">
        <svg width="480" height="230" className="overflow-visible">
          {/* Connecting Branches */}
          {lines.map((l) => (
            <line
              key={l.id}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#58a6ff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />
          ))}

          {/* Node Circles */}
          {renderNodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle
                r="20"
                fill="#161b22"
                stroke="#58a6ff"
                strokeWidth="2.5"
                className="filter drop-shadow-md hover:scale-110 transition-transform"
              />
              <text
                textAnchor="middle"
                dy="5"
                fill="#f0f6fc"
                fontSize="13"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {node.value}
              </text>
              <text
                textAnchor="middle"
                dy="32"
                fill="#8b949e"
                fontSize="9"
                fontFamily="monospace"
              >
                {node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Array representation row (Heap / Tree mapping) */}
      <div className="flex flex-col gap-1 border-t border-[#30363d]/40 pt-2">
        <span className="text-[11px] font-mono text-[#8b949e] font-semibold">
          Sequential / Level-Order Representation:
        </span>
        <div className="flex gap-1 overflow-x-auto">
          {nodeValues.map((v, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center bg-[#0d1117] border border-[#30363d] px-2 py-1 rounded"
            >
              <span className="text-[9px] font-mono text-[#8b949e]">[{idx}]</span>
              <span className="text-xs font-mono font-bold text-[#58a6ff]">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
