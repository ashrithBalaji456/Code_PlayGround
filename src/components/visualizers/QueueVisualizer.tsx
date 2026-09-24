import React from 'react';
import { DataStructureState } from '../../types/execution';
import { ArrowRight, CornerDownRight } from 'lucide-react';

interface QueueVisualizerProps {
  structure: DataStructureState;
}

export const QueueVisualizer: React.FC<QueueVisualizerProps> = ({ structure }) => {
  const elements = structure.queueData || [];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <CornerDownRight className="w-4 h-4 text-[#39c5cf]" />
          <span className="font-mono font-bold text-[#39c5cf] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            size: {elements.length}
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#39c5cf] bg-[#39c5cf]/10 px-2 py-0.5 rounded border border-[#39c5cf]/20">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Queue Pipeline */}
      <div className="flex items-center justify-between gap-2 p-4 bg-[#0d1117] rounded-lg border-y-2 border-[#30363d] overflow-x-auto min-h-[110px]">
        {/* Dequeue indicator */}
        <div className="flex flex-col items-center gap-1 text-[11px] font-mono text-[#f85149] font-bold min-w-[70px]">
          <span className="bg-[#f85149]/10 border border-[#f85149]/30 px-2 py-0.5 rounded">
            FRONT
          </span>
          <div className="flex items-center gap-0.5 text-[#f85149]">
            <span>⇦ Dequeue</span>
          </div>
        </div>

        {/* Conveyor items */}
        <div className="flex items-center gap-2 flex-1 justify-center px-4">
          {elements.length === 0 ? (
            <div className="text-xs text-[#8b949e] font-mono">[ Empty Queue ]</div>
          ) : (
            elements.map((val, idx) => {
              const isFront = idx === 0;
              const isRear = idx === elements.length - 1;

              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-[#8b949e]">
                    {isFront ? 'front' : isRear ? 'rear' : `#${idx}`}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-sm border shadow transition-all duration-300 ${
                      isFront
                        ? 'bg-[#39c5cf]/20 border-[#39c5cf] text-[#39c5cf] ring-2 ring-[#39c5cf]'
                        : isRear
                        ? 'bg-[#3fb950]/20 border-[#3fb950] text-[#3fb950] ring-1 ring-[#3fb950]'
                        : 'bg-[#21262d] border-[#30363d] text-[#f0f6fc]'
                    }`}
                  >
                    {val}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Enqueue indicator */}
        <div className="flex flex-col items-center gap-1 text-[11px] font-mono text-[#3fb950] font-bold min-w-[70px]">
          <span className="bg-[#3fb950]/10 border border-[#3fb950]/30 px-2 py-0.5 rounded">
            REAR
          </span>
          <div className="flex items-center gap-0.5 text-[#3fb950]">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Enqueue</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] font-mono text-[#8b949e]">
        FIFO (First-In, First-Out Pipeline)
      </div>
    </div>
  );
};
