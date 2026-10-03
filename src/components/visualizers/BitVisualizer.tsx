import React, { useState } from 'react';
import { DataStructureState } from '../../types/execution';
import { Binary, Cpu, Sliders, CheckCircle, Zap } from 'lucide-react';

interface BitVisualizerProps {
  structure: DataStructureState;
}

export const BitVisualizer: React.FC<BitVisualizerProps> = ({ structure }) => {
  const bitData = structure.bitData || {
    operandA: 0,
    result: 0,
    bitSize: 32,
  };

  const [displayBits, setDisplayBits] = useState<8 | 16 | 32>(8);

  const a = bitData.operandA ?? 0;
  const b = bitData.operandB;
  const op = bitData.operator || '&';
  const res = bitData.result ?? a;
  const targetBit = bitData.targetBit;

  // Extract binary strings
  const getBits = (val: number, count: number): number[] => {
    const bits: number[] = [];
    for (let i = count - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
    return bits;
  };

  const aBits = getBits(a, displayBits);
  const bBits = b !== undefined ? getBits(b, displayBits) : null;
  const resBits = getBits(res, displayBits);

  // Common bit pattern helpers computed on value 'a'
  const isPowerOfTwo = a > 0 && (a & (a - 1)) === 0;
  const bitCount = (a >>> 0).toString(2).split('1').length - 1;

  return (
    <div className="backdrop-blur-xl bg-[#161b22]/70 border border-white/10 rounded-xl p-4 shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#30363d]/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#39c5cf]/15 border border-[#39c5cf]/30 flex items-center justify-center text-[#39c5cf]">
            <Binary className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#39c5cf] text-base">{structure.name}</span>
              <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded font-mono">
                Decimal: {res} • Hex: 0x{(res >>> 0).toString(16).toUpperCase()}
              </span>
            </div>
            <span className="text-[11px] text-[#8b949e]">32-Bit Integer Binary Register & Bitwise Logic</span>
          </div>
        </div>

        {/* Bit size toggle */}
        <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] text-xs font-mono">
          <button
            onClick={() => setDisplayBits(8)}
            className={`px-2 py-0.5 rounded ${displayBits === 8 ? 'bg-[#39c5cf] text-black font-bold' : 'text-[#8b949e]'}`}
          >
            8-Bit
          </button>
          <button
            onClick={() => setDisplayBits(16)}
            className={`px-2 py-0.5 rounded ${displayBits === 16 ? 'bg-[#39c5cf] text-black font-bold' : 'text-[#8b949e]'}`}
          >
            16-Bit
          </button>
          <button
            onClick={() => setDisplayBits(32)}
            className={`px-2 py-0.5 rounded ${displayBits === 32 ? 'bg-[#39c5cf] text-black font-bold' : 'text-[#8b949e]'}`}
          >
            32-Bit
          </button>
        </div>
      </div>

      {/* Operation Formula Banner */}
      {bitData.explanation && (
        <div className="bg-[#0d1117]/80 border border-[#30363d] rounded-lg p-2.5 flex items-center justify-between font-mono text-xs">
          <span className="text-[#8b949e]">Operation:</span>
          <span className="text-[#39c5cf] font-bold">{bitData.explanation}</span>
        </div>
      )}

      {/* Binary Registers Visualizer */}
      <div className="flex flex-col gap-3 bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
        {/* Register A */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
            <span>Operand A ({a}):</span>
            <span>0b{(a >>> 0).toString(2).padStart(displayBits, '0')}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {aBits.map((bit, idx) => {
              const bitIndex = displayBits - 1 - idx;
              const isTarget = targetBit === bitIndex;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center w-7 h-9 rounded border font-mono transition-all ${
                    isTarget
                      ? 'bg-[#39c5cf]/20 border-[#39c5cf] text-[#39c5cf] ring-1 ring-[#39c5cf]'
                      : bit === 1
                      ? 'bg-[#3fb950]/15 border-[#3fb950]/50 text-[#3fb950] font-bold'
                      : 'bg-[#161b22] border-[#30363d] text-[#8b949e]'
                  }`}
                >
                  <span className="text-xs font-bold">{bit}</span>
                  <span className="text-[8px] text-[#8b949e]/60">{bitIndex}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operator & Register B if binary operation */}
        {bBits && (
          <div className="flex flex-col gap-1 border-t border-[#30363d]/50 pt-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
              <span>Operator [{op}] • Operand B ({b ?? 0}):</span>
              <span>0b{((b ?? 0) >>> 0).toString(2).padStart(displayBits, '0')}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {bBits.map((bit, idx) => {
                const bitIndex = displayBits - 1 - idx;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center w-7 h-9 rounded border font-mono transition-all ${
                      bit === 1
                        ? 'bg-[#58a6ff]/15 border-[#58a6ff]/50 text-[#58a6ff] font-bold'
                        : 'bg-[#161b22] border-[#30363d] text-[#8b949e]'
                    }`}
                  >
                    <span className="text-xs font-bold">{bit}</span>
                    <span className="text-[8px] text-[#8b949e]/60">{bitIndex}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Result Register */}
        <div className="flex flex-col gap-1 border-t border-[#30363d] pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#3fb950] font-bold">
            <span>Result Register ({res}):</span>
            <span>0b{(res >>> 0).toString(2).padStart(displayBits, '0')}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {resBits.map((bit, idx) => {
              const bitIndex = displayBits - 1 - idx;
              const hasChanged = aBits[idx] !== bit;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center w-7 h-9 rounded border font-mono transition-all ${
                    hasChanged
                      ? 'bg-[#d29922]/20 border-[#d29922] text-[#d29922] font-bold animate-pulse'
                      : bit === 1
                      ? 'bg-[#3fb950]/20 border-[#3fb950] text-[#3fb950] font-bold'
                      : 'bg-[#161b22] border-[#30363d] text-[#8b949e]'
                  }`}
                >
                  <span className="text-xs font-bold">{bit}</span>
                  <span className="text-[8px] text-[#8b949e]/60">{bitIndex}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bit Helper Patterns Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60">
          <span className="text-[10px] text-[#8b949e] font-bold uppercase block">Count Bits (1s)</span>
          <span className="text-sm font-bold text-[#39c5cf] mt-0.5 block">{bitCount} bits set</span>
        </div>
        <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60">
          <span className="text-[10px] text-[#8b949e] font-bold uppercase block">Power of Two?</span>
          <span className={`text-sm font-bold mt-0.5 block ${isPowerOfTwo ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
            {isPowerOfTwo ? 'YES (n & n-1 == 0)' : 'NO'}
          </span>
        </div>
        <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60">
          <span className="text-[10px] text-[#8b949e] font-bold uppercase block">Right Shift (n &gt;&gt; 1)</span>
          <span className="text-sm font-bold text-[#f0f6fc] mt-0.5 block">{a >> 1} (div 2)</span>
        </div>
        <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60">
          <span className="text-[10px] text-[#8b949e] font-bold uppercase block">Left Shift (n &lt;&lt; 1)</span>
          <span className="text-sm font-bold text-[#f0f6fc] mt-0.5 block">{a << 1} (mul 2)</span>
        </div>
      </div>
    </div>
  );
};
