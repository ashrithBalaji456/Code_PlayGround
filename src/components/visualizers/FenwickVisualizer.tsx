import React from 'react';
import { DataStructureState } from '../../types/execution';
import { Activity, Layers, ArrowRight } from 'lucide-react';

interface FenwickVisualizerProps {
  structure: DataStructureState;
}

export const FenwickVisualizer: React.FC<FenwickVisualizerProps> = ({ structure }) => {
  const fenwickData = structure.fenwickData;
  const tree = fenwickData?.treeArray || [];
  const activeIdx = fenwickData?.activeIndex;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#30363d]/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#39c5cf]/15 border border-[#39c5cf]/30 flex items-center justify-center text-[#39c5cf]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-[#39c5cf] text-base">{structure.name}</span>
            <span className="text-[11px] text-[#8b949e] block">Binary Indexed Tree (Fenwick) • 1-Indexed Tree Array</span>
          </div>
        </div>

        {fenwickData?.lastAction && (
          <span className="text-xs font-mono font-medium text-[#39c5cf] bg-[#39c5cf]/10 border border-[#39c5cf]/20 px-2.5 py-1 rounded-md">
            {fenwickData.lastAction}
          </span>
        )}
      </div>

      {/* BIT Array Cells */}
      <div className="flex flex-col gap-2 bg-[#0d1117]/80 p-3.5 rounded-lg border border-[#30363d]">
        <div className="flex items-center justify-between text-xs text-[#8b949e]">
          <span>Tree Array Nodes [1..N]</span>
          <span className="font-mono text-[11px] text-[#58a6ff]">i += i &amp; (-i) for update • i -= i &amp; (-i) for query</span>
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 pt-1">
          {tree.map((val, idx) => {
            if (idx === 0) return null; // 1-based indexing for BIT
            const isActive = activeIdx === idx;
            const lsb = idx & -idx;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center min-w-[4rem] p-2.5 rounded-lg border font-mono transition-all ${
                  isActive
                    ? 'bg-[#39c5cf]/20 border-[#39c5cf] text-[#39c5cf] font-bold ring-1 ring-[#39c5cf]'
                    : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                }`}
              >
                <span className="text-[10px] text-[#8b949e] font-bold">idx: {idx}</span>
                <span className="text-base font-bold my-0.5">{val}</span>
                <span className="text-[8px] text-[#8b949e]">lsb: {lsb} (0b{(idx >>> 0).toString(2)})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
