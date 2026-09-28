import React, { useState } from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { BarChart2, Layers, Network } from 'lucide-react';

interface ArrayVisualizerProps {
  structure: DataStructureState;
  pointers: Record<string, any>;
  comparisonIndices?: number[];
  activeIndices?: number[];
  lastEvent?: ExecutionEvent;
  comparisonInfo?: {
    left?: string | number;
    right?: string | number;
    operator?: string;
    result?: boolean | number;
    explanation?: string;
  };
  whyChanged?: {
    target: string;
    previousValue: any;
    newValue: any;
    reason: string;
    sourceLine: number;
    sourceCode?: string;
  };
}

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  structure,
  pointers,
  comparisonIndices,
  activeIndices,
  lastEvent,
  comparisonInfo,
  whyChanged,
}) => {
  const [viewMode, setViewMode] = useState<'boxes' | 'bars' | 'nested'>('boxes');

  // Helper to render cell value safely (handles booleans, nested arrays, nulls, primitives)
  const renderCellContent = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-[#8b949e] italic text-xs font-mono">null</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={`px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wider ${
            val
              ? 'bg-[#238636]/30 text-[#3fb950] border border-[#3fb950]/50 shadow-[0_0_8px_rgba(63,185,80,0.3)]'
              : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
          }`}
        >
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }
    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap items-center justify-center gap-1 px-1.5 py-0.5">
          <span className="text-[#8b949e] font-mono text-xs font-bold">[</span>
          {val.length === 0 ? (
            <span className="text-[#8b949e] font-mono text-[11px] italic">empty</span>
          ) : (
            val.map((item, itemIdx) => (
              <span
                key={itemIdx}
                className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-[#1f6feb]/25 text-[#58a6ff] border border-[#388bfd]/30"
              >
                {String(item)}
              </span>
            ))
          )}
          <span className="text-[#8b949e] font-mono text-xs font-bold">]</span>
        </div>
      );
    }
    return String(val);
  };

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
                        <span>{renderCellContent(val)}</span>
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
  const isNestedList = arr.some((v) => Array.isArray(v));
  const maxVal = Math.max(...arr.map((v) => (typeof v === 'number' ? Math.abs(v) : Array.isArray(v) ? v.length : 1)), 10);

  // Effective visual indicators
  const effectiveComparingIndices = (comparisonIndices && comparisonIndices.length > 0)
    ? comparisonIndices
    : (structure.comparingIndices || []);

  const effectiveSwappingIndices = structure.swappingIndices
    ? structure.swappingIndices
    : (lastEvent && (lastEvent.type === 'ARRAY_SWAP' || lastEvent.type === 'SWAP') && lastEvent.indices && lastEvent.indices.length >= 2)
    ? [lastEvent.indices[0], lastEvent.indices[1]] as [number, number]
    : undefined;

  const effectiveActiveIndices = (activeIndices && activeIndices.length > 0)
    ? activeIndices
    : (structure.activeIndices || []);

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
          {isNestedList && (
            <button
              onClick={() => setViewMode('nested')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${
                viewMode === 'nested' ? 'bg-[#58a6ff] text-black font-semibold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
              title="Nested Tree Hierarchy"
            >
              <Network className="w-3.5 h-3.5" />
              Hierarchy
            </button>
          )}
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

      {/* Live Data Movement & Swap Motion Banner */}
      {effectiveSwappingIndices && effectiveSwappingIndices.length === 2 && (
        <div className="bg-[#bc8cff]/15 border-2 border-[#bc8cff]/60 rounded-xl p-3 flex flex-col gap-2 shadow-lg shadow-[#bc8cff]/20 animate-pulse">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#d2a8ff]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#bc8cff] animate-ping" />
              <span className="text-sm font-semibold">🔄 Live Memory Motion: Exchanging Values</span>
            </div>
            <span className="bg-[#bc8cff]/30 text-[#f0f6fc] px-2 py-0.5 rounded border border-[#bc8cff]/50">
              Indices [{effectiveSwappingIndices[0]}] ⇄ [{effectiveSwappingIndices[1]}]
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 py-1 font-mono text-xs">
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[#bc8cff]/60 px-3 py-1.5 rounded-lg shadow">
              <span className="text-[#8b949e]">Index {effectiveSwappingIndices[0]}:</span>
              <span className="font-bold text-[#f0f6fc] text-sm">{String(arr[effectiveSwappingIndices[0]])}</span>
              <span className="text-[#bc8cff] font-bold">➔ Moving to Index {effectiveSwappingIndices[1]}</span>
            </div>

            <div className="text-[#bc8cff] font-bold text-xl px-1">
              ⇄
            </div>

            <div className="flex items-center gap-2 bg-[#0d1117] border border-[#bc8cff]/60 px-3 py-1.5 rounded-lg shadow">
              <span className="text-[#8b949e]">Index {effectiveSwappingIndices[1]}:</span>
              <span className="font-bold text-[#f0f6fc] text-sm">{String(arr[effectiveSwappingIndices[1]])}</span>
              <span className="text-[#bc8cff] font-bold">➔ Moving to Index {effectiveSwappingIndices[0]}</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Data Selection & Comparison Arc */}
      {effectiveComparingIndices.length >= 2 && !effectiveSwappingIndices && (
        <div className="bg-[#d29922]/15 border border-[#d29922]/60 rounded-xl p-3 flex flex-col gap-2 shadow-lg shadow-[#d29922]/10">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#e3b341]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d29922] animate-pulse" />
              <span className="text-sm font-semibold">🔍 Data Selection & Comparison Bridge</span>
            </div>
            <span className="bg-[#d29922]/30 text-[#f0f6fc] px-2 py-0.5 rounded border border-[#d29922]/50">
              Comparing arr[{effectiveComparingIndices[0]}] vs arr[{effectiveComparingIndices[1]}]
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 py-1 font-mono text-xs">
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[#d29922]/60 px-3 py-1.5 rounded-lg shadow">
              <span className="text-[#8b949e]">Selected [#{effectiveComparingIndices[0]}]:</span>
              <span className="font-bold text-[#f0f6fc] text-sm">{String(arr[effectiveComparingIndices[0]])}</span>
            </div>

            <div className="px-2.5 py-1 rounded bg-[#d29922]/25 text-[#e3b341] font-bold border border-[#d29922]/50 text-xs">
              {comparisonInfo?.operator ? `${arr[effectiveComparingIndices[0]]} ${comparisonInfo.operator} ${arr[effectiveComparingIndices[1]]}` : `arr[${effectiveComparingIndices[0]}] ? arr[${effectiveComparingIndices[1]}]`}
            </div>

            <div className="flex items-center gap-2 bg-[#0d1117] border border-[#d29922]/60 px-3 py-1.5 rounded-lg shadow">
              <span className="text-[#8b949e]">Selected [#{effectiveComparingIndices[1]}]:</span>
              <span className="font-bold text-[#f0f6fc] text-sm">{String(arr[effectiveComparingIndices[1]])}</span>
            </div>

            {comparisonInfo && comparisonInfo.result !== undefined && (
              <div className={`px-2.5 py-1 rounded text-xs font-bold border ${
                comparisonInfo.result
                  ? 'bg-[#3fb950]/20 text-[#3fb950] border-[#3fb950]/50'
                  : 'bg-[#f85149]/20 text-[#f85149] border-[#f85149]/50'
              }`}>
                {comparisonInfo.result ? 'TRUE (Condition Met)' : 'FALSE (Keep Position)'}
              </div>
            )}
          </div>
          {comparisonInfo?.explanation && (
            <p className="text-[11px] text-[#8b949e] font-sans text-center">
              {comparisonInfo.explanation}
            </p>
          )}
        </div>
      )}

      {/* Assignment / Mutation Explanation if active */}
      {whyChanged && whyChanged.target && whyChanged.target.includes(structure.name) && (
        <div className="bg-[#1f6feb]/15 border border-[#388bfd]/50 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs font-mono shadow">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse" />
            <span className="text-[#8b949e]">Value Mutated:</span>
            <span className="text-[#f0f6fc] font-bold">{whyChanged.reason}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[#8b949e] line-through">{String(whyChanged.previousValue)}</span>
            <span className="text-[#3fb950] font-bold">➔ {String(whyChanged.newValue)}</span>
          </div>
        </div>
      )}

      {/* Live Two Pointers Formula Card (Reference Video #1 & Section 33) */}
      {(() => {
        const leftPtrEntry = Object.entries(pointers).find(([k, v]) => ['left', 'l', 'start', 'low', 'i'].includes(k.toLowerCase()) && typeof v === 'number' && v >= 0 && v < arr.length);
        const rightPtrEntry = Object.entries(pointers).find(([k, v]) => ['right', 'r', 'end', 'high', 'j'].includes(k.toLowerCase()) && typeof v === 'number' && v >= 0 && v < arr.length && k.toLowerCase() !== leftPtrEntry?.[0].toLowerCase());
        if (!leftPtrEntry || !rightPtrEntry || leftPtrEntry[1] === rightPtrEntry[1]) return null;

        const leftVal = arr[leftPtrEntry[1]];
        const rightVal = arr[rightPtrEntry[1]];
        const isNumeric = typeof leftVal === 'number' && typeof rightVal === 'number';
        const sum = isNumeric ? leftVal + rightVal : null;

        return (
          <div className="bg-[#1f6feb]/10 border border-[#388bfd]/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#58a6ff] animate-pulse" />
              <span className="text-[#8b949e]">Two Pointers:</span>
              <div className="flex items-center gap-1.5">
                <span className="bg-[#58a6ff]/20 text-[#58a6ff] px-2 py-0.5 rounded font-bold">
                  {leftPtrEntry[0]} [#{leftPtrEntry[1]}] = {String(leftVal)}
                </span>
                <span className="text-[#8b949e] font-bold">+</span>
                <span className="bg-[#bc8cff]/20 text-[#bc8cff] px-2 py-0.5 rounded font-bold">
                  {rightPtrEntry[0]} [#{rightPtrEntry[1]}] = {String(rightVal)}
                </span>
                {sum !== null && (
                  <>
                    <span className="text-[#8b949e] font-bold">=</span>
                    <span className="text-[#3fb950] font-bold text-sm bg-[#3fb950]/15 px-2 py-0.5 rounded border border-[#3fb950]/30">
                      {sum}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8b949e]">
              <span className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] text-[#58a6ff] font-semibold">
                L ➔ right
              </span>
              <span className="bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] text-[#bc8cff] font-semibold">
                left ⬅ R
              </span>
            </div>
          </div>
        );
      })()}

      {/* Live Binary Search Decision Card (Reference Video #3 & Section 26) */}
      {(() => {
        const midPtr = Object.entries(pointers).find(([k, v]) => ['mid', 'm', 'middle'].includes(k.toLowerCase()) && typeof v === 'number');
        if (!midPtr || typeof midPtr[1] !== 'number' || midPtr[1] < 0 || midPtr[1] >= arr.length) return null;
        const midVal = arr[midPtr[1]];

        return (
          <div className="bg-[#d29922]/10 border border-[#d29922]/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d29922] animate-pulse" />
              <span className="text-[#8b949e]">Binary Search Pivot:</span>
              <span className="bg-[#d29922]/20 text-[#e3b341] px-2.5 py-0.5 rounded font-bold text-sm">
                arr[mid={midPtr[1]}] = {String(midVal)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="bg-[#0d1117] text-[#8b949e] px-2 py-0.5 rounded border border-[#30363d]">
                MID ↓
              </span>
              <span className="text-[#f0f6fc] font-semibold">
                Halves search space to O(log N)
              </span>
            </div>
          </div>
        );
      })()}

      {/* Live Array Read / Access Animation Banner (Section 6) */}
      {lastEvent && lastEvent.type === 'ARRAY_ACCESS' && typeof lastEvent.index === 'number' && lastEvent.index >= 0 && lastEvent.index < arr.length && (
        <div className="bg-[#3fb950]/10 border border-[#3fb950]/40 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs font-mono shadow animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
            <span className="text-[#8b949e]">Array Element Read:</span>
            <span className="text-[#3fb950] font-bold">
              {structure.name}[{lastEvent.index}] = {String(arr[lastEvent.index])}
            </span>
          </div>
          <span className="text-[10px] bg-[#3fb950]/20 text-[#3fb950] px-2 py-0.5 rounded font-bold border border-[#3fb950]/30">
            ACCESS ➔ LOAD
          </span>
        </div>
      )}

      {/* Cumulative Prefix Sum Build Card (Reference Video #7 & Section 35) */}
      {(structure.name.toLowerCase().includes('pref') || structure.cellExplanation?.toLowerCase().includes('prefix')) && (
        <div className="bg-[#3fb950]/10 border border-[#3fb950]/40 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs font-mono shadow">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
            <span className="text-[#8b949e]">Prefix Cumulative Build:</span>
            <span className="text-[#f0f6fc] font-bold">prefix[i] = prefix[i - 1] + nums[i]</span>
          </div>
          <span className="text-[10px] bg-[#3fb950]/20 text-[#3fb950] px-2 py-0.5 rounded font-bold border border-[#3fb950]/30">
            + build
          </span>
        </div>
      )}

      {viewMode === 'nested' ? (
        /* Hierarchical Nested Tree Representation (Section 10) */
        <div className="overflow-x-auto py-2">
          <div className="flex flex-col gap-1.5 font-mono text-xs bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 shadow-inner">
            <div className="flex items-center gap-2 text-[#58a6ff] font-bold pb-2 border-b border-[#30363d]/40">
              <span>{structure.name}</span>
              <span className="text-[#8b949e] font-normal text-[11px]">(Nested Collection, {arr.length} elements)</span>
            </div>
            {arr.map((sub, sIdx) => {
              const subItems = Array.isArray(sub) ? sub : [sub];
              const isLast = sIdx === arr.length - 1;
              const branchChar = isLast ? '└──' : '├──';
              const isActive = structure.activeIndices?.includes(sIdx);
              return (
                <div key={sIdx} className="flex flex-col">
                  <div
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors ${
                      isActive ? 'bg-[#1f6feb]/20 border border-[#58a6ff]/40' : 'hover:bg-[#161b22]'
                    }`}
                  >
                    <span className="text-[#8b949e] select-none">{branchChar}</span>
                    <span className="font-bold text-[#f0f6fc]">list[{sIdx}]</span>
                    <span className="text-[#8b949e] select-none">➔</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[#8b949e] font-bold">[</span>
                      {subItems.length === 0 ? (
                        <span className="text-[#8b949e] italic text-[11px]">empty</span>
                      ) : (
                        subItems.map((item, itIdx) => (
                          <span
                            key={itIdx}
                            className="px-2 py-0.5 rounded text-xs font-bold bg-[#1f6feb]/25 text-[#58a6ff] border border-[#388bfd]/30 shadow-sm"
                          >
                            {String(item)}
                          </span>
                        ))
                      )}
                      <span className="text-[#8b949e] font-bold">]</span>
                    </div>
                    <span className="text-[10px] text-[#8b949e] ml-auto">
                      size: {subItems.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'boxes' ? (
        <div className="overflow-x-auto py-3">
          <div className="flex items-end justify-center min-w-max gap-2 px-2">
            {arr.map((val, idx) => {
              const activePtrs = pointersByIndex[idx] || [];
              const algoBadges = structure.pointerBadges?.[idx] || [];
              const allBadges = [...new Set([...activePtrs, ...algoBadges])];

              const isActive = structure.activeIndices?.includes(idx) || effectiveActiveIndices.includes(idx);
              const isComparing = effectiveComparingIndices.includes(idx);
              const isSwapping = !!effectiveSwappingIndices?.includes(idx);
              const otherSwapIdx = effectiveSwappingIndices ? (effectiveSwappingIndices[0] === idx ? effectiveSwappingIndices[1] : effectiveSwappingIndices[0]) : null;
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
              } else if (isSwapping) {
                borderColor = 'border-[#bc8cff]';
                bgColor = 'bg-[#bc8cff]/25';
                textColor = 'text-[#bc8cff]';
                ringClass = 'ring-2 ring-[#bc8cff] shadow-lg shadow-[#bc8cff]/40 animate-pulse';
              } else if (isComparing) {
                borderColor = 'border-[#d29922]';
                bgColor = 'bg-[#d29922]/25';
                textColor = 'text-[#d29922]';
                ringClass = 'ring-2 ring-[#d29922] shadow-lg shadow-[#d29922]/30';
              } else if (isActive) {
                borderColor = 'border-[#58a6ff]';
                bgColor = 'bg-[#58a6ff]/20';
                textColor = 'text-[#58a6ff]';
                ringClass = 'ring-2 ring-[#58a6ff] ring-offset-2 ring-offset-[#0d1117]';
              } else if (isSorted) {
                borderColor = 'border-[#3fb950]/60';
                textColor = 'text-[#3fb950]';
              }

              if (inWindowRange && !isPivot && !isComparing && !isSwapping && !isActive) {
                borderColor = 'border-[#39c5cf]/70';
              }

              const dimClass = !inSearchRange ? 'opacity-30 grayscale scale-95' : 'opacity-100 scale-100';
              const cellWidthClass = isNestedList ? 'min-w-[4.5rem] w-auto px-2.5 h-14' : 'w-14 h-14';

              return (
                <div key={idx} className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${dimClass}`}>
                  {/* Pointers & Algorithm Badges above cell */}
                  <div className="h-6 flex items-center justify-center">
                    {isSwapping && otherSwapIdx !== null ? (
                      <span className="bg-[#bc8cff] text-black font-extrabold text-[9px] font-mono px-1.5 py-0.5 rounded shadow-lg animate-bounce flex items-center gap-0.5 whitespace-nowrap z-10">
                        {idx < otherSwapIdx ? '➔' : '←'} To #{otherSwapIdx}
                      </span>
                    ) : isComparing ? (
                      <span className="bg-[#d29922] text-black font-extrabold text-[9px] font-mono px-1.5 py-0.5 rounded shadow-lg flex items-center gap-0.5 whitespace-nowrap z-10 animate-pulse">
                        Selected {idx === effectiveComparingIndices[0] ? 'A' : 'B'}
                      </span>
                    ) : allBadges.length > 0 ? (
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
                    className={`${cellWidthClass} rounded-lg flex items-center justify-center font-mono text-base font-bold border ${borderColor} ${bgColor} ${textColor} ${ringClass} shadow-md transition-all duration-300 transform hover:scale-105 relative`}
                  >
                    {isSorted && (
                      <span className="absolute top-0.5 right-1 text-[9px] text-[#3fb950] font-bold">
                        ✓
                      </span>
                    )}
                    {isSwapping && (
                      <span className="absolute bottom-0.5 text-[8px] font-mono text-[#bc8cff] font-bold tracking-tight">
                        ⇄ move
                      </span>
                    )}
                    {isComparing && !isSwapping && (
                      <span className="absolute bottom-0.5 text-[8px] font-mono text-[#e3b341] font-bold tracking-tight">
                        inspect
                      </span>
                    )}
                    {isUpdated && lastEvent.oldValue !== undefined ? (
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="text-[10px] text-[#8b949e] line-through font-mono">
                          {typeof lastEvent.oldValue === 'boolean'
                            ? String(lastEvent.oldValue)
                            : Array.isArray(lastEvent.oldValue)
                            ? `[${lastEvent.oldValue.join(', ')}]`
                            : String(lastEvent.oldValue)}
                        </span>
                        <div className="flex items-center gap-0.5 text-xs text-[#3fb950] font-mono font-bold mt-0.5 animate-bounce">
                          <span>↓</span>
                          <span>{renderCellContent(val)}</span>
                        </div>
                      </div>
                    ) : (
                      renderCellContent(val)
                    )}
                  </div>

                  {/* Index below cell */}
                  <span className="font-mono text-xs text-[#8b949e] font-semibold">{idx}</span>
                </div>
              );
            })}
          </div>

          {/* Physical Sliding Window Bracket Handle (Reference Video #2 & Section 34) */}
          {structure.windowRange && structure.windowRange.length === 2 && (
            <div className="flex flex-col items-center mt-3 font-mono text-xs select-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#39c5cf]/15 border border-[#39c5cf]/50 text-[#39c5cf] shadow-md shadow-[#39c5cf]/10">
                <span className="font-bold">CURRENT WINDOW</span>
                <span className="text-white font-semibold">[{structure.windowRange[0]} ... {structure.windowRange[1]}]</span>
                {(() => {
                  const sub = arr.slice(structure.windowRange[0], structure.windowRange[1] + 1);
                  if (sub.length > 0 && sub.every((x) => typeof x === 'number')) {
                    const sum = sub.reduce((a, b) => a + b, 0);
                    return <span className="bg-[#39c5cf]/30 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">sum = {sum}</span>;
                  }
                  return null;
                })()}
                <span className="text-[10px] bg-[#0d1117] px-2 py-0.5 rounded border border-[#39c5cf]/40 font-bold animate-pulse text-[#39c5cf]">
                  slide ➔
                </span>
              </div>
            </div>
          )}
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
              const numVal = typeof val === 'number' ? val : typeof val === 'boolean' ? (val ? 10 : 2) : Array.isArray(val) ? val.length * 2 : 10;
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

                  <span className="text-xs font-mono font-bold text-[#f0f6fc]">{typeof val === 'boolean' ? String(val) : Array.isArray(val) ? `[${val.length}]` : val}</span>

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
