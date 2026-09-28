import React from 'react';
import { DataStructureState } from '../../types/execution';
import { Type, Search, ArrowRight, Hash, Layers } from 'lucide-react';

interface StringVisualizerProps {
  structure: DataStructureState;
}

export const StringVisualizer: React.FC<StringVisualizerProps> = ({ structure }) => {
  const stringData = structure.stringData || { text: '' };
  const text = stringData.text || '';
  const pattern = stringData.pattern || '';
  const activeIdx = stringData.activeIndex;
  const patternIdx = stringData.patternIndex;
  const lps = stringData.lps;
  const freqs = stringData.frequencies || {};

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#30363d]/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f0883e]/15 border border-[#f0883e]/30 flex items-center justify-center text-[#f0883e]">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#f0883e] text-base">{structure.name}</span>
              <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
                Length: {text.length} chars
              </span>
            </div>
            <span className="text-[11px] text-[#8b949e]">String Traversal, Pattern Search & Character Frequencies</span>
          </div>
        </div>

        {structure.lastOperation && (
          <span className="text-xs font-mono font-medium text-[#f0883e] bg-[#f0883e]/10 border border-[#f0883e]/20 px-2.5 py-1 rounded-md">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* Main String Character Cells */}
      <div className="flex flex-col gap-2 bg-[#0d1117]/80 p-3.5 rounded-lg border border-[#30363d]">
        <div className="flex items-center justify-between text-xs text-[#8b949e] font-semibold">
          <span className="flex items-center gap-1.5 text-[#58a6ff]">
            <Search className="w-3.5 h-3.5" /> Text String Index View
          </span>
          <span className="text-[10px] font-mono">
            {activeIdx !== undefined ? `Active Pointer i = ${activeIdx}` : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 pt-4">
          {text.split('').map((char, idx) => {
            const isActive = activeIdx === idx;
            return (
              <div key={idx} className="relative flex flex-col items-center">
                {/* Pointer Badge */}
                {isActive && (
                  <div className="absolute -top-4 flex items-center gap-0.5 text-[9px] font-mono font-bold text-[#58a6ff] animate-bounce">
                    <span>i</span>
                    <span>↓</span>
                  </div>
                )}

                <div
                  className={`flex flex-col items-center justify-center w-8 h-10 rounded-md font-mono transition-all border ${
                    isActive
                      ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff] font-bold ring-1 ring-[#58a6ff]'
                      : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                  }`}
                >
                  <span className="text-sm font-bold">{char}</span>
                  <span className="text-[8px] text-[#8b949e]">{idx}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KMP LPS (Longest Prefix Suffix) Array if active */}
      {lps && lps.length > 0 && (
        <div className="flex flex-col gap-2 bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
          <span className="text-xs font-semibold text-[#bc8cff] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> KMP Pattern & LPS Array
          </span>
          <div className="flex flex-wrap gap-1.5">
            {lps.map((val, idx) => {
              const isPActive = patternIdx === idx;
              const pChar = pattern ? pattern[idx] : `[${idx}]`;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center min-w-[2.5rem] p-1.5 rounded border font-mono text-xs ${
                    isPActive
                      ? 'bg-[#bc8cff]/20 border-[#bc8cff] text-[#bc8cff] font-bold'
                      : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                  }`}
                >
                  <span className="text-[10px] text-[#8b949e]">{pChar}</span>
                  <span className="font-bold text-sm text-[#bc8cff] mt-0.5">{val}</span>
                  <span className="text-[8px] text-[#8b949e]">j:{idx}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rabin-Karp Rolling Hash if active */}
      {stringData.hashPattern !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#0d1117] p-3 rounded-lg border border-[#30363d] text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Pattern Hash</span>
            <span className="font-bold text-[#f0883e] text-sm mt-0.5 block">{stringData.hashPattern}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Window Hash</span>
            <span className="font-bold text-[#58a6ff] text-sm mt-0.5 block">{stringData.hashWindow ?? '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Window Start</span>
            <span className="font-bold text-[#3fb950] text-sm mt-0.5 block">Index {stringData.windowStart ?? 0}</span>
          </div>
        </div>
      )}

      {/* Character Frequencies Bar */}
      {Object.keys(freqs).length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[#3fb950]" /> Observed Character Frequencies
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(freqs).map(([ch, count]) => (
              <div
                key={ch}
                className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] px-2.5 py-1 rounded-md text-xs font-mono"
              >
                <span className="font-bold text-[#f0f6fc]">'{ch}'</span>
                <span className="text-[10px] bg-[#3fb950]/20 text-[#3fb950] px-1.5 rounded-full font-bold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
