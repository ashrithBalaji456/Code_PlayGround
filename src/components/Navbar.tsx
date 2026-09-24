import React from 'react';
import { SupportedLanguage, CodePreset } from '../types/execution';
import { CODE_PRESETS } from '../presets';
import {
  Code2,
  BookOpen,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';

interface NavbarProps {
  language: SupportedLanguage;
  selectedPresetId: string;
  isLearningMode: boolean;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onSelectPreset: (preset: CodePreset) => void;
  onToggleLearningMode: () => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  selectedPresetId,
  isLearningMode,
  onLanguageChange,
  onSelectPreset,
  onToggleLearningMode,
  onOpenHelp,
}) => {
  // Group presets by category
  const categories = Array.from(new Set(CODE_PRESETS.map((p) => p.category)));

  return (
    <header className="h-14 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between shadow-md select-none z-20">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#58a6ff] to-[#bc8cff] p-0.5 flex items-center justify-center shadow-lg">
          <div className="w-full h-full bg-[#0d1117] rounded-[7px] flex items-center justify-center">
            <Code2 className="w-4 h-4 text-[#58a6ff]" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm text-[#f0f6fc] tracking-tight">
              CodeFlow <span className="text-[#58a6ff]">DSA Lab</span>
            </h1>
            <span className="text-[10px] bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30 px-1.5 py-0.2 rounded font-mono font-semibold">
              v1.0
            </span>
          </div>
          <span className="text-[10px] text-[#8b949e]">
            Live Execution & Memory Architecture
          </span>
        </div>
      </div>

      {/* Center Controls: Preset Selector & Language Selector */}
      <div className="flex items-center gap-3">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1">
          <FolderOpen className="w-3.5 h-3.5 text-[#8b949e]" />
          <select
            value={selectedPresetId}
            onChange={(e) => {
              const p = CODE_PRESETS.find((x) => x.id === e.target.value);
              if (p) onSelectPreset(p);
            }}
            className="bg-transparent text-xs font-mono text-[#f0f6fc] focus:outline-none cursor-pointer max-w-[220px]"
          >
            {categories.map((cat) => (
              <optgroup key={cat} label={cat} className="bg-[#161b22] text-[#8b949e]">
                {CODE_PRESETS.filter((p) => p.category === cat).map((p) => (
                  <option key={p.id} value={p.id} className="text-[#f0f6fc]">
                    {p.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
          <button
            onClick={() => onLanguageChange('java')}
            className={`text-xs px-2.5 py-1 rounded font-mono font-semibold transition-all ${
              language === 'java'
                ? 'bg-[#58a6ff] text-black shadow'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Java
          </button>
          <button
            onClick={() => onLanguageChange('python')}
            className={`text-xs px-2.5 py-1 rounded font-mono font-semibold transition-all ${
              language === 'python'
                ? 'bg-[#3fb950] text-black shadow'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Python
          </button>
        </div>
      </div>

      {/* Right Controls: Learning Mode & Help */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleLearningMode}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            isLearningMode
              ? 'bg-[#bc8cff]/20 border-[#bc8cff] text-[#bc8cff] font-bold shadow-md shadow-[#bc8cff]/20'
              : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]'
          }`}
          title="Toggle Learning Mode Study Guide"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Study Guide</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition-colors"
          title="Shortcuts & Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
