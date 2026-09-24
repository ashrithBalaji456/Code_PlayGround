import React from 'react';
import { DataStructureState } from '../../types/execution';
import { Layers } from 'lucide-react';

interface StackVisualizerProps {
  structure: DataStructureState;
}

export const StackVisualizer: React.FC<StackVisualizerProps> = ({ structure }) => {
  const elements = structure.stackData || [];
  const topIndex = elements.length - 1;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3 min-w-[200px] flex-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#bc8cff]" />
          <span className="font-mono font-bold text-[#bc8cff] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            size: {elements.length}
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#bc8cff] bg-[#bc8cff]/10 px-2 py-0.5 rounded border border-[#bc8cff]/20">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Visual Stack Vessel */}
      <div className="flex flex-col items-center justify-end min-h-[220px] max-h-[280px] p-3 bg-[#0d1117]/80 rounded-lg border-x-2 border-b-4 border-[#30363d] relative overflow-y-auto">
        {elements.length === 0 ? (
          <div className="text-xs text-[#8b949e] font-mono flex flex-col items-center gap-1 my-auto">
            <span>[ Empty Stack ]</span>
            <span className="text-[10px] text-[#8b949e]/60">Push elements to fill</span>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-1.5 w-full max-w-[160px]">
            {elements.map((val, idx) => {
              const isTop = idx === topIndex;
              return (
                <div key={idx} className="relative flex items-center justify-center">
                  {/* Top pointer badge */}
                  {isTop && (
                    <div className="absolute -left-14 flex items-center gap-0.5 text-[10px] font-mono font-bold text-[#bc8cff] animate-pointer">
                      <span>TOP</span>
                      <span>➔</span>
                    </div>
                  )}

                  <div
                    className={`w-full py-2 px-3 rounded-md font-mono text-center font-bold text-sm border shadow transition-all duration-300 ${
                      isTop
                        ? 'bg-[#bc8cff]/20 border-[#bc8cff] text-[#bc8cff] ring-1 ring-[#bc8cff]'
                        : 'bg-[#21262d] border-[#30363d] text-[#f0f6fc]'
                    }`}
                  >
                    {val}
                  </div>

                  <span className="absolute -right-7 text-[10px] font-mono text-[#8b949e]">
                    [{idx}]
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom base label */}
      <div className="text-center text-[10px] font-mono text-[#8b949e] border-t border-[#30363d]/40 pt-1">
        LIFO (Last-In, First-Out)
      </div>
    </div>
  );
};
