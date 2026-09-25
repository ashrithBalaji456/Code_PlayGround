import React, { useState } from 'react';
import { AlgorithmState, ExecutionStep, RecursionTreeNode } from '../../types/execution';
import {
  Compass,
  ArrowUpDown,
  Search,
  Maximize2,
  GitCommit,
  GitBranch,
  Table as TableIcon,
  Activity,
  Cpu,
  CheckCircle,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AlgorithmsPanelProps {
  currentStep: ExecutionStep | null;
}

export const AlgorithmsPanel: React.FC<AlgorithmsPanelProps> = ({ currentStep }) => {
  const [subView, setSubView] = useState<'current' | 'matrix' | 'tree' | 'dp'>('current');

  if (!currentStep) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#8b949e] p-6 text-center select-none">
        <Compass className="w-10 h-10 text-[#58a6ff] mb-2 opacity-50 animate-pulse" />
        <p className="text-sm font-semibold text-[#f0f6fc]">No Active Algorithm Execution</p>
        <p className="text-xs text-[#8b949e] mt-1 max-w-xs">
          Run any search, sort, two-pointer, sliding window, recursion, or dynamic programming code to inspect live algorithm states and metrics.
        </p>
      </div>
    );
  }

  const algoState: AlgorithmState = currentStep.algorithmState || {
    metrics: {
      comparisons: 0,
      swaps: 0,
      accesses: 0,
      assignments: 0,
      functionCalls: 0,
      recursiveCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
    },
  };

  const metrics = algoState.metrics;
  const treeNodes = Object.values(algoState.recursionTree || {});

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 gap-4 text-xs font-sans text-[#f0f6fc]">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d]/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/15 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#f0f6fc]">
                {algoState.algorithmName || 'Standard Program Execution'}
              </span>
              {algoState.category && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 font-semibold">
                  {algoState.category}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8b949e]">
              Status: <span className="text-[#58a6ff] font-medium">{algoState.status || 'Executing'}</span>
              {algoState.phase ? ` • Phase: ${algoState.phase}` : ''}
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
          <button
            onClick={() => setSubView('current')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              subView === 'current' ? 'bg-[#58a6ff] text-black font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Overview
          </button>
          {treeNodes.length > 0 && (
            <button
              onClick={() => setSubView('tree')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                subView === 'tree' ? 'bg-[#bc8cff] text-black font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              Recursion Tree
            </button>
          )}
          {(algoState.dpTable1D || algoState.dpTable2D || algoState.memoEntries) && (
            <button
              onClick={() => setSubView('dp')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                subView === 'dp' ? 'bg-[#39c5cf] text-black font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              DP Table
            </button>
          )}
          <button
            onClick={() => setSubView('matrix')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              subView === 'matrix' ? 'bg-[#d29922] text-black font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Complexity Matrix
          </button>
        </div>
      </div>

      {/* Main Subview Content */}
      {subView === 'current' && (
        <div className="flex flex-col gap-4">
          {/* SEARCHING DETAILS */}
          {algoState.category === 'Searching' && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#58a6ff] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Search State
                </span>
                <span className="text-[11px] font-mono text-[#8b949e]">
                  Result: <strong className={algoState.searchResult === 'FOUND' ? 'text-[#3fb950]' : algoState.searchResult === 'NOT_FOUND' ? 'text-[#f85149]' : 'text-[#d29922]'}>{algoState.searchResult || 'Searching...'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Target</span>
                  <p className="text-sm font-mono font-bold text-[#f0883e] mt-0.5">{String(algoState.target ?? '-')}</p>
                </div>
                {algoState.searchLow !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Low Index (L)</span>
                    <p className="text-sm font-mono font-bold text-[#58a6ff] mt-0.5">{algoState.searchLow}</p>
                  </div>
                )}
                {algoState.searchMid !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Mid Index (M)</span>
                    <p className="text-sm font-mono font-bold text-[#d29922] mt-0.5">{algoState.searchMid}</p>
                  </div>
                )}
                {algoState.searchHigh !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">High Index (H)</span>
                    <p className="text-sm font-mono font-bold text-[#bc8cff] mt-0.5">{algoState.searchHigh}</p>
                  </div>
                )}
                {algoState.foundIndex !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#238636]/50">
                    <span className="text-[10px] text-[#3fb950] uppercase font-bold">Found Index</span>
                    <p className="text-sm font-mono font-bold text-[#3fb950] mt-0.5">{algoState.foundIndex}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SORTING DETAILS */}
          {algoState.category === 'Sorting' && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#bc8cff] flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Sorting Progress
                </span>
                <span className="text-[11px] font-mono text-[#8b949e]">
                  Phase: <strong className="text-[#58a6ff]">{algoState.phase || 'Comparing'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {algoState.sortRange && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Current Range</span>
                    <p className="text-sm font-mono font-bold text-[#58a6ff] mt-0.5">[{algoState.sortRange[0]} ... {algoState.sortRange[1]}]</p>
                  </div>
                )}
                {algoState.pivotIndex !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Pivot Index</span>
                    <p className="text-sm font-mono font-bold text-[#f0883e] mt-0.5">{algoState.pivotIndex} (val: {algoState.pivotValue})</p>
                  </div>
                )}
                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Comparisons</span>
                  <p className="text-sm font-mono font-bold text-[#d29922] mt-0.5">{metrics.comparisons}</p>
                </div>
                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Swaps</span>
                  <p className="text-sm font-mono font-bold text-[#bc8cff] mt-0.5">{metrics.swaps}</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDING WINDOW / TWO POINTERS / KADANE */}
          {algoState.category === 'Array Patterns' && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#39c5cf] flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" /> Pattern State
                </span>
                <span className="text-[11px] font-mono text-[#8b949e]">
                  {algoState.algorithmName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {algoState.leftPointer !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Left Pointer</span>
                    <p className="text-sm font-mono font-bold text-[#58a6ff] mt-0.5">{algoState.leftPointer}</p>
                  </div>
                )}
                {algoState.rightPointer !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Right Pointer</span>
                    <p className="text-sm font-mono font-bold text-[#bc8cff] mt-0.5">{algoState.rightPointer}</p>
                  </div>
                )}
                {algoState.windowStart !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Window Range</span>
                    <p className="text-sm font-mono font-bold text-[#39c5cf] mt-0.5">[{algoState.windowStart}..{algoState.windowEnd}]</p>
                  </div>
                )}
                {algoState.windowSum !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Current Sum</span>
                    <p className="text-sm font-mono font-bold text-[#f0883e] mt-0.5">{algoState.windowSum}</p>
                  </div>
                )}
                {algoState.windowBest !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#238636]/50">
                    <span className="text-[10px] text-[#3fb950] uppercase font-bold">Best Result</span>
                    <p className="text-sm font-mono font-bold text-[#3fb950] mt-0.5">{algoState.windowBest}</p>
                  </div>
                )}
                {algoState.kadaneCurrentSum !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Current Sum</span>
                    <p className="text-sm font-mono font-bold text-[#58a6ff] mt-0.5">{algoState.kadaneCurrentSum}</p>
                  </div>
                )}
                {algoState.kadaneBestSum !== undefined && (
                  <div className="bg-[#0d1117] p-2 rounded-lg border border-[#238636]/50">
                    <span className="text-[10px] text-[#3fb950] uppercase font-bold">Best Subarray Sum</span>
                    <p className="text-sm font-mono font-bold text-[#3fb950] mt-0.5">{algoState.kadaneBestSum}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BACKTRACKING CHOICES */}
          {algoState.choicesHistory && algoState.choicesHistory.length > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-2">
              <span className="font-semibold text-xs text-[#bc8cff] flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" /> Backtracking Choice Path
              </span>
              <div className="flex flex-wrap items-center gap-1.5 py-1">
                {algoState.choicesHistory.map((ch, idx) => (
                  <React.Fragment key={idx}>
                    <span className="bg-[#bc8cff]/20 text-[#bc8cff] px-2 py-0.5 rounded font-mono font-bold border border-[#bc8cff]/40">
                      {ch}
                    </span>
                    {idx < algoState.choicesHistory!.length - 1 && (
                      <span className="text-[#8b949e]">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* DUAL COMPLEXITY CARDS: Theoretical vs Observed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Theoretical Complexity */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5">
                <span className="font-semibold text-xs text-[#58a6ff] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Theoretical Complexity
                </span>
                <span className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded font-mono">
                  Educational Reference
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[#8b949e]">Time (Avg):</span>{' '}
                  <strong className="text-[#f0f6fc]">{algoState.theoreticalComplexity?.average || algoState.theoreticalComplexity?.time || 'O(n)'}</strong>
                </div>
                <div>
                  <span className="text-[#8b949e]">Time (Worst):</span>{' '}
                  <strong className="text-[#f85149]">{algoState.theoreticalComplexity?.worst || 'O(n²)'}</strong>
                </div>
                <div>
                  <span className="text-[#8b949e]">Time (Best):</span>{' '}
                  <strong className="text-[#3fb950]">{algoState.theoreticalComplexity?.best || 'O(1)'}</strong>
                </div>
                <div>
                  <span className="text-[#8b949e]">Space:</span>{' '}
                  <strong className="text-[#d29922]">{algoState.theoreticalComplexity?.space || 'O(1)'}</strong>
                </div>
              </div>
              <p className="text-[10px] text-[#8b949e] italic mt-1 border-t border-[#30363d]/30 pt-1">
                Standard mathematical bounds for recognized algorithm patterns.
              </p>
            </div>

            {/* Observed Runtime Operations */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5">
                <span className="font-semibold text-xs text-[#3fb950] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Observed Runtime Operations
                </span>
                <span className="text-[10px] bg-[#238636]/20 text-[#3fb950] px-1.5 py-0.5 rounded font-mono font-bold">
                  Live Counts
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="bg-[#0d1117] p-1.5 rounded border border-[#30363d]/40">
                  <span className="text-[9px] text-[#8b949e] uppercase">Accesses</span>
                  <p className="font-bold text-[#58a6ff]">{metrics.accesses}</p>
                </div>
                <div className="bg-[#0d1117] p-1.5 rounded border border-[#30363d]/40">
                  <span className="text-[9px] text-[#8b949e] uppercase">Compares</span>
                  <p className="font-bold text-[#d29922]">{metrics.comparisons}</p>
                </div>
                <div className="bg-[#0d1117] p-1.5 rounded border border-[#30363d]/40">
                  <span className="text-[9px] text-[#8b949e] uppercase">Swaps</span>
                  <p className="font-bold text-[#bc8cff]">{metrics.swaps}</p>
                </div>
                <div className="bg-[#0d1117] p-1.5 rounded border border-[#30363d]/40">
                  <span className="text-[9px] text-[#8b949e] uppercase">Recursive</span>
                  <p className="font-bold text-[#f0883e]">{metrics.recursiveCalls}</p>
                </div>
              </div>
              <p className="text-[10px] text-[#8b949e] italic mt-1 border-t border-[#30363d]/30 pt-1">
                Directly measured step-by-step from actual Java JVM execution events.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RECURSION TREE VIEW */}
      {subView === 'tree' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
            <span className="font-semibold text-xs text-[#bc8cff] flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5" /> Live Recursion Tree
            </span>
            <span className="text-[11px] font-mono text-[#8b949e]">
              Total Calls: {treeNodes.length} • Max Depth: {Math.max(...treeNodes.map((n) => n.depth), 0)}
            </span>
          </div>

          <div className="overflow-x-auto py-2">
            <div className="flex flex-col gap-2 min-w-max">
              {treeNodes.map((node) => {
                const isCurrent = algoState.activeCallId === node.id;
                let statusColor = 'border-[#30363d] text-[#8b949e] bg-[#0d1117]';
                if (node.status === 'CALLING') statusColor = 'border-[#58a6ff] text-[#58a6ff] bg-[#58a6ff]/10 ring-2 ring-[#58a6ff]';
                else if (node.status === 'BASE_CASE') statusColor = 'border-[#3fb950] text-[#3fb950] bg-[#3fb950]/15';
                else if (node.status === 'RETURNED') statusColor = 'border-[#bc8cff] text-[#bc8cff] bg-[#bc8cff]/10';
                else if (node.status === 'BACKTRACKED') statusColor = 'border-[#d29922] text-[#d29922] bg-[#d29922]/10';

                return (
                  <div
                    key={node.id}
                    style={{ marginLeft: `${(node.depth - 1) * 24}px` }}
                    className={`flex items-center gap-2 p-2 rounded-lg border font-mono text-xs transition-all ${statusColor}`}
                  >
                    <span className="text-[#8b949e] text-[10px] w-8">d={node.depth}</span>
                    <strong className="text-[#f0f6fc]">{node.fnName}</strong>
                    <span>({JSON.stringify(node.args)})</span>
                    {node.returnValue !== undefined && (
                      <span className="ml-auto text-[#3fb950] font-bold">
                        ➔ {String(node.returnValue)}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ml-2 bg-black/40">
                      {node.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC PROGRAMMING TABLE */}
      {subView === 'dp' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
            <span className="font-semibold text-xs text-[#39c5cf] flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5" /> Dynamic Programming State Table
            </span>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[#3fb950]">Hits: {metrics.cacheHits}</span>
              <span className="text-[#f85149]">Misses: {metrics.cacheMisses}</span>
            </div>
          </div>

          {algoState.dpTransitionFormula && (
            <div className="bg-[#0d1117] p-2 rounded-lg border border-[#39c5cf]/30 font-mono text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#39c5cf]" />
              <span className="text-[#8b949e]">Active Transition:</span>
              <span className="text-[#39c5cf] font-bold">{algoState.dpTransitionFormula}</span>
            </div>
          )}

          {/* 1D DP Table */}
          {algoState.dpTable1D && (
            <div className="overflow-x-auto py-2">
              <div className="flex items-center gap-2 min-w-max">
                {algoState.dpTable1D.map((val, idx) => {
                  const isCurrent = algoState.dpCurrentCell && algoState.dpCurrentCell[0] === idx;
                  const isPrev = algoState.dpPreviousCells?.some((c) => c[0] === idx);

                  let cellClass = 'border-[#30363d] bg-[#0d1117] text-[#f0f6fc]';
                  if (isCurrent) cellClass = 'border-[#39c5cf] bg-[#39c5cf]/20 text-[#39c5cf] ring-2 ring-[#39c5cf] animate-pulse';
                  else if (isPrev) cellClass = 'border-[#d29922] bg-[#d29922]/20 text-[#d29922]';

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold border text-sm shadow ${cellClass}`}>
                        {val}
                      </div>
                      <span className="text-[10px] font-mono text-[#8b949e]">[{idx}]</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2D DP Table */}
          {algoState.dpTable2D && (
            <div className="overflow-x-auto py-2">
              <div className="flex flex-col gap-1.5 min-w-max">
                {algoState.dpTable2D.map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-1.5">
                    <span className="w-6 text-right font-mono text-[10px] text-[#8b949e]">{rIdx}</span>
                    {row.map((val, cIdx) => {
                      const isCurrent = algoState.dpCurrentCell && algoState.dpCurrentCell[0] === rIdx && algoState.dpCurrentCell[1] === cIdx;
                      const isPrev = algoState.dpPreviousCells?.some((c) => c[0] === rIdx && c[1] === cIdx);

                      let cellClass = 'border-[#30363d] bg-[#0d1117] text-[#f0f6fc]';
                      if (isCurrent) cellClass = 'border-[#39c5cf] bg-[#39c5cf]/20 text-[#39c5cf] ring-2 ring-[#39c5cf]';
                      else if (isPrev) cellClass = 'border-[#d29922] bg-[#d29922]/20 text-[#d29922]';

                      return (
                        <div
                          key={cIdx}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xs font-bold border shadow ${cellClass}`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPLEXITY COMPARISON MATRIX */}
      {subView === 'matrix' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
            <span className="font-semibold text-xs text-[#d29922] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Sorting & Algorithm Complexity Reference
            </span>
            <span className="text-[10px] text-[#8b949e]">Section 64 Educational Reference</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e]">
                  <th className="py-1.5 px-2">Algorithm</th>
                  <th className="py-1.5 px-2">Best Time</th>
                  <th className="py-1.5 px-2">Average Time</th>
                  <th className="py-1.5 px-2">Worst Time</th>
                  <th className="py-1.5 px-2">Space</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/40">
                <tr className="hover:bg-[#0d1117]">
                  <td className="py-1.5 px-2 font-bold text-[#f0f6fc]">Bubble Sort</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n)</td>
                  <td className="py-1.5 px-2 text-[#d29922]">O(n²)</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(n²)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(1)</td>
                </tr>
                <tr className="hover:bg-[#0d1117]">
                  <td className="py-1.5 px-2 font-bold text-[#f0f6fc]">Selection Sort</td>
                  <td className="py-1.5 px-2 text-[#d29922]">O(n²)</td>
                  <td className="py-1.5 px-2 text-[#d29922]">O(n²)</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(n²)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(1)</td>
                </tr>
                <tr className="hover:bg-[#0d1117]">
                  <td className="py-1.5 px-2 font-bold text-[#f0f6fc]">Insertion Sort</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n)</td>
                  <td className="py-1.5 px-2 text-[#d29922]">O(n²)</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(n²)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(1)</td>
                </tr>
                <tr className="hover:bg-[#0d1117]">
                  <td className="py-1.5 px-2 font-bold text-[#f0f6fc]">Merge Sort</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n log n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n log n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n log n)</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(n)</td>
                </tr>
                <tr className="hover:bg-[#0d1117]">
                  <td className="py-1.5 px-2 font-bold text-[#f0f6fc]">Quick Sort</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n log n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n log n)</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(n²)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(log n)</td>
                </tr>
                <tr className="hover:bg-[#0d1117]">
                  <td className="py-1.5 px-2 font-bold text-[#f0f6fc]">Heap Sort</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n log n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n log n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n log n)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(1)</td>
                </tr>
                <tr className="hover:bg-[#0d1117]">
                  <td className="py-1.5 px-2 font-bold text-[#f0f6fc]">Binary Search</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(1)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(log n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(log n)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
