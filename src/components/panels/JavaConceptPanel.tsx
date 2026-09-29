import React, { useState } from 'react';
import { JavaConceptInfo } from '../../types/execution';
import { BookOpen, Sparkles, CheckCircle2, Info, ArrowRight, HelpCircle, Lightbulb, Zap, Award } from 'lucide-react';

interface JavaConceptPanelProps {
  concept: JavaConceptInfo | null | undefined;
  line?: number;
  beginnerExplanation?: {
    what: string;
    why?: string;
    actionType?: string;
  };
}

export const JavaConceptPanel: React.FC<JavaConceptPanelProps> = ({ concept, line, beginnerExplanation }) => {
  const [mode, setMode] = useState<'beginner' | 'advanced'>('beginner');

  if (!concept && !beginnerExplanation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#8b949e] font-mono text-xs select-none">
        <BookOpen className="w-8 h-8 mb-2 text-[#58a6ff]/40" />
        <p className="font-semibold text-[#f0f6fc] text-sm mb-1">Live Java Concept & Explanation Monitor</p>
        <p className="max-w-md text-[#8b949e]">
          Execute Java code with OOP, Constructors, Polymorphism, Exceptions, Memory, or Strings to see dynamic runtime explanations here.
        </p>
      </div>
    );
  }

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    OOP: { bg: 'bg-[#58a6ff]/15', text: 'text-[#58a6ff]', border: 'border-[#58a6ff]/30' },
    MEMORY: { bg: 'bg-[#3fb950]/15', text: 'text-[#3fb950]', border: 'border-[#3fb950]/30' },
    CONTROL_FLOW: { bg: 'bg-[#d29922]/15', text: 'text-[#d29922]', border: 'border-[#d29922]/30' },
    EXCEPTIONS: { bg: 'bg-[#f85149]/15', text: 'text-[#f85149]', border: 'border-[#f85149]/30' },
    COLLECTIONS: { bg: 'bg-[#bc8cff]/15', text: 'text-[#bc8cff]', border: 'border-[#bc8cff]/30' },
    CONCURRENCY: { bg: 'bg-[#39c5cf]/15', text: 'text-[#39c5cf]', border: 'border-[#39c5cf]/30' },
    MODERN_JAVA: { bg: 'bg-[#e3b341]/15', text: 'text-[#e3b341]', border: 'border-[#e3b341]/30' },
  };

  const currentCategory = concept?.category || 'OOP';
  const colors = categoryColors[currentCategory] || categoryColors.OOP;

  const whatText = beginnerExplanation?.what || concept?.explanation || 'Java executed the current instruction.';
  const whyText = beginnerExplanation?.why || concept?.whyExplanation || 'The Java Virtual Machine follows the standard Java language execution specifications.';

  return (
    <div className="h-full flex flex-col bg-[#161b22] border border-[#30363d] rounded-xl p-3 overflow-y-auto text-xs font-mono shadow-lg gap-3">
      {/* Header with Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${colors.text}`} />
          <span className="font-bold text-sm text-[#f0f6fc]">
            {mode === 'beginner' ? 'What Just Happened?' : (concept?.name || 'JVM Concept')}
          </span>
          {concept?.badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
              {concept.badge}
            </span>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] text-[11px]">
          <button
            onClick={() => setMode('beginner')}
            className={`px-2 py-0.5 rounded transition-all font-semibold flex items-center gap-1 ${
              mode === 'beginner'
                ? 'bg-[#58a6ff] text-[#0d1117]'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <span>🎓</span>
            <span>Beginner</span>
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`px-2 py-0.5 rounded transition-all font-semibold flex items-center gap-1 ${
              mode === 'advanced'
                ? 'bg-[#bc8cff] text-[#0d1117]'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <span>⚡</span>
            <span>Advanced</span>
          </button>
          {line && (
            <span className="text-[10px] text-[#8b949e] px-1.5 py-0.5 border-l border-[#30363d]">
              L{line}
            </span>
          )}
        </div>
      </div>

      {mode === 'beginner' ? (
        /* BEGINNER MODE: WHAT JUST HAPPENED & WHY */
        <div className="flex flex-col gap-3">
          {/* What Just Happened Card */}
          <div className="bg-[#0d1117] border border-[#58a6ff]/40 rounded-xl p-3 flex flex-col gap-1.5 shadow">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#58a6ff]">
              <HelpCircle className="w-4 h-4" />
              <span className="uppercase tracking-wider">What Just Happened:</span>
            </div>
            <p className="text-sm font-semibold text-[#f0f6fc] leading-relaxed">
              {whatText}
            </p>
          </div>

          {/* Why Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#d29922]">
              <Lightbulb className="w-4 h-4" />
              <span className="uppercase tracking-wider">Why Does Java Do This?</span>
            </div>
            <p className="text-xs text-[#c9d1d9] leading-relaxed">
              {whyText}
            </p>
          </div>

          {beginnerExplanation?.actionType && (
            <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
              <Award className="w-3.5 h-3.5 text-[#3fb950]" />
              <span>Concept Category: <strong className="text-[#3fb950]">{beginnerExplanation.actionType.replace(/_/g, ' ')}</strong></span>
            </div>
          )}
        </div>
      ) : (
        /* ADVANCED MODE: TECHNICAL JVM BREAKDOWN */
        <div className="flex flex-col gap-3">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs text-[#f0f6fc] leading-relaxed">
            {concept?.explanation || whatText}
          </div>

          {concept?.details && Object.keys(concept.details).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">
                Runtime JVM Telemetry:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(concept.details).map(([k, v]) => (
                  <div
                    key={k}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2 flex items-center justify-between text-xs"
                  >
                    <span className="text-[#8b949e] capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-bold text-[#58a6ff] truncate max-w-[150px]">
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational Note */}
      <div className="mt-auto pt-2 border-t border-[#30363d]/60 text-[10px] text-[#8b949e] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#58a6ff] flex-shrink-0" />
          <span>Educational JVM Execution Model — Grounded in Real Runtime Traces</span>
        </span>
        <span className="text-[#3fb950] font-semibold">Phase 11 Visualizer</span>
      </div>
    </div>
  );
};
