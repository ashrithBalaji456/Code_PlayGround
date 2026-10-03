import React from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { Layers, ArrowDown, ArrowUp } from 'lucide-react';

interface StackVisualizerProps {
  structure: DataStructureState;
  lastEvent?: ExecutionEvent;
}

export const StackVisualizer: React.FC<StackVisualizerProps> = ({ structure, lastEvent }) => {
  const elements = structure.stackData || [];
  const topIndex = elements.length - 1;

  const isPushEvent =
    lastEvent &&
    (lastEvent.type === 'STACK_PUSH' || structure.lastOperation?.toLowerCase().includes('push')) &&
    (lastEvent.structureId === structure.id || (lastEvent as any).stackId === structure.name);

  const isPopEvent =
    lastEvent &&
    (lastEvent.type === 'STACK_POP' || structure.lastOperation?.toLowerCase().includes('pop')) &&
    (lastEvent.structureId === structure.id || (lastEvent as any).stackId === structure.name);

  const poppedValue = isPopEvent && lastEvent ? (lastEvent.value ?? lastEvent.returnValue) : null;
  const pushedValue = isPushEvent && lastEvent ? lastEvent.value : null;

  const swappingIndices = structure.swappingIndices;
  const idx1 = swappingIndices && swappingIndices.length === 2 ? Math.min(swappingIndices[0], swappingIndices[1]) : 0;
  const idx2 = swappingIndices && swappingIndices.length === 2 ? Math.max(swappingIndices[0], swappingIndices[1]) : 0;

  return (
    <div className="backdrop-blur-xl bg-[#161b22]/70 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3 min-w-[220px] flex-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#bc8cff]/20 border border-[#bc8cff]/40 flex items-center justify-center text-[#bc8cff]">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-[#f0f6fc] text-base">{structure.name}</span>
          <span className="text-[11px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono border border-[#30363d]">
            size: {elements.length}
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#bc8cff] bg-[#bc8cff]/15 px-2.5 py-0.5 rounded-full border border-[#bc8cff]/30 font-semibold shadow-sm">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Floating Push / Pop Movement Slot */}
      <div className="h-10 flex items-center justify-center">
        {isPushEvent && pushedValue !== null ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#3fb950]/20 border border-[#3fb950]/50 rounded-lg text-xs font-mono font-bold text-[#3fb950] animate-bounce shadow-md">
            <span>[{String(pushedValue)}]</span>
            <ArrowDown className="w-3.5 h-3.5" />
            <span>PUSH TO TOP</span>
          </div>
        ) : isPopEvent && poppedValue !== null ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f85149]/20 border border-[#f85149]/50 rounded-lg text-xs font-mono font-bold text-[#f85149] animate-pulse shadow-md">
            <span>[{String(poppedValue)}]</span>
            <ArrowUp className="w-3.5 h-3.5" />
            <span>POPPED / REMOVED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#8b949e]">
            <span>TOP</span>
            <span>↓</span>
            <span className="text-[10px] text-[#8b949e]/70">(entry & exit point)</span>
          </div>
        )}
      </div>

      {/* Physical Stack Vessel */}
      <div className="flex flex-col items-center justify-end min-h-[220px] max-h-[300px] p-3.5 px-8 bg-[#0d1117] rounded-xl border-x-2 border-b-4 border-[#30363d] relative overflow-y-auto shadow-inner">
        {elements.length === 0 ? (
          <div className="text-xs text-[#8b949e] font-mono flex flex-col items-center gap-1 my-auto">
            <span className="font-semibold text-[#8b949e]">[ Empty Stack ]</span>
            <span className="text-[11px] text-[#8b949e]/60">stack.push(val) to add</span>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-2 w-full max-w-[170px] relative">
            {elements.map((val, idx) => {
              const isTop = idx === topIndex;
              const isSwapping = !!swappingIndices && swappingIndices.includes(idx);
              const isLowerSwap = isSwapping && idx === idx1;
              const cellPitchY = 46;
              const swapDeltaY = (idx2 - idx1) * cellPitchY;

              const swapStyle: React.CSSProperties = isSwapping
                ? ({
                    '--swap-dist-y': `${swapDeltaY}px`,
                    animation: isLowerSwap
                      ? 'verticalSwapUp 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite'
                      : 'verticalSwapDown 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
                    zIndex: 40,
                  } as any)
                : {};

              return (
                <div key={idx} className="relative flex items-center justify-center">
                  {/* Ghost receptacle slot when element lifts */}
                  {isSwapping && (
                    <div className="absolute inset-0 rounded-xl border-2 border-dashed border-[#bc8cff]/50 bg-[#bc8cff]/10 flex items-center justify-center font-mono text-[9px] font-bold text-[#bc8cff] pointer-events-none select-none z-0">
                      Slot #{idx}
                    </div>
                  )}

                  {/* Top pointer badge */}
                  {isTop && !isSwapping && (
                    <div className="absolute -left-16 flex items-center gap-1 text-[10px] font-mono font-bold text-[#bc8cff] bg-[#bc8cff]/15 border border-[#bc8cff]/40 px-1.5 py-0.5 rounded shadow">
                      <span>top</span>
                      <span>➔</span>
                    </div>
                  )}

                  <div
                    style={swapStyle}
                    className={`w-full py-2.5 px-3 rounded-xl font-mono text-center font-bold text-sm border shadow-md transition-all duration-300 relative z-10 ${
                      isSwapping
                        ? isLowerSwap
                          ? 'bg-[#bc8cff]/30 border-[#bc8cff] text-[#bc8cff] ring-2 ring-[#bc8cff] shadow-[0_15px_30px_rgba(188,140,255,0.45)]'
                          : 'bg-[#58a6ff]/30 border-[#58a6ff] text-[#58a6ff] ring-2 ring-[#58a6ff] shadow-[0_15px_30px_rgba(88,166,255,0.45)]'
                        : isTop
                        ? 'bg-[#bc8cff]/20 border-[#bc8cff] text-[#bc8cff] ring-2 ring-[#bc8cff]/50 shadow-[#bc8cff]/20'
                        : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                    }`}
                  >
                    {String(val)}
                  </div>

                  <span className="absolute -right-8 text-[10px] font-mono text-[#8b949e]">
                    #{idx}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Pill */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] border-t border-[#30363d]/50 pt-2 px-1">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#bc8cff]" />
          LIFO Principle
        </span>
        <span className="bg-[#21262d] text-[#bc8cff] font-semibold px-2 py-0.5 rounded border border-[#30363d]">
          stack: go deep
        </span>
      </div>
    </div>
  );
};

