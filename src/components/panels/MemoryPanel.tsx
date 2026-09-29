import React, { useState } from 'react';
import { VariableInfo, HeapObject, ThreadState, LockState } from '../../types/execution';
import { Cpu, HardDrive, Database, Layers, Eye, ShieldCheck, AlertCircle, Share2 } from 'lucide-react';

interface MemoryPanelProps {
  variables: Record<string, VariableInfo>;
  heap: HeapObject[];
  memoryStats: {
    stackBytes: number;
    heapBytes: number;
    totalBytes: number;
  };
  staticFields?: Record<string, Record<string, any>>;
  threads?: Record<string, ThreadState>;
  locks?: Record<string, LockState>;
  stringPool?: Array<{ value: string; references: string[] }>;
  objectGraph?: Array<{ fromId: string; fromName: string; toId: string; toName: string; label?: string }>;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  variables,
  heap,
  memoryStats,
  staticFields = {},
  threads = {},
  locks = {},
  stringPool = [],
  objectGraph = [],
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'inspector' | 'graph' | 'threads' | 'strings'>('model');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedVarName, setSelectedVarName] = useState<string | null>(null);

  const references = Object.values(variables).filter((v) => v.isReference);

  const inspectedObj = selectedObjectId
    ? heap.find((h) => h.objectId === selectedObjectId || h.id === selectedObjectId || h.id === `@${selectedObjectId}`)
    : null;

  const inspectedVar = selectedVarName ? variables[selectedVarName] : null;

  return (
    <div className="h-full flex flex-col bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
      {/* Header & Subtabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#0d1117] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#3fb950]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            Educational JVM Memory View
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-[#161b22] p-0.5 rounded-lg border border-[#30363d] text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('model')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeTab === 'model'
                ? 'bg-[#58a6ff] text-[#0d1117] font-bold'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Memory Model
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeTab === 'inspector'
                ? 'bg-[#bc8cff] text-[#0d1117] font-bold'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Inspector
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeTab === 'graph'
                ? 'bg-[#7ee787] text-[#0d1117] font-bold'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Object Graph {objectGraph.length > 0 ? `(${objectGraph.length})` : ''}
          </button>
          {Object.keys(threads).length > 0 && (
            <button
              onClick={() => setActiveTab('threads')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === 'threads'
                  ? 'bg-[#39c5cf] text-[#0d1117] font-bold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              Threads ({Object.keys(threads).length})
            </button>
          )}
          {stringPool.length > 0 && (
            <button
              onClick={() => setActiveTab('strings')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === 'strings'
                  ? 'bg-[#d29922] text-[#0d1117] font-bold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              String Pool
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-[#8b949e]">Total:</span>
          <span className="font-bold text-[#3fb950]">~{memoryStats.totalBytes} B</span>
          <span className="text-[9px] text-[#8b949e]/70">(Est.)</span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
        {activeTab === 'model' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. STACK COLUMN */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5">
                <span className="font-bold text-[#58a6ff] text-xs flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>STACK</span>
                  <span className="text-[10px] text-[#8b949e] font-normal">(Primitives & Refs)</span>
                </span>
                <span className="text-[11px] text-[#3fb950] font-semibold">
                  ~{memoryStats.stackBytes} B
                </span>
              </div>

              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px]">
                {Object.values(variables).length === 0 ? (
                  <span className="text-[11px] text-[#8b949e] p-2 text-center italic">Empty</span>
                ) : (
                  Object.values(variables).map((v) => (
                    <div
                      key={v.name}
                      onClick={() => {
                        setSelectedVarName(v.name);
                        if (v.refTargetId) setSelectedObjectId(v.refTargetId);
                        setActiveTab('inspector');
                      }}
                      className={`p-1.5 rounded border text-[11px] flex items-center justify-between cursor-pointer transition-all ${
                        v.isReference
                          ? 'bg-[#bc8cff]/10 border-[#bc8cff]/40 text-[#bc8cff] hover:bg-[#bc8cff]/20'
                          : 'bg-[#161b22] border-[#30363d] text-[#f0f6fc] hover:border-[#58a6ff]/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold">{v.name}</span>
                        <span className="text-[10px] text-[#8b949e]">({v.type})</span>
                        {v.aliasedWith && v.aliasedWith.length > 0 && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-[#f0883e]/20 text-[#f0883e] border border-[#f0883e]/40 font-bold" title={`Aliased with ${v.aliasedWith.join(', ')}`}>
                            ALIAS ({v.aliasedWith.join(', ')})
                          </span>
                        )}
                        {v.inActiveScope === false && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40 font-bold">
                            OUT OF SCOPE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {v.isReference ? (
                          <span className="text-[#bc8cff] font-bold">
                            ➔ {v.refTargetId || 'null'}
                          </span>
                        ) : (
                          <span>{String(v.value)}</span>
                        )}
                        <span className="text-[9px] text-[#8b949e] ml-1">
                          {v.estimatedBytes}B
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. HEAP COLUMN */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5">
                <span className="font-bold text-[#bc8cff] text-xs flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>HEAP</span>
                  <span className="text-[10px] text-[#8b949e] font-normal">(Objects)</span>
                </span>
                <span className="text-[11px] text-[#3fb950] font-semibold">
                  ~{memoryStats.heapBytes} B
                </span>
              </div>

              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px]">
                {heap.length === 0 ? (
                  <span className="text-[11px] text-[#8b949e] p-2 text-center italic">
                    No heap allocations yet
                  </span>
                ) : (
                  heap.map((obj) => {
                    const cleanId = obj.objectId || obj.id.replace(/^@/, '');
                    const isGcEligible = obj.gcEligible || (obj.referencesFrom && obj.referencesFrom.length === 0);
                    return (
                      <div
                        key={obj.id}
                        onClick={() => {
                          setSelectedObjectId(cleanId);
                          setActiveTab('inspector');
                        }}
                        className={`bg-[#161b22] border rounded p-2 flex flex-col gap-1 text-[11px] cursor-pointer transition-all ${
                          isGcEligible
                            ? 'border-[#d29922]/50 hover:border-[#d29922]'
                            : 'border-[#30363d] hover:border-[#bc8cff]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[#bc8cff]">
                          <div className="flex items-center gap-1 truncate">
                            <span className="font-bold">{obj.className ? `${obj.className} (${cleanId})` : cleanId}</span>
                            {obj.aliased && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-[#f0883e]/20 text-[#f0883e] border border-[#f0883e]/40 font-bold" title="Aliased by multiple references">
                                ALIASING
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#3fb950]">~{obj.estimatedBytes} B</span>
                        </div>
                        <div className="text-[10px] text-[#8b949e] truncate flex items-center justify-between">
                          <span>Type: <strong className="text-[#f0f6fc]">{obj.className || obj.type}</strong></span>
                          {isGcEligible && (
                            <span className="text-[9px] text-[#d29922] font-bold bg-[#d29922]/15 px-1 rounded">
                              Eligible for GC
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. STATIC / CLASS AREA COLUMN */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-1.5">
                <span className="font-bold text-[#d29922] text-xs flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  <span>STATIC / CLASS</span>
                  <span className="text-[10px] text-[#8b949e] font-normal">(Metaspace)</span>
                </span>
                <span className="text-[10px] text-[#8b949e]">Shared</span>
              </div>

              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px]">
                {Object.keys(staticFields).length === 0 ? (
                  <span className="text-[11px] text-[#8b949e] p-2 text-center italic">
                    No static class variables
                  </span>
                ) : (
                  Object.entries(staticFields).map(([className, flds]) => (
                    <div key={className} className="bg-[#161b22] border border-[#30363d] rounded p-2 flex flex-col gap-1 text-[11px]">
                      <span className="font-bold text-[#d29922]">{className}</span>
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        {Object.entries(flds).map(([fk, fv]) => (
                          <div key={fk} className="flex items-center justify-between">
                            <span className="text-[#8b949e]">{fk}:</span>
                            <span className="font-bold text-[#f0f6fc]">{JSON.stringify(fv)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Object & Reference Inspector (Section 27, 28) */}
        {activeTab === 'inspector' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#58a6ff]">Object & Reference Inspector</span>
              <span className="text-[10px] text-[#8b949e]">Click any variable or heap object to inspect</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Selected Variable */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
                <span className="font-bold text-xs text-[#58a6ff] border-b border-[#30363d] pb-1">
                  Reference Inspector
                </span>
                {inspectedVar ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Variable:</span>
                      <span className="font-bold text-[#f0f6fc]">{inspectedVar.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Kind:</span>
                      <span className="font-bold text-[#79c0ff]">{inspectedVar.kind || (inspectedVar.isReference ? 'Reference' : 'Primitive')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Location:</span>
                      <span className="font-bold text-[#58a6ff]">{inspectedVar.location || 'Stack'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Declared Type:</span>
                      <span className="font-bold text-[#58a6ff]">{inspectedVar.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">{inspectedVar.isReference ? 'Points To:' : 'Value:'}</span>
                      <span className="font-bold text-[#bc8cff]">
                        {inspectedVar.isReference ? (inspectedVar.refTargetId || 'null') : String(inspectedVar.value)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Stack Frame:</span>
                      <span className="text-[#f0f6fc]">{inspectedVar.scope}()</span>
                    </div>
                    {inspectedVar.aliasedWith && inspectedVar.aliasedWith.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#f0883e]">Aliased With:</span>
                        <span className="font-bold text-[#f0883e]">{inspectedVar.aliasedWith.join(', ')}</span>
                      </div>
                    )}
                    {inspectedVar.inActiveScope === false && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#f85149]">Scope Status:</span>
                        <span className="text-[10px] font-bold text-[#f85149] bg-[#f85149]/15 px-1 rounded">No longer in active scope</span>
                      </div>
                    )}
                    {inspectedVar.educationalSize && (
                      <div className="text-[10px] text-[#8b949e] italic mt-1 border-t border-[#30363d]/50 pt-1">
                        {inspectedVar.educationalSize}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[#8b949e] italic py-4 text-center">
                    Select a variable from the stack to inspect its reference.
                  </span>
                )}
              </div>

              {/* Selected Heap Object */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
                <span className="font-bold text-xs text-[#bc8cff] border-b border-[#30363d] pb-1">
                  Heap Object Inspector
                </span>
                {inspectedObj ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Class:</span>
                      <span className="font-bold text-[#bc8cff]">{inspectedObj.className || inspectedObj.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Object ID:</span>
                      <span className="font-bold text-[#f0f6fc]">
                        {inspectedObj.objectId || inspectedObj.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">GC Status:</span>
                      <span className={`font-bold ${inspectedObj.gcEligible ? 'text-[#d29922]' : 'text-[#3fb950]'}`}>
                        {inspectedObj.gcEligible ? 'Eligible for GC' : 'Active (Referenced)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e]">Referenced By:</span>
                      <span className="text-[#58a6ff] font-bold">
                        {inspectedObj.referencesFrom && inspectedObj.referencesFrom.length > 0
                          ? inspectedObj.referencesFrom.join(', ')
                          : 'None'}
                      </span>
                    </div>
                    {inspectedObj.aliased && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#f0883e]">Aliasing:</span>
                        <span className="font-bold text-[#f0883e] bg-[#f0883e]/15 px-1 rounded">
                          Shared by multiple references ({inspectedObj.referencesFrom?.join(', ')})
                        </span>
                      </div>
                    )}

                    {/* Fields */}
                    <div className="mt-1 pt-2 border-t border-[#30363d]">
                      <span className="text-[#8b949e] block mb-1">Instance Fields:</span>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(inspectedObj.fields).map(([fk, fv]) => (
                          <div key={fk} className="p-1 rounded bg-[#161b22] border border-[#30363d] flex justify-between">
                            <span className="text-[#8b949e]">{fk}:</span>
                            <span className="font-bold text-[#f0f6fc] truncate">{JSON.stringify(fv)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nested References */}
                    {inspectedObj.nestedReferences && Object.keys(inspectedObj.nestedReferences).length > 0 && (
                      <div className="flex flex-col gap-1 border-t border-[#30363d]/60 pt-1 mt-1">
                        <span className="text-[#8b949e] text-[10px]">Nested Object References:</span>
                        {Object.entries(inspectedObj.nestedReferences).map(([fKey, targetId]) => (
                          <div
                            key={fKey}
                            onClick={() => setSelectedObjectId(targetId)}
                            className="flex items-center justify-between p-1 rounded bg-[#161b22] border border-[#7ee787]/40 text-[#7ee787] cursor-pointer hover:bg-[#7ee787]/10"
                          >
                            <span>.{fKey} ➔</span>
                            <span className="font-bold underline">{targetId}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[#8b949e] italic py-4 text-center">
                    Select a heap object to inspect its fields and references.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Directed Object Graph (Section 26, 36, 37) */}
        {activeTab === 'graph' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7ee787] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Runtime Object Graph</span>
              </span>
              <span className="text-[10px] text-[#8b949e]">
                Generated from actual runtime references (Stack ➔ Heap ➔ Nested Heap)
              </span>
            </div>

            {objectGraph.length === 0 ? (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] italic">
                No active object references or heap instances in memory yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {objectGraph.map((edge, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0d1117] border border-[#30363d] hover:border-[#7ee787] transition-all rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#58a6ff] bg-[#58a6ff]/10 border border-[#58a6ff]/30 px-1.5 py-0.5 rounded">
                        {edge.fromName}
                      </span>
                      <span className="text-[#8b949e] text-[10px] font-sans italic">{edge.label || 'refers to'}</span>
                      <span className="font-bold text-[#bc8cff] bg-[#bc8cff]/10 border border-[#bc8cff]/30 px-1.5 py-0.5 rounded">
                        {edge.toName}
                      </span>
                    </div>

                    <div className="flex items-center justify-center py-2 text-[#7ee787]">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="h-0.5 w-12 bg-gradient-to-r from-[#58a6ff] to-[#bc8cff]"></span>
                        <span>➔</span>
                        <span className="text-[10px] text-[#8b949e]">Pointer Binding</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#8b949e] bg-[#161b22] p-1.5 rounded border border-[#30363d]/60">
                      Target Object: <strong className="text-[#f0f6fc]">{edge.toId}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] flex items-center gap-2">
              <span className="text-[#7ee787] font-bold">Concept:</span>
              <span>Java variables do not hold objects directly. Stack variables hold references (pointers) pointing to objects allocated on the Heap. Aliasing occurs when two or more references point to the exact same Heap object ID.</span>
            </div>
          </div>
        )}

        {/* Tab 3: Threads & Locks (Section 80) */}
        {activeTab === 'threads' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-[#39c5cf]">Active JVM Threads & Intrinsic Locks</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2">
                <span className="font-bold text-xs text-[#39c5cf]">Threads</span>
                {Object.values(threads).map((th) => (
                  <div key={th.id} className="p-2 rounded bg-[#161b22] border border-[#30363d] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#f0f6fc]">{th.name}</span>
                      <span className="text-[10px] text-[#8b949e] block">ID: {th.id} | Stack Frames: {th.callStack.length}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#39c5cf]/20 text-[#39c5cf] border border-[#39c5cf]/40">
                      {th.state}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2">
                <span className="font-bold text-xs text-[#d29922]">Intrinsic Locks (Monitors)</span>
                {Object.keys(locks).length === 0 ? (
                  <span className="text-[#8b949e] italic py-3 text-center">No active monitors</span>
                ) : (
                  Object.values(locks).map((lk) => (
                    <div key={lk.id} className="p-2 rounded bg-[#161b22] border border-[#30363d] flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#d29922]">Lock [{lk.name}]</span>
                        <span className="text-[10px] text-[#3fb950]">{lk.ownerThreadId ? `Held by ${lk.ownerThreadId}` : 'Free'}</span>
                      </div>
                      {lk.waitingThreadIds.length > 0 && (
                        <div className="text-[10px] text-[#f85149]">
                          Waiting Threads: {lk.waitingThreadIds.join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: String Pool (Section 43) */}
        {activeTab === 'strings' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#bc8cff]">String Pool — Conceptual JVM View</span>
              <span className="text-[10px] text-[#8b949e]">String literals interned in constant pool</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {stringPool.map((sp, idx) => (
                <div key={idx} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2 flex flex-col gap-1">
                  <span className="font-bold text-[#f0f6fc]">"{sp.value}"</span>
                  <span className="text-[10px] text-[#8b949e]">
                    References: <strong className="text-[#58a6ff]">{sp.references.join(', ') || 'literal'}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Memory Footprint Table & Disclaimer */}
      <div className="px-3 py-1.5 bg-[#0d1117] border-t border-[#30363d] text-[10px] text-[#8b949e] flex items-center justify-between">
        <span className="truncate">
          Estimates based on 64-bit JVM specification with Compressed OOPs enabled. Conceptual educational view.
        </span>
        <span className="text-[#3fb950] font-mono font-bold whitespace-nowrap ml-2">
          Refs: {references.length}
        </span>
      </div>
    </div>
  );
};
