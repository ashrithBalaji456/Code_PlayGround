import React from 'react';
import { VariableInfo } from '../../types/execution';
import { Variable } from 'lucide-react';

interface VariablesPanelProps {
  variables: Record<string, VariableInfo>;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({ variables }) => {
  const varList = Object.values(variables);

  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <Variable className="w-4 h-4 text-[#58a6ff]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            Variables & Scopes
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded">
          {varList.length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {varList.length === 0 ? (
          <div className="text-xs text-[#8b949e] font-mono p-4 text-center">
            No variables in active scope.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-[#8b949e] border-b border-[#30363d]/60">
                <th className="pb-1.5 pl-1 font-medium">Name</th>
                <th className="pb-1.5 font-medium">Type</th>
                <th className="pb-1.5 font-medium">Value</th>
                <th className="pb-1.5 pr-1 text-right font-medium">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/30">
              {varList.map((v) => (
                <tr key={v.name} className="hover:bg-[#21262d]/50 transition-colors">
                  <td className="py-1.5 pl-1 font-bold text-[#58a6ff]">{v.name}</td>
                  <td className="py-1.5 text-[#8b949e] text-[11px]">{v.type}</td>
                  <td className="py-1.5 font-semibold text-[#f0f6fc] max-w-[120px] truncate">
                    {v.isReference ? (
                      <span className="text-[#bc8cff] underline decoration-dotted" title={String(v.value)}>
                        {v.refTargetId || String(v.value)}
                      </span>
                    ) : (
                      String(v.value)
                    )}
                  </td>
                  <td className="py-1.5 pr-1 text-right text-[11px] text-[#3fb950]">
                    {v.estimatedBytes} B
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
