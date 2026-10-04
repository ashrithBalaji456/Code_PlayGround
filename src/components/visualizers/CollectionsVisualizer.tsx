import React, { useState } from 'react';
import {
  ExecutionStep,
  DataStructureState,
  GenericsInfo,
  CollectionsMetrics,
  CollectionRelationshipInfo,
} from '../../types/execution';
import {
  Layers,
  Box,
  Compass,
  Zap,
  Info,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface CollectionsVisualizerProps {
  currentStep: ExecutionStep;
  onSelectCollection?: (colName: string) => void;
}

export const CollectionsVisualizer: React.FC<CollectionsVisualizerProps> = ({
  currentStep,
  onSelectCollection,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'generics' | 'hierarchy' | 'metrics'>('overview');
  const [selectedCol, setSelectedCol] = useState<string | null>(null);

  const structures = currentStep.structures || {};
  const genericsInfo: GenericsInfo | null = currentStep.genericsInfo || null;
  const relationship: CollectionRelationshipInfo | null = currentStep.collectionsRelationship || null;
  const metrics: CollectionsMetrics | null = currentStep.collectionsMetrics || null;
  const lastOp = currentStep.collectionOperation;

  // Filter collections in current structures
  const collectionsList: { name: string; state: DataStructureState }[] = Object.entries(structures)
    .filter(([_, st]) => {
      const type = (st.type || '').toLowerCase();
      const colType = (st.collectionType || '').toLowerCase();
      return (
        colType ||
        ['array', 'linkedlist', 'stack', 'queue', 'deque', 'priorityqueue', 'heap', 'map', 'set'].includes(type)
      );
    })
    .map(([name, state]) => ({ name, state }));

  const activeCol = selectedCol
    ? collectionsList.find((c) => c.name === selectedCol) || collectionsList[0]
    : collectionsList[0];

  const getCollectionBadgeColor = (colType: string) => {
    const t = colType.toLowerCase();
    if (t.includes('list')) return 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/40';
    if (t.includes('set')) return 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/40';
    if (t.includes('map')) return 'bg-[#bc8cff]/15 text-[#bc8cff] border-[#bc8cff]/40';
    if (t.includes('queue') || t.includes('deque')) return 'bg-[#f0883e]/15 text-[#f0883e] border-[#f0883e]/40';
    if (t.includes('stack')) return 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/40';
    return 'bg-[#8b949e]/15 text-[#8b949e] border-[#8b949e]/40';
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-2xl flex flex-col gap-4 text-[#f0f6fc]">
      {/* ─── HEADER & TABS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#30363d] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#bc8cff]/15 border border-[#bc8cff]/30 text-[#bc8cff]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#f0f6fc] tracking-wide">
                Java Collections & Generics Framework
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#bc8cff]/20 text-[#bc8cff] border border-[#bc8cff]/40">
                Phase 18
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">
              Visualizing Real JVM Collections, Iterators, Type Erasure & Generics Constraints
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-[#bc8cff]/20 text-[#bc8cff] border border-[#bc8cff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Collections ({collectionsList.length})
          </button>
          <button
            onClick={() => setActiveTab('generics')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'generics'
                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Generics & Erasure
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'metrics'
                ? 'bg-[#f0883e]/20 text-[#f0883e] border border-[#f0883e]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Complexity & Ops
          </button>
        </div>
      </div>

      {/* ─── ACTIVE OP NOTIFICATION BANNER ─── */}
      {lastOp && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#bc8cff] flex-shrink-0 animate-pulse" />
            <span className="text-[#8b949e]">Recent Op:</span>
            <span className="text-[#58a6ff] font-bold">{lastOp.operation}</span>
            {lastOp.value !== undefined && (
              <span className="text-[#3fb950] bg-[#3fb950]/10 px-1.5 py-0.5 rounded border border-[#3fb950]/30">
                val = {JSON.stringify(lastOp.value)}
              </span>
            )}
            {lastOp.index !== undefined && lastOp.index >= 0 && (
              <span className="text-[#d29922] bg-[#d29922]/10 px-1.5 py-0.5 rounded border border-[#d29922]/30">
                index = {lastOp.index}
              </span>
            )}
          </div>
          {lastOp.isFailFast && (
            <div className="flex items-center gap-1 text-[#f85149] bg-[#f85149]/15 border border-[#f85149]/40 px-2 py-0.5 rounded-full font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>FAIL-FAST DETECTED</span>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 1: COLLECTIONS OVERVIEW & ITERATORS ─── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {collectionsList.length === 0 ? (
            <div className="p-8 text-center bg-[#0d1117] rounded-xl border border-[#30363d] text-[#8b949e] text-xs">
              No collection instances declared in the current step. Declare an ArrayList, HashSet, HashMap, or Iterator to inspect live.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {collectionsList.map(({ name, state }) => {
                const cType = state.collectionType || state.type;
                const genType = state.genericType || 'Object';
                const count = state.elements?.length ?? state.size ?? 0;
                const cap = state.capacity;
                const iterators = Object.values(state.activeIterators || {});

                return (
                  <div
                    key={name}
                    onClick={() => {
                      setSelectedCol(name);
                      onSelectCollection?.(name);
                    }}
                    className={`bg-[#0d1117] border rounded-xl p-3 flex flex-col gap-2.5 transition-all cursor-pointer ${
                      activeCol?.name === name
                        ? 'border-[#bc8cff] shadow-lg shadow-[#bc8cff]/10'
                        : 'border-[#30363d] hover:border-[#8b949e]'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-[#bc8cff]" />
                        <span className="font-mono font-bold text-sm text-[#f0f6fc]">{name}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getCollectionBadgeColor(cType)}`}>
                        {cType}&lt;{genType}&gt;
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-[#161b22] p-1.5 rounded border border-[#30363d] flex flex-col">
                        <span className="text-[10px] text-[#8b949e]">SIZE</span>
                        <span className="font-bold text-[#58a6ff]">{count}</span>
                      </div>
                      <div className="bg-[#161b22] p-1.5 rounded border border-[#30363d] flex flex-col">
                        <span className="text-[10px] text-[#8b949e]">CAPACITY</span>
                        <span className="font-bold text-[#3fb950]">
                          {cap ? `${cap}` : 'Dynamic'}
                          {state.isDerivedCapacity && (
                            <span className="text-[9px] text-[#8b949e] ml-1">(derived)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Active Iterators */}
                    {iterators.length > 0 && (
                      <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-[#bc8cff] flex items-center gap-1">
                          <Compass className="w-3 h-3" />
                          <span>Active Iterators ({iterators.length})</span>
                        </span>
                        {iterators.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between text-xs font-mono bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]/60"
                          >
                            <span className="text-[#f0f6fc] font-bold">↑ {it.id}</span>
                            <span className="text-[#8b949e]">cursor: {it.cursor}</span>
                            <span className={it.hasNext ? 'text-[#3fb950]' : 'text-[#f85149]'}>
                              {it.hasNext ? 'hasNext=true' : 'exhausted'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Elements Preview */}
                    {state.elements && state.elements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {state.elements.slice(0, 8).map((el: any, idx: number) => {
                          const hasItAtIdx = iterators.some((it) => it.cursor === idx);
                          return (
                            <div
                              key={idx}
                              className={`text-[11px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                hasItAtIdx
                                  ? 'bg-[#bc8cff]/20 border-[#bc8cff] text-[#bc8cff] font-bold shadow'
                                  : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc]'
                              }`}
                            >
                              <span className="text-[9px] text-[#8b949e]">{idx}:</span>
                              <span>{String(el)}</span>
                              {hasItAtIdx && <span className="text-[9px]">🎯</span>}
                            </div>
                          );
                        })}
                        {state.elements.length > 8 && (
                          <span className="text-[10px] text-[#8b949e] self-center">
                            +{state.elements.length - 8} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Map entries preview */}
                    {state.mapData?.entries && state.mapData.entries.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {state.mapData.entries.slice(0, 4).map((entry, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] font-mono px-2 py-1 rounded border bg-[#161b22] border-[#30363d] flex items-center justify-between"
                          >
                            <span className="text-[#58a6ff]">{JSON.stringify(entry.key)}</span>
                            <ArrowRight className="w-3 h-3 text-[#8b949e]" />
                            <span className="text-[#3fb950]">{JSON.stringify(entry.value)}</span>
                          </div>
                        ))}
                        {state.mapData.entries.length > 4 && (
                          <span className="text-[10px] text-[#8b949e]">
                            +{state.mapData.entries.length - 4} more entries
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: GENERICS & TYPE ERASURE ─── */}
      {activeTab === 'generics' && (
        <div className="flex flex-col gap-3 bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#58a6ff]">
            <Info className="w-4 h-4" />
            <span>Java Generics & Runtime Type Erasure Engine</span>
          </div>

          {genericsInfo ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] flex flex-col gap-1.5">
                  <span className="text-[#8b949e] text-[11px]">Compile-Time Generic Signature</span>
                  <div className="text-sm font-bold text-[#f0f6fc]">
                    {genericsInfo.declaredGenericType || 'T'}
                  </div>
                  <div className="text-[11px] text-[#58a6ff]">
                    Type Arguments:{' '}
                    {genericsInfo.typeArguments?.join(', ') ||
                      genericsInfo.valueType ||
                      'Object'}
                  </div>
                </div>

                <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] flex flex-col gap-1.5">
                  <span className="text-[#8b949e] text-[11px]">JVM Runtime Representation</span>
                  <div className="text-sm font-bold text-[#d29922]">
                    Raw Type: {genericsInfo.collectionType || 'Object'}
                  </div>
                  <div className="text-[11px] text-[#8b949e]">
                    Erased at bytecode level for backward compatibility
                  </div>
                </div>
              </div>

              {/* Wildcard Bound Info */}
              {genericsInfo.wildcardBound && genericsInfo.wildcardBound !== 'NONE' && (
                <div className="bg-[#161b22] p-3 rounded-lg border border-[#58a6ff]/40 flex items-center gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-[#58a6ff]" />
                  <div>
                    <span className="font-bold text-[#58a6ff]">
                      Wildcard Bound ({genericsInfo.wildcardBound}):{' '}
                    </span>
                    <span className="font-mono text-[#f0f6fc]">
                      {genericsInfo.wildcardBound === 'EXTENDS' && `? extends ${genericsInfo.boundType} (Covariant / Read-only)`}
                      {genericsInfo.wildcardBound === 'SUPER' && `? super ${genericsInfo.boundType} (Contravariant / Write-enabled)`}
                      {genericsInfo.wildcardBound === 'UNBOUNDED' && `? (Unbounded / Object-only)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Type Erasure Details Card */}
              <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] flex flex-col gap-1.5 text-xs">
                <span className="font-bold text-[#3fb950] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Why Type Erasure Matters in Java</span>
                </span>
                <p className="text-[#8b949e] leading-relaxed">
                  {genericsInfo.erasureExplanation ||
                    'In Java, generic type parameters are only checked at compile time by javac. During compilation, all type parameters are replaced with their upper bounds (or Object). Casts are inserted automatically, but at runtime on the JVM, List<String> and List<Integer> share the exact same bytecode class (java.util.List).'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-[#8b949e] text-xs">
              No active generic variable detected in this step.
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: HIERARCHY & RELATIONSHIPS ─── */}
      {activeTab === 'hierarchy' && (
        <div className="flex flex-col gap-3 bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3fb950]">
              <GitBranch className="w-4 h-4" />
              <span>Java Collections Framework Hierarchy</span>
            </div>
            {relationship && (
              <span className="text-xs font-mono font-bold text-[#bc8cff]">
                {relationship.concreteClass}
              </span>
            )}
          </div>

          {/* Interactive Hierarchy Flow */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Collection Branch */}
              <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] flex flex-col gap-2">
                <div className="font-bold text-[#58a6ff] border-b border-[#30363d]/60 pb-1">
                  Iterable &lt;T&gt; ➔ Collection &lt;E&gt;
                </div>
                <div className="flex flex-col gap-1 pl-2 text-[11px] text-[#8b949e]">
                  <div className="flex items-center gap-1">
                    <span className="text-[#3fb950]">├── List:</span>
                    <span>ArrayList, LinkedList, Vector, Stack</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#f0883e]">├── Set:</span>
                    <span>HashSet, LinkedHashSet, TreeSet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#bc8cff]">└── Queue/Deque:</span>
                    <span>ArrayDeque, PriorityQueue, LinkedList</span>
                  </div>
                </div>
              </div>

              {/* Map Branch */}
              <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] flex flex-col gap-2">
                <div className="font-bold text-[#bc8cff] border-b border-[#30363d]/60 pb-1">
                  Map &lt;K, V&gt; (Independent Hierarchy)
                </div>
                <div className="flex flex-col gap-1 pl-2 text-[11px] text-[#8b949e]">
                  <div className="flex items-center gap-1">
                    <span className="text-[#58a6ff]">├── HashMap:</span>
                    <span>Unordered, O(1) avg lookup</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#3fb950]">├── LinkedHashMap:</span>
                    <span>Insertion-order preserved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#d29922]">├── TreeMap:</span>
                    <span>Red-Black Tree, sorted keys, O(log N)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#8b949e]">└── Hashtable:</span>
                    <span>Legacy, synchronized, no null keys/values</span>
                  </div>
                </div>
              </div>
            </div>

            {relationship && relationship.keyCharacteristics && (
              <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] mt-2 flex flex-col gap-1 text-xs">
                <span className="font-bold text-[#f0f6fc]">
                  Key Characteristics of {relationship.concreteClass}:
                </span>
                <ul className="list-disc list-inside text-[#8b949e] flex flex-col gap-0.5">
                  {relationship.keyCharacteristics.map((ch, idx) => (
                    <li key={idx}>{ch}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: COMPLEXITY & METRICS ─── */}
      {activeTab === 'metrics' && (
        <div className="flex flex-col gap-3 bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f0883e]">
              <Zap className="w-4 h-4" />
              <span>Observed Real-Time Operation Counters & Complexity</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col">
              <span className="text-[10px] text-[#8b949e]">ADDS</span>
              <span className="font-bold text-sm text-[#3fb950]">{metrics?.adds ?? 0}</span>
            </div>
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col">
              <span className="text-[10px] text-[#8b949e]">REMOVES</span>
              <span className="font-bold text-sm text-[#f85149]">{metrics?.removes ?? 0}</span>
            </div>
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col">
              <span className="text-[10px] text-[#8b949e]">GETS</span>
              <span className="font-bold text-sm text-[#58a6ff]">{metrics?.gets ?? 0}</span>
            </div>
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col">
              <span className="text-[10px] text-[#8b949e]">MAP PUTS</span>
              <span className="font-bold text-sm text-[#bc8cff]">{metrics?.mapPuts ?? 0}</span>
            </div>
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col">
              <span className="text-[10px] text-[#8b949e]">MAP GETS</span>
              <span className="font-bold text-sm text-[#58a6ff]">{metrics?.mapGets ?? 0}</span>
            </div>
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col">
              <span className="text-[10px] text-[#8b949e]">SET CONTAINS</span>
              <span className="font-bold text-sm text-[#d29922]">{metrics?.setContains ?? 0}</span>
            </div>
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col">
              <span className="text-[10px] text-[#8b949e]">ITERATOR NEXT</span>
              <span className="font-bold text-sm text-[#bc8cff]">{metrics?.iteratorNext ?? 0}</span>
            </div>
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] flex flex-col">
              <span className="text-[10px] text-[#8b949e]">HAS_NEXT CHECKS</span>
              <span className="font-bold text-sm text-[#8b949e]">{metrics?.iteratorHasNext ?? 0}</span>
            </div>
          </div>

          {/* Complexity Reference Table */}
          <div className="mt-2 bg-[#161b22] rounded-lg border border-[#30363d] p-3 text-[11px] font-mono">
            <span className="font-bold text-[#f0f6fc] block mb-2">Standard Time Complexity Reference:</span>
            <div className="grid grid-cols-4 gap-2 text-[#8b949e] border-b border-[#30363d]/60 pb-1 font-bold">
              <span>Collection</span>
              <span>Add</span>
              <span>Get(idx)/Lookup</span>
              <span>Remove</span>
            </div>
            <div className="flex flex-col gap-1 mt-1 text-[#f0f6fc]">
              <div className="grid grid-cols-4 gap-2">
                <span className="text-[#58a6ff]">ArrayList</span>
                <span className="text-[#3fb950]">O(1) amortized</span>
                <span className="text-[#3fb950]">O(1)</span>
                <span className="text-[#f0883e]">O(N)</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <span className="text-[#bc8cff]">LinkedList</span>
                <span className="text-[#3fb950]">O(1)</span>
                <span className="text-[#f0883e]">O(N)</span>
                <span className="text-[#3fb950]">O(1) with it</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <span className="text-[#3fb950]">HashSet / HashMap</span>
                <span className="text-[#3fb950]">O(1) avg</span>
                <span className="text-[#3fb950]">O(1) avg</span>
                <span className="text-[#3fb950]">O(1) avg</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <span className="text-[#d29922]">TreeSet / TreeMap</span>
                <span className="text-[#58a6ff]">O(log N)</span>
                <span className="text-[#58a6ff]">O(log N)</span>
                <span className="text-[#58a6ff]">O(log N)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
