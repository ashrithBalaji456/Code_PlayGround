import React from 'react';
import { DataStructureState } from '../../types/execution';
import { Network } from 'lucide-react';

interface GraphVisualizerProps {
  structure: DataStructureState;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ structure }) => {
  const gData = structure.graphData;
  if (!gData) return null;

  const nodes = gData.nodes;
  const edges = gData.edges;

  // Auto-arrange nodes in a circle
  const radius = 80;
  const centerX = 160;
  const centerY = 110;

  const nodeCoords: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, idx) => {
    const angle = (idx / Math.max(1, nodes.length)) * 2 * Math.PI - Math.PI / 2;
    nodeCoords[n.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#bc8cff]" />
          <span className="font-mono font-bold text-[#bc8cff] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {nodes.length} vertices, {edges.length} edges
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="bg-[#0d1117] rounded-lg p-2 flex justify-center overflow-x-auto min-h-[220px]">
        <svg width="320" height="220" className="overflow-visible">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#58a6ff" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((e, idx) => {
            const src = nodeCoords[e.source];
            const tgt = nodeCoords[e.target];
            if (!src || !tgt) return null;
            return (
              <line
                key={idx}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke="#58a6ff"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                opacity="0.8"
              />
            );
          })}

          {/* Vertices */}
          {nodes.map((n) => {
            const coord = nodeCoords[n.id] || { x: centerX, y: centerY };
            return (
              <g key={n.id} transform={`translate(${coord.x}, ${coord.y})`}>
                <circle
                  r="18"
                  fill="#161b22"
                  stroke="#bc8cff"
                  strokeWidth="2.5"
                  className="filter drop-shadow-md"
                />
                <text
                  textAnchor="middle"
                  dy="5"
                  fill="#f0f6fc"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
