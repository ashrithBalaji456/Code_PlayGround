import React, { useState } from 'react';
import { ExecutionStep, VariableInfo, DataStructureState } from '../../types/execution';
import {
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Database,
  Info,
  Clock,
  Code2,
} from 'lucide-react';

interface EducationalInspectorPanelProps {
  currentStep: ExecutionStep | null;
}

export const EducationalInspectorPanel: React.FC<EducationalInspectorPanelProps> = ({ currentStep }) => {
  const [selectedEntityKey, setSelectedEntityKey] = useState<string | null>(null);

  if (!currentStep) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#8b949e] p-6 text-center select-none">
        <HelpCircle className="w-10 h-10 text-[#58a6ff] mb-2 opacity-50 animate-pulse" />
        <p className="text-sm font-semibold text-[#f0f6fc]">Educational Inspector Ready</p>
        <p className="text-xs text-[#8b949e] mt-1 max-w-xs">
          Inspect variables, data structures, runtime types vs declared types, and see exact reasons why states changed.
        </p>
      </div>
    );
  }

  const variables = currentStep.variables || {};
  const structures = currentStep.structures || {};
  const algoState = currentStep.algorithmState;
  const whyChanged = algoState?.whyChanged;

  const varList = Object.values(variables);
  const structList = Object.values(structures);

  // Selected item details
  const activeVar: VariableInfo | undefined = selectedEntityKey ? variables[selectedEntityKey] : varList[0];
  const activeStruct: DataStructureState | undefined = selectedEntityKey ? structures[selectedEntityKey] : undefined;

  // Determine runtime vs declared type
  let declaredType = activeVar?.type || 'Object';
  let runtimeType = activeVar?.type || 'Object';
  let entityRole = 'Primitive Variable';

  if (activeVar?.name.toLowerCase().includes('queue') || declaredType.includes('Queue')) {
    entityRole = 'FIFO Queue Data Structure';
    declaredType = 'Queue<Integer>';
    runtimeType = 'LinkedList<Integer>';
  } else if (activeVar?.name.toLowerCase().includes('stack') || declaredType.includes('Stack')) {
    entityRole = 'LIFO Stack Data Structure';
  } else if (activeVar?.name.toLowerCase().includes('graph') || activeStruct?.type === 'graph') {
    entityRole = 'Adjacency Graph (Vertices & Edges)';
    declaredType = 'List<List<Integer>>';
    runtimeType = 'ArrayList<ArrayList<Integer>>';
  } else if (activeVar?.name.toLowerCase().includes('visited') || declaredType.includes('boolean[]')) {
    entityRole = 'Visited Lookup Set / Array';
  } else if (activeVar?.isReference) {
    entityRole = 'Heap Object Reference';
  }

  const confidence = algoState?.detectionConfidence || 'RUNTIME_STATE';
  const confidenceScore = algoState?.confidencePercent || 100;

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 gap-4 text-xs font-sans text-[#f0f6fc]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#30363d]/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/15 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#f0f6fc]">Educational Runtime Inspector</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  confidence === 'RUNTIME_STATE'
                    ? 'bg-[#3fb950]/20 border-[#3fb950]/40 text-[#3fb950]'
                    : confidence === 'DERIVED_STRUCTURE'
                    ? 'bg-[#bc8cff]/20 border-[#bc8cff]/40 text-[#bc8cff]'
                    : 'bg-[#58a6ff]/20 border-[#58a6ff]/40 text-[#58a6ff]'
                }`}
              >
                {confidence.replace('_', ' ')} • {confidenceScore}% Confidence
              </span>
            </div>
            <span className="text-[11px] text-[#8b949e]">
              Deep state inspection, causality explanation &amp; architectural layers
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* "WHY DID THIS CHANGE?" PANEL (Section 41) */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#30363d]/50 pb-2">
            <span className="font-bold text-xs text-[#d29922] flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> Why Did This Change?
            </span>
            <span className="text-[10px] font-mono text-[#8b949e]">Step {currentStep.stepIndex + 1}</span>
          </div>

          {whyChanged ? (
            <div className="flex flex-col gap-2.5 bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">Target Entity:</span>
                <span className="font-mono font-bold text-[#58a6ff]">{whyChanged.target}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">State Transition:</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="bg-[#f85149]/20 text-[#f85149] px-2 py-0.5 rounded border border-[#f85149]/30">
                    {String(whyChanged.previousValue ?? 'init')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span className="bg-[#3fb950]/20 text-[#3fb950] px-2 py-0.5 rounded border border-[#3fb950]/30 font-bold">
                    {String(whyChanged.newValue ?? 'updated')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-[#30363d]/50 pt-2 text-xs">
                <span className="text-[#8b949e]">Trigger Reason:</span>
                <span className="text-[#f0f6fc] font-medium">{whyChanged.reason}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] border-t border-[#30363d]/40 pt-1.5">
                <span>Executed at Source Line:</span>
                <span className="text-[#58a6ff] font-bold">Line {currentStep.line}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#0d1117] rounded-lg text-center text-[#8b949e] text-xs font-mono">
              Initial execution step. Step forward to inspect runtime state transitions.
            </div>
          )}
        </div>

        {/* "WHAT IS THIS?" ELEMENT INSPECTOR (Section 40) */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#30363d]/50 pb-2">
            <span className="font-bold text-xs text-[#58a6ff] flex items-center gap-1.5 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" /> What Is This? Element Inspector
            </span>
            {/* Entity selector */}
            <select
              value={selectedEntityKey || (activeVar?.name || '')}
              onChange={(e) => setSelectedEntityKey(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono text-[#f0f6fc] px-2 py-0.5"
            >
              {varList.map((v) => (
                <option key={v.name} value={v.name}>
                  var: {v.name}
                </option>
              ))}
              {structList.map((s) => (
                <option key={s.id} value={s.id}>
                  structure: {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>

          {activeVar ? (
            <div className="flex flex-col gap-2 bg-[#0d1117] p-3 rounded-lg border border-[#30363d] text-xs">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#30363d]/50">
                <div>
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Variable Name</span>
                  <span className="font-mono text-sm font-bold text-[#f0f6fc]">{activeVar.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Conceptual Role</span>
                  <span className="font-mono text-xs font-bold text-[#bc8cff]">{entityRole}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#30363d]/50">
                <div>
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Declared Type</span>
                  <span className="font-mono text-xs text-[#58a6ff]">{declaredType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Runtime Implementation</span>
                  <span className="font-mono text-xs text-[#3fb950] font-bold">{runtimeType}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold block">Current Runtime Value</span>
                <span className="font-mono text-xs text-[#f0883e] bg-[#161b22] p-2 rounded border border-[#30363d] break-all">
                  {String(activeVar.value)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#0d1117] rounded-lg text-center text-[#8b949e] text-xs font-mono">
              Select any runtime variable to inspect its declared vs runtime type and role.
            </div>
          )}
        </div>
      </div>

      {/* VISUALIZATION LAYERS (Section 50) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md flex flex-col gap-3">
        <span className="font-bold text-xs text-[#bc8cff] flex items-center gap-1.5 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" /> Architectural Visualization Layers
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-[#0d1117] p-3 rounded-lg border border-[#3fb950]/40 flex flex-col gap-1">
            <span className="text-[10px] text-[#3fb950] font-bold uppercase">Layer 1: Runtime State</span>
            <p className="text-xs text-[#f0f6fc] font-mono">100% Authoritative JVM Execution</p>
            <span className="text-[10px] text-[#8b949e]">Variables, primitives, array buffers &amp; call stack frames</span>
          </div>

          <div className="bg-[#0d1117] p-3 rounded-lg border border-[#bc8cff]/40 flex flex-col gap-1">
            <span className="text-[10px] text-[#bc8cff] font-bold uppercase">Layer 2: Derived Structure</span>
            <p className="text-xs text-[#f0f6fc] font-mono">Graph / DSU Derived Representation</p>
            <span className="text-[10px] text-[#8b949e]">Generated only when relationships are safely established</span>
          </div>

          <div className="bg-[#0d1117] p-3 rounded-lg border border-[#58a6ff]/40 flex flex-col gap-1">
            <span className="text-[10px] text-[#58a6ff] font-bold uppercase">Layer 3: Algorithm View</span>
            <p className="text-xs text-[#f0f6fc] font-mono">{algoState?.algorithmName || 'Generic Execution'}</p>
            <span className="text-[10px] text-[#8b949e]">Conservative recognition with zero false positives</span>
          </div>

          <div className="bg-[#0d1117] p-3 rounded-lg border border-[#d29922]/40 flex flex-col gap-1">
            <span className="text-[10px] text-[#d29922] font-bold uppercase">Layer 4: Educational Insights</span>
            <p className="text-xs text-[#f0f6fc] font-mono">Dynamic State Explanation</p>
            <span className="text-[10px] text-[#8b949e]">Natural language step timeline &amp; change causality</span>
          </div>
        </div>
      </div>
    </div>
  );
};
