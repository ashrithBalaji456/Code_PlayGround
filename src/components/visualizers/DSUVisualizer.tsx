import React from 'react';
import { DataStructureState } from '../../types/execution';
import { GitMerge, ArrowRight, CheckCircle2, Share2, Layers } from 'lucide-react';

interface DSUVisualizerProps {
  structure: DataStructureState;
}

export const DSUVisualizer: React.FC<DSUVisualizerProps> = ({ structure }) => {
  const dsuData = structure.dsuData || { parents: {} };
  const parents = dsuData.parents || {};
  const ranks = dsuData.ranks || {};
  const nodeKeys = Object.keys(parents);

  // Group nodes by root representative
  const setsByRoot: Record<string, string[]> = {};
  const getRoot = (id: string, visited = new Set<string>()): string => {
    if (visited.has(id)) return id;
    visited.add(id);
    const p = parents[id];
    if (p === undefined || p === id) return id;
    return getRoot(p, visited);
  };

  nodeKeys.forEach((node) => {
    const root = getRoot(node);
    if (!setsByRoot[root]) setsByRoot[root] = [];
    setsByRoot[root].push(node);
  });

  const roots = Object.keys(setsByRoot);

  return (
    <div className="backdrop-blur-xl bg-[#161b22]/70 border border-white/10 rounded-xl p-4 shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#30363d]/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#bc8cff]/15 border border-[#bc8cff]/30 flex items-center justify-center text-[#bc8cff]">
            <GitMerge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#bc8cff] text-base">{structure.name}</span>
              <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
                {nodeKeys.length} Elements • {roots.length} Disjoint Sets
              </span>
            </div>
            <span className="text-[11px] text-[#8b949e]">Union-Find with Path Compression & Rank</span>
          </div>
        </div>
        {dsuData.lastAction && (
          <span className="text-xs font-mono font-medium text-[#3fb950] bg-[#238636]/20 border border-[#238636]/40 px-2.5 py-1 rounded-md">
            {dsuData.lastAction}
          </span>
        )}
      </div>

      {/* Parent & Rank Array Table */}
      <div className="flex flex-col gap-1.5 bg-[#0d1117]/80 p-3 rounded-lg border border-[#30363d]">
        <div className="flex items-center justify-between text-xs text-[#8b949e] font-semibold mb-1">
          <span className="flex items-center gap-1.5 text-[#58a6ff]">
            <Layers className="w-3.5 h-3.5" /> Parent & Rank Array Representation
          </span>
          <span className="text-[10px] text-[#8b949e]">parent[i] == i denotes set root</span>
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {nodeKeys.map((node) => {
            const parent = parents[node];
            const rank = ranks[node] ?? 0;
            const isRoot = parent === node;
            const isActive1 = dsuData.activeSet1 === node;
            const isActive2 = dsuData.activeSet2 === node;
            const isCompressed = dsuData.pathCompressed?.includes(node);

            return (
              <div
                key={node}
                className={`flex flex-col items-center justify-center min-w-[3.5rem] p-2 rounded-lg border transition-all ${
                  isActive1 || isActive2
                    ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff] ring-1 ring-[#58a6ff]'
                    : isCompressed
                    ? 'bg-[#d29922]/20 border-[#d29922] text-[#d29922]'
                    : isRoot
                    ? 'bg-[#3fb950]/15 border-[#3fb950]/50 text-[#3fb950]'
                    : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                }`}
              >
                <span className="text-[10px] font-mono text-[#8b949e] uppercase font-bold">i: {node}</span>
                <span className="font-mono text-sm font-bold mt-0.5">p: {parent}</span>
                <span className="text-[9px] font-mono text-[#8b949e] mt-0.5">rk: {rank}</span>
                {isRoot && (
                  <span className="text-[8px] bg-[#3fb950]/20 text-[#3fb950] px-1 rounded font-bold uppercase mt-1">
                    ROOT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Disjoint Trees Visual Representation */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-[#bc8cff]" /> Partitioned Disjoint Trees
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {roots.map((root) => {
            const members = setsByRoot[root] || [];
            return (
              <div
                key={root}
                className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col gap-2 shadow-sm"
              >
                {/* Root Badge */}
                <div className="flex items-center justify-between border-b border-[#30363d]/50 pb-1.5">
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
                    <span className="font-bold text-[#3fb950]">Set Root: {root}</span>
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono">
                    size: {members.length}
                  </span>
                </div>

                {/* Tree Structure */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {members.map((m) => {
                    const isR = m === root;
                    const p = parents[m];
                    return (
                      <div
                        key={m}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-medium border ${
                          isR
                            ? 'bg-[#3fb950]/20 border-[#3fb950] text-[#3fb950] font-bold'
                            : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                        }`}
                      >
                        <span>{m}</span>
                        {!isR && (
                          <span className="text-[10px] text-[#8b949e] flex items-center">
                            ➔ {p}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
