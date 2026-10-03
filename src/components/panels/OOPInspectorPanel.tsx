import React, { useState } from 'react';
import {
  ExecutionStep,
  HeapObject,
  ClassMetadata,
  OOPRelationship,
  PolymorphismInfo,
  StreamPipelineState,
  IteratorState,
  TypeSystemInfo,
  MethodDispatchInfo,
  ObjectIdentityComparison,
  MethodOverloadResolution,
} from '../../types/execution';
import {
  GitBranch,
  Layers,
  Box,
  Cpu,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Compass,
  Sparkles,
  Scale,
  BookOpen,
  Binary,
  Link2,
  Lock,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface OOPInspectorPanelProps {
  currentStep: ExecutionStep | null;
}

export const OOPInspectorPanel: React.FC<OOPInspectorPanelProps> = ({ currentStep }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'polymorphism' | 'typesystem' | 'identity' | 'object' | 'class' | 'relationships' | 'streams'
  >('polymorphism');
  const [isExpertMode, setIsExpertMode] = useState<boolean>(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('');

  const polyInfo: PolymorphismInfo | null = currentStep?.polymorphismInfo || null;
  const typeSys: TypeSystemInfo | null = currentStep?.typeSystemInfo || null;
  const dispatchInfo: MethodDispatchInfo | null = currentStep?.methodDispatchInfo || null;
  const identityCmp: ObjectIdentityComparison | null = currentStep?.identityComparison || null;
  const overloadRes: MethodOverloadResolution | null = currentStep?.methodOverloadResolution || null;
  const heap: HeapObject[] = currentStep?.heap || [];
  const classMeta: Record<string, ClassMetadata> = currentStep?.classMetadata || {};
  const relationships: OOPRelationship[] = currentStep?.oopRelationships || [];
  const streamPipeline: StreamPipelineState | null = currentStep?.streamPipeline || null;
  const iteratorState: IteratorState | null = currentStep?.iteratorState || null;

  // Active object for Object Inspector
  const activeObjId = selectedObjectId || (heap.length > 0 ? heap[heap.length - 1].id : '');
  const activeObj =
    heap.find((o) => o.id === activeObjId || o.objectId === activeObjId) ||
    (heap.length > 0 ? heap[heap.length - 1] : null);

  // Active class for Class Inspector
  const classNames = Object.keys(classMeta);
  const activeClsName = selectedClassName || (classNames.length > 0 ? classNames[0] : '');
  const activeCls =
    classMeta[activeClsName] || (classNames.length > 0 ? classMeta[classNames[0]] : null);

  // Aliased objects on heap (objects with multiple references pointing to them)
  const aliasedObjects = heap.filter(
    (h) => (h.referencesFrom && h.referencesFrom.length > 1) || (h as any).aliases?.length > 1
  );

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
            <span>Dispatch & Overrides</span>
            {(polyInfo || dispatchInfo) && <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveSubTab('typesystem')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'typesystem'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Type System & Casts</span>
            {typeSys && <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveSubTab('identity')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'identity'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Identity & Aliasing</span>
            {identityCmp && <span className="w-2 h-2 rounded-full bg-[#d29922] animate-pulse" />}
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
            <span>Objects</span>
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
            <span>Class Hierarchy</span>
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
            <span>OOP Map</span>
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
          </button>
        </div>

        {/* Mode Toggle & Step Counter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpertMode(!isExpertMode)}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-all ${
              isExpertMode
                ? 'bg-[#6e40c9]/30 text-[#d2a8ff] border-[#8957e5]'
                : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#f0f6fc]'
            }`}
            title="Toggle between Beginner and Expert Educational Mode"
          >
            {isExpertMode ? '🎓 Expert Mode' : '🌱 Beginner Mode'}
          </button>
          <div className="text-[11px] font-mono text-[#8b949e] hidden sm:block">
            Step {currentStep ? currentStep.stepIndex + 1 : 0} of {currentStep ? currentStep.totalSteps : 0}
          </div>
        </div>
      </div>

      {/* Mode Explanation Banner */}
      {currentStep?.learningModeExplanation && (
        <div className="px-3 py-1.5 bg-[#161b22]/70 border-b border-[#30363d] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#388bfd]/20 text-[#58a6ff]">
              {isExpertMode ? 'JVM Execution Trace' : 'Concept Explanation'}
            </span>
            <span className="text-[#c9d1d9] truncate">
              {isExpertMode
                ? currentStep.learningModeExplanation.expert
                : currentStep.learningModeExplanation.beginner}
            </span>
          </div>
        </div>
      )}

      {/* Sub-Tab Content View */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ======================================================== */}
        {/* 1. POLYMORPHISM & METHOD DISPATCH                        */}
        {/* ======================================================== */}
        {activeSubTab === 'polymorphism' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#58a6ff]" />
                  Dynamic Method Dispatch & Overloading
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Dynamic dispatch resolves overridden methods at runtime via actual heap instance headers.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30">
                RUNTIME VERIFIED
              </span>
            </div>

            {/* Dynamic Dispatch Details */}
            {dispatchInfo || polyInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Declared vs Runtime Card */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                    Type Comparison (Reference vs Heap)
                  </div>
                  <div className="flex items-center justify-between bg-[#0d1117] p-2.5 rounded border border-[#21262d]">
                    <div>
                      <div className="text-[11px] text-[#8b949e]">Declared Reference Type</div>
                      <div className="text-sm font-bold font-mono text-[#58a6ff]">
                        {dispatchInfo?.referenceType || polyInfo?.declaredType || 'Object'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8b949e]" />
                    <div className="text-right">
                      <div className="text-[11px] text-[#8b949e]">Actual Runtime Heap Type</div>
                      <div className="text-sm font-bold font-mono text-[#3fb950]">
                        {dispatchInfo?.runtimeType || polyInfo?.runtimeType || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <span className="text-[#8b949e]">Variable:</span>{' '}
                      <span className="font-mono font-semibold text-[#e3b341]">
                        {dispatchInfo?.invokingVariable || polyInfo?.variableName || 'reference'}
                      </span>
                    </div>
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                      <span className="text-[#8b949e]">Dispatch Strategy:</span>{' '}
                      <span className="font-mono font-semibold text-[#a371f7]">
                        {dispatchInfo?.dispatchType || 'DYNAMIC_DISPATCH'}
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
                      <span className="font-mono text-[#f0f6fc]">
                        {dispatchInfo?.methodName || polyInfo?.methodName || 'method()'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e]">Resolved Target:</span>
                      <span className="font-mono font-bold text-[#3fb950]">
                        {dispatchInfo?.selectedImplementation ||
                          polyInfo?.resolvedImplementation ||
                          `${polyInfo?.runtimeType}.${polyInfo?.methodName}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e]">Overridden:</span>
                      <span className="font-semibold text-[#58a6ff]">
                        {dispatchInfo?.overrideFound !== false ? 'YES (Dynamic Dispatch)' : 'DIRECT CALL'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] bg-[#388bfd]/10 text-[#58a6ff] p-2 rounded border border-[#388bfd]/20">
                    <strong>Why this resolved:</strong>{' '}
                    {dispatchInfo?.whyExplanation ||
                      'The JVM inspects the object header on the heap at runtime and dynamically dispatches to the subclass implementation.'}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Overload Resolution Card */}
            {overloadRes && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                    Compile-Time Method Overloading
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#8957e5]/20 text-[#d2a8ff] border border-[#8957e5]/30">
                    STATIC EARLY BINDING
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                    <span className="text-[#8b949e]">Selected Signature:</span>{' '}
                    <span className="font-mono font-bold text-[#f0f6fc]">{overloadRes.selectedSignature}</span>
                  </div>
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                    <span className="text-[#8b949e]">Argument Types:</span>{' '}
                    <span className="font-mono text-[#58a6ff]">{overloadRes.argumentTypes.join(', ')}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8b949e] bg-[#0d1117] p-2 rounded border border-[#21262d]">
                  {overloadRes.explanation}
                </p>
              </div>
            )}

            {!dispatchInfo && !polyInfo && !overloadRes && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] space-y-2">
                <GitBranch className="w-8 h-8 mx-auto text-[#484f58]" />
                <p className="text-xs">No polymorphic method dispatch on the current execution step.</p>
                <p className="text-[11px] text-[#6e7681]">
                  Step through your program to observe declared reference types dispatch dynamically to runtime subclasses.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. TYPE SYSTEM & CASTING                                 */}
        {/* ======================================================== */}
        {activeSubTab === 'typesystem' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Binary className="w-4 h-4 text-[#58a6ff]" />
                  Java Type System, Upcasting, Downcasting & instanceof
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Visualizes reference widening (upcasting), narrowing (downcasting), and instanceof type checks.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd]/30">
                TYPE VERIFIED
              </span>
            </div>

            {typeSys ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                    <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                      Reference Binding
                    </div>
                    <div className="bg-[#0d1117] p-2.5 rounded border border-[#21262d] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b949e]">Variable Name:</span>
                        <span className="font-mono font-bold text-[#e3b341]">{typeSys.variableName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b949e]">Declared / Reference Type:</span>
                        <span className="font-mono text-[#58a6ff]">{typeSys.declaredType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b949e]">Runtime Object Type:</span>
                        <span className="font-mono text-[#3fb950]">{typeSys.runtimeType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b949e]">Target Object ID:</span>
                        <span className="font-mono text-[#a371f7]">{typeSys.objectId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                    <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                      Casting Operations
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8b949e]">Classification:</span>
                        {typeSys.isUpcast ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/30">
                            UPCASTING (Widening, Safe)
                          </span>
                        ) : typeSys.isDowncast ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              typeSys.castSuccess !== false
                                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30'
                                : 'bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/30'
                            }`}
                          >
                            {typeSys.castSuccess !== false ? 'DOWNCASTING (Narrowing, Succeeded)' : 'DOWNCAST FAILED'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#30363d] text-[#8b949e]">
                            DIRECT ASSIGNMENT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8b949e] bg-[#0d1117] p-2 rounded border border-[#21262d] mt-2">
                        {typeSys.explanation}
                      </div>
                    </div>
                  </div>
                </div>

                {/* instanceof checks */}
                {typeSys.instanceofChecks && typeSys.instanceofChecks.length > 0 && (
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                    <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                      instanceof Type Evaluations
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {typeSys.instanceofChecks.map((check, idx) => (
                        <div
                          key={idx}
                          className="bg-[#0d1117] p-2 rounded border border-[#21262d] flex items-center justify-between text-xs"
                        >
                          <span className="font-mono text-[#f0f6fc]">
                            {typeSys.variableName} instanceof {check.targetType}
                          </span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              check.result
                                ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
                                : 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/30'
                            }`}
                          >
                            {check.result ? 'TRUE' : 'FALSE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generics & Erasure Note */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-1.5">
                  <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#a371f7]" />
                    <span>Java Generics & Type Erasure Principle</span>
                  </div>
                  <p className="text-[11px] text-[#8b949e]">
                    Compile-time generic types (e.g. <span className="font-mono text-[#f0f6fc]">List&lt;T&gt;</span>,{' '}
                    <span className="font-mono text-[#f0f6fc]">&lt;T extends Number&gt;</span>) are verified by javac and
                    erased at runtime to their bounds (<span className="font-mono text-[#f0f6fc]">Object</span> or upper
                    bound). No generic metadata remains on raw heap allocations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] space-y-2">
                <Binary className="w-8 h-8 mx-auto text-[#484f58]" />
                <p className="text-xs">No active type system or casting event on this step.</p>
                <p className="text-[11px] text-[#6e7681]">
                  Step through your code to inspect reference types, runtime heap classes, and instanceof evaluations.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. IDENTITY & ALIASING                                   */}
        {/* ======================================================== */}
        {activeSubTab === 'identity' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#d29922]" />
                  Object Identity (==) vs Logical Equality (.equals)
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Compares raw memory address references vs semantic object equivalence, and tracks variable aliases.
                </p>
              </div>
            </div>

            {/* Active Identity Comparison */}
            {identityCmp ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                  Active Comparison: {identityCmp.comparisonType === 'IDENTITY_EQ' ? '== (Pointer Identity)' : '.equals() (Logical Equivalence)'}
                </div>
                <div className="bg-[#0d1117] p-2.5 rounded border border-[#21262d] flex items-center justify-between text-xs">
                  <div className="font-mono text-sm font-bold text-[#f0f6fc]">
                    {identityCmp.leftOperand} {identityCmp.comparisonType === 'IDENTITY_EQ' ? '==' : '.equals('}{' '}
                    {identityCmp.rightOperand}
                    {identityCmp.comparisonType === 'EQUALS_METHOD' ? ')' : ''}
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${
                      identityCmp.isIdentical
                        ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
                        : 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/30'
                    }`}
                  >
                    {identityCmp.isIdentical ? 'TRUE (EQUAL)' : 'FALSE (NOT EQUAL)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                    <span className="text-[#8b949e]">Left Target Address:</span>{' '}
                    <span className="font-mono text-[#58a6ff]">{identityCmp.leftObjectId || 'ptr-left'}</span>
                  </div>
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                    <span className="text-[#8b949e]">Right Target Address:</span>{' '}
                    <span className="font-mono text-[#3fb950]">{identityCmp.rightObjectId || 'ptr-right'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8b949e] bg-[#0d1117] p-2 rounded border border-[#21262d]">
                  {identityCmp.explanation}
                </p>
              </div>
            ) : null}

            {/* Aliasing Cards */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider flex items-center justify-between">
                <span>Active Variable Aliasing on Heap</span>
                <span className="text-[10px] text-[#8b949e] font-mono">{aliasedObjects.length} aliased object(s)</span>
              </div>
              {aliasedObjects.length > 0 ? (
                <div className="space-y-2">
                  {aliasedObjects.map((obj) => (
                    <div
                      key={obj.id}
                      className="bg-[#0d1117] p-2.5 rounded border border-[#21262d] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#f0f6fc]">
                          {obj.type} (#{obj.id})
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/30">
                          SHARED INSTANCE
                        </span>
                      </div>
                      <div className="text-[#8b949e]">
                        Referenced by variables:{' '}
                        <span className="font-mono font-bold text-[#58a6ff]">
                          {obj.referencesFrom ? obj.referencesFrom.join(', ') : 'multiple variables'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8b949e] italic">
                        Mutating a field via any reference immediately affects all aliases because they share this exact heap memory instance.
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8b949e] bg-[#0d1117] p-2.5 rounded border border-[#21262d]">
                  No multiple-reference aliases detected on the active heap step.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. OBJECT INSPECTOR                                      */}
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
              <span className="text-[10px] font-mono text-[#8b949e]">Total Heap: {heap.length}</span>
            </div>

            {heap.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Object Selector Column */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 space-y-1.5">
                  <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                    Heap Instances
                  </div>
                  {heap.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={`w-full text-left p-2 rounded text-xs transition-all flex items-center justify-between ${
                        obj.id === activeObjId
                          ? 'bg-[#1f6feb] text-white font-semibold'
                          : 'bg-[#0d1117] text-[#c9d1d9] hover:bg-[#21262d]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-mono">{obj.type}</div>
                        <div className="text-[10px] opacity-75">{obj.id}</div>
                      </div>
                      {obj.gcEligible ? (
                        <span className="text-[9px] px-1 rounded bg-[#f85149]/20 text-[#f85149]">GC</span>
                      ) : (
                        <span className="text-[9px] px-1 rounded bg-[#3fb950]/20 text-[#3fb950]">Live</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Object Detail Card */}
                {activeObj ? (
                  <div className="md:col-span-2 bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                      <div>
                        <div className="text-sm font-bold font-mono text-[#58a6ff]">{activeObj.type}</div>
                        <div className="text-[11px] text-[#8b949e] font-mono">ID: {activeObj.id}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          activeObj.gcEligible
                            ? 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/30'
                            : 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
                        }`}
                      >
                        {activeObj.gcEligible ? 'REACHABILITY: GC ELIGIBLE' : 'REACHABILITY: ROOT REACHABLE'}
                      </span>
                    </div>

                    {/* Instance Fields */}
                    <div>
                      <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
                        Instance Fields
                      </div>
                      {activeObj.fields && Object.keys(activeObj.fields).length > 0 ? (
                        <div className="bg-[#0d1117] rounded border border-[#21262d] divide-y divide-[#21262d]">
                          {Object.entries(activeObj.fields).map(([fKey, fVal]) => (
                            <div key={fKey} className="p-2 text-xs flex items-center justify-between">
                              <span className="font-mono text-[#8b949e]">{fKey}</span>
                              <span className="font-mono font-semibold text-[#f0f6fc]">
                                {JSON.stringify(fVal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] text-xs text-[#8b949e]">
                          No instance fields defined.
                        </div>
                      )}
                    </div>

                    {/* References pointing to this object */}
                    <div>
                      <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
                        Pointing References (Aliases)
                      </div>
                      <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] text-xs font-mono">
                        {activeObj.referencesFrom && activeObj.referencesFrom.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {activeObj.referencesFrom.map((ref) => (
                              <span
                                key={ref}
                                className="px-2 py-0.5 rounded bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd]/30 font-semibold"
                              >
                                {ref}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#8b949e]">No named local variables currently pointing to this object.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] space-y-2">
                <Box className="w-8 h-8 mx-auto text-[#484f58]" />
                <p className="text-xs">The Java Heap is currently empty.</p>
                <p className="text-[11px] text-[#6e7681]">
                  Objects allocated using the <span className="font-mono">new</span> keyword will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. CLASS INSPECTOR                                       */}
        {/* ======================================================== */}
        {activeSubTab === 'class' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#58a6ff]" />
                  Class & Interface Metadata Inspector
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Parsed declarations, modifiers, inheritance trees, and interfaces.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">Classes: {classNames.length}</span>
            </div>

            {classNames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Class List Column */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 space-y-1.5">
                  <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                    Class Registry
                  </div>
                  {classNames.map((name) => {
                    const c = classMeta[name];
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedClassName(name)}
                        className={`w-full text-left p-2 rounded text-xs transition-all flex items-center justify-between ${
                          name === activeClsName
                            ? 'bg-[#1f6feb] text-white font-semibold'
                            : 'bg-[#0d1117] text-[#c9d1d9] hover:bg-[#21262d]'
                        }`}
                      >
                        <span className="font-mono">{name}</span>
                        {c.isInterface ? (
                          <span className="text-[9px] px-1 rounded bg-[#a371f7]/20 text-[#a371f7]">interface</span>
                        ) : c.isAbstract ? (
                          <span className="text-[9px] px-1 rounded bg-[#e3b341]/20 text-[#e3b341]">abstract</span>
                        ) : (
                          <span className="text-[9px] px-1 rounded bg-[#3fb950]/20 text-[#3fb950]">class</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Class Detail View */}
                {activeCls ? (
                  <div className="md:col-span-2 bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                      <div>
                        <div className="text-sm font-bold font-mono text-[#58a6ff]">{activeCls.className}</div>
                        <div className="text-[11px] text-[#8b949e]">
                          {activeCls.superClass && (
                            <span>
                              extends <span className="font-mono text-[#f0f6fc]">{activeCls.superClass}</span>{' '}
                            </span>
                          )}
                          {activeCls.interfaces && activeCls.interfaces.length > 0 && (
                            <span>
                              implements{' '}
                              <span className="font-mono text-[#a371f7]">{activeCls.interfaces.join(', ')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#30363d] text-[#8b949e]">
                        {activeCls.sourceType}
                      </span>
                    </div>

                    {/* Methods */}
                    <div>
                      <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
                        Declared Methods
                      </div>
                      {activeCls.methods && activeCls.methods.length > 0 ? (
                        <div className="bg-[#0d1117] rounded border border-[#21262d] divide-y divide-[#21262d]">
                          {activeCls.methods.map((m, idx) => (
                            <div key={idx} className="p-2 text-xs flex items-center justify-between">
                              <span className="font-mono text-[#f0f6fc]">
                                {m.accessModifier} {m.returnType} {m.name}()
                              </span>
                              <div className="flex items-center gap-1.5">
                                {m.isStatic && (
                                  <span className="text-[9px] px-1 rounded bg-[#388bfd]/20 text-[#58a6ff]">
                                    static
                                  </span>
                                )}
                                {m.isOverridden && (
                                  <span className="text-[9px] px-1 rounded bg-[#3fb950]/20 text-[#3fb950]">
                                    @Override
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] text-xs text-[#8b949e]">
                          No explicit methods found.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] space-y-2">
                <Layers className="w-8 h-8 mx-auto text-[#484f58]" />
                <p className="text-xs">No class metadata found.</p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. OOP RELATIONSHIPS MAP                                 */}
        {/* ======================================================== */}
        {activeSubTab === 'relationships' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#58a6ff]" />
                  OOP Structural Relationships
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Inheritance (is-a), Implementation, Composition, and Aggregation.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">Edges: {relationships.length}</span>
            </div>

            {relationships.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {relationships.map((rel, idx) => (
                  <div
                    key={idx}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          rel.type === 'INHERITANCE'
                            ? 'bg-[#388bfd]/20 text-[#58a6ff]'
                            : rel.type === 'IMPLEMENTATION'
                            ? 'bg-[#a371f7]/20 text-[#a371f7]'
                            : rel.type === 'COMPOSITION'
                            ? 'bg-[#e3b341]/20 text-[#e3b341]'
                            : 'bg-[#3fb950]/20 text-[#3fb950]'
                        }`}
                      >
                        {rel.type}
                      </span>
                      <span className="text-[9px] text-[#8b949e]">{rel.nature}</span>
                    </div>
                    <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#f0f6fc]">{rel.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
                      <span className="font-bold text-[#58a6ff]">{rel.to}</span>
                    </div>
                    {rel.label && (
                      <div className="text-[10px] text-[#8b949e]">
                        Field/Role: <span className="font-mono text-[#f0f6fc]">{rel.label}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] space-y-2">
                <Compass className="w-8 h-8 mx-auto text-[#484f58]" />
                <p className="text-xs">No explicit OOP relationships declared.</p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. STREAMS & ITERATORS                                   */}
        {/* ======================================================== */}
        {activeSubTab === 'streams' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d29922]" />
                  Java Streams & Iterator Cursor View
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Flowing pipeline stages, lazy evaluation states, and active iterator pointers.
                </p>
              </div>
            </div>

            {/* Stream Pipeline Section */}
            {streamPipeline ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                    Pipeline Stages ({streamPipeline.sourceCollection || 'source'})
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      streamPipeline.terminalOpExecuted
                        ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
                        : 'bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/30'
                    }`}
                  >
                    {streamPipeline.terminalOpExecuted ? 'TERMINAL OP EXECUTED' : 'LAZY / INTERMEDIATE'}
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  {streamPipeline.stages.map((stg, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2 flex-shrink-0">
                      <div className="bg-[#0d1117] border border-[#30363d] rounded p-2 text-center min-w-[90px]">
                        <div className="text-[10px] text-[#8b949e] uppercase">{stg.operation}</div>
                        <div className="text-xs font-mono font-bold text-[#58a6ff]">
                          {stg.description || stg.operation}
                        </div>
                      </div>
                      {sIdx < streamPipeline.stages.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Iterator Cursor Section */}
            {iteratorState ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                  Iterator Cursor State
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                    <div className="text-[10px] text-[#8b949e]">Index</div>
                    <div className="font-mono font-bold text-[#58a6ff]">{iteratorState.cursorIndex}</div>
                  </div>
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                    <div className="text-[10px] text-[#8b949e]">hasNext()</div>
                    <div
                      className={`font-bold ${iteratorState.hasNext ? 'text-[#3fb950]' : 'text-[#f85149]'}`}
                    >
                      {iteratorState.hasNext ? 'true' : 'false'}
                    </div>
                  </div>
                  <div className="bg-[#0d1117] p-2 rounded border border-[#21262d]">
                    <div className="text-[10px] text-[#8b949e]">Direction</div>
                    <div className="font-bold text-[#a371f7]">{iteratorState.direction || 'FORWARD'}</div>
                  </div>
                </div>
              </div>
            ) : null}

            {!streamPipeline && !iteratorState && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-[#484f58]" />
                <p className="text-xs">No active Stream pipeline or Iterator on this step.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
