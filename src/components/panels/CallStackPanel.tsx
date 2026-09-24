import React from 'react';
import { CallFrame } from '../../types/execution';
import { Layers } from 'lucide-react';

interface CallStackPanelProps {
  callStack: CallFrame[];
}

export const CallStackPanel: React.FC<CallStackPanelProps> = ({ callStack }) => {
  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#bc8cff]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            Call Stack (Recursion)
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#bc8cff] bg-[#bc8cff]/10 border border-[#bc8cff]/20 px-2 py-0.5 rounded font-bold">
          Depth: {callStack.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col-reverse gap-1.5">
        {callStack.length === 0 ? (
          <div className="text-xs text-[#8b949e] font-mono p-4 text-center">
            No active frames.
          </div>
        ) : (
          callStack.map((frame, idx) => {
            const isTop = idx === callStack.length - 1;
            return (
              <div
                key={frame.id || idx}
                className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                  isTop
                    ? 'bg-[#bc8cff]/15 border-[#bc8cff] shadow-md'
                    : 'bg-[#0d1117] border-[#30363d] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold ${isTop ? 'text-[#bc8cff]' : 'text-[#f0f6fc]'}`}>
                    {frame.functionName}
                  </span>
                  <span className="text-[10px] text-[#8b949e]">
                    Frame #{idx + 1}
                  </span>
                </div>

                {/* Arguments */}
                {Object.keys(frame.arguments || {}).length > 0 && (
                  <div className="text-[11px] text-[#8b949e] flex gap-2 flex-wrap mt-1">
                    {Object.entries(frame.arguments).map(([k, v]) => (
                      <span key={k} className="bg-[#21262d] px-1.5 py-0.5 rounded text-[#58a6ff]">
                        {k} = {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
