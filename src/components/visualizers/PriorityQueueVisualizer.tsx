import React from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { Crown, ArrowRight, Layers } from 'lucide-react';

interface PriorityQueueVisualizerProps {
  structure: DataStructureState;
  lastEvent?: ExecutionEvent;
}

export const PriorityQueueVisualizer: React.FC<PriorityQueueVisualizerProps> = ({
  structure,
}) => {
  const rawElements = structure.priorityQueueData || [];
  // Sort for logical priority view (Java PriorityQueue natural ordering is min-heap)
  const logicalOrder = [...rawElements].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-[#d2a8ff]" />
          <span className="font-mono font-bold text-[#d2a8ff] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {structure.dataType || 'PriorityQueue<Integer>'} (size: {rawElements.length})
          </span>
          <span className="text-[10px] font-mono text-[#d2a8ff] bg-[#d2a8ff]/10 border border-[#d2a8ff]/30 px-1.5 py-0.5 rounded">
            Min-Heap Priority
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#d2a8ff] bg-[#d2a8ff]/10 px-2 py-0.5 rounded border border-[#d2a8ff]/20">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Logical Priority Order View */}
      <div className="flex flex-col gap-2 p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
        <div className="flex items-center justify-between text-xs font-mono text-[#8b949e]">
          <span className="font-semibold text-[#f0f6fc]">Logical Priority Order (Highest Priority First):</span>
          <span className="text-[10px] text-[#3fb950] font-bold">poll() always extracts Head</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {logicalOrder.length === 0 ? (
            <div className="text-xs text-[#8b949e] font-mono mx-auto">[ Empty PriorityQueue ]</div>
          ) : (
            logicalOrder.map((val, idx) => {
              const isHead = idx === 0;

              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    {/* Head Priority Tag */}
                    <div className="h-5 flex items-center justify-center">
                      {isHead ? (
                        <span className="text-[10px] font-mono font-bold text-black bg-[#d2a8ff] px-1.5 py-0.2 rounded shadow animate-pulse">
                          HEAD (Min)
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-[#8b949e]">Prio #{idx + 1}</span>
                      )}
                    </div>

                    {/* Cell */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-sm border shadow transition-all duration-300 ${
                        isHead
                          ? 'bg-[#d2a8ff]/25 border-[#d2a8ff] text-[#d2a8ff] ring-2 ring-[#d2a8ff]'
                          : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                      }`}
                    >
                      {String(val)}
                    </div>
                  </div>

                  {idx < logicalOrder.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-[#30363d] mt-4" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Internal Heap Storage Array (Observable vs Internal distinction) */}
      <div className="p-2.5 bg-[#0d1117]/60 rounded-lg border border-[#30363d]/50 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#8b949e]" />
          <span className="text-[#8b949e]">Internal Heap Array (Unsorted):</span>
          <span className="text-[#f0f6fc] font-bold">[{rawElements.join(', ')}]</span>
        </div>
        <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded">
          Conceptual vs Runtime Order
        </span>
      </div>
    </div>
  );
};
