import React, { useState } from 'react';
import { DataStructureState, TreeNodeData } from '../../types/execution';
import { computeBinaryTreeLayout, TreeLayoutResult } from '../../utils/treeLayout';
import { GitFork, GitBranch, Compass, Info, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

interface TreeVisualizerProps {
  structure: DataStructureState;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ structure }) => {
  const treeData = structure.treeData;
  const isBST = structure.type === 'bst' || structure.dataType?.toLowerCase().includes('bst');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!treeData || !treeData.rootId || Object.keys(treeData.nodes).length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-lg text-center font-mono">
        <div className="flex items-center justify-center gap-2 text-[#8b949e] mb-1">
          {isBST ? <GitBranch className="w-5 h-5 text-[#58a6ff]" /> : <GitFork className="w-5 h-5 text-[#d29922]" />}
          <span className="font-bold text-sm text-[#f0f6fc]">{structure.name}</span>
        </div>
        <div className="text-xs text-[#8b949e]">[ Empty {isBST ? 'Binary Search Tree' : 'Binary Tree'}: root is null ]</div>
      </div>
    );
  }

  const nodes = treeData.nodes;
  const layout: TreeLayoutResult = computeBinaryTreeLayout(treeData.rootId, nodes, {
    levelHeight: 75,
    minNodeSpacing: 60,
    paddingX: 55,
    paddingY: 45,
  });

  const activeNodeId = treeData.activeTraversalNodeId || treeData.selectedNodeId;
  const inspectedNodeId = selectedNodeId || activeNodeId || treeData.rootId;
  const inspectedNode: TreeNodeData | undefined = inspectedNodeId ? nodes[inspectedNodeId] : undefined;

  // Traversal order sequence
  const traversalOrder = treeData.traversalOrder || [];
  const traversalType = treeData.traversalType || 'TRAVERSAL';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d]/60 pb-2.5">
        <div className="flex items-center gap-2">
          {isBST ? (
            <GitBranch className="w-4 h-4 text-[#58a6ff]" />
          ) : (
            <GitFork className="w-4 h-4 text-[#d29922]" />
          )}
          <span className="font-mono font-bold text-base text-[#f0f6fc]">{structure.name}</span>
          <span
            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
              isBST
                ? 'bg-[#58a6ff]/15 border-[#58a6ff]/30 text-[#58a6ff]'
                : 'bg-[#d29922]/15 border-[#d29922]/30 text-[#d29922]'
            }`}
          >
            {isBST ? 'Binary Search Tree (BST)' : 'Binary Tree'}
          </span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {Object.keys(nodes).length} {Object.keys(nodes).length === 1 ? 'node' : 'nodes'}
          </span>
        </div>

        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#d29922] bg-[#d29922]/10 px-2.5 py-0.5 rounded border border-[#d29922]/20 shadow-sm">
            ⚡ {structure.lastOperation}
          </span>
        )}
      </div>

      {/* BST Decision Path / Comparison Banner */}
      {isBST && treeData.comparisonStep && (
        <div className="bg-[#58a6ff]/10 border border-[#58a6ff]/40 rounded-lg px-3 py-2 flex items-center justify-between text-xs font-mono shadow-sm">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#58a6ff] animate-spin" />
            <span className="text-[#8b949e]">BST Decision:</span>
            <span className="font-bold text-[#f0f6fc]">{treeData.comparisonStep}</span>
          </div>
          <span className="text-[10px] bg-[#58a6ff]/20 text-[#58a6ff] px-2 py-0.5 rounded font-bold">
            Left &lt; Root &lt; Right
          </span>
        </div>
      )}

      {/* Traversal Order Ribbon if active */}
      {traversalOrder.length > 0 && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-1.5 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
            <span className="flex items-center gap-1.5 font-semibold text-[#f0f6fc]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />
              {traversalType} Traversal Sequence:
            </span>
            <span className="text-[10px] text-[#3fb950] font-bold">
              {traversalOrder.length} visited
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {traversalOrder.map((val, idx) => (
              <React.Fragment key={idx}>
                <span className="bg-[#161b22] border border-[#30363d] text-[#f0f6fc] px-2 py-0.5 rounded text-xs font-mono font-bold shadow-sm">
                  {String(val)}
                </span>
                {idx < traversalOrder.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#8b949e]/60 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* SVG Canvas for Tree */}
      <div className="bg-[#0d1117] rounded-lg p-3 flex justify-center overflow-x-auto min-h-[240px] border border-[#30363d]/50 relative">
        <svg
          width={layout.width}
          height={layout.height}
          className="overflow-visible select-none"
        >
          <defs>
            <marker
              id="arrow-tree-left"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#58a6ff" opacity="0.8" />
            </marker>
            <marker
              id="arrow-tree-right"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#3fb950" opacity="0.8" />
            </marker>
          </defs>

          {/* Connecting Branches (Parent ➔ Child References) */}
          {layout.edges.map((edge) => {
            const isLeft = edge.isLeft;
            const strokeColor = isLeft ? '#58a6ff' : '#3fb950';

            return (
              <g key={edge.id}>
                <line
                  x1={edge.x1}
                  y1={edge.y1 + 18}
                  x2={edge.x2}
                  y2={edge.y2 - 18}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                {/* Branch Reference Label (L / R) */}
                <text
                  x={(edge.x1 + edge.x2) / 2 + (isLeft ? -10 : 10)}
                  y={(edge.y1 + edge.y2) / 2}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {isLeft ? 'L' : 'R'}
                </text>
              </g>
            );
          })}

          {/* Node Circles */}
          {layout.nodes.map((node) => {
            const isRoot = node.id === treeData.rootId;
            const isActive = node.id === activeNodeId;
            const isInspected = node.id === inspectedNodeId;

            let strokeColor = '#30363d';
            let fillColor = '#161b22';

            if (isActive) {
              strokeColor = '#f0883e';
              fillColor = '#f0883e22';
            } else if (isInspected) {
              strokeColor = '#58a6ff';
              fillColor = '#58a6ff22';
            } else if (isRoot) {
              strokeColor = '#d29922';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer transition-transform duration-200 hover:scale-110"
              >
                {/* Outer halo if active */}
                {isActive && (
                  <circle
                    r="26"
                    fill="none"
                    stroke="#f0883e"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-spin"
                  />
                )}

                {/* Node Body */}
                <circle
                  r="21"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isActive || isInspected ? '3' : '2'}
                  className="filter drop-shadow-md"
                />

                {/* Balance Factor / Height badge for AVL nodes */}
                {node.balanceFactor !== undefined && (
                  <g transform="translate(14, -14)">
                    <rect
                      x="-10"
                      y="-7"
                      width="20"
                      height="14"
                      rx="4"
                      fill="#161b22"
                      stroke={Math.abs(node.balanceFactor) > 1 ? '#f85149' : '#3fb950'}
                      strokeWidth="1.2"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill={Math.abs(node.balanceFactor) > 1 ? '#f85149' : '#3fb950'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.balanceFactor > 0 ? `+${node.balanceFactor}` : node.balanceFactor}
                    </text>
                  </g>
                )}

                {/* Node Value (Value vs Reference distinction) */}
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

                {/* Node Reference Label */}
                <text
                  textAnchor="middle"
                  dy="34"
                  fill="#8b949e"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {isRoot ? '★ root' : node.id.length > 10 ? node.id.substring(0, 8) + '..' : node.id}
                  {node.height !== undefined ? ` (h:${node.height})` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Structure Inspector (Section 43) */}
      {inspectedNode && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono border-b border-[#30363d]/60 pb-1.5">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span className="font-bold text-[#f0f6fc]">NODE INSPECTOR</span>
              <span className="text-[#8b949e]">({inspectedNode.id})</span>
            </div>
            <span className="text-[10px] text-[#3fb950] font-bold">
              {inspectedNode.id === treeData.rootId ? 'ROOT NODE' : inspectedNode.isLeft ? 'LEFT CHILD' : 'RIGHT CHILD'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
              <span className="text-[10px] text-[#8b949e]">VALUE:</span>
              <span className="text-sm font-bold text-[#f0f6fc]">{String(inspectedNode.value)}</span>
            </div>

            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
              <span className="text-[10px] text-[#8b949e]">PARENT:</span>
              <span className="text-xs font-bold text-[#bc8cff]">
                {inspectedNode.parentId || (inspectedNode.id === treeData.rootId ? 'null (Root)' : 'root')}
              </span>
            </div>

            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
              <span className="text-[10px] text-[#8b949e]">LEFT REF:</span>
              <span className="text-xs font-bold text-[#58a6ff]">
                {inspectedNode.leftId ? `➔ ${nodes[inspectedNode.leftId]?.value ?? inspectedNode.leftId}` : 'null'}
              </span>
            </div>

            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
              <span className="text-[10px] text-[#8b949e]">RIGHT REF:</span>
              <span className="text-xs font-bold text-[#3fb950]">
                {inspectedNode.rightId ? `➔ ${nodes[inspectedNode.rightId]?.value ?? inspectedNode.rightId}` : 'null'}
              </span>
            </div>

            {inspectedNode.height !== undefined && (
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
                <span className="text-[10px] text-[#8b949e]">NODE HEIGHT:</span>
                <span className="text-xs font-bold text-[#d29922]">
                  {inspectedNode.height}
                </span>
              </div>
            )}

            {inspectedNode.balanceFactor !== undefined && (
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
                <span className="text-[10px] text-[#8b949e]">BALANCE FACTOR:</span>
                <span className={`text-xs font-bold ${Math.abs(inspectedNode.balanceFactor) > 1 ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>
                  {inspectedNode.balanceFactor} {Math.abs(inspectedNode.balanceFactor) > 1 ? '(Unbalanced)' : '(Balanced)'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conceptual View vs Runtime State Distinction Note (Section 41) */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] border-t border-[#30363d]/40 pt-2 px-1">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-[#58a6ff]" />
          References: Left (L, Blue) ➔ Left Child | Right (R, Green) ➔ Right Child
        </span>
        <span className="bg-[#21262d] px-1.5 py-0.5 rounded">Runtime Memory Graph</span>
      </div>
    </div>
  );
};
