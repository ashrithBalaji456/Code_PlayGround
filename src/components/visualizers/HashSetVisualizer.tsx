import React from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface HashSetVisualizerProps {
  structure: DataStructureState;
  lastEvent?: ExecutionEvent;
}

export const HashSetVisualizer: React.FC<HashSetVisualizerProps> = ({
  structure,
  lastEvent,
}) => {
  const elements = structure.setData || [];
  const isDuplicateRejected =
    lastEvent &&
    lastEvent.type === 'SET_ADD' &&
    lastEvent.structureId === structure.id &&
    lastEvent.conditionResult === false;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#e3b341]" />
          <span className="font-mono font-bold text-[#e3b341] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {structure.dataType || 'HashSet<Integer>'} (size: {elements.length})
          </span>
          <span className="text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            Unique Elements Only
          </span>
        </div>
        {structure.lastOperation && (
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
              isDuplicateRejected
                ? 'bg-[#f85149]/20 text-[#f85149] border-[#f85149]/40 font-bold animate-pulse'
                : 'text-[#e3b341] bg-[#e3b341]/10 border-[#e3b341]/20'
            }`}
          >
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Duplicate Rejection Banner if active */}
      {isDuplicateRejected && (
        <div className="bg-[#f85149]/15 border border-[#f85149]/50 rounded-lg p-2.5 flex items-center gap-2 text-xs font-mono text-[#f85149] shadow-sm animate-pulse">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Duplicate element rejected: <strong>{String(lastEvent.value)}</strong> already exists. Set size remains {elements.length}.</span>
        </div>
      )}

      {/* Elements Set Container */}
      <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d] min-h-[110px] flex flex-wrap items-center justify-center gap-2.5">
        {elements.length === 0 ? (
          <div className="text-xs text-[#8b949e] font-mono">[ Empty Set (0 elements) ]</div>
        ) : (
          elements.map((val, idx) => {
            const isJustAdded =
              lastEvent &&
              lastEvent.type === 'SET_ADD' &&
              lastEvent.structureId === structure.id &&
              lastEvent.value === val &&
              lastEvent.conditionResult !== false;

            const isQueried =
              lastEvent &&
              lastEvent.type === 'SET_LOOKUP' &&
              lastEvent.structureId === structure.id &&
              lastEvent.value === val;

            return (
              <div
                key={idx}
                className={`px-4 py-2 rounded-xl font-mono font-bold text-sm border shadow-md transition-all duration-300 transform hover:scale-105 ${
                  isJustAdded
                    ? 'bg-[#3fb950]/20 border-[#3fb950] text-[#3fb950] ring-2 ring-[#3fb950] scale-105'
                    : isQueried
                    ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff] ring-2 ring-[#58a6ff] scale-105'
                    : 'bg-[#161b22] border-[#e3b341]/40 text-[#f0f6fc] hover:border-[#e3b341]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#e3b341]">#</span>
                  <span>{String(val)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] border-t border-[#30363d]/40 pt-1">
        <span>Hashing guarantees O(1) average lookup/insert</span>
        <span>Runtime State</span>
      </div>
    </div>
  );
};
