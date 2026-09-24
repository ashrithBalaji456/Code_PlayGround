import React from 'react';
import { X, Keyboard, Zap, ShieldCheck } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#58a6ff]" />
            <h2 className="font-bold text-base text-[#f0f6fc]">
              CodeFlow DSA Lab Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#f0f6fc] p-1 rounded-lg hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-sm">
          {/* Core Principle */}
          <div className="bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-xl p-3.5 flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#58a6ff] uppercase tracking-wider">
              Core Execution Principle
            </span>
            <p className="text-xs text-[#f0f6fc] leading-relaxed">
              <strong>User Code ➔ Actual AST Execution ➔ Normalized Events ➔ Synchronous Visual State.</strong>
              <br />
              This is <em>not</em> canned or hard-coded animations! Changing array values, creating multiple stacks, or advancing pointers directly mutates the visual structures.
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
              <Keyboard className="w-4 h-4 text-[#bc8cff]" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                <span className="text-[#8b949e]">Run Code</span>
                <kbd className="bg-[#21262d] px-2 py-0.5 rounded text-[#58a6ff]">Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                <span className="text-[#8b949e]">Next Step</span>
                <kbd className="bg-[#21262d] px-2 py-0.5 rounded text-[#58a6ff]">Right Arrow</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                <span className="text-[#8b949e]">Prev Step</span>
                <kbd className="bg-[#21262d] px-2 py-0.5 rounded text-[#58a6ff]">Left Arrow</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                <span className="text-[#8b949e]">Toggle Breakpoint</span>
                <kbd className="bg-[#21262d] px-2 py-0.5 rounded text-[#58a6ff]">Click Gutter</kbd>
              </div>
            </div>
          </div>

          {/* Supported Structures */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
              <ShieldCheck className="w-4 h-4 text-[#3fb950]" />
              <span>Supported Data Structures</span>
            </div>
            <ul className="grid grid-cols-2 gap-2 text-xs text-[#8b949e]">
              <li className="p-2 bg-[#0d1117] rounded border border-[#30363d]">
                <strong className="text-[#f0f6fc]">1D & 2D Arrays</strong>: in-place mutations, bar tracer, swaps
              </li>
              <li className="p-2 bg-[#0d1117] rounded border border-[#30363d]">
                <strong className="text-[#f0f6fc]">Stacks</strong>: multiple independent stacks, LIFO push/pop
              </li>
              <li className="p-2 bg-[#0d1117] rounded border border-[#30363d]">
                <strong className="text-[#f0f6fc]">Queues</strong>: FIFO conveyor, front/rear indicators
              </li>
              <li className="p-2 bg-[#0d1117] rounded border border-[#30363d]">
                <strong className="text-[#f0f6fc]">Linked Lists</strong>: Node heap links, next pointers, null
              </li>
              <li className="p-2 bg-[#0d1117] rounded border border-[#30363d]">
                <strong className="text-[#f0f6fc]">Trees & BST</strong>: Hierarchical SVG branch layout
              </li>
              <li className="p-2 bg-[#0d1117] rounded border border-[#30363d]">
                <strong className="text-[#f0f6fc]">HashMaps</strong>: Polynomial hash, bucket chaining
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#30363d] bg-[#0d1117] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-black font-bold text-xs rounded-lg transition-colors"
          >
            Got it, Let's Code
          </button>
        </div>
      </div>
    </div>
  );
};
