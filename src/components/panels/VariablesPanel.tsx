import React from 'react';
import { VariableInfo, ExecutionEvent } from '../../types/execution';
import { Variable, ArrowRight } from 'lucide-react';

interface VariablesPanelProps {
  variables: Record<string, VariableInfo>;
  lastEvent?: ExecutionEvent;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  lastEvent,
}) => {
  const varList = Object.values(variables);

  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <Variable className="w-4 h-4 text-[#58a6ff]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            Variables Panel
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded">
          {varList.length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {varList.length === 0 ? (
          <div className="text-xs text-[#8b949e] font-mono p-4 text-center">
            No variables in active scope.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {varList.map((v) => {
              const isUpdated =
                lastEvent &&
                lastEvent.type === 'VARIABLE_UPDATE' &&
                lastEvent.variable === v.name;

              return (
                <div
                  key={v.name}
                  className={`p-3 rounded-lg border font-mono transition-all duration-300 ${
                    isUpdated
                      ? 'bg-[#3fb950]/15 border-[#3fb950] shadow-lg shadow-[#3fb950]/20 ring-1 ring-[#3fb950]'
                      : 'bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#58a6ff] text-sm">{v.name}</span>
                    <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
                      {v.type}
                    </span>
                  </div>

                  {/* Value & Transition Display */}
                  <div className="flex items-center gap-2 text-base font-bold">
                    {isUpdated && lastEvent.oldValue !== undefined ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[#8b949e] line-through">{String(lastEvent.oldValue)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#3fb950] animate-pulse" />
                        <span className="text-[#3fb950] font-bold text-sm bg-[#3fb950]/20 px-1.5 py-0.5 rounded">
                          {String(v.value)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#f0f6fc] text-sm truncate">
                        {v.isReference ? (
                          <span className="text-[#bc8cff]" title={String(v.value)}>
                            {v.refTargetId || String(v.value)}
                          </span>
                        ) : (
                          String(v.value)
                        )}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 pt-1 border-t border-[#30363d]/50 flex items-center justify-between text-[10px] text-[#8b949e]">
                    <span>Scope: {v.scope}</span>
                    <span className="text-[#3fb950]">{v.estimatedBytes} B</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
