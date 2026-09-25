import React from 'react';
import { DataStructureState } from '../../types/execution';
import { GitCommit, ArrowRight } from 'lucide-react';

interface LinkedListVisualizerProps {
  structure: DataStructureState;
  pointers: Record<string, any>;
}

export const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({
  structure,
  pointers,
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
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-[#3fb950]" />
          <span className="font-mono font-bold text-[#3fb950] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {orderedNodes.length} nodes
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#3fb950] bg-[#3fb950]/10 px-2 py-0.5 rounded border border-[#3fb950]/20">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Linked Nodes Row */}
      <div className="flex items-center gap-2 p-3 bg-[#0d1117] rounded-lg overflow-x-auto min-h-[140px]">
        {orderedNodes.length === 0 ? (
          <div className="text-xs text-[#8b949e] font-mono mx-auto">[ Empty List (head is null) ]</div>
        ) : (
          orderedNodes.map((node) => {
            const activePtrs = pointersByNodeId[node.id] || [];
            const isHead = node.id === llData.headId;

            return (
              <div key={node.id} className="flex items-center gap-2">
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
                                : ptr === 'curr'
                                ? 'bg-[#58a6ff] text-black'
                                : 'bg-[#bc8cff] text-black'
                            }`}
                          >
                            {ptr} ↓
                          </span>
                        ))}
                      </div>
                    ) : isHead ? (
                      <span className="text-[10px] font-mono text-[#3fb950]">head ↓</span>
                    ) : null}
                  </div>

                  {/* Visual Node: [ Value | Next • ] */}
                  <div className="flex rounded-lg overflow-hidden border-2 border-[#3fb950]/50 bg-[#161b22] shadow-md hover:border-[#3fb950] transition-colors">
                    <div className="px-3.5 py-2 font-mono font-bold text-base text-[#f0f6fc] bg-[#21262d] flex items-center justify-center min-w-[44px]">
                      {node.value}
                    </div>
                    <div className="px-2.5 py-2 font-mono text-xs text-[#8b949e] border-l border-[#30363d] flex items-center justify-center bg-[#161b22] gap-1">
                      <span>next</span>
                      <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
                    </div>
                  </div>

                  {/* Heap ID */}
                  <span className="text-[9px] font-mono text-[#8b949e]">{node.id}</span>
                </div>

                {/* SVG Arrow to Next */}
                <div className="flex items-center justify-center text-[#3fb950]">
                  {node.nextId ? (
                    <ArrowRight className="w-6 h-6 animate-pulse" />
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-mono text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/30 px-2 py-1 rounded">
                      <span>➔</span>
                      <span>null</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-center text-[10px] font-mono text-[#8b949e]">
        Explicit Heap Pointers & Reference Chain
      </div>
    </div>
  );
};
