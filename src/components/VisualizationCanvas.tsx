import React from 'react';
import { ExecutionStep } from '../types/execution';
import { ArrayVisualizer } from './visualizers/ArrayVisualizer';
import { StackVisualizer } from './visualizers/StackVisualizer';
import { QueueVisualizer } from './visualizers/QueueVisualizer';
import { DequeVisualizer } from './visualizers/DequeVisualizer';
import { LinkedListVisualizer } from './visualizers/LinkedListVisualizer';
import { TreeVisualizer } from './visualizers/TreeVisualizer';
import { HashMapVisualizer } from './visualizers/HashMapVisualizer';
import { HashSetVisualizer } from './visualizers/HashSetVisualizer';
import { PriorityQueueVisualizer } from './visualizers/PriorityQueueVisualizer';
import { GraphVisualizer } from './visualizers/GraphVisualizer';
import { Sparkles, AlertCircle, ArrowRightLeft } from 'lucide-react';

interface VisualizationCanvasProps {
  currentStep: ExecutionStep | null;
  isRunning: boolean;
}

export const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  currentStep,
}) => {
  if (!currentStep) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0b0e14] text-[#8b949e] p-8 select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4 text-[#58a6ff] shadow-xl">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-1">Visualizer Canvas Ready</h3>
        <p className="text-sm text-[#8b949e] max-w-sm text-center">
          Write Java or Python code on the left, or pick a preset algorithm, then click <strong className="text-[#3fb950]">Run</strong> to watch live memory and data structures evolve.
        </p>
      </div>
    );
  }

  const structures = Object.values(currentStep.structures);
  const comparison = currentStep.comparison;
  const error = currentStep.error;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0b0e14] p-4 flex flex-col gap-4">
      {/* Active Step Explanation Banner */}
      <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl px-4 py-3 flex items-center justify-between shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 text-xs font-mono font-bold px-2.5 py-1 rounded-md">
            Line {currentStep.line}
          </span>
          <span className="text-sm font-medium text-[#f0f6fc]">
            {currentStep.explanation}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
          <span>Step {currentStep.stepIndex + 1}</span>
          {currentStep.totalSteps && (
            <span>/ {currentStep.totalSteps}</span>
          )}
        </div>
      </div>

      {/* Condition Evaluation Banner if active */}
      {comparison && (
        <div
          className={`border rounded-xl p-3.5 flex items-center justify-between shadow-md transition-all ${
            comparison.result
              ? 'bg-[#3fb950]/10 border-[#3fb950]/50 text-[#3fb950]'
              : 'bg-[#f85149]/10 border-[#f85149]/50 text-[#f85149]'
          }`}
        >
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-bold">
                Condition Evaluated
              </span>
              <span className="font-mono text-sm font-semibold">
                {comparison.explanation}
              </span>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
              comparison.result ? 'bg-[#3fb950] text-black' : 'bg-[#f85149] text-white'
            }`}
          >
            {comparison.result ? 'Branch Taken (TRUE)' : 'Branch Skipped (FALSE)'}
          </div>
        </div>
      )}

      {/* Error Callout if exception occurred */}
      {error && (
        <div className="bg-[#f85149]/15 border-2 border-[#f85149] rounded-xl p-4 shadow-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#f85149] font-bold text-base">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error.type} on Line {error.line}</span>
          </div>
          <p className="text-sm text-[#f0f6fc] font-mono bg-[#0d1117]/80 p-2.5 rounded border border-[#f85149]/30">
            {error.message}
          </p>
          <p className="text-xs text-[#8b949e]">
            {error.detail}
          </p>
          {error.brokenReference && (
            <div className="flex items-center gap-2 text-xs font-mono bg-[#161b22] p-2 rounded border border-[#30363d] text-[#f85149]">
              <span>Broken Pointer:</span>
              <span className="font-bold text-[#f0f6fc]">{error.brokenReference.source}</span>
              <span>────✖</span>
              <span className="italic font-bold">null (Cannot dereference null object!)</span>
            </div>
          )}
        </div>
      )}

      {/* Render Dynamic Structures */}
      {structures.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center text-[#8b949e] font-mono text-sm">
          No data structures initialized yet in current step.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Top Row for Multiple Stacks if present */}
          {structures.some((s) => s.type === 'stack') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {structures
                .filter((s) => s.type === 'stack')
                .map((st) => (
                  <div key={st.id} id={`dsa-struct-${st.id}`} className="transition-all duration-300 rounded-xl">
                    <StackVisualizer structure={st} />
                  </div>
                ))}
            </div>
          )}

          {/* Render All Non-Stack Structures */}
          {structures
            .filter((s) => s.type !== 'stack')
            .map((st) => {
              let visualizer = null;
              switch (st.type) {
                case 'array':
                case 'matrix':
                  visualizer = (
                    <ArrayVisualizer
                      structure={st}
                      pointers={currentStep.activePointers}
                      lastEvent={currentStep.event}
                    />
                  );
                  break;
                case 'queue':
                  visualizer = <QueueVisualizer structure={st} />;
                  break;
                case 'deque':
                  visualizer = <DequeVisualizer structure={st} lastEvent={currentStep.event} />;
                  break;
                case 'linkedlist':
                  visualizer = (
                    <LinkedListVisualizer
                      structure={st}
                      pointers={currentStep.activePointers}
                    />
                  );
                  break;
                case 'map':
                  visualizer = <HashMapVisualizer structure={st} />;
                  break;
                case 'set':
                  visualizer = <HashSetVisualizer structure={st} lastEvent={currentStep.event} />;
                  break;
                case 'priorityqueue':
                  visualizer = <PriorityQueueVisualizer structure={st} lastEvent={currentStep.event} />;
                  break;
                case 'tree':
                  visualizer = <TreeVisualizer structure={st} />;
                  break;
                case 'graph':
                  visualizer = <GraphVisualizer structure={st} />;
                  break;
                default:
                  visualizer = null;
              }
              if (!visualizer) return null;
              return (
                <div key={st.id} id={`dsa-struct-${st.id}`} className="transition-all duration-300 rounded-xl">
                  {visualizer}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

