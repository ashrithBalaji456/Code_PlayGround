import React from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { GitCommit, ArrowRight } from 'lucide-react';

interface LinkedListVisualizerProps {
  structure: DataStructureState;
  pointers: Record<string, any>;
  lastEvent?: ExecutionEvent;
}

export const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({
  structure,
  pointers,
  lastEvent,
}) => {
  const llData = structure.linkedListData;
  if (!llData) return null;

  // Build ordered list of nodes starting from head
  const orderedNodes: any[] = [];
  const visited = new Set<string>();
  let currentId: string | null = llData.headId;

  while (currentId && !visited.has(currentId) && llData.nodes[currentId]) {
    visited.add(currentId);
    orderedNodes.push(llData.nodes[currentId]);
    currentId = llData.nodes[currentId].nextId;
  }

  // Also include any disconnected nodes
  for (const [id, node] of Object.entries(llData.nodes)) {
    if (!visited.has(id)) {
      orderedNodes.push(node);
    }
  }

  // Map pointers pointing to each node
  const pointersByNodeId: Record<string, string[]> = {};
  for (const [pName, pVal] of Object.entries(pointers)) {
    if (typeof pVal === 'string') {
      const match = pVal.match(/Node#\d+/);
      const targetId = match ? match[0] : pVal;
      if (!pointersByNodeId[targetId]) pointersByNodeId[targetId] = [];
      pointersByNodeId[targetId].push(pName);
    }
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#3fb950]/20 border border-[#3fb950]/40 flex items-center justify-center text-[#3fb950]">
            <GitCommit className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-[#f0f6fc] text-base">{structure.name}</span>
          <span className="text-[11px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono border border-[#30363d]">
            {orderedNodes.length} nodes
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#3fb950] bg-[#3fb950]/15 px-2.5 py-0.5 rounded-full border border-[#3fb950]/30 font-semibold shadow-sm">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Linked Nodes Row */}
      <div className="flex items-center gap-3 p-4 bg-[#0d1117] rounded-xl overflow-x-auto min-h-[140px] shadow-inner">
        {orderedNodes.length === 0 ? (
          <div className="text-xs text-[#8b949e] font-mono mx-auto flex items-center gap-2">
            <span>head ──→</span>
            <span className="text-[#f85149] bg-[#f85149]/15 border border-[#f85149]/30 px-2 py-0.5 rounded font-bold">
              NULL (∅)
            </span>
          </div>
        ) : (
          orderedNodes.map((node, nodeIdx) => {
            const activePtrs = pointersByNodeId[node.id] || [];
            const isHead = node.id === llData.headId;
            const isLast = nodeIdx === orderedNodes.length - 1;

            return (
              <div key={node.id} className="flex items-center gap-2.5">
                {/* Node Box */}
                <div className="flex flex-col items-center gap-1.5">
                  {/* Pointers above node */}
                  <div className="h-6 flex items-center justify-center">
                    {activePtrs.length > 0 ? (
                      <div className="flex gap-1 animate-pointer">
                        {activePtrs.map((ptr) => (
                          <span
                            key={ptr}
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow ${
                              ptr === 'head'
                                ? 'bg-[#3fb950] text-black'
                                : ptr === 'curr' || ptr === 'current'
                                ? 'bg-[#58a6ff] text-black'
                                : ptr === 'prev' || ptr === 'previous'
                                ? 'bg-[#d29922] text-black'
                                : 'bg-[#bc8cff] text-black'
                            }`}
                          >
                            {ptr} ↓
                          </span>
                        ))}
                      </div>
                    ) : isHead ? (
                      <span className="text-[10px] font-mono font-bold text-[#3fb950]">head ↓</span>
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>

                  {/* Visual Node: [ Value | next • ] */}
                  <div className="flex rounded-xl overflow-hidden border-2 border-[#3fb950]/60 bg-[#161b22] shadow-lg hover:border-[#3fb950] transition-all">
                    <div className="px-4 py-2.5 font-mono font-bold text-base text-[#f0f6fc] bg-[#21262d] flex items-center justify-center min-w-[48px]">
                      {String(node.value)}
                    </div>
                    <div className="px-3 py-2.5 font-mono text-xs text-[#8b949e] border-l border-[#30363d] flex items-center justify-center bg-[#161b22] gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#8b949e]">next</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3fb950] shadow-sm animate-pulse" />
                    </div>
                  </div>

                  {/* Heap ID */}
                  <span className="text-[9px] font-mono text-[#8b949e]">{node.id}</span>
                </div>

                {/* SVG Arrow to Next or NULL endpoint */}
                <div className="flex items-center justify-center pt-2">
                  {node.nextId ? (
                    <div className="flex items-center text-[#3fb950]">
                      <span className="w-4 h-0.5 bg-[#3fb950]" />
                      <ArrowRight className="w-5 h-5 -ml-1 text-[#3fb950]" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-[#f85149]" />
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#f85149] bg-[#f85149]/15 border border-[#f85149]/40 px-2 py-0.5 rounded shadow">
                        <span>NULL</span>
                        <span>∅</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action Pill */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] border-t border-[#30363d]/50 pt-2 px-1">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
          Direct Address References
        </span>
        <span className="bg-[#21262d] text-[#3fb950] font-semibold px-2 py-0.5 rounded border border-[#30363d]">
          nodes & pointers
        </span>
      </div>
    </div>
  );
};

