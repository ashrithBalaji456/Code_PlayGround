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

  // Swapping indices calculation
  const swappingIndices = structure.swappingIndices;
  const idx1 = swappingIndices && swappingIndices.length === 2 ? Math.min(swappingIndices[0], swappingIndices[1]) : 0;
  const idx2 = swappingIndices && swappingIndices.length === 2 ? Math.max(swappingIndices[0], swappingIndices[1]) : 0;

  return (
    <div className="backdrop-blur-xl bg-[#161b22]/70 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
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
      <div className="flex items-center gap-3 p-6 py-10 bg-[#0d1117] rounded-xl overflow-x-auto min-h-[160px] shadow-inner relative">
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

            const isSwapping = !!swappingIndices && swappingIndices.includes(nodeIdx);
            const isLeftSwap = isSwapping && nodeIdx === idx1;
            const cellPitch = 120; // node width + next + arrow ≈ 120px
            const swapDeltaX = (idx2 - idx1) * cellPitch;

            const swapStyle: React.CSSProperties = isSwapping
              ? ({
                  '--swap-dist': `${swapDeltaX}px`,
                  animation: isLeftSwap
                    ? 'swapLiftMoveRight 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite'
                    : 'swapLiftMoveLeft 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
                  zIndex: 40,
                } as any)
              : {};

            return (
              <div key={node.id} className="flex items-center gap-2.5 relative">
                {/* Ghost receptacle slot when node lifts into the air */}
                {isSwapping && (
                  <div
                    className="absolute inset-0 rounded-xl border-2 border-dashed border-[#bc8cff]/50 bg-[#bc8cff]/10 flex items-center justify-center font-mono text-[9px] font-bold text-[#bc8cff] pointer-events-none select-none z-0"
                    style={{ height: '72px', top: '24px' }}
                  >
                    Slot #{nodeIdx}
                  </div>
                )}

                {/* Node Box */}
                <div
                  className="flex flex-col items-center gap-1.5 relative z-10"
                  style={swapStyle}
                >
                  {/* Pointers above node */}
                  <div className="h-6 flex items-center justify-center">
                    {isSwapping ? (
                      <span
                        className={`text-black font-extrabold text-[9px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap ${
                          isLeftSwap ? 'bg-[#bc8cff]' : 'bg-[#58a6ff]'
                        }`}
                      >
                        {isLeftSwap ? `▲ LIFT ➔ #${idx2}` : `▼ LIFT ⬅ #${idx1}`}
                      </span>
                    ) : activePtrs.length > 0 ? (
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
                  <div
                    className={`flex rounded-xl overflow-hidden border-2 transition-all shadow-lg ${
                      isSwapping
                        ? isLeftSwap
                          ? 'border-[#bc8cff] ring-2 ring-[#bc8cff] shadow-[0_20px_35px_rgba(188,140,255,0.45)]'
                          : 'border-[#58a6ff] ring-2 ring-[#58a6ff] shadow-[0_20px_35px_rgba(88,166,255,0.45)]'
                        : 'border-[#3fb950]/60 bg-[#161b22] hover:border-[#3fb950]'
                    }`}
                  >
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
                    <div className="flex items-center text-[#3fb950] group relative" title="next pointer link">
                      <span className="w-6 h-0.5 bg-gradient-to-r from-[#3fb950] to-[#58a6ff]" />
                      <ArrowRight className="w-5 h-5 -ml-1 text-[#58a6ff] animate-pulse" />
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

