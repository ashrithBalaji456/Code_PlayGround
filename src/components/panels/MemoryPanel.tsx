import React from 'react';
import { VariableInfo, HeapObject } from '../../types/execution';
import { Cpu, HardDrive } from 'lucide-react';

interface MemoryPanelProps {
  variables: Record<string, VariableInfo>;
  heap: HeapObject[];
  memoryStats: {
    stackBytes: number;
    heapBytes: number;
    totalBytes: number;
  };
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  variables,
  heap,
  memoryStats,
}) => {
  const references = Object.values(variables).filter((v) => v.isReference);

  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#3fb950]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            JVM Memory Model (Stack vs Heap)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-[#8b949e]">Total:</span>
          <span className="font-bold text-[#3fb950]">~{memoryStats.totalBytes} B</span>
          <span className="text-[9px] text-[#8b949e]/70">(Est.)</span>
        </div>
      </div>

      {/* Memory Dual Column: STACK (Left) vs HEAP (Right) */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        {/* STACK COLUMN */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5">
            <span className="font-bold text-[#58a6ff] text-xs flex items-center gap-1">
              <span>STACK</span>
              <span className="text-[10px] text-[#8b949e] font-normal">(Frames & Primitives)</span>
            </span>
            <span className="text-[11px] text-[#3fb950] font-semibold">
              ~{memoryStats.stackBytes} B
            </span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px]">
            {Object.values(variables).length === 0 ? (
              <span className="text-[11px] text-[#8b949e] p-2 text-center italic">Empty</span>
            ) : (
              Object.values(variables).map((v) => (
                <div
                  key={v.name}
                  className={`p-1.5 rounded border text-[11px] flex items-center justify-between ${
                    v.isReference
                      ? 'bg-[#bc8cff]/10 border-[#bc8cff]/40 text-[#bc8cff]'
                      : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold">{v.name}</span>
                    <span className="text-[10px] text-[#8b949e]">({v.type})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {v.isReference ? (
                      <span className="text-[#bc8cff] font-bold">
                        ➔ {v.refTargetId || 'null'}
                      </span>
                    ) : (
                      <span>{String(v.value)}</span>
                    )}
                    <span className="text-[9px] text-[#8b949e] ml-1">
                      {v.estimatedBytes}B
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HEAP COLUMN */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5">
            <span className="font-bold text-[#bc8cff] text-xs flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span>HEAP</span>
              <span className="text-[10px] text-[#8b949e] font-normal">(Objects & Arrays)</span>
            </span>
            <span className="text-[11px] text-[#3fb950] font-semibold">
              ~{memoryStats.heapBytes} B
            </span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px]">
            {heap.length === 0 ? (
              <span className="text-[11px] text-[#8b949e] p-2 text-center italic">
                No heap allocations yet
              </span>
            ) : (
              heap.map((obj) => (
                <div
                  key={obj.id}
                  className="bg-[#161b22] border border-[#30363d] rounded p-2 flex flex-col gap-1 text-[11px]"
                >
                  <div className="flex items-center justify-between text-[#58a6ff]">
                    <span className="font-bold">{obj.id}</span>
                    <span className="text-[10px] text-[#3fb950]">~{obj.estimatedBytes} B</span>
                  </div>
                  <div className="text-[10px] text-[#8b949e] truncate">
                    Type: <span className="text-[#f0f6fc]">{obj.type}</span> | {obj.label}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Memory Footprint Table & Disclaimer */}
      <div className="px-3 py-1.5 bg-[#0d1117] border-t border-[#30363d] text-[10px] text-[#8b949e] flex items-center justify-between">
        <span className="truncate">
          Estimates based on 64-bit JVM specification with Compressed OOPs enabled.
        </span>
        <span className="text-[#3fb950] font-mono font-bold whitespace-nowrap ml-2">
          Refs: {references.length}
        </span>
      </div>
    </div>
  );
};
