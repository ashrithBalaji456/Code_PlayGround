import React, { useState } from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { computeHeapTreeLayout, TreeLayoutResult } from '../../utils/treeLayout';
import { Layers, ArrowUpDown, Eye, Info, Sparkles } from 'lucide-react';

interface HeapVisualizerProps {
  structure: DataStructureState;
  lastEvent?: ExecutionEvent;
}

export const HeapVisualizer: React.FC<HeapVisualizerProps> = ({ structure }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Derive elements array from heapData or priorityQueueData or elements
  const elements = structure.heapData?.array || structure.priorityQueueData || structure.elements || [];
  const isMinHeap = structure.heapData?.isMinHeap ?? true;
  const comparingIndices = structure.heapData?.comparingIndices || structure.comparingIndices;
  const swappingIndices = structure.heapData?.swappingIndices || structure.swappingIndices;
  const lastAction = structure.heapData?.lastAction || structure.lastOperation;

  if (elements.length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-lg text-center font-mono">
        <div className="flex items-center justify-center gap-2 text-[#8b949e] mb-1">
          <Layers className="w-5 h-5 text-[#3fb950]" />
          <span className="font-bold text-sm text-[#f0f6fc]">{structure.name}</span>
        </div>
        <div className="text-xs text-[#8b949e]">
          [ Empty {isMinHeap ? 'Min-Heap' : 'Max-Heap'}: 0 elements ]
        </div>
      </div>
    );
  }

  // Compute complete binary tree layout for heap array
  const layout: TreeLayoutResult = computeHeapTreeLayout(elements, {
    levelHeight: 70,
    minNodeSpacing: 55,
    paddingX: 50,
    paddingY: 40,
  });

  const activeIndex = selectedIndex !== null ? selectedIndex : 0;
  const activeVal = elements[activeIndex];
  const parentIdx = activeIndex > 0 ? Math.floor((activeIndex - 1) / 2) : null;
  const leftChildIdx = 2 * activeIndex + 1 < elements.length ? 2 * activeIndex + 1 : null;
  const rightChildIdx = 2 * activeIndex + 2 < elements.length ? 2 * activeIndex + 2 : null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#3fb950]" />
          <span className="font-mono font-bold text-base text-[#f0f6fc]">{structure.name}</span>
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border bg-[#3fb950]/15 border-[#3fb950]/30 text-[#3fb950]">
            {isMinHeap ? 'Min Heap' : 'Max Heap'}
          </span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            size: {elements.length}
          </span>
          <span className="text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            root = elements[0] ({elements[0]})
          </span>
        </div>

        {lastAction && (
          <span className="text-[11px] font-mono text-[#3fb950] bg-[#3fb950]/10 px-2.5 py-0.5 rounded border border-[#3fb950]/20 shadow-sm flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3 animate-bounce" />
            {lastAction}
          </span>
        )}
      </div>

      {/* Heapify comparison / swap indicator banner */}
      {(comparingIndices || swappingIndices) && (
        <div className="bg-[#3fb950]/10 border border-[#3fb950]/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#3fb950]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold">
              {swappingIndices
                ? `Swapping nodes [${swappingIndices[0]}] ⇄ [${swappingIndices[1]}]`
                : `Comparing parent [${comparingIndices![0]}] vs child [${comparingIndices![1]}]`}
            </span>
          </div>
          <span className="text-[10px] bg-[#3fb950]/20 text-[#3fb950] px-2 py-0.5 rounded font-bold">
            {isMinHeap ? 'Parent <= Children' : 'Parent >= Children'}
          </span>
        </div>
      )}

      {/* 1. Hierarchical Complete Binary Tree View */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-[#8b949e]">
          <span className="font-semibold text-[#f0f6fc]">Tree Representation (Complete Binary Tree):</span>
          <span className="text-[10px] text-[#8b949e]">Parent i ➔ Left: 2i+1, Right: 2i+2</span>
        </div>

        <div className="bg-[#0d1117] rounded-lg p-3 flex justify-center overflow-x-auto min-h-[200px] border border-[#30363d]/50">
          <svg
            width={layout.width}
            height={layout.height}
            className="overflow-visible select-none"
          >
            {/* Edges */}
            {layout.edges.map((edge) => {
              const isLeft = edge.isLeft;
              return (
                <line
                  key={edge.id}
                  x1={edge.x1}
                  y1={edge.y1 + 18}
                  x2={edge.x2}
                  y2={edge.y2 - 18}
                  stroke="#3fb950"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity={isLeft ? 0.75 : 0.65}
                />
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              // Extract index from node.id: "heap_0" -> 0
              const idx = parseInt(node.id.replace('heap_', ''), 10);
              const isComparing = comparingIndices && comparingIndices.includes(idx);
              const isSwapping = swappingIndices && swappingIndices.includes(idx);
              const isSelected = activeIndex === idx;

              let strokeColor = '#30363d';
              let fillColor = '#161b22';

              if (isSwapping) {
                strokeColor = '#f0883e';
                fillColor = '#f0883e22';
              } else if (isComparing) {
                strokeColor = '#58a6ff';
                fillColor = '#58a6ff22';
              } else if (isSelected) {
                strokeColor = '#3fb950';
                fillColor = '#3fb95022';
              } else if (idx === 0) {
                strokeColor = '#d2a8ff';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedIndex(idx)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                >
                  {/* Halo ring for compare/swap */}
                  {(isComparing || isSwapping) && (
                    <circle
                      r="25"
                      fill="none"
                      stroke={isSwapping ? '#f0883e' : '#58a6ff'}
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      className="animate-spin"
                    />
                  )}

                  <circle
                    r="20"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected || isComparing || isSwapping ? '3' : '2'}
                    className="filter drop-shadow-md"
                  />

                  {/* Node Value */}
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

                  {/* Heap Index Subscript */}
                  <text
                    textAnchor="middle"
                    dy="32"
                    fill="#8b949e"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    [{idx}]
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 2. Heap Array / Index Representation View */}
      <div className="flex flex-col gap-1.5 border-t border-[#30363d]/50 pt-2.5">
        <div className="flex items-center justify-between text-xs font-mono text-[#8b949e]">
          <span className="font-semibold text-[#f0f6fc]">Internal Heap Array View:</span>
          <span className="text-[10px] text-[#3fb950] font-bold">Linear Storage [0 .. {elements.length - 1}]</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto py-1">
          {elements.map((val, idx) => {
            const isComparing = comparingIndices && comparingIndices.includes(idx);
            const isSwapping = swappingIndices && swappingIndices.includes(idx);
            const isSelected = activeIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`flex flex-col items-center p-2 rounded-lg border font-mono transition-all duration-200 cursor-pointer min-w-[50px] ${
                  isSwapping
                    ? 'bg-[#f0883e]/20 border-[#f0883e] shadow-lg ring-1 ring-[#f0883e]'
                    : isComparing
                    ? 'bg-[#58a6ff]/20 border-[#58a6ff] ring-1 ring-[#58a6ff]'
                    : isSelected
                    ? 'bg-[#3fb950]/20 border-[#3fb950] ring-1 ring-[#3fb950]'
                    : 'bg-[#0d1117] border-[#30363d] hover:border-[#3fb950]/60 hover:bg-[#161b22]'
                }`}
              >
                <span className="text-[10px] text-[#8b949e]">[{idx}]</span>
                <span className="text-sm font-bold text-[#f0f6fc] mt-0.5">{String(val)}</span>
                {idx === 0 && (
                  <span className="text-[9px] font-bold text-[#d2a8ff] mt-1 bg-[#d2a8ff]/10 px-1 rounded">
                    ROOT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Heap Element Inspector (Section 43) */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono border-b border-[#30363d]/60 pb-1.5">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-[#3fb950]" />
            <span className="font-bold text-[#f0f6fc]">HEAP NODE INSPECTOR</span>
            <span className="text-[#8b949e]">(Index [{activeIndex}])</span>
          </div>
          <span className="text-[10px] text-[#3fb950] font-bold">
            {activeIndex === 0 ? 'ROOT ELEMENT' : 'HEAP NODE'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
            <span className="text-[10px] text-[#8b949e]">VALUE:</span>
            <span className="text-sm font-bold text-[#f0f6fc]">{String(activeVal)}</span>
          </div>

          <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
            <span className="text-[10px] text-[#8b949e]">PARENT (i-1)/2:</span>
            <span className="text-xs font-bold text-[#bc8cff]">
              {parentIdx !== null ? `[${parentIdx}] = ${elements[parentIdx]}` : 'None (Root)'}
            </span>
          </div>

          <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
            <span className="text-[10px] text-[#8b949e]">LEFT CHILD (2i+1):</span>
            <span className="text-xs font-bold text-[#58a6ff]">
              {leftChildIdx !== null ? `[${leftChildIdx}] = ${elements[leftChildIdx]}` : 'None'}
            </span>
          </div>

          <div className="bg-[#161b22] p-2 rounded border border-[#30363d]/80 flex flex-col">
            <span className="text-[10px] text-[#8b949e]">RIGHT CHILD (2i+2):</span>
            <span className="text-xs font-bold text-[#3fb950]">
              {rightChildIdx !== null ? `[${rightChildIdx}] = ${elements[rightChildIdx]}` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Conceptual View vs Runtime State Distinction (Section 41) */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] border-t border-[#30363d]/40 pt-2 px-1">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-[#3fb950]" />
          Tree and Array views represent the identical runtime heap memory state.
        </span>
        <span className="bg-[#21262d] px-1.5 py-0.5 rounded">Dual Representation</span>
      </div>
    </div>
  );
};
