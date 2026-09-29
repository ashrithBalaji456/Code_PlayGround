import React from 'react';
import { JavaConceptInfo } from '../../types/execution';
import { BookOpen, Sparkles, CheckCircle2, Info, ArrowRight } from 'lucide-react';

interface JavaConceptPanelProps {
  concept: JavaConceptInfo | null | undefined;
  line?: number;
}

export const JavaConceptPanel: React.FC<JavaConceptPanelProps> = ({ concept, line }) => {
  if (!concept) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#8b949e] font-mono text-xs select-none">
        <BookOpen className="w-8 h-8 mb-2 text-[#58a6ff]/40" />
        <p className="font-semibold text-[#f0f6fc] text-sm mb-1">Live Java Concept Monitor</p>
        <p className="max-w-md text-[#8b949e]">
          Execute Java code with OOP, Constructors, Polymorphism, Exceptions, Collections, or Threads to see dynamic runtime concept explanations here.
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

  const colors = categoryColors[concept.category] || categoryColors.OOP;

  return (
    <div className="h-full flex flex-col bg-[#161b22] border border-[#30363d] rounded-xl p-4 overflow-y-auto text-xs font-mono shadow-lg gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${colors.text}`} />
          <span className="font-bold text-sm text-[#f0f6fc]">{concept.name}</span>
          {concept.badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
              {concept.badge}
            </span>
          )}
        </div>
        {line && (
          <span className="text-[10px] text-[#8b949e] px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d]">
            Line {line}
          </span>
        )}
      </div>

      {/* Primary Explanation Box */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-[#f0f6fc] leading-relaxed">
        {concept.explanation}
      </div>

      {/* Dynamic Key-Value Details */}
      {concept.details && Object.keys(concept.details).length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">
            Runtime Details:
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

      {/* Educational Note */}
      <div className="mt-auto pt-2 border-t border-[#30363d]/60 text-[10px] text-[#8b949e] flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-[#58a6ff] flex-shrink-0" />
        <span>Educational JVM Concept Model — Observed from real execution trace.</span>
      </div>
    </div>
  );
};
