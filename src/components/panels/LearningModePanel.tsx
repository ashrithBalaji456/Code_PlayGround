import React from 'react';
import { CodePreset } from '../../types/execution';
import { BookOpen, Clock, HardDrive, CheckCircle2, Lightbulb, Play } from 'lucide-react';

interface LearningModePanelProps {
  preset: CodePreset;
  onRunPreset: () => void;
}

export const LearningModePanel: React.FC<LearningModePanelProps> = ({
  preset,
  onRunPreset,
}) => {
  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#58a6ff]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            Interactive DSA Study Guide
          </span>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
            preset.difficulty === 'Easy'
              ? 'bg-[#3fb950]/15 border-[#3fb950]/40 text-[#3fb950]'
              : preset.difficulty === 'Medium'
              ? 'bg-[#d29922]/15 border-[#d29922]/40 text-[#d29922]'
              : 'bg-[#f85149]/15 border-[#f85149]/40 text-[#f85149]'
          }`}
        >
          {preset.difficulty}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {/* Title & Category */}
        <div>
          <span className="text-[10px] text-[#58a6ff] uppercase font-bold tracking-wider">
            {preset.category}
          </span>
          <h2 className="text-base font-bold text-[#f0f6fc] mt-0.5">{preset.title}</h2>
          <p className="text-[#8b949e] mt-1 leading-relaxed">{preset.description}</p>
        </div>

        {/* Complexity Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#d29922]" />
            <div>
              <span className="text-[10px] text-[#8b949e] block font-medium">Time Complexity</span>
              <span className="font-mono font-bold text-sm text-[#f0f6fc]">
                {preset.timeComplexity}
              </span>
            </div>
          </div>
          <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d] flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#bc8cff]" />
            <div>
              <span className="text-[10px] text-[#8b949e] block font-medium">Space Complexity</span>
              <span className="font-mono font-bold text-sm text-[#f0f6fc]">
                {preset.spaceComplexity}
              </span>
            </div>
          </div>
        </div>

        {/* Deep Dive Explanation */}
        <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d] flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[#58a6ff] font-bold">
            <Lightbulb className="w-4 h-4" />
            <span>How Execution Works</span>
          </div>
          <p className="text-[#8b949e] leading-relaxed">
            {preset.explanation}
          </p>
        </div>

        {/* Practice Challenge */}
        <div className="bg-[#3fb950]/10 border border-[#3fb950]/30 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[#3fb950] font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Try Modifying The Code:</span>
          </div>
          <ul className="list-disc list-inside text-[#8b949e] space-y-1">
            <li>Change the input values in the code editor to test edge cases.</li>
            <li>Press <strong>Next Step</strong> to inspect changes line-by-line.</li>
            <li>Observe how pointers and memory update synchronously.</li>
          </ul>
        </div>

        {/* Quick Launch Button */}
        <button
          onClick={onRunPreset}
          className="w-full mt-auto py-2.5 px-4 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#58a6ff]/20"
        >
          <Play className="w-4 h-4 fill-black" />
          Load & Execute Preset
        </button>
      </div>
    </div>
  );
};
