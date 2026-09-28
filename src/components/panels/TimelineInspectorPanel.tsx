import React, { useState } from 'react';
import { ExecutionStep, ExecutionEvent } from '../../types/execution';
import { ListOrdered, Code, ChevronRight, Terminal, Clock, CheckCircle } from 'lucide-react';

interface TimelineInspectorPanelProps {
  steps: ExecutionStep[];
  currentStepIndex: number;
  onScrub: (index: number) => void;
}

export const TimelineInspectorPanel: React.FC<TimelineInspectorPanelProps> = ({
  steps,
  currentStepIndex,
  onScrub,
}) => {
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const currentStep = steps[currentStepIndex];

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 gap-4 text-xs font-sans text-[#f0f6fc]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#30363d]/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#3fb950]/15 border border-[#3fb950]/30 flex items-center justify-center text-[#3fb950]">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#f0f6fc]">"What Happened?" Timeline &amp; Event Inspector</span>
              <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
                {steps.length} Steps
              </span>
            </div>
            <span className="text-[11px] text-[#8b949e]">
              Step-by-step plain English execution log with raw event inspection
            </span>
          </div>
        </div>

        {/* Raw Event toggle */}
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
            showRawJson
              ? 'bg-[#58a6ff] text-black border-[#58a6ff] font-bold'
              : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#f0f6fc]'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>{showRawJson ? 'Hide Raw Event' : 'Show Raw Event'}</span>
        </button>
      </div>

      {/* Raw Event JSON Inspector if active */}
      {showRawJson && currentStep && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 flex flex-col gap-2 font-mono shadow-md">
          <div className="flex items-center justify-between text-xs border-b border-[#30363d]/50 pb-2">
            <span className="text-[#58a6ff] font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Raw Event Payload (Step {currentStep.stepIndex + 1})
            </span>
            <span className="text-[10px] text-[#8b949e]">EventType: {currentStep.event.type}</span>
          </div>
          <pre className="text-[11px] text-[#3fb950] overflow-x-auto p-2 bg-[#161b22] rounded border border-[#30363d] max-h-48">
            {JSON.stringify(currentStep.event, null, 2)}
          </pre>
        </div>
      )}

      {/* Timeline Steps List */}
      <div className="flex flex-col gap-1.5">
        {steps.map((st, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPast = idx < currentStepIndex;

          return (
            <button
              key={idx}
              onClick={() => onScrub(idx)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left font-mono transition-all duration-200 ${
                isCurrent
                  ? 'bg-[#58a6ff]/15 border-[#58a6ff] text-[#58a6ff] font-bold ring-1 ring-[#58a6ff]'
                  : isPast
                  ? 'bg-[#161b22]/70 border-[#30363d]/70 text-[#8b949e] hover:bg-[#161b22]'
                  : 'bg-[#0d1117] border-[#21262d] text-[#484f58] hover:bg-[#161b22]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isCurrent
                    ? 'bg-[#58a6ff] text-black'
                    : isPast
                    ? 'bg-[#21262d] text-[#8b949e]'
                    : 'bg-[#161b22] text-[#484f58]'
                }`}>
                  #{idx + 1}
                </span>

                <div className="flex flex-col">
                  <span className={`text-xs ${isCurrent ? 'text-[#f0f6fc]' : ''}`}>
                    {st.explanation}
                  </span>
                  <span className="text-[10px] text-[#8b949e]/70">
                    Line {st.line} • {st.event.type}
                  </span>
                </div>
              </div>

              {isCurrent && (
                <span className="text-[10px] bg-[#58a6ff]/20 text-[#58a6ff] px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
