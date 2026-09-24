import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';

interface ConsolePanelProps {
  output: string[];
  onClear: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ output, onClear }) => {
  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#39c5cf]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            Execution Console
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[#8b949e] hover:text-[#f85149] p-1 rounded hover:bg-[#21262d] transition-colors"
          title="Clear Console"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-[#f0f6fc] flex flex-col gap-1 bg-[#0d1117]/80">
        {output.length === 0 ? (
          <span className="text-[#8b949e] italic text-xs">
            Program stdout will appear here...
          </span>
        ) : (
          output.map((line, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-[#8b949e]/50 select-none">❯</span>
              <span className="text-[#39c5cf]">{line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
