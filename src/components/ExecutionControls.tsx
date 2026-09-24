import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
  FastForward,
  CornerDownRight,
  CornerUpRight,
  ArrowRight,
  Cpu,
  Loader2,
} from 'lucide-react';
import { ExecutionStatus } from '../types/execution';

interface ExecutionControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  executionStatus?: ExecutionStatus;
  currentLine?: number | null;
  workerName?: string;
  currentStepIndex: number;
  totalSteps: number;
  speed: number;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onSpeedChange: (speed: number) => void;
  onScrub: (stepIndex: number) => void;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  isRunning,
  isPaused,
  executionStatus = 'IDLE',
  currentLine,
  workerName,
  currentStepIndex,
  totalSteps,
  speed,
  onRun,
  onPause,
  onResume,
  onStop,
  onRestart,
  onNextStep,
  onPrevStep,
  onStepOver,
  onStepInto,
  onStepOut,
  onSpeedChange,
  onScrub,
}) => {
  const hasSteps = totalSteps > 0;
  const isAtStart = currentStepIndex <= 0;
  const isAtEnd = currentStepIndex >= totalSteps - 1;

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md select-none">
      {/* Primary Action Buttons */}
      <div className="flex items-center gap-1.5">
        {!isRunning ? (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3fb950] hover:bg-[#2ea043] text-black font-bold text-xs shadow-md transition-all transform active:scale-95"
            title="Execute Code (Ctrl + Enter)"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Run</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3fb950] hover:bg-[#2ea043] text-black font-bold text-xs shadow-md transition-all transform active:scale-95"
            title="Resume Auto-Step"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#d29922] hover:bg-[#bb8009] text-black font-bold text-xs shadow-md transition-all transform active:scale-95"
            title="Pause Execution"
          >
            <Pause className="w-4 h-4 fill-black" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={onStop}
          disabled={!isRunning && !hasSteps}
          className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#f85149] disabled:opacity-40 disabled:hover:bg-[#21262d] transition-colors"
          title="Stop Execution"
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={onRestart}
          disabled={!hasSteps}
          className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-40 transition-colors"
          title="Restart from Step 0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-[#30363d] mx-1" />

        {/* Stepping Buttons */}
        <button
          onClick={onPrevStep}
          disabled={!hasSteps || isAtStart}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] disabled:opacity-30 text-xs font-mono font-medium transition-colors"
          title="Previous Step (Left Arrow)"
        >
          <SkipBack className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <button
          onClick={onNextStep}
          disabled={!hasSteps || isAtEnd}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] disabled:opacity-30 text-xs font-mono font-bold transition-colors"
          title="Next Step (Right Arrow)"
        >
          <span>Next</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-[#30363d] mx-1 hidden sm:block" />

        {/* Step Over / Into / Out */}
        <button
          onClick={onStepOver}
          disabled={!hasSteps || isAtEnd}
          className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-30 text-xs font-mono transition-colors"
          title="Step Over"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Over</span>
        </button>

        <button
          onClick={onStepInto}
          disabled={!hasSteps || isAtEnd}
          className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-30 text-xs font-mono transition-colors"
          title="Step Into"
        >
          <CornerDownRight className="w-3.5 h-3.5" />
          <span>Into</span>
        </button>

        <button
          onClick={onStepOut}
          disabled={!hasSteps || isAtEnd}
          className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-30 text-xs font-mono transition-colors"
          title="Step Out"
        >
          <CornerUpRight className="w-3.5 h-3.5" />
          <span>Out</span>
        </button>
      </div>

      {/* Timeline Scrubber, Step Counter & Line Indicator */}
      <div className="flex items-center gap-3 flex-1 max-w-lg mx-2">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          {executionStatus === 'COMPILING' ? (
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40 px-2 py-0.5 rounded-full animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Compiling
            </span>
          ) : executionStatus === 'RUNNING' ? (
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/40 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-ping" />
              Running
            </span>
          ) : executionStatus === 'PAUSED' ? (
            <span className="text-[11px] font-mono font-bold bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40 px-2 py-0.5 rounded-full">
              Paused
            </span>
          ) : executionStatus === 'COMPLETED' ? (
            <span className="text-[11px] font-mono font-bold bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 px-2 py-0.5 rounded-full">
              Completed
            </span>
          ) : executionStatus === 'ERROR' ? (
            <span className="text-[11px] font-mono font-bold bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40 px-2 py-0.5 rounded-full">
              Error
            </span>
          ) : (
            <span className="text-[11px] font-mono text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded-full">
              Idle
            </span>
          )}

          {currentLine && currentLine > 0 && (
            <span className="text-[11px] font-mono font-bold text-[#58a6ff] bg-[#58a6ff]/10 border border-[#58a6ff]/30 px-2 py-0.5 rounded">
              Line {currentLine}
            </span>
          )}
        </div>

        <span className="text-xs font-mono text-[#8b949e] whitespace-nowrap min-w-[70px] text-right">
          {hasSteps ? `Step ${currentStepIndex + 1} / ${totalSteps}` : '0 / 0'}
        </span>

        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={hasSteps ? currentStepIndex : 0}
          disabled={!hasSteps}
          onChange={(e) => onScrub(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-[#58a6ff] disabled:opacity-30"
          title="Drag to jump to any execution step"
        />

        {workerName && (
          <span className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-[#3fb950] bg-[#3fb950]/10 border border-[#3fb950]/30 px-2 py-0.5 rounded whitespace-nowrap">
            <Cpu className="w-3 h-3 text-[#3fb950]" />
            {workerName}
          </span>
        )}
      </div>

      {/* Speed Slider */}
      <div className="flex items-center gap-2">
        <FastForward className="w-3.5 h-3.5 text-[#8b949e]" />
        <span className="text-xs font-mono text-[#8b949e]">Speed:</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono text-[#f0f6fc] px-2 py-1 focus:outline-none focus:border-[#58a6ff]"
        >
          <option value={0.25}>0.25x (Slow)</option>
          <option value={0.5}>0.5x</option>
          <option value={1}>1.0x (Normal)</option>
          <option value={2}>2.0x (Fast)</option>
          <option value={4}>4.0x (Max)</option>
        </select>
      </div>
    </div>
  );
};
