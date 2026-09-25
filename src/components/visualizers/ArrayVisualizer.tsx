import React, { useState } from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { BarChart2, Layers } from 'lucide-react';

interface ArrayVisualizerProps {
  structure: DataStructureState;
  pointers: Record<string, any>;
  comparisonIndices?: number[];
  activeIndices?: number[];
  lastEvent?: ExecutionEvent;
}

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  structure,
  pointers,
  lastEvent,
}) => {
  const [viewMode, setViewMode] = useState<'boxes' | 'bars'>('boxes');

  // If it's a 2D matrix
  if (structure.type === 'matrix' && structure.matrixData) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3 border-b border-[#30363d]/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#58a6ff] text-base">{structure.name}</span>
            <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
              {structure.dataType}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center overflow-x-auto py-2">
          {structure.matrixData.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-2 items-center">
              <span className="text-xs font-mono text-[#8b949e] w-4 text-right">{rIdx}</span>
              {row.map((val, cIdx) => (
                <div
                  key={cIdx}
                  className="w-12 h-12 flex items-center justify-center bg-[#0d1117] border border-[#30363d] rounded-lg font-mono text-base font-semibold text-[#f0f6fc] shadow-inner"
                >
                  {val}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const arr = structure.arrayData || [];
  const maxVal = Math.max(...arr.map((v) => (typeof v === 'number' ? Math.abs(v) : 1)), 10);

  // Group pointers by index
  const pointersByIndex: Record<number, string[]> = {};
  for (const [pName, pIdx] of Object.entries(pointers)) {
    if (typeof pIdx === 'number' && pIdx >= 0 && pIdx < arr.length) {
      if (!pointersByIndex[pIdx]) pointersByIndex[pIdx] = [];
      pointersByIndex[pIdx].push(pName);
    }
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#58a6ff] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {structure.dataType} (size: {arr.length})
          </span>
          {structure.lastOperation && (
            <span className="text-xs text-[#3fb950] font-mono bg-[#3fb950]/10 px-2 py-0.5 rounded border border-[#3fb950]/20">
              {structure.lastOperation}
            </span>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
          <button
            onClick={() => setViewMode('boxes')}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${
              viewMode === 'boxes' ? 'bg-[#58a6ff] text-black font-semibold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
            title="Cell View"
          >
            <Layers className="w-3.5 h-3.5" />
            Cells
          </button>
          <button
            onClick={() => setViewMode('bars')}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${
              viewMode === 'bars' ? 'bg-[#58a6ff] text-black font-semibold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
            title="Chart Tracer View"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Bars
          </button>
        </div>
      </div>

      {/* Main visualization */}
      {/* Algorithm active badges & window indicator bar */}
      {(structure.windowRange || structure.searchRange || structure.pivotIndex !== undefined) && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-[#0d1117] rounded-lg border border-[#30363d]/60 text-xs font-mono">
          {structure.windowRange && (
            <div className="flex items-center gap-1.5 text-[#39c5cf] bg-[#39c5cf]/10 px-2 py-0.5 rounded border border-[#39c5cf]/30">
              <span className="font-bold">Window:</span>
              <span>[{structure.windowRange[0]} ... {structure.windowRange[1]}]</span>
              <span className="text-[10px] text-[#8b949e]">({structure.windowRange[1] - structure.windowRange[0] + 1} elements)</span>
            </div>
          )}
          {structure.searchRange && (
            <div className="flex items-center gap-1.5 text-[#d29922] bg-[#d29922]/10 px-2 py-0.5 rounded border border-[#d29922]/30">
              <span className="font-bold">Search Scope:</span>
              <span>[{structure.searchRange[0]} ... {structure.searchRange[1]}]</span>
            </div>
          )}
          {structure.pivotIndex !== undefined && (
            <div className="flex items-center gap-1.5 text-[#f0883e] bg-[#f0883e]/10 px-2 py-0.5 rounded border border-[#f0883e]/30">
              <span className="font-bold">Pivot:</span>
              <span>index {structure.pivotIndex}</span>
            </div>
          )}
        </div>
      )}

      {viewMode === 'boxes' ? (
        <div className="overflow-x-auto py-3">
          <div className="flex items-end justify-center min-w-max gap-2 px-2">
            {arr.map((val, idx) => {
              const activePtrs = pointersByIndex[idx] || [];
              const algoBadges = structure.pointerBadges?.[idx] || [];
              const allBadges = [...new Set([...activePtrs, ...algoBadges])];

              const isActive = structure.activeIndices?.includes(idx);
              const isComparing = structure.comparingIndices?.includes(idx);
              const isSwapping = structure.swappingIndices?.includes(idx);
              const isPivot = structure.pivotIndex === idx;
              const isSorted = structure.sortedIndices?.includes(idx);

              // Check if within search range
              const inSearchRange = !structure.searchRange || (idx >= structure.searchRange[0] && idx <= structure.searchRange[1]);
              // Check if within window range
              const inWindowRange = structure.windowRange && (idx >= structure.windowRange[0] && idx <= structure.windowRange[1]);

              const isUpdated =
                lastEvent &&
                lastEvent.type === 'ARRAY_UPDATE' &&
                (lastEvent.structureId === structure.id || lastEvent.arrayId === structure.name) &&
                lastEvent.index === idx;

              let borderColor = 'border-[#30363d]';
              let bgColor = inWindowRange ? 'bg-[#39c5cf]/10' : 'bg-[#0d1117]';
              let textColor = 'text-[#f0f6fc]';
              let ringClass = '';

              if (isPivot) {
                borderColor = 'border-[#f0883e]';
                bgColor = 'bg-[#f0883e]/20';
                textColor = 'text-[#f0883e]';
                ringClass = 'ring-2 ring-[#f0883e] shadow-lg shadow-[#f0883e]/30';
              } else if (isUpdated) {
                borderColor = 'border-[#3fb950]';
                bgColor = 'bg-[#3fb950]/20';
                textColor = 'text-[#3fb950]';
                ringClass = 'ring-2 ring-[#3fb950] ring-offset-2 ring-offset-[#0d1117] animate-pulse';
              } else if (isActive) {
                borderColor = 'border-[#58a6ff]';
                bgColor = 'bg-[#58a6ff]/20';
                textColor = 'text-[#58a6ff]';
                ringClass = 'ring-2 ring-[#58a6ff] ring-offset-2 ring-offset-[#0d1117]';
              } else if (isComparing) {
                borderColor = 'border-[#d29922]';
                bgColor = 'bg-[#d29922]/20';
                textColor = 'text-[#d29922]';
                ringClass = 'ring-2 ring-[#d29922]';
              } else if (isSwapping) {
                borderColor = 'border-[#bc8cff]';
                bgColor = 'bg-[#bc8cff]/20';
                textColor = 'text-[#bc8cff]';
                ringClass = 'ring-2 ring-[#bc8cff]';
              } else if (isSorted) {
                borderColor = 'border-[#3fb950]/60';
                textColor = 'text-[#3fb950]';
              }

              if (inWindowRange && !isPivot && !isComparing && !isSwapping && !isActive) {
                borderColor = 'border-[#39c5cf]/70';
              }

              const dimClass = !inSearchRange ? 'opacity-30 grayscale scale-95' : 'opacity-100 scale-100';

              return (
                <div key={idx} className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${dimClass}`}>
                  {/* Pointers & Algorithm Badges above cell */}
                  <div className="h-6 flex items-center justify-center">
                    {allBadges.length > 0 ? (
                      <div className="flex gap-1 animate-pointer">
                        {allBadges.map((badge) => {
                          let badgeBg = 'bg-[#58a6ff] text-[#0d1117]';
                          if (badge.includes('Pivot')) badgeBg = 'bg-[#f0883e] text-black';
                          else if (badge.includes('H') || badge.includes('Right') || badge.includes('R')) badgeBg = 'bg-[#bc8cff] text-black';
                          else if (badge.includes('M') || badge.includes('Mid')) badgeBg = 'bg-[#d29922] text-black';
                          else if (badge.includes('Win')) badgeBg = 'bg-[#39c5cf] text-black';
                          else if (badge.includes('Found')) badgeBg = 'bg-[#3fb950] text-black';

                          return (
                            <span
                              key={badge}
                              className={`${badgeBg} text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap`}
                            >
                              {badge} ↓
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>

                  {/* Array Cell */}
                  <div
                    className={`w-14 h-14 rounded-lg flex items-center justify-center font-mono text-base font-bold border ${borderColor} ${bgColor} ${textColor} ${ringClass} shadow-md transition-all duration-300 transform hover:scale-105 relative`}
                  >
                    {isSorted && (
                      <span className="absolute top-0.5 right-1 text-[9px] text-[#3fb950] font-bold">
                        ✓
                      </span>
                    )}
                    {isUpdated && lastEvent.oldValue !== undefined ? (
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="text-[10px] text-[#8b949e] line-through font-mono">
                          {lastEvent.oldValue}
                        </span>
                        <div className="flex items-center gap-0.5 text-xs text-[#3fb950] font-mono font-bold mt-0.5">
                          <span>↓</span>
                          <span>{val}</span>
                        </div>
                      </div>
                    ) : (
                      val
                    )}
                  </div>

                  {/* Index below cell */}
                  <span className="font-mono text-xs text-[#8b949e] font-semibold">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Bar Chart Tracer View */
        <div className="overflow-x-auto py-3">
          <div className="flex items-end justify-center min-w-max gap-3 h-48 px-2 border-b border-[#30363d]/60 pb-2">
            {arr.map((val, idx) => {
              const activePtrs = pointersByIndex[idx] || [];
              const algoBadges = structure.pointerBadges?.[idx] || [];
              const allBadges = [...new Set([...activePtrs, ...algoBadges])];
              const isActive = structure.activeIndices?.includes(idx);
              const numVal = typeof val === 'number' ? val : 10;
              const barHeightPercent = Math.max(12, Math.min(100, (Math.abs(numVal) / maxVal) * 100));

              let barColor = 'bg-[#58a6ff]/70';
              if (structure.pivotIndex === idx) barColor = 'bg-[#f0883e] shadow-lg shadow-[#f0883e]/30';
              else if (isActive) barColor = 'bg-[#3fb950] shadow-lg shadow-[#3fb950]/30';
              else if (allBadges.length > 0) barColor = 'bg-[#bc8cff] shadow-lg shadow-[#bc8cff]/30';

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  {allBadges.length > 0 && (
                    <div className="flex gap-1 text-[10px] font-mono font-bold text-[#58a6ff] animate-pointer">
                      {allBadges.join(', ')}
                    </div>
                  )}

                  <span className="text-xs font-mono font-bold text-[#f0f6fc]">{val}</span>

                  <div
                    style={{ height: `${barHeightPercent}%` }}
                    className={`w-9 rounded-t-md transition-all duration-300 ${barColor}`}
                  />

                  <span className="font-mono text-xs text-[#8b949e] font-semibold">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
