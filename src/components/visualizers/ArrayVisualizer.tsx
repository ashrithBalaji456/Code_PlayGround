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
    const mat = structure.matrixData;
    const rows = mat.length;
    const cols = rows > 0 && Array.isArray(mat[0]) ? mat[0].length : 0;
    const activeCell = structure.activeCell;
    const dependencyCells = structure.dependencyCells || [];
    const highlightedCells = structure.highlightedCells || [];
    const lastUpdatedCell = structure.lastUpdatedCell;

    // Helper to determine directional badge for dependency cells
    const getDependencyTag = (rIdx: number, cIdx: number) => {
      if (!activeCell) return 'REF';
      const [ar, ac] = activeCell;
      if (rIdx === ar - 1 && cIdx === ac - 1) return '↖ diag';
      if (rIdx === ar - 1 && cIdx === ac) return '↑ top';
      if (rIdx === ar && cIdx === ac - 1) return '← left';
      return 'REF';
    };

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d]/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#58a6ff] text-base">{structure.name}</span>
            <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono border border-[#30363d]">
              {structure.dataType || 'int[][]'}
            </span>
            <span className="text-xs bg-[#0d1117] text-[#58a6ff] px-2 py-0.5 rounded font-mono border border-[#58a6ff]/30">
              {rows} × {cols}
            </span>
            {structure.lastOperation && (
              <span className="text-xs text-[#3fb950] font-mono bg-[#3fb950]/10 px-2 py-0.5 rounded border border-[#3fb950]/20">
                {structure.lastOperation}
              </span>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-1 bg-[#238636]/15 border border-[#3fb950]/40 px-1.5 py-0.5 rounded text-[#3fb950]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
              <span>Updating</span>
            </div>
            <div className="flex items-center gap-1 bg-[#d29922]/15 border border-[#d29922]/40 px-1.5 py-0.5 rounded text-[#e3b341]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d29922]" />
              <span>Reference</span>
            </div>
            {highlightedCells.length > 0 && (
              <div className="flex items-center gap-1 bg-[#bc8cff]/15 border border-[#bc8cff]/40 px-1.5 py-0.5 rounded text-[#d2a8ff]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#bc8cff]" />
                <span>Path</span>
              </div>
            )}
          </div>
        </div>

        {/* Formula / Reference Explanation Card */}
        {structure.cellExplanation && (
          <div className="bg-[#0d1117] border border-[#388bfd]/30 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse flex-shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[#8b949e] font-mono font-semibold">Reference Formula:</span>
                <span className="text-[#f0f6fc] font-mono font-medium">{structure.cellExplanation}</span>
              </div>
            </div>
            {activeCell && (
              <span className="text-[10px] font-mono font-bold bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/40 px-2 py-0.5 rounded flex-shrink-0">
                Cell [{activeCell[0]}][{activeCell[1]}]
              </span>
            )}
          </div>
        )}

        {/* Matrix Grid with Column and Row Labels */}
        <div className="overflow-x-auto py-2 flex justify-center">
          <div className="inline-block min-w-max">
            {/* Column Headers */}
            <div className="flex items-end gap-2 mb-2 pl-12">
              {mat[0]?.map((_, cIdx) => (
                <div key={cIdx} className="w-12 text-center flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-mono text-[#8b949e] font-semibold">{cIdx}</span>
                  {structure.colLabels && structure.colLabels[cIdx] !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1 rounded font-bold ${
                        activeCell && activeCell[1] === cIdx
                          ? 'bg-[#388bfd] text-white'
                          : 'bg-[#21262d] text-[#58a6ff] border border-[#30363d]'
                      }`}
                    >
                      {structure.colLabels[cIdx]}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            <div className="flex flex-col gap-2">
              {mat.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-2 items-center">
                  {/* Row Header */}
                  <div className="w-10 flex items-center justify-end gap-1.5 pr-1">
                    {structure.rowLabels && structure.rowLabels[rIdx] !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1 rounded font-bold ${
                          activeCell && activeCell[0] === rIdx
                            ? 'bg-[#388bfd] text-white'
                            : 'bg-[#21262d] text-[#58a6ff] border border-[#30363d]'
                        }`}
                      >
                        {structure.rowLabels[rIdx]}
                      </span>
                    )}
                    <span className="text-xs font-mono text-[#8b949e] font-semibold">{rIdx}</span>
                  </div>

                  {/* Row Cells */}
                  {row.map((val, cIdx) => {
                    const isActive = activeCell && activeCell[0] === rIdx && activeCell[1] === cIdx;
                    const isDep = dependencyCells.some(([dr, dc]) => dr === rIdx && dc === cIdx);
                    const isPath = highlightedCells.some(([pr, pc]) => pr === rIdx && pc === cIdx);
                    const isLast =
                      !isActive &&
                      lastUpdatedCell &&
                      lastUpdatedCell[0] === rIdx &&
                      lastUpdatedCell[1] === cIdx;

                    let borderClass = 'border-[#30363d]';
                    let bgClass = 'bg-[#0d1117]';
                    let textClass = 'text-[#f0f6fc]';
                    let ringClass = '';
                    let badge: React.ReactNode = null;

                    if (isActive) {
                      borderClass = 'border-[#3fb950]';
                      bgClass = 'bg-[#238636]/30';
                      textClass = 'text-[#3fb950]';
                      ringClass =
                        'ring-2 ring-[#3fb950] shadow-[0_0_16px_rgba(63,185,80,0.5)] scale-105 z-20 animate-pulse';
                      badge = (
                        <span className="absolute -top-2.5 px-1 py-0.2 bg-[#238636] text-[8px] font-bold text-white rounded shadow uppercase tracking-wide">
                          UPDATING
                        </span>
                      );
                    } else if (isDep) {
                      borderClass = 'border-[#d29922]';
                      bgClass = 'bg-[#d29922]/25';
                      textClass = 'text-[#e3b341]';
                      ringClass =
                        'ring-2 ring-[#d29922]/60 shadow-[0_0_12px_rgba(210,153,34,0.4)] z-10 scale-102';
                      const tag = getDependencyTag(rIdx, cIdx);
                      badge = (
                        <span className="absolute -top-2.5 px-1 py-0.2 bg-[#9e6a03] text-[8px] font-bold text-white rounded shadow">
                          {tag}
                        </span>
                      );
                    } else if (isPath) {
                      borderClass = 'border-[#bc8cff]';
                      bgClass = 'bg-[#bc8cff]/25';
                      textClass = 'text-[#d2a8ff]';
                      ringClass =
                        'ring-2 ring-[#bc8cff]/50 shadow-[0_0_12px_rgba(188,140,255,0.4)] z-10';
                      badge = (
                        <span className="absolute -top-2.5 px-1 py-0.2 bg-[#8957e5] text-[8px] font-bold text-white rounded shadow uppercase">
                          PATH
                        </span>
                      );
                    } else if (isLast) {
                      borderClass = 'border-[#58a6ff]';
                      bgClass = 'bg-[#1f6feb]/15';
                      textClass = 'text-[#58a6ff]';
                    }

                    return (
                      <div
                        key={cIdx}
                        className={`relative w-12 h-12 flex items-center justify-center border rounded-lg font-mono text-base font-semibold transition-all duration-200 select-none ${borderClass} ${bgClass} ${textClass} ${ringClass}`}
                        title={`dp[${rIdx}][${cIdx}] = ${val}`}
                      >
                        {badge}
                        <span>{val}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
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
