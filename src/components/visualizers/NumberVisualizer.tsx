import React from 'react';
import { DataStructureState } from '../../types/execution';
import { Calculator, ArrowRight, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface NumberVisualizerProps {
  structure: DataStructureState;
}

export const NumberVisualizer: React.FC<NumberVisualizerProps> = ({ structure }) => {
  const numberData = structure.numberData || { type: 'GCD' };
  const type = numberData.type;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#30363d]/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#d29922]/15 border border-[#d29922]/30 flex items-center justify-center text-[#d29922]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-[#d29922] text-base">{structure.name}</span>
            <span className="text-[11px] text-[#8b949e] block">
              {type === 'GCD' ? "Euclidean Algorithm (Greatest Common Divisor)" :
               type === 'SIEVE' ? "Sieve of Eratosthenes (Prime Generation)" :
               type === 'FAST_POWER' ? "Binary Exponentiation (Fast Power)" : "Number Theory Foundations"}
            </span>
          </div>
        </div>

        {structure.lastOperation && (
          <span className="text-xs font-mono font-medium text-[#d29922] bg-[#d29922]/10 border border-[#d29922]/20 px-2.5 py-1 rounded-md">
            {structure.lastOperation}
          </span>
        )}
      </div>

      {/* GCD VIEW */}
      {type === 'GCD' && numberData.gcdSteps && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[#8b949e]">Euclidean Division Steps (a % b = r)</span>
          <div className="flex flex-col gap-1.5 bg-[#0d1117] p-3 rounded-lg border border-[#30363d] font-mono text-xs">
            {numberData.gcdSteps.map((step, idx) => {
              const isFinal = step.remainder === 0;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded border ${
                    isFinal
                      ? 'bg-[#3fb950]/15 border-[#3fb950]/50 text-[#3fb950] font-bold'
                      : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#8b949e] font-bold">Step {idx + 1}:</span>
                    <span>{step.a} % {step.b} = {step.remainder}</span>
                  </div>
                  {isFinal && (
                    <span className="text-[11px] bg-[#3fb950] text-black px-2 py-0.5 rounded font-bold">
                      GCD = {step.b}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SIEVE OF ERATOSTHENES VIEW */}
      {type === 'SIEVE' && numberData.sieveGrid && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#8b949e]">
            <span>Prime Sieve Grid (2 to {numberData.sieveGrid.length - 1})</span>
            {numberData.currentP && (
              <span className="font-mono text-[#58a6ff] font-bold">
                Active Prime p = {numberData.currentP}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 bg-[#0d1117] p-3 rounded-lg border border-[#30363d] max-h-60 overflow-y-auto">
            {numberData.sieveGrid.map((isPrime, num) => {
              if (num < 2) return null;
              const isP = numberData.currentP === num;
              const isCrossed = !isPrime;
              const isJustCrossed = numberData.crossedIndex === num;

              return (
                <div
                  key={num}
                  className={`flex items-center justify-center w-8 h-8 rounded border font-mono text-xs transition-all ${
                    isJustCrossed
                      ? 'bg-[#f85149]/20 border-[#f85149] text-[#f85149] line-through font-bold ring-1 ring-[#f85149]'
                      : isP
                      ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff] font-bold ring-1 ring-[#58a6ff]'
                      : isCrossed
                      ? 'bg-[#161b22] border-[#21262d] text-[#484f58] line-through'
                      : 'bg-[#3fb950]/15 border-[#3fb950]/40 text-[#3fb950] font-bold'
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAST POWER VIEW */}
      {type === 'FAST_POWER' && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[#8b949e]">Binary Exponentiation Steps</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-2">
            <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e] font-bold">Base</span>
              <p className="text-sm font-bold text-[#f0f6fc]">{numberData.powerBase ?? 1}</p>
            </div>
            <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e] font-bold">Exponent</span>
              <p className="text-sm font-bold text-[#58a6ff]">{numberData.powerExp ?? 0}</p>
            </div>
            <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e] font-bold">Binary (Exp)</span>
              <p className="text-sm font-bold text-[#bc8cff]">{numberData.powerBinaryExp ?? '-'}</p>
            </div>
            <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <span className="text-[10px] text-[#8b949e] font-bold">Accumulator Result</span>
              <p className="text-sm font-bold text-[#3fb950]">{numberData.powerResult ?? 1}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
