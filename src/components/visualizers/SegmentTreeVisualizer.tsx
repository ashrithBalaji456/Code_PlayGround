import React from 'react';
import { DataStructureState } from '../../types/execution';
import { GitBranch, Layers, ArrowRight } from 'lucide-react';

interface SegmentTreeVisualizerProps {
  structure: DataStructureState;
}

export const SegmentTreeVisualizer: React.FC<SegmentTreeVisualizerProps> = ({ structure }) => {
  const segData = structure.segmentTreeData;
  const intervals = segData?.intervals || [];
  const activeRange = segData?.activeRange;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#30363d]/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#3fb950]/15 border border-[#3fb950]/30 flex items-center justify-center text-[#3fb950]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-[#3fb950] text-base">{structure.name}</span>
            <span className="text-[11px] text-[#8b949e] block">Segment Tree (Interval Representation & Point/Range Updates)</span>
          </div>
        </div>

        {segData?.lastAction && (
          <span className="text-xs font-mono font-medium text-[#3fb950] bg-[#238636]/20 border border-[#238636]/40 px-2.5 py-1 rounded-md">
            {segData.lastAction}
          </span>
        )}
      </div>

      {/* Active Range Callout if present */}
      {activeRange && (
        <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d] flex items-center justify-between text-xs font-mono">
          <span className="text-[#8b949e]">Active Interval:</span>
          <span className="text-[#3fb950] font-bold">[{activeRange[0]} .. {activeRange[1]}]</span>
        </div>
      )}

      {/* Interval Nodes Grid */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#3fb950]" /> Tree Intervals
        </span>
        <div className="flex flex-wrap gap-2">
          {intervals.map((node: any) => {
            return (
              <div
                key={node.id}
                className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col items-center justify-center min-w-[5rem] text-xs font-mono shadow-sm"
              >
                <span className="text-[10px] text-[#58a6ff] font-bold">[{node.left}, {node.right}]</span>
                <span className="text-sm font-bold text-[#f0f6fc] mt-1">{node.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
