import React from 'react';
import { DataStructureState } from '../../types/execution';
import { Database, ArrowDown } from 'lucide-react';

interface HashMapVisualizerProps {
  structure: DataStructureState;
}

export const HashMapVisualizer: React.FC<HashMapVisualizerProps> = ({ structure }) => {
  const mapData = structure.mapData;
  if (!mapData) return null;

  const bucketCount = mapData.bucketCount || 8;
  const buckets: any[][] = Array.from({ length: bucketCount }, () => []);

  mapData.entries.forEach((entry) => {
    const b = entry.bucket % bucketCount;
    buckets[b].push(entry);
  });

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#f0883e]" />
          <span className="font-mono font-bold text-[#f0883e] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {mapData.entries.length} entries ({bucketCount} buckets)
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#f0883e] bg-[#f0883e]/10 px-2 py-0.5 rounded border border-[#f0883e]/20">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Conceptual Flow Diagram */}
      <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d] flex items-center justify-around text-xs font-mono">
        <div className="flex flex-col items-center">
          <span className="text-[#8b949e]">Key</span>
          <span className="text-[#f0f6fc] font-bold">"string"</span>
        </div>
        <span className="text-[#8b949e]">➔</span>
        <div className="flex flex-col items-center bg-[#161b22] px-2 py-1 rounded border border-[#30363d]">
          <span className="text-[#39c5cf]">hash(key)</span>
          <span className="text-[10px] text-[#8b949e]">polynomial</span>
        </div>
        <span className="text-[#8b949e]">➔</span>
        <div className="flex flex-col items-center bg-[#161b22] px-2 py-1 rounded border border-[#30363d]">
          <span className="text-[#bc8cff]">% Capacity</span>
          <span className="text-[10px] text-[#8b949e]">Bucket index</span>
        </div>
        <span className="text-[#8b949e]">➔</span>
        <div className="flex flex-col items-center">
          <span className="text-[#3fb950]">Entry Node</span>
          <span className="text-[10px] text-[#3fb950] font-bold">[K : V]</span>
        </div>
      </div>

      {/* Buckets Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto">
        {buckets.map((entries, bIdx) => {
          const hasEntries = entries.length > 0;
          return (
            <div
              key={bIdx}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                hasEntries
                  ? 'bg-[#0d1117] border-[#f0883e]/40'
                  : 'bg-[#0d1117]/40 border-[#30363d]/40 opacity-70'
              }`}
            >
              {/* Bucket Slot */}
              <div className="w-10 h-10 rounded bg-[#21262d] flex flex-col items-center justify-center border border-[#30363d] text-center font-mono">
                <span className="text-[9px] text-[#8b949e]">BKT</span>
                <span className="text-xs font-bold text-[#f0883e]">{bIdx}</span>
              </div>

              {/* Chained Linked Entries */}
              <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                {hasEntries ? (
                  entries.map((entry, eIdx) => (
                    <div key={eIdx} className="flex items-center gap-1">
                      <div className="bg-[#161b22] border border-[#f0883e] rounded px-2 py-1 font-mono text-xs flex gap-1 items-center shadow">
                        <span className="text-[#58a6ff] font-bold">"{entry.key}"</span>
                        <span className="text-[#8b949e]">:</span>
                        <span className="text-[#3fb950] font-bold">{entry.value}</span>
                      </div>
                      {eIdx < entries.length - 1 && (
                        <span className="text-xs text-[#f0883e]">➔</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] font-mono text-[#8b949e]/50 italic">null</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
