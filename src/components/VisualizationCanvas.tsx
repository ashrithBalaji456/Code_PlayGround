import React from 'react';
import { ExecutionStep } from '../types/execution';
import { ArrayVisualizer } from './visualizers/ArrayVisualizer';
import { StackVisualizer } from './visualizers/StackVisualizer';
import { QueueVisualizer } from './visualizers/QueueVisualizer';
import { DequeVisualizer } from './visualizers/DequeVisualizer';
import { LinkedListVisualizer } from './visualizers/LinkedListVisualizer';
import { TreeVisualizer } from './visualizers/TreeVisualizer';
import { HeapVisualizer } from './visualizers/HeapVisualizer';
import { TrieVisualizer } from './visualizers/TrieVisualizer';
import { HashMapVisualizer } from './visualizers/HashMapVisualizer';
import { HashSetVisualizer } from './visualizers/HashSetVisualizer';
import { PriorityQueueVisualizer } from './visualizers/PriorityQueueVisualizer';
import { GraphVisualizer } from './visualizers/GraphVisualizer';
import { DSUVisualizer } from './visualizers/DSUVisualizer';
import { BitVisualizer } from './visualizers/BitVisualizer';
import { StringVisualizer } from './visualizers/StringVisualizer';
import { NumberVisualizer } from './visualizers/NumberVisualizer';
import { SegmentTreeVisualizer } from './visualizers/SegmentTreeVisualizer';
import { FenwickVisualizer } from './visualizers/FenwickVisualizer';
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

      {/* Beginner Action Story HUD */}
      {(() => {
        const isSwapAction = currentStep.event?.type === 'ARRAY_SWAP' || currentStep.event?.type === 'SWAP' || structures.some(s => s.swappingIndices && s.swappingIndices.length >= 2);
        const isCompareAction = !!comparison || structures.some(s => s.comparingIndices && s.comparingIndices.length >= 2);
        const isArrayUpdate = currentStep.event?.type === 'ARRAY_UPDATE';

        // What happened, Why, and What's next synthesis
        let whatHappened = currentStep.explanation;
        let whyItHappened = 'Advancing program control flow to the next instruction.';
        let whatNext = 'Evaluating subsequent line or loop iteration.';

        if (isSwapAction) {
          whatHappened = 'Two elements exchanged positions in memory.';
          whyItHappened = 'The earlier comparison determined they were in inverted order.';
          whatNext = 'The loop will advance to examine the next adjacent pair or partition.';
        } else if (isCompareAction) {
          whatHappened = comparison?.explanation || 'Selected two elements to compare their values.';
          whyItHappened = 'Algorithms must inspect elements to determine ordering or search direction.';
          whatNext = comparison?.result
            ? 'Condition met: an action (such as a swap or branch) will execute.'
            : 'Condition not met: elements retain their positions and the search continues.';
        } else if (isArrayUpdate) {
          whatHappened = `Assigned new value into array at index ${currentStep.event?.index ?? ''}.`;
          whyItHappened = 'Updating element storage with newly computed result.';
          whatNext = 'Proceeding to next statement.';
        }

        return (
          <div className="flex flex-col gap-2.5">
            <div className="bg-gradient-to-r from-[#161b22] via-[#1c2128] to-[#161b22] border border-[#30363d] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                {isSwapAction ? (
                  <span className="flex items-center gap-1.5 bg-[#bc8cff]/20 text-[#d2a8ff] border border-[#bc8cff]/50 text-xs font-mono font-bold px-3 py-1 rounded-xl animate-pulse">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    SWAPPING DATA
                  </span>
                ) : isCompareAction ? (
                  <span className="flex items-center gap-1.5 bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/50 text-xs font-mono font-bold px-3 py-1 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5" />
                    COMPARING ELEMENTS
                  </span>
                ) : isArrayUpdate ? (
                  <span className="flex items-center gap-1.5 bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/50 text-xs font-mono font-bold px-3 py-1 rounded-xl">
                    <span>↓</span>
                    WRITING TO MEMORY
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/50 text-xs font-mono font-bold px-3 py-1 rounded-xl">
                    <span>▶</span>
                    EXECUTING
                  </span>
                )}

                <div className="flex flex-col">
                  <span className="text-[11px] text-[#8b949e] font-semibold uppercase tracking-wider">What the computer is doing right now:</span>
                  <span className="text-sm font-semibold text-[#f0f6fc]">
                    {isSwapAction
                      ? 'Two elements are exchanging positions in memory to move toward their sorted places.'
                      : isCompareAction
                      ? (comparison?.explanation || 'Selecting and comparing elements to decide which one is larger/smaller.')
                      : isArrayUpdate
                      ? `Placing new value into memory array (arr[${currentStep.event?.index ?? ''}] = ${currentStep.event?.value ?? ''}).`
                      : currentStep.explanation}
                  </span>
                </div>
              </div>

              {/* Current Active Pointers Badges */}
              {Object.keys(currentStep.activePointers).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#8b949e] font-mono">Pointers:</span>
                  {Object.entries(currentStep.activePointers).map(([ptr, idx]) => (
                    <span
                      key={ptr}
                      className="bg-[#0d1117] text-[#58a6ff] border border-[#58a6ff]/40 text-xs font-mono font-bold px-2 py-0.5 rounded-lg shadow-sm"
                    >
                      {ptr} ➔ index {String(idx)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Beginner 3-Question Pedagogical Journey (Section 56) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-[#161b22] border border-[#30363d]/70 rounded-xl p-2.5 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] text-[#58a6ff] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff]" />
                  What Changed?
                </span>
                <span className="text-[#f0f6fc] text-[11px] line-clamp-2">{whatHappened}</span>
              </div>

              <div className="bg-[#161b22] border border-[#30363d]/70 rounded-xl p-2.5 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] text-[#eab308] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                  Why?
                </span>
                <span className="text-[#8b949e] text-[11px] line-clamp-2">{whyItHappened}</span>
              </div>

              <div className="bg-[#161b22] border border-[#30363d]/70 rounded-xl p-2.5 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] text-[#3fb950] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                  What's Next?
                </span>
                <span className="text-[#8b949e] text-[11px] line-clamp-2">{whatNext}</span>
              </div>
            </div>

            {/* Visual Legend Bar (Section 54) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#0d1117]/80 border border-[#30363d]/60 rounded-xl text-[11px] font-mono shadow-sm">
              <span className="text-[#8b949e] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse" />
                Visual Legend:
              </span>
              <div className="flex items-center gap-3.5 flex-wrap">
                <span className="flex items-center gap-1 text-[#58a6ff]">
                  <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
                  Active
                </span>
                <span className="flex items-center gap-1 text-[#eab308]">
                  <span className="w-2 h-2 rounded-full bg-[#eab308]" />
                  Compared
                </span>
                <span className="flex items-center gap-1 text-[#bc8cff]">
                  <span className="w-2 h-2 rounded-full bg-[#bc8cff]" />
                  Swapping
                </span>
                <span className="flex items-center gap-1 text-[#3fb950]">
                  <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
                  Sorted / Match
                </span>
                <span className="flex items-center gap-1 text-[#f85149]">
                  <span className="w-2 h-2 rounded-full bg-[#f85149]" />
                  Removed / Pop
                </span>
                <span className="flex items-center gap-1 text-[#39c5cf]">
                  <span className="font-bold">➔</span>
                  Pointer Pin
                </span>
              </div>
            </div>
          </div>
        );
      })()}

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
                      comparisonIndices={st.comparingIndices}
                      activeIndices={st.activeIndices}
                      lastEvent={currentStep.event}
                      comparisonInfo={currentStep.comparison || undefined}
                      whyChanged={currentStep.algorithmState?.whyChanged}
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
                  visualizer = (
                    <div className="flex flex-col gap-3">
                      <PriorityQueueVisualizer structure={st} lastEvent={currentStep.event} />
                      {st.priorityQueueData && st.priorityQueueData.length > 0 && (
                        <HeapVisualizer structure={st} lastEvent={currentStep.event} />
                      )}
                    </div>
                  );
                  break;
                case 'heap':
                  visualizer = <HeapVisualizer structure={st} lastEvent={currentStep.event} />;
                  break;
                case 'tree':
                case 'bst':
                  visualizer = <TreeVisualizer structure={st} />;
                  break;
                case 'trie':
                  visualizer = <TrieVisualizer structure={st} />;
                  break;
                case 'graph':
                  visualizer = <GraphVisualizer structure={st} />;
                  break;
                case 'dsu':
                  visualizer = <DSUVisualizer structure={st} />;
                  break;
                case 'bits':
                  visualizer = <BitVisualizer structure={st} />;
                  break;
                case 'string':
                  visualizer = <StringVisualizer structure={st} />;
                  break;
                case 'number':
                  visualizer = <NumberVisualizer structure={st} />;
                  break;
                case 'segmenttree':
                  visualizer = <SegmentTreeVisualizer structure={st} />;
                  break;
                case 'fenwick':
                  visualizer = <FenwickVisualizer structure={st} />;
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

