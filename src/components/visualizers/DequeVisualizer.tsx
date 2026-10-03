import React from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { ArrowLeftRight } from 'lucide-react';

interface DequeVisualizerProps {
  structure: DataStructureState;
  lastEvent?: ExecutionEvent;
}

export const DequeVisualizer: React.FC<DequeVisualizerProps> = ({
  structure,
}) => {
  const elements = structure.dequeData || structure.queueData || [];

  const swappingIndices = structure.swappingIndices;
  const idx1 = swappingIndices && swappingIndices.length === 2 ? Math.min(swappingIndices[0], swappingIndices[1]) : 0;
  const idx2 = swappingIndices && swappingIndices.length === 2 ? Math.max(swappingIndices[0], swappingIndices[1]) : 0;

  return (
    <div className="backdrop-blur-xl bg-[#161b22]/70 border border-white/10 rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-[#58a6ff]" />
          <span className="font-mono font-bold text-[#58a6ff] text-base">{structure.name}</span>
          <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
            {structure.dataType || 'Deque<Integer>'} (size: {elements.length})
          </span>
          <span className="text-[10px] font-mono text-[#58a6ff] bg-[#58a6ff]/10 border border-[#58a6ff]/30 px-1.5 py-0.5 rounded">
            Double-Ended Queue
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#58a6ff] bg-[#58a6ff]/10 px-2 py-0.5 rounded border border-[#58a6ff]/20">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Deque Pipeline with Double-Ended Controls */}
      <div className="flex items-center justify-between gap-3 p-4 py-8 bg-[#0d1117] rounded-lg border-y-2 border-[#30363d] overflow-x-auto min-h-[140px] relative">
        {/* FRONT Terminal */}
        <div className="flex flex-col items-center gap-1 text-[11px] font-mono font-bold min-w-[95px] p-2 bg-[#161b22] rounded-lg border border-[#30363d]">
          <span className="text-[#58a6ff] border-b border-[#58a6ff]/30 pb-0.5 w-full text-center">
            FRONT
          </span>
          <div className="flex flex-col items-center gap-0.5 text-[10px] text-[#8b949e] mt-1">
            <span className="text-[#3fb950] flex items-center gap-0.5">
              <span>➔ addFirst</span>
            </span>
            <span className="text-[#f85149] flex items-center gap-0.5">
              <span>⇦ removeFirst</span>
            </span>
          </div>
        </div>

        {/* Center items */}
        <div className="flex items-center gap-2 flex-1 justify-center px-4 relative">
          {elements.length === 0 ? (
            <div className="text-xs text-[#8b949e] font-mono">[ Empty Deque ]</div>
          ) : (
            elements.map((val, idx) => {
              const isFront = idx === 0;
              const isRear = idx === elements.length - 1;
              const isSwapping = !!swappingIndices && swappingIndices.includes(idx);
              const isLeftSwap = isSwapping && idx === idx1;
              const cellPitch = 56; // w-12 (48px) + gap-2 (8px) = 56px
              const swapDeltaX = (idx2 - idx1) * cellPitch;

              const swapStyle: React.CSSProperties = isSwapping
                ? ({
                    '--swap-dist': `${swapDeltaX}px`,
                    animation: isLeftSwap
                      ? 'swapLiftMoveRight 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite'
                      : 'swapLiftMoveLeft 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
                    zIndex: 40,
                  } as any)
                : {};

              return (
                <div key={idx} className="relative flex flex-col items-center">
                  {/* Ghost receptacle slot when element lifts */}
                  {isSwapping && (
                    <div
                      className="absolute inset-0 w-12 h-12 rounded-lg border-2 border-dashed border-[#58a6ff]/50 bg-[#58a6ff]/10 flex items-center justify-center font-mono text-[9px] font-bold text-[#58a6ff] pointer-events-none select-none z-0"
                      style={{ top: '18px' }}
                    >
                      Slot #{idx}
                    </div>
                  )}

                  <div
                    style={swapStyle}
                    className="flex flex-col items-center gap-1 relative z-10"
                  >
                    <span className={`text-[9px] font-mono font-bold ${
                      isSwapping
                        ? isLeftSwap ? 'text-[#bc8cff]' : 'text-[#58a6ff]'
                        : isFront ? 'text-[#58a6ff]' : isRear ? 'text-[#3fb950]' : 'text-[#8b949e]'
                    }`}>
                      {isSwapping ? (isLeftSwap ? `➔ #${idx2}` : `⬅ #${idx1}`) : isFront ? 'front' : isRear ? 'rear' : `#${idx}`}
                    </span>
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-sm border shadow transition-all duration-300 ${
                        isSwapping
                          ? isLeftSwap
                            ? 'bg-[#bc8cff]/25 border-[#bc8cff] text-[#bc8cff] ring-2 ring-[#bc8cff] shadow-[0_15px_30px_rgba(188,140,255,0.45)]'
                            : 'bg-[#58a6ff]/25 border-[#58a6ff] text-[#58a6ff] ring-2 ring-[#58a6ff] shadow-[0_15px_30px_rgba(88,166,255,0.45)]'
                          : isFront
                          ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff] ring-2 ring-[#58a6ff]'
                          : isRear
                          ? 'bg-[#3fb950]/20 border-[#3fb950] text-[#3fb950] ring-2 ring-[#3fb950]'
                          : 'bg-[#21262d] border-[#30363d] text-[#f0f6fc]'
                      }`}
                    >
                      {String(val)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* REAR Terminal */}
        <div className="flex flex-col items-center gap-1 text-[11px] font-mono font-bold min-w-[95px] p-2 bg-[#161b22] rounded-lg border border-[#30363d]">
          <span className="text-[#3fb950] border-b border-[#3fb950]/30 pb-0.5 w-full text-center">
            REAR
          </span>
          <div className="flex flex-col items-center gap-0.5 text-[10px] text-[#8b949e] mt-1">
            <span className="text-[#3fb950] flex items-center gap-0.5">
              <span>addLast ➔</span>
            </span>
            <span className="text-[#f85149] flex items-center gap-0.5">
              <span>removeLast ⇦</span>
            </span>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] font-mono text-[#8b949e]">
        Double-Ended Queue (Insert/Extract from Both Ends)
      </div>
    </div>
  );
};
