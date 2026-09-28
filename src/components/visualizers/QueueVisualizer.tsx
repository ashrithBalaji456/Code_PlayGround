import React from 'react';
import { DataStructureState, ExecutionEvent } from '../../types/execution';
import { CornerDownRight, ArrowRight, ArrowLeft } from 'lucide-react';

interface QueueVisualizerProps {
  structure: DataStructureState;
  lastEvent?: ExecutionEvent;
}

export const QueueVisualizer: React.FC<QueueVisualizerProps> = ({ structure, lastEvent }) => {
  const elements = structure.queueData || [];

  const isEnqueueEvent =
    lastEvent &&
    (lastEvent.type === 'QUEUE_ENQUEUE' || structure.lastOperation?.toLowerCase().includes('enqueue') || structure.lastOperation?.toLowerCase().includes('offer') || structure.lastOperation?.toLowerCase().includes('add')) &&
    (lastEvent.structureId === structure.id || (lastEvent as any).queueId === structure.name);

  const isDequeueEvent =
    lastEvent &&
    (lastEvent.type === 'QUEUE_DEQUEUE' || structure.lastOperation?.toLowerCase().includes('dequeue') || structure.lastOperation?.toLowerCase().includes('poll') || structure.lastOperation?.toLowerCase().includes('remove')) &&
    (lastEvent.structureId === structure.id || (lastEvent as any).queueId === structure.name);

  const dequeuedValue = isDequeueEvent && lastEvent ? (lastEvent.value ?? lastEvent.returnValue) : null;
  const enqueuedValue = isEnqueueEvent && lastEvent ? lastEvent.value : null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#39c5cf]/20 border border-[#39c5cf]/40 flex items-center justify-center text-[#39c5cf]">
            <CornerDownRight className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-[#f0f6fc] text-base">{structure.name}</span>
          <span className="text-[11px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono border border-[#30363d]">
            size: {elements.length}
          </span>
        </div>
        {structure.lastOperation && (
          <span className="text-[11px] font-mono text-[#39c5cf] bg-[#39c5cf]/15 px-2.5 py-0.5 rounded-full border border-[#39c5cf]/30 font-semibold shadow-sm">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Floating Enqueue / Dequeue Action Slot */}
      <div className="flex items-center justify-between px-3 h-8 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          {isDequeueEvent && dequeuedValue !== null ? (
            <span className="bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40 px-2 py-0.5 rounded font-bold animate-pulse flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              FRONT [{String(dequeuedValue)}] DEQUEUED
            </span>
          ) : (
            <span className="text-[#39c5cf] font-bold flex items-center gap-1">
              <span>FRONT</span>
              <span>↓</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isEnqueueEvent && enqueuedValue !== null ? (
            <span className="bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/40 px-2 py-0.5 rounded font-bold animate-bounce flex items-center gap-1">
              <span>REAR [{String(enqueuedValue)}] ENQUEUED</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          ) : (
            <span className="text-[#3fb950] font-bold flex items-center gap-1">
              <span>REAR</span>
              <span>↓</span>
            </span>
          )}
        </div>
      </div>

      {/* Queue Conveyor Pipe */}
      <div className="flex items-center justify-between gap-3 p-4 bg-[#0d1117] rounded-xl border-y-2 border-[#30363d] overflow-x-auto min-h-[120px] shadow-inner relative">
        {/* Dequeue Exit Indicator */}
        <div className="flex flex-col items-center gap-1 text-[11px] font-mono text-[#f85149] font-bold min-w-[70px]">
          <span className="bg-[#f85149]/15 border border-[#f85149]/30 px-2 py-0.5 rounded text-[10px]">
            EXIT
          </span>
          <div className="flex items-center gap-0.5 text-[#f85149]">
            <span>⇦ Dequeue</span>
          </div>
        </div>

        {/* Elements Conduit */}
        <div className="flex items-center gap-2 flex-1 justify-center px-4">
          {elements.length === 0 ? (
            <div className="text-xs text-[#8b949e] font-mono">[ Empty Queue: 0 elements ]</div>
          ) : (
            elements.map((val, idx) => {
              const isFront = idx === 0;
              const isRear = idx === elements.length - 1;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-bold ${
                    isFront ? 'text-[#39c5cf]' : isRear ? 'text-[#3fb950]' : 'text-[#8b949e]'
                  }`}>
                    {isFront ? 'FRONT' : isRear ? 'REAR' : `#${idx}`}
                  </span>
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center font-mono font-bold text-base border shadow-md transition-all duration-300 ${
                      isFront
                        ? 'bg-[#39c5cf]/20 border-[#39c5cf] text-[#39c5cf] ring-2 ring-[#39c5cf]/60 shadow-[#39c5cf]/20'
                        : isRear
                        ? 'bg-[#3fb950]/20 border-[#3fb950] text-[#3fb950] ring-1 ring-[#3fb950]/50'
                        : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                    }`}
                  >
                    {String(val)}
                  </div>
                  <span className="text-[9px] font-mono text-[#8b949e]">
                    [{idx}]
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Enqueue Entry Indicator */}
        <div className="flex flex-col items-center gap-1 text-[11px] font-mono text-[#3fb950] font-bold min-w-[70px]">
          <span className="bg-[#3fb950]/15 border border-[#3fb950]/30 px-2 py-0.5 rounded text-[10px]">
            ENTRY
          </span>
          <div className="flex items-center gap-0.5 text-[#3fb950]">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Enqueue</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Pill */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] border-t border-[#30363d]/50 pt-2 px-1">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#39c5cf]" />
          FIFO Pipeline (First-In, First-Out)
        </span>
        <span className="bg-[#21262d] text-[#39c5cf] font-semibold px-2 py-0.5 rounded border border-[#30363d]">
          queue: by level
        </span>
      </div>
    </div>
  );
};

