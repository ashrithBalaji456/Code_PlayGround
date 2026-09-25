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
  Network,
  ArrowRight,
  Share2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  GitMerge,
  RefreshCw,
  Sliders,
  Hash,
  Database,
} from 'lucide-react';

interface AlgorithmsPanelProps {
  currentStep: ExecutionStep | null;
}

export const AlgorithmsPanel: React.FC<AlgorithmsPanelProps> = ({ currentStep }) => {
  const [subView, setSubView] = useState<'current' | 'matrix' | 'tree' | 'dp' | 'relationships'>('current');

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
          <button
            onClick={() => setSubView('relationships')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              subView === 'relationships' ? 'bg-[#bc8cff] text-black font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Structure Map
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

          {/* BELLMAN-FORD DETAILS */}
          {(algoState.bellmanDistances !== undefined || algoState.algorithmName?.toLowerCase().includes('bellman')) && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#58a6ff] flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5" /> Bellman-Ford Shortest Paths
                </span>
                <span className="text-[11px] font-mono text-[#8b949e]">
                  Pass: <strong className="text-[#f0883e]">{algoState.bellmanPass ?? 1}</strong> / {algoState.bellmanTotalPasses ?? 'V-1'}
                </span>
              </div>

              {/* Negative Cycle Warning Banner */}
              {algoState.negativeCycleDetected && (
                <div className="bg-[#f85149]/15 border-2 border-[#f85149] rounded-lg p-2.5 flex items-center gap-2 text-[#f85149] font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-bounce" />
                  <span>NEGATIVE CYCLE DETECTED! Distances can decrease indefinitely.</span>
                </div>
              )}

              {/* Edge Relaxation Card */}
              {algoState.bellmanCurrentEdge && (
                <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#8b949e]">Active Edge Relaxation:</span>
                    <span className="text-[#58a6ff] font-bold">
                      {algoState.bellmanCurrentEdge.from} ──({algoState.bellmanCurrentEdge.weight})──&gt; {algoState.bellmanCurrentEdge.to}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#c9d1d9] bg-[#161b22] p-1.5 rounded border border-[#30363d]/40">
                    dist[{algoState.bellmanCurrentEdge.from}] + ({algoState.bellmanCurrentEdge.weight}) &lt; dist[{algoState.bellmanCurrentEdge.to}]
                  </div>
                </div>
              )}

              {/* Distance Table */}
              {algoState.bellmanDistances && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">Vertex Distances Table</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.entries(algoState.bellmanDistances).map(([node, dist]) => {
                      const isUpdated = algoState.bellmanCurrentEdge?.to === node;
                      return (
                        <div
                          key={node}
                          className={`p-2 rounded-lg border text-center font-mono ${
                            isUpdated
                              ? 'bg-[#3fb950]/15 border-[#3fb950] text-[#3fb950] ring-1 ring-[#3fb950]'
                              : 'bg-[#0d1117] border-[#30363d]/60 text-[#f0f6fc]'
                          }`}
                        >
                          <div className="text-[10px] text-[#8b949e] font-bold">{node}</div>
                          <div className="text-sm font-bold mt-0.5">{dist === Infinity || dist === 'Infinity' ? '∞' : dist}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FLOYD-WARSHALL 2D MATRIX & COMPARISON */}
          {(algoState.floydMatrix !== undefined || algoState.algorithmName?.toLowerCase().includes('floyd')) && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#d29922] flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5" /> Floyd-Warshall All-Pairs Distance Matrix
                </span>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="bg-[#bc8cff]/20 text-[#bc8cff] px-2 py-0.5 rounded font-bold border border-[#bc8cff]/40">
                    k = {String(algoState.floydK ?? '-')}
                  </span>
                  <span className="text-[#8b949e]">
                    i: <strong className="text-[#58a6ff]">{String(algoState.floydI ?? '-')}</strong>, j: <strong className="text-[#3fb950]">{String(algoState.floydJ ?? '-')}</strong>
                  </span>
                </div>
              </div>

              {/* Active Comparison & Transition Formula */}
              {algoState.floydOldDistance !== undefined && algoState.floydCandidateDistance !== undefined && (
                <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#d29922]/40 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d29922]" />
                    <span className="text-[#8b949e]">dist[{algoState.floydI}][{algoState.floydK}] + dist[{algoState.floydK}][{algoState.floydJ}]:</span>
                    <span className="font-bold text-[#f0883e]">{algoState.floydCandidateDistance}</span>
                    <span className="text-[#8b949e]">vs current:</span>
                    <span className="font-bold text-[#c9d1d9]">{algoState.floydOldDistance}</span>
                  </div>
                  {Number(algoState.floydCandidateDistance) < Number(algoState.floydOldDistance) ? (
                    <span className="bg-[#3fb950]/20 text-[#3fb950] px-2 py-0.5 rounded font-bold text-[10px]">
                      UPDATE CELL
                    </span>
                  ) : (
                    <span className="bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-bold text-[10px]">
                      KEEP CURRENT
                    </span>
                  )}
                </div>
              )}

              {/* 2D Interactive Matrix Grid */}
              {algoState.floydMatrix && (
                <div className="overflow-x-auto py-1">
                  <table className="w-full text-center font-mono text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-1 text-[10px] text-[#8b949e] border border-[#30363d]/50 bg-[#0d1117]">i \ j</th>
                        {(algoState.floydLabels || algoState.floydMatrix.map((_, idx) => String.fromCharCode(65 + idx))).map((lbl, cIdx) => {
                          const isColJ = String(algoState.floydJ) === lbl || Number(algoState.floydJ) === cIdx;
                          const isK = String(algoState.floydK) === lbl || Number(algoState.floydK) === cIdx;
                          return (
                            <th
                              key={cIdx}
                              className={`p-1.5 border border-[#30363d]/60 font-bold ${
                                isK ? 'bg-[#bc8cff]/20 text-[#bc8cff]' : isColJ ? 'bg-[#3fb950]/20 text-[#3fb950]' : 'bg-[#0d1117] text-[#8b949e]'
                              }`}
                            >
                              {lbl}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {algoState.floydMatrix.map((row, rIdx) => {
                        const rowLabel = algoState.floydLabels ? algoState.floydLabels[rIdx] : String.fromCharCode(65 + rIdx);
                        const isRowI = String(algoState.floydI) === rowLabel || Number(algoState.floydI) === rIdx;
                        const isRowK = String(algoState.floydK) === rowLabel || Number(algoState.floydK) === rIdx;
                        return (
                          <tr key={rIdx}>
                            <td
                              className={`p-1.5 font-bold border border-[#30363d]/60 ${
                                isRowK ? 'bg-[#bc8cff]/20 text-[#bc8cff]' : isRowI ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e]'
                              }`}
                            >
                              {rowLabel}
                            </td>
                            {row.map((val, cIdx) => {
                              const colLabel = algoState.floydLabels ? algoState.floydLabels[cIdx] : String.fromCharCode(65 + cIdx);
                              const isCurrentCell =
                                (String(algoState.floydI) === rowLabel || Number(algoState.floydI) === rIdx) &&
                                (String(algoState.floydJ) === colLabel || Number(algoState.floydJ) === cIdx);
                              return (
                                <td
                                  key={cIdx}
                                  className={`p-2 border border-[#30363d]/40 font-bold transition-all ${
                                    isCurrentCell
                                      ? 'bg-[#d29922]/25 text-[#d29922] ring-2 ring-[#d29922]'
                                      : isRowI
                                      ? 'bg-[#58a6ff]/10 text-[#f0f6fc]'
                                      : 'bg-[#0d1117]/60 text-[#c9d1d9]'
                                  }`}
                                >
                                  {val === Infinity || val === 'Infinity' ? '∞' : val}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MINIMUM SPANNING TREE (Prim & Kruskal) */}
          {(algoState.mstEdges !== undefined || algoState.kruskalSortedEdges !== undefined || algoState.algorithmName?.toLowerCase().includes('prim') || algoState.algorithmName?.toLowerCase().includes('kruskal')) && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#3fb950] flex items-center gap-1.5">
                  <GitMerge className="w-3.5 h-3.5" /> Minimum Spanning Tree (MST)
                </span>
                <span className="text-xs font-mono font-bold text-[#3fb950] bg-[#3fb950]/15 border border-[#3fb950]/30 px-2 py-0.5 rounded">
                  Total Weight: {algoState.mstTotalWeight ?? 0}
                </span>
              </div>

              {/* Prim Specific Info */}
              {algoState.primCurrentNode && (
                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8b949e]">Current Tree Node (Prim):</span>
                  <span className="text-[#58a6ff] font-bold">{algoState.primCurrentNode}</span>
                </div>
              )}

              {/* Kruskal Sorted Edges Queue */}
              {algoState.kruskalSortedEdges && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Sorted Edges (Kruskal)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {algoState.kruskalSortedEdges.map((e, idx) => {
                      let badgeColor = 'bg-[#0d1117] border-[#30363d] text-[#8b949e]';
                      if (e.status === 'ACCEPTED') badgeColor = 'bg-[#3fb950]/15 border-[#3fb950] text-[#3fb950]';
                      else if (e.status === 'REJECTED') badgeColor = 'bg-[#f85149]/15 border-[#f85149] text-[#f85149] line-through';
                      return (
                        <span key={idx} className={`px-2 py-1 rounded text-xs font-mono font-bold border ${badgeColor}`}>
                          {e.from}-{e.to} ({e.weight})
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Disjoint Set (DSU) Parent Mapping */}
              {algoState.disjointSetParents && (
                <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Disjoint Set Union (DSU) Forest</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                    {Object.entries(algoState.disjointSetParents).map(([node, parent]) => (
                      <div key={node} className="bg-[#161b22] p-1.5 rounded border border-[#30363d]/40">
                        <div className="text-[9px] text-[#8b949e]">{node}</div>
                        <div className="font-bold text-[#58a6ff] text-xs">➔ {parent}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MST Edges Accumulator */}
              {algoState.mstEdges && algoState.mstEdges.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Spanning Tree Edges ({algoState.mstEdges.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {algoState.mstEdges.map((e, idx) => (
                      <span key={idx} className="bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/40 px-2 py-0.5 rounded font-mono font-bold text-xs">
                        {e.from} ──({e.weight})── {e.to}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOPOLOGICAL SORT */}
          {(algoState.indegrees !== undefined || algoState.topologicalQueue !== undefined || algoState.topologicalOrder !== undefined) && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#58a6ff] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" /> Topological Sort (Kahn / DFS)
                </span>
                {algoState.topologicalCycle ? (
                  <span className="text-[10px] bg-[#f85149]/20 text-[#f85149] px-2 py-0.5 rounded font-bold border border-[#f85149]/40">
                    Cycle Detected!
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#238636]/20 text-[#3fb950] px-2 py-0.5 rounded font-bold border border-[#238636]/40">
                    DAG Verified
                  </span>
                )}
              </div>

              {/* In-Degree Table */}
              {algoState.indegrees && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Vertex In-Degrees</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center font-mono">
                    {Object.entries(algoState.indegrees).map(([node, deg]) => (
                      <div
                        key={node}
                        className={`p-1.5 rounded border text-xs ${
                          deg === 0 ? 'bg-[#3fb950]/15 border-[#3fb950] text-[#3fb950]' : 'bg-[#0d1117] border-[#30363d]/60 text-[#f0f6fc]'
                        }`}
                      >
                        <div className="text-[10px] text-[#8b949e] font-bold">{node}</div>
                        <div className="font-bold text-sm">{deg}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Queue & Output Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/60 flex flex-col gap-1">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Zero In-Degree Queue</span>
                  <div className="flex items-center gap-1 min-h-[24px]">
                    {(algoState.topologicalQueue || []).length === 0 ? (
                      <span className="text-[#8b949e] italic">[Empty]</span>
                    ) : (
                      algoState.topologicalQueue!.map((node, idx) => (
                        <span key={idx} className="bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 px-2 py-0.5 rounded font-bold">
                          {node}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/60 flex flex-col gap-1">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Topological Output Order</span>
                  <div className="flex items-center gap-1 min-h-[24px]">
                    {(algoState.topologicalOrder || []).length === 0 ? (
                      <span className="text-[#8b949e] italic">[None Yet]</span>
                    ) : (
                      algoState.topologicalOrder!.map((node, idx) => (
                        <React.Fragment key={idx}>
                          <span className="bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/40 px-2 py-0.5 rounded font-bold">
                            {node}
                          </span>
                          {idx < algoState.topologicalOrder!.length - 1 && <span className="text-[#8b949e]">➔</span>}
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STRONGLY CONNECTED COMPONENTS (Kosaraju / Tarjan) */}
          {(algoState.sccComponents !== undefined || algoState.tarjanLowLink !== undefined || algoState.kosarajuFinishStack !== undefined) && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#bc8cff] flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Strongly Connected Components (SCC)
                </span>
                <span className="text-xs font-mono font-bold text-[#bc8cff] bg-[#bc8cff]/15 border border-[#bc8cff]/30 px-2 py-0.5 rounded">
                  {(algoState.sccComponents || []).length} Components Discovered
                </span>
              </div>

              {/* Kosaraju Specific Finish Stack & Transpose State */}
              {algoState.kosarajuFinishStack && (
                <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] uppercase font-bold">
                    <span>Kosaraju DFS Finish Stack</span>
                    <span className={algoState.isTransposePhase ? 'text-[#3fb950]' : 'text-[#8b949e]'}>
                      {algoState.isTransposePhase ? 'Phase 2: Transpose Graph Gᵀ' : 'Phase 1: Original Graph'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    {algoState.kosarajuFinishStack.map((n, idx) => (
                      <span key={idx} className="bg-[#bc8cff]/20 text-[#bc8cff] border border-[#bc8cff]/40 px-2 py-0.5 rounded font-bold">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarjan Discovery & Low-Link State */}
              {algoState.tarjanLowLink && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Tarjan Discovery (dfn) & Low-Link Indices</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
                    {Object.entries(algoState.tarjanLowLink).map(([node, low]) => {
                      const dfn = algoState.tarjanDiscoveryIndex ? algoState.tarjanDiscoveryIndex[node] : '-';
                      return (
                        <div key={node} className="bg-[#0d1117] p-1.5 rounded border border-[#30363d]/60 text-xs">
                          <div className="text-[10px] text-[#8b949e] font-bold">{node}</div>
                          <div className="font-bold text-[#f0883e] mt-0.5">dfn:{dfn}</div>
                          <div className="text-[10px] text-[#58a6ff]">low:{low}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Discovered SCC Component Groups */}
              {algoState.sccComponents && algoState.sccComponents.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Component Groups</span>
                  <div className="flex flex-wrap gap-2">
                    {algoState.sccComponents.map((comp, idx) => (
                      <div key={idx} className="bg-[#0d1117] border border-[#bc8cff]/50 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#bc8cff]">SCC #{idx + 1}:</span>
                        <span className="font-mono text-xs font-bold text-[#f0f6fc]">
                          {`{ ${comp.join(', ')} }`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AVL TREE BALANCING & ROTATIONS */}
          {(algoState.lastRotationType !== undefined || algoState.avlRotationsCount !== undefined || algoState.nodeHeights !== undefined || algoState.category === 'Advanced Tree') && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#58a6ff] flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> AVL Self-Balancing Tree
                </span>
                <span className="text-xs font-mono font-bold text-[#58a6ff] bg-[#58a6ff]/15 border border-[#58a6ff]/30 px-2 py-0.5 rounded">
                  Rotations: {algoState.avlRotationsCount ?? 0}
                </span>
              </div>

              {/* Rotation Alert Banner if active */}
              {algoState.lastRotationType && (
                <div className="bg-[#58a6ff]/15 border border-[#58a6ff] rounded-lg p-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#58a6ff]" />
                    <span className="font-bold text-[#f0f6fc]">Rotation Applied:</span>
                    <span className="text-[#58a6ff] font-bold">
                      {algoState.lastRotationType === 'LL' ? 'Right Rotation (LL Case)' :
                       algoState.lastRotationType === 'RR' ? 'Left Rotation (RR Case)' :
                       algoState.lastRotationType === 'LR' ? 'Left-Right Rotation (LR Case)' :
                       'Right-Left Rotation (RL Case)'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#58a6ff] text-black font-bold px-1.5 py-0.5 rounded">
                    O(1) Pointers
                  </span>
                </div>
              )}

              {/* Balance Factors and Heights Table */}
              {algoState.nodeHeights && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold">Node Heights & Balance Factors</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
                    {Object.entries(algoState.nodeHeights).map(([node, h]) => {
                      const bf = algoState.balanceFactors ? algoState.balanceFactors[node] : 0;
                      const isUnbalanced = Math.abs(bf) > 1;
                      return (
                        <div
                          key={node}
                          className={`p-1.5 rounded border text-xs ${
                            isUnbalanced ? 'bg-[#f85149]/15 border-[#f85149] text-[#f85149]' : 'bg-[#0d1117] border-[#30363d]/60 text-[#f0f6fc]'
                          }`}
                        >
                          <div className="text-[10px] text-[#8b949e] font-bold">{node}</div>
                          <div className="text-xs font-semibold text-[#8b949e]">h = {h}</div>
                          <div className={`text-xs font-bold ${isUnbalanced ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>
                            BF = {bf > 0 ? `+${bf}` : bf}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BINARY SEARCH ON ANSWER */}
          {algoState.category === 'Advanced Search / Optimization' && algoState.answerFeasibility !== undefined && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#39c5cf] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Binary Search on Answer
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  algoState.answerFeasibility ? 'bg-[#3fb950]/15 border-[#3fb950] text-[#3fb950]' : 'bg-[#f85149]/15 border-[#f85149] text-[#f85149]'
                }`}>
                  Feasibility: {algoState.answerFeasibility ? 'FEASIBLE (TRUE)' : 'INFEASIBLE (FALSE)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/60">
                  <span className="text-[10px] text-[#8b949e] uppercase">Low</span>
                  <p className="text-sm font-bold text-[#58a6ff]">{algoState.searchLow ?? '-'}</p>
                </div>
                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/60">
                  <span className="text-[10px] text-[#8b949e] uppercase">Mid (Candidate)</span>
                  <p className="text-sm font-bold text-[#d29922]">{algoState.searchMid ?? '-'}</p>
                </div>
                <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/60">
                  <span className="text-[10px] text-[#8b949e] uppercase">High</span>
                  <p className="text-sm font-bold text-[#bc8cff]">{algoState.searchHigh ?? '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* MONOTONIC STACK */}
          {algoState.monoStackType && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#bc8cff] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Monotonic Stack Pattern
                </span>
                <span className="text-xs font-mono font-bold text-[#bc8cff] bg-[#bc8cff]/15 border border-[#bc8cff]/30 px-2 py-0.5 rounded">
                  Monotonic {algoState.monoStackType}
                </span>
              </div>
              <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold">Stack State:</span>
                {(algoState.monoStackElements || []).length === 0 ? (
                  <span className="text-xs text-[#8b949e] italic font-mono">[Empty]</span>
                ) : (
                  algoState.monoStackElements!.map((el, idx) => (
                    <span key={idx} className="bg-[#bc8cff]/20 text-[#bc8cff] border border-[#bc8cff]/40 px-2 py-0.5 rounded font-mono font-bold text-xs">
                      {String(el)}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {/* COORDINATE COMPRESSION */}
          {algoState.coordMapping && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <span className="font-semibold text-xs text-[#39c5cf] flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Coordinate Compression Mapping
                </span>
                <span className="text-[10px] text-[#8b949e] font-mono">
                  {Object.keys(algoState.coordMapping).length} Unique Coordinates
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                {Object.entries(algoState.coordMapping).map(([orig, comp]) => (
                  <div key={orig} className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/60 flex items-center justify-between">
                    <span className="text-[#8b949e]">{orig}</span>
                    <span className="text-[#39c5cf] font-bold">➔ [{comp}]</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALGORITHM ARCHITECTURE & CROSS-STRUCTURE INTEGRATION */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5">
              <span className="font-semibold text-xs text-[#bc8cff] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Data Structure & Algorithm Architecture
              </span>
              <span className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded font-mono">
                Cross-Structure Integration
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50">
                <div className="text-[10px] text-[#8b949e] uppercase font-bold">Algorithm</div>
                <div className="font-bold text-[#f0f6fc] mt-0.5">{algoState.algorithmName || 'Standard Program'}</div>
              </div>
              <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]/50 col-span-2">
                <div className="text-[10px] text-[#8b949e] uppercase font-bold">Underlying Data Structures</div>
                <div className="font-bold text-[#58a6ff] mt-0.5">
                  {algoState.algorithmName?.toLowerCase().includes('prim')
                    ? 'Graph + PriorityQueue (Min-Heap) + Visited Set'
                    : algoState.algorithmName?.toLowerCase().includes('kruskal')
                    ? 'Graph + Sorted Edge Array + Disjoint Set (DSU)'
                    : algoState.algorithmName?.toLowerCase().includes('bellman')
                    ? 'Graph + Distance Table + Edge Relaxation Passes'
                    : algoState.algorithmName?.toLowerCase().includes('floyd')
                    ? 'Graph + 2D Distance Matrix (Dynamic Programming)'
                    : algoState.algorithmName?.toLowerCase().includes('topological') || algoState.algorithmName?.toLowerCase().includes('kahn')
                    ? 'Graph + In-Degree Array + Queue (BFS)'
                    : algoState.algorithmName?.toLowerCase().includes('kosaraju')
                    ? 'Graph + Finish Stack + Transpose Graph Gᵀ'
                    : algoState.algorithmName?.toLowerCase().includes('tarjan')
                    ? 'Graph + Recursion Tree + Low-Link Array + Stack'
                    : algoState.algorithmName?.toLowerCase().includes('avl')
                    ? 'Binary Search Tree + Height Balancing + Rotations'
                    : algoState.algorithmName?.toLowerCase().includes('monotonic')
                    ? 'Array + Stack'
                    : 'Array / Call Stack / Heap'}
                </div>
              </div>
            </div>
          </div>

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
                <tr className="hover:bg-[#0d1117] bg-[#58a6ff]/5">
                  <td className="py-1.5 px-2 font-bold text-[#58a6ff]">Bellman-Ford</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(E)</td>
                  <td className="py-1.5 px-2 text-[#d29922]">O(V · E)</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(V · E)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(V)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#58a6ff]/5">
                  <td className="py-1.5 px-2 font-bold text-[#58a6ff]">Floyd-Warshall</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(V³)</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(V³)</td>
                  <td className="py-1.5 px-2 text-[#f85149]">O(V³)</td>
                  <td className="py-1.5 px-2 text-[#d29922]">O(V²)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#3fb950]/5">
                  <td className="py-1.5 px-2 font-bold text-[#3fb950]">Prim's MST</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(E log V)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(E log V)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(E log V)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(V)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#3fb950]/5">
                  <td className="py-1.5 px-2 font-bold text-[#3fb950]">Kruskal's MST</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(E log E)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(E log E)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(E log E)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(V)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#58a6ff]/5">
                  <td className="py-1.5 px-2 font-bold text-[#58a6ff]">Topological Sort</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(V)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#bc8cff]/5">
                  <td className="py-1.5 px-2 font-bold text-[#bc8cff]">Kosaraju SCC</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(V + E)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#bc8cff]/5">
                  <td className="py-1.5 px-2 font-bold text-[#bc8cff]">Tarjan SCC</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(V + E)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(V)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#39c5cf]/5">
                  <td className="py-1.5 px-2 font-bold text-[#39c5cf]">AVL Tree (Ops)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(1)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(log n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(log n)</td>
                  <td className="py-1.5 px-2 text-[#d29922]">O(n)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#bc8cff]/5">
                  <td className="py-1.5 px-2 font-bold text-[#bc8cff]">Monotonic Stack</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(n)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(n)</td>
                </tr>
                <tr className="hover:bg-[#0d1117] bg-[#39c5cf]/5">
                  <td className="py-1.5 px-2 font-bold text-[#39c5cf]">Binary Search on Ans</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(1)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(log(R) · check)</td>
                  <td className="py-1.5 px-2 text-[#3fb950]">O(log(R) · check)</td>
                  <td className="py-1.5 px-2 text-[#58a6ff]">O(1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STRUCTURE MAP & CROSS-STRUCTURE RELATIONSHIPS */}
      {subView === 'relationships' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
            <span className="font-semibold text-xs text-[#bc8cff] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Data Structure Architecture & Relationships
            </span>
            <span className="text-[10px] text-[#8b949e]">Section 46 Cross-Structure View</span>
          </div>

          <p className="text-[#8b949e] font-sans text-xs">
            Advanced algorithms do not invent redundant execution models. Instead, they orchestrate fundamental data structures:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#3fb950] text-sm">Prim's MST</span>
                <span className="text-[10px] bg-[#3fb950]/15 text-[#3fb950] px-1.5 py-0.5 rounded">Greedy / Heap</span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Grows a single minimum spanning tree from a source vertex by iteratively greedily expanding the cut.
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded">Graph</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#d29922] px-1.5 py-0.5 rounded">PriorityQueue (Min-Heap)</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#3fb950] px-1.5 py-0.5 rounded">Visited Set</span>
              </div>
            </div>

            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#3fb950] text-sm">Kruskal's MST</span>
                <span className="text-[10px] bg-[#3fb950]/15 text-[#3fb950] px-1.5 py-0.5 rounded">Greedy / DSU</span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Sorts all edges globally, then greedily unions connected components while rejecting cycle-causing edges.
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded">Graph Edges</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#bc8cff] px-1.5 py-0.5 rounded">QuickSort</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#38bdf8] px-1.5 py-0.5 rounded">Disjoint Set Union (DSU)</span>
              </div>
            </div>

            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#58a6ff] text-sm">Bellman-Ford</span>
                <span className="text-[10px] bg-[#58a6ff]/15 text-[#58a6ff] px-1.5 py-0.5 rounded">DP / Shortest Path</span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Repeats edge relaxation V-1 times to find single-source shortest paths with negative weights and detect negative cycles.
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded">Weighted Graph</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#d29922] px-1.5 py-0.5 rounded">Distance Array</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#f85149] px-1.5 py-0.5 rounded">Cycle Checker</span>
              </div>
            </div>

            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#d29922] text-sm">Floyd-Warshall</span>
                <span className="text-[10px] bg-[#d29922]/15 text-[#d29922] px-1.5 py-0.5 rounded">All-Pairs DP</span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Computes shortest distances between all pairs of vertices via intermediate vertices k in O(V³).
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded">Graph</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#39c5cf] px-1.5 py-0.5 rounded">2D Distance Matrix</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#bc8cff] px-1.5 py-0.5 rounded">Dynamic Programming</span>
              </div>
            </div>

            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#58a6ff] text-sm">Topological Sort</span>
                <span className="text-[10px] bg-[#58a6ff]/15 text-[#58a6ff] px-1.5 py-0.5 rounded">DAG Linearization</span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Orders vertices of a DAG linearly such that every directed edge u ➔ v has u before v.
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded">DAG Graph</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#f0883e] px-1.5 py-0.5 rounded">In-Degrees Map</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#3fb950] px-1.5 py-0.5 rounded">Queue (BFS)</span>
              </div>
            </div>

            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#bc8cff] text-sm">Tarjan & Kosaraju SCC</span>
                <span className="text-[10px] bg-[#bc8cff]/15 text-[#bc8cff] px-1.5 py-0.5 rounded">Graph Components</span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Partitions directed graphs into maximal strongly connected components where every node reaches every other node.
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded">Graph</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#d29922] px-1.5 py-0.5 rounded">DFS Call Stack</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#bc8cff] px-1.5 py-0.5 rounded">Stack / Low-Link Array</span>
              </div>
            </div>

            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#39c5cf] text-sm">AVL Tree</span>
                <span className="text-[10px] bg-[#39c5cf]/15 text-[#39c5cf] px-1.5 py-0.5 rounded">Self-Balancing BST</span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Maintains balance factor |h(L) - h(R)| ≤ 1 at every node via LL, RR, LR, and RL rotations.
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded">Binary Search Tree</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#39c5cf] px-1.5 py-0.5 rounded">Height Computation</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#d29922] px-1.5 py-0.5 rounded">O(1) Rotations</span>
              </div>
            </div>

            <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#bc8cff] text-sm">Monotonic Stack</span>
                <span className="text-[10px] bg-[#bc8cff]/15 text-[#bc8cff] px-1.5 py-0.5 rounded">Pattern</span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans">
                Maintains elements in strictly increasing or decreasing order to solve Next Greater / Smaller Element in O(n).
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded">Array</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#bc8cff] px-1.5 py-0.5 rounded">Stack</span>
                <span className="text-[#8b949e]">+</span>
                <span className="bg-[#21262d] text-[#3fb950] px-1.5 py-0.5 rounded">Result Array</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
