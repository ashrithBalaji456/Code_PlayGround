import React, { useState } from 'react';
import { ExecutionStep, HeapObject, ClassMetadata, OOPRelationship, PolymorphismInfo, StreamPipelineState, IteratorState } from '../../types/execution';
import { GitBranch, Layers, Box, Cpu, ArrowRight, CheckCircle, XCircle, Clock, Shield, Compass, Sparkles } from 'lucide-react';

interface OOPInspectorPanelProps {
  currentStep: ExecutionStep | null;
}

export const OOPInspectorPanel: React.FC<OOPInspectorPanelProps> = ({ currentStep }) => {
  const [activeSubTab, setActiveSubTab] = useState<'polymorphism' | 'object' | 'class' | 'relationships' | 'streams'>('polymorphism');
  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('');

  const polyInfo: PolymorphismInfo | null = currentStep?.polymorphismInfo || null;
  const heap: HeapObject[] = currentStep?.heap || [];
  const classMeta: Record<string, ClassMetadata> = currentStep?.classMetadata || {};
  const relationships: OOPRelationship[] = currentStep?.oopRelationships || [];
  const streamPipeline: StreamPipelineState | null = currentStep?.streamPipeline || null;
  const iteratorState: IteratorState | null = currentStep?.iteratorState || null;

  // Active object for Object Inspector
  const activeObjId = selectedObjectId || (heap.length > 0 ? heap[heap.length - 1].id : '');
  const activeObj = heap.find((o) => o.id === activeObjId || o.objectId === activeObjId) || (heap.length > 0 ? heap[heap.length - 1] : null);

  // Active class for Class Inspector
  const classNames = Object.keys(classMeta);
  const activeClsName = selectedClassName || (classNames.length > 0 ? classNames[0] : '');
  const activeCls = classMeta[activeClsName] || (classNames.length > 0 ? classMeta[classNames[0]] : null);

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-[#f0f6fc] font-sans overflow-hidden border border-[#30363d] rounded-lg">
      {/* Panel Sub-Tab Navigation Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] flex-shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('polymorphism')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'polymorphism'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Polymorphism & Dispatch</span>
            {polyInfo && <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveSubTab('object')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'object'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Object Inspector</span>
            <span className="text-[10px] bg-[#30363d] px-1.5 rounded-full">{heap.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('class')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'class'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Class Inspector</span>
            <span className="text-[10px] bg-[#30363d] px-1.5 rounded-full">{classNames.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('relationships')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'relationships'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>OOP Relationships</span>
            <span className="text-[10px] bg-[#30363d] px-1.5 rounded-full">{relationships.length}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('streams')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'streams'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Streams & Iterators</span>
            {(streamPipeline || iteratorState) && <span className="w-2 h-2 rounded-full bg-[#d29922] animate-pulse" />}
          </button>
        </div>

        <div className="text-[11px] font-mono text-[#8b949e] hidden sm:block">
          Step {currentStep ? currentStep.stepIndex + 1 : 0} of {currentStep ? currentStep.totalSteps : 0}
        </div>
      </div>

      {/* Sub-Tab Content View */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ======================================================== */}
        {/* 1. POLYMORPHISM INSPECTOR (Section 65)                    */}
        {/* ======================================================== */}
        {activeSubTab === 'polymorphism' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#58a6ff]" />
                  Polymorphism & Dynamic Dispatch Inspector
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Visualizes declared reference types vs actual runtime heap types and virtual method resolution.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30">
                RUNTIME VERIFIED
              </span>
            </div>

            {polyInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Declared vs Runtime Card */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                    Type Comparison
                  </div>
                  <div className="flex items-center justify-between bg-[#0d1117] p-2.5 rounded border border-[#21262d]">
                    <div>
                      <div className="text-[11px] text-[#8b949e]">Declared Reference Type</div>
                      <div className="text-sm font-bold font-mono text-[#58a6ff]">
                        {polyInfo.declaredType || 'Object'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8b949e]" />
                    <div className="text-right">
                      <div className="text-[11px] text-[#8b949e]">Actual Runtime Heap Type</div>
                      <div className="text-sm font-bold font-mono text-[#3fb950]">
                        {polyInfo.runtimeType || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <span className="text-[#8b949e]">Variable:</span>{' '}
                      <span className="font-mono font-semibold text-[#e3b341]">
                        {polyInfo.variableName || 'reference'}
                      </span>
                    </div>
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <span className="text-[#8b949e]">Heap Object:</span>{' '}
                      <span className="font-mono font-semibold text-[#a371f7]">
                        {polyInfo.objectId || 'object-1'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Method Resolution Card */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                    Virtual Method Resolution
                  </div>
                  <div className="bg-[#0d1117] p-2.5 rounded border border-[#21262d] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e]">Method Invoked:</span>
                      <span className="font-mono text-[#f0f6fc]">{polyInfo.methodName || 'method()'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e]">Resolved Implementation:</span>
                      <span className="font-mono font-bold text-[#3fb950]">
                        {polyInfo.resolvedImplementation || `${polyInfo.runtimeType}.${polyInfo.methodName}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e]">Overridden:</span>
                      <span className="font-semibold text-[#58a6ff]">YES (Dynamic Dispatch)</span>
                    </div>
                  </div>

                  <div className="text-[11px] bg-[#388bfd]/10 text-[#58a6ff] p-2 rounded border border-[#388bfd]/20">
                    <strong>Why this resolved:</strong> The JVM virtual method table (vtable) looked up the implementation on the actual heap object (<span className="font-mono">{polyInfo.runtimeType}</span>) rather than the declared reference (<span className="font-mono">{polyInfo.declaredType}</span>).
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] space-y-2">
                <GitBranch className="w-8 h-8 mx-auto text-[#484f58]" />
                <p className="text-xs">
                  No polymorphic method dispatch on the current execution step.
                </p>
                <p className="text-[11px] text-[#6e7681]">
                  Step through your program to see declared reference types dispatch dynamically to runtime subclasses.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. OBJECT INSPECTOR (Section 64)                         */}
        {/* ======================================================== */}
        {activeSubTab === 'object' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Box className="w-4 h-4 text-[#58a6ff]" />
                  Java Heap Object Inspector
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Inspects heap objects, instance fields, nested references, and garbage collector reachability.
                </p>
              </div>

              {/* Object Selector */}
              {heap.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8b949e]">Object:</span>
                  <select
                    value={activeObj?.id || ''}
                    onChange={(e) => setSelectedObjectId(e.target.value)}
                    className="bg-[#161b22] border border-[#30363d] text-xs rounded px-2 py-1 text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
                  >
                    {heap.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.className} ({o.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeObj ? (
              <div className="space-y-3">
                {/* Object Metadata Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded-lg">
                    <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Object ID</div>
                    <div className="text-xs font-mono font-bold text-[#a371f7]">{activeObj.id}</div>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded-lg">
                    <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Runtime Class</div>
                    <div className="text-xs font-mono font-bold text-[#3fb950]">{activeObj.className}</div>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded-lg">
                    <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Reachability</div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      {activeObj.reachable !== false ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-[#3fb950]" />
                          <span className="text-[#3fb950]">Reachable</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-[#f85149]" />
                          <span className="text-[#f85149]">GC Eligible</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded-lg">
                    <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Memory Size</div>
                    <div className="text-xs font-mono text-[#8b949e]">
                      {activeObj.estimatedBytes || 24} bytes (typical)
                    </div>
                  </div>
                </div>

                {/* References pointing to this object */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 text-xs">
                  <span className="text-[#8b949e]">Pointing References:</span>{' '}
                  {activeObj.referencesFrom && activeObj.referencesFrom.length > 0 ? (
                    activeObj.referencesFrom.map((r, i) => (
                      <span
                        key={i}
                        className="inline-block bg-[#0d1117] border border-[#30363d] px-1.5 py-0.5 rounded font-mono text-[#e3b341] mr-1"
                      >
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#8b949e] italic">No active stack references</span>
                  )}
                </div>

                {/* Fields Table */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-[#21262d] text-xs font-semibold text-[#8b949e] border-b border-[#30363d] flex items-center justify-between">
                    <span>Instance Fields</span>
                    <span className="text-[10px] text-[#8b949e]">
                      {Object.keys(activeObj.fields || {}).length} field(s)
                    </span>
                  </div>
                  {Object.keys(activeObj.fields || {}).length > 0 ? (
                    <div className="divide-y divide-[#30363d]/50 font-mono text-xs">
                      {Object.entries(activeObj.fields).map(([fKey, fVal]) => {
                        const isObjRef = typeof fVal === 'string' && fVal.startsWith('object-');
                        return (
                          <div key={fKey} className="px-3 py-2 flex items-center justify-between hover:bg-[#0d1117]/40">
                            <span className="text-[#79c0ff]">{fKey}</span>
                            <span className={isObjRef ? 'text-[#a371f7] font-bold' : 'text-[#f0f6fc]'}>
                              {JSON.stringify(fVal)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-xs text-[#8b949e] text-center italic">
                      No instance fields recorded.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e]">
                No heap objects instantiated yet.
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. CLASS INSPECTOR (Section 66)                          */}
        {/* ======================================================== */}
        {activeSubTab === 'class' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#58a6ff]" />
                  Class Metadata Inspector
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Inspects declared classes, superclasses, interfaces, and modifiers.
                </p>
              </div>

              {/* Class Selector */}
              {classNames.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8b949e]">Class:</span>
                  <select
                    value={activeCls?.className || ''}
                    onChange={(e) => setSelectedClassName(e.target.value)}
                    className="bg-[#161b22] border border-[#30363d] text-xs rounded px-2 py-1 text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
                  >
                    {classNames.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeCls ? (
              <div className="space-y-3">
                {/* Source Metadata Warning Badge (Section 66 & 78) */}
                <div className="flex items-center justify-between bg-[#1f6feb]/10 border border-[#1f6feb]/30 px-3 py-1.5 rounded-lg text-xs">
                  <div className="flex items-center gap-2 text-[#58a6ff]">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="font-semibold">SOURCE METADATA</span>
                  </div>
                  <span className="text-[11px] text-[#8b949e]">
                    Parsed directly from Java declarations (static structure)
                  </span>
                </div>

                {/* Class Details Card */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold text-[#f0f6fc]">
                      {activeCls.accessModifier} {activeCls.isAbstract ? 'abstract ' : ''}
                      {activeCls.isFinal ? 'final ' : ''}
                      {activeCls.isInterface ? 'interface ' : activeCls.isEnum ? 'enum ' : 'class '}
                      <span className="text-[#3fb950]">{activeCls.className}</span>
                    </span>
                    <span className="text-[10px] bg-[#30363d] px-2 py-0.5 rounded font-mono text-[#8b949e]">
                      {activeCls.packageName || 'default package'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <span className="text-[#8b949e]">Superclass:</span>{' '}
                      <span className="font-mono text-[#58a6ff] font-semibold">
                        {activeCls.superClass || 'java.lang.Object'}
                      </span>
                    </div>
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <span className="text-[#8b949e]">Interfaces:</span>{' '}
                      {activeCls.interfaces && activeCls.interfaces.length > 0 ? (
                        activeCls.interfaces.map((iface, i) => (
                          <span
                            key={i}
                            className="inline-block bg-[#161b22] border border-[#30363d] px-1.5 py-0.5 rounded font-mono text-[#e3b341] mr-1"
                          >
                            {iface}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#8b949e] italic">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e]">
                No class metadata available.
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. OOP RELATIONSHIPS (Section 67)                        */}
        {/* ======================================================== */}
        {activeSubTab === 'relationships' && (
          <div className="space-y-3">
            <div className="border-b border-[#30363d] pb-2">
              <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#58a6ff]" />
                OOP Relationships (Inheritance, Implementation, Composition, Aggregation)
              </h3>
              <p className="text-xs text-[#8b949e]">
                Structural relationships between Java types and runtime objects.
              </p>
            </div>

            {relationships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {relationships.map((rel, idx) => (
                  <div
                    key={idx}
                    className="bg-[#161b22] border border-[#30363d] p-2.5 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#f0f6fc]">{rel.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
                      <span className="font-mono font-bold text-[#58a6ff]">{rel.to}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        rel.type === 'INHERITANCE'
                          ? 'bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd]/30'
                          : rel.type === 'IMPLEMENTATION'
                          ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
                          : rel.type === 'COMPOSITION'
                          ? 'bg-[#a371f7]/20 text-[#d2a8ff] border border-[#a371f7]/30'
                          : 'bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/30'
                      }`}
                    >
                      {rel.label || rel.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e]">
                No OOP relationships detected in the current code snippet.
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. STREAMS & ITERATORS (Section 68 & 69)                  */}
        {/* ======================================================== */}
        {activeSubTab === 'streams' && (
          <div className="space-y-4">
            {/* Stream Pipeline Section */}
            <div>
              <div className="border-b border-[#30363d] pb-2 mb-3">
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#e3b341]" />
                  Java Stream Pipeline Flow
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Step-by-step element evaluation across intermediate and terminal operations with laziness visualization.
                </p>
              </div>

              {streamPipeline ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8b949e]">
                      Source Collection: <span className="font-mono text-[#58a6ff]">{streamPipeline.sourceCollection}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        streamPipeline.isLazy
                          ? 'bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/30'
                          : 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
                      }`}
                    >
                      {streamPipeline.isLazy ? 'LAZY (Deferred Execution)' : 'TERMINAL EVALUATED'}
                    </span>
                  </div>

                  {/* Pipeline Flow Stages */}
                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    {streamPipeline.stages.map((stg, i) => (
                      <React.Fragment key={i}>
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-center min-w-[100px] flex-shrink-0">
                          <div className="text-[10px] text-[#8b949e] uppercase font-semibold">Stage {i + 1}</div>
                          <div className="text-xs font-mono font-bold text-[#f0f6fc] mt-0.5">
                            {stg.operation}()
                          </div>
                        </div>
                        {i < streamPipeline.stages.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {streamPipeline.currentElement !== undefined && (
                    <div className="bg-[#0d1117] border border-[#21262d] p-2.5 rounded text-xs flex items-center justify-between">
                      <span className="text-[#8b949e]">Current Element Evaluated:</span>
                      <span className="font-mono font-bold text-[#3fb950]">
                        {JSON.stringify(streamPipeline.currentElement)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-center text-xs text-[#8b949e]">
                  No active Stream pipeline on this step.
                </div>
              )}
            </div>

            {/* Iterator Cursor Section */}
            <div>
              <div className="border-b border-[#30363d] pb-2 mb-3">
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#58a6ff]" />
                  Iterator Cursor Visualizer
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Tracks Iterator and ListIterator cursor index, direction, and hasNext state.
                </p>
              </div>

              {iteratorState ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <div className="text-[10px] text-[#8b949e]">Iterator ID</div>
                      <div className="font-mono font-bold text-[#58a6ff]">{iteratorState.iteratorId}</div>
                    </div>
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <div className="text-[10px] text-[#8b949e]">Cursor Index</div>
                      <div className="font-mono font-bold text-[#e3b341]">{iteratorState.cursorIndex}</div>
                    </div>
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <div className="text-[10px] text-[#8b949e]">hasNext()</div>
                      <div className={`font-bold ${iteratorState.hasNext ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                        {iteratorState.hasNext ? 'true' : 'false'}
                      </div>
                    </div>
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <div className="text-[10px] text-[#8b949e]">Direction</div>
                      <div className="font-bold text-[#a371f7]">
                        {iteratorState.direction || 'FORWARD'}
                      </div>
                    </div>
                  </div>

                  {iteratorState.currentElement !== undefined && (
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] text-xs flex items-center justify-between">
                      <span className="text-[#8b949e]">Last Visited Element:</span>
                      <span className="font-mono font-bold text-[#3fb950]">
                        {JSON.stringify(iteratorState.currentElement)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-center text-xs text-[#8b949e]">
                  No active Iterator on this step.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
