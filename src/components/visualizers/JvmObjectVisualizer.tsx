import React, { useState } from 'react';
import { ExecutionStep, HeapObject, VariableInfo } from '../../types/execution';
import { Layers, HardDrive, ShieldAlert, Cpu, Database, Eye, AlertTriangle } from 'lucide-react';

interface JvmObjectVisualizerProps {
  currentStep: ExecutionStep;
  onSelectObject?: (objId: string) => void;
  onSelectVariable?: (varName: string) => void;
}

export const JvmObjectVisualizer: React.FC<JvmObjectVisualizerProps> = ({
  currentStep,
  onSelectObject,
  onSelectVariable,
}) => {
  const [inspectedObjectId, setInspectedObjectId] = useState<string | null>(null);
  const [inspectedVarName, setInspectedVarName] = useState<string | null>(null);

  const variables = Object.values(currentStep.variables);
  const heap = currentStep.heap;
  const staticFields = currentStep.staticFields || {};
  const threads = currentStep.threads || {};
  const locks = currentStep.locks || {};
  const deadlock = currentStep.deadlockDetected;
  const stringPool = currentStep.stringPool || [];

  // Categorize heap objects: Custom OOP objects vs collections/arrays
  const customObjects = heap.filter((h) => h.className || (h.type && !['array', 'matrix', 'stack', 'queue', 'deque', 'linkedlist', 'map', 'set', 'tree', 'heap', 'graph', 'trie'].includes(h.type.toLowerCase())));

  const inspectedObj = inspectedObjectId
    ? heap.find((h) => h.id === inspectedObjectId || h.id === `@${inspectedObjectId}`)
    : null;

  const inspectedVar = inspectedVarName ? currentStep.variables[inspectedVarName] : null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#30363d] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#58a6ff]/15 border border-[#58a6ff]/30 text-[#58a6ff]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#f0f6fc]">Educational JVM Memory View</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30">
                Conceptual JVM View
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">
              Visualizing runtime Stack Frames, Heap Objects, References, and Class Metaspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
          <span className="px-2 py-1 bg-[#0d1117] rounded border border-[#30363d]">
            Objects: <strong className="text-[#58a6ff]">{customObjects.length}</strong>
          </span>
          <span className="px-2 py-1 bg-[#0d1117] rounded border border-[#30363d]">
            Total Est: <strong className="text-[#3fb950]">~{currentStep.memoryStats.totalBytes}B</strong>
          </span>
        </div>
      </div>

      {/* Deadlock Alert Banner if present */}
      {deadlock && (
        <div className="bg-[#f85149]/15 border border-[#f85149]/50 rounded-xl p-3 flex items-center gap-3 text-[#f85149] animate-pulse">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">POSSIBLE DEADLOCK DETECTED</div>
            <div className="text-xs text-[#f0f6fc]">
              Threads are waiting circularly on synchronized locks. Neither thread can proceed.
            </div>
          </div>
        </div>
      )}

      {/* Tri-Column Memory Layout: Stack | Heap | Static Metaspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 1. STACK COLUMN (4 cols) */}
        <div className="lg:col-span-4 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#58a6ff]">
              <Layers className="w-4 h-4" />
              <span>STACK (Frames & References)</span>
            </div>
            <span className="text-[11px] font-mono text-[#8b949e]">~{currentStep.memoryStats.stackBytes}B</span>
          </div>

          {/* Active Call Frame */}
          <div className="flex flex-col gap-2">
            {currentStep.callStack.map((frame, idx) => (
              <div
                key={frame.id || idx}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-2 shadow"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#58a6ff] border-b border-[#30363d]/60 pb-1">
                  <span className="font-bold flex items-center gap-1">
                    <span>{frame.functionName}()</span>
                    <span className="text-[10px] text-[#8b949e]">frame</span>
                  </span>
                  <span className="text-[10px] text-[#8b949e]">Line {frame.line}</span>
                </div>

                {/* Variables in Frame */}
                <div className="flex flex-col gap-1.5">
                  {variables.length === 0 ? (
                    <span className="text-[11px] text-[#8b949e] italic text-center py-2">
                      No local variables allocated
                    </span>
                  ) : (
                    variables.map((v) => {
                      const isNull = v.value === null || v.value === 'null';
                      const isSelected = inspectedVarName === v.name;
                      return (
                        <div
                          key={v.name}
                          onClick={() => {
                            setInspectedVarName(v.name);
                            if (v.refTargetId) setInspectedObjectId(v.refTargetId);
                            onSelectVariable?.(v.name);
                          }}
                          className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#58a6ff] bg-[#58a6ff]/15 text-[#f0f6fc]'
                              : v.isReference
                              ? 'bg-[#bc8cff]/10 border-[#bc8cff]/30 hover:border-[#bc8cff]/60 text-[#f0f6fc]'
                              : 'bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff]/50 text-[#f0f6fc]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-[#58a6ff]">{v.name}</span>
                            <span className="text-[10px] text-[#8b949e]">({v.type})</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {v.isReference ? (
                              isNull ? (
                                <span className="px-1.5 py-0.5 rounded bg-[#f85149]/20 text-[#f85149] font-bold text-[10px] border border-[#f85149]/30">
                                  null
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[#bc8cff] font-bold text-[11px]">
                                  <span>──►</span>
                                  <span>{v.refTargetId || 'obj'}</span>
                                </span>
                              )
                            ) : (
                              <span className="font-semibold text-[#3fb950]">{String(v.value)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. HEAP COLUMN (5 cols) */}
        <div className="lg:col-span-5 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#bc8cff]">
              <HardDrive className="w-4 h-4" />
              <span>HEAP (Objects & Instances)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#8b949e] font-mono">
              <span>~{currentStep.memoryStats.heapBytes}B</span>
              <span className="text-[9px] text-[#8b949e]/70">(Est.)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px] pr-1">
            {customObjects.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-[#8b949e] border border-dashed border-[#30363d] rounded-xl p-4">
                No custom objects currently allocated on the heap.
              </div>
            ) : (
              customObjects.map((obj) => {
                const isSelected = inspectedObjectId === obj.id || inspectedObjectId === obj.id.replace(/^@/, '');
                const cleanId = obj.id.replace(/^@/, '');
                const isGcEligible = obj.gcEligible || (obj.referencesFrom && obj.referencesFrom.length === 0);

                return (
                  <div
                    key={obj.id}
                    onClick={() => {
                      setInspectedObjectId(cleanId);
                      onSelectObject?.(cleanId);
                    }}
                    className={`bg-[#161b22] border rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer shadow-md ${
                      isSelected
                        ? 'border-[#bc8cff] ring-2 ring-[#bc8cff]/30 shadow-[#bc8cff]/20'
                        : isGcEligible
                        ? 'border-[#d29922]/50 hover:border-[#d29922] bg-[#d29922]/5'
                        : 'border-[#30363d] hover:border-[#bc8cff]/60'
                    }`}
                  >
                    {/* Object Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#bc8cff]">
                          {obj.className || obj.type}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] font-semibold border border-[#30363d]">
                          {cleanId}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isGcEligible ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40 animate-pulse">
                            Eligible for GC
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/40">
                            Reachable
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[#8b949e]">~{obj.estimatedBytes}B</span>
                      </div>
                    </div>

                    {/* Referenced From Badges (Stack references converging on this object) */}
                    {obj.referencesFrom && obj.referencesFrom.length > 0 ? (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#8b949e]">
                        <span>Refs from Stack:</span>
                        <div className="flex flex-wrap gap-1">
                          {obj.referencesFrom.map((rf) => (
                            <span
                              key={rf}
                              className="px-1.5 py-0.2 rounded bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 font-bold"
                            >
                              {rf} ──►
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-[#d29922] italic">
                        No active references (Eligible for Garbage Collection)
                      </div>
                    )}

                    {/* Fields Table */}
                    <div className="bg-[#0d1117] rounded-lg p-2 border border-[#30363d]/60 text-xs font-mono">
                      {Object.keys(obj.fields).length === 0 ? (
                        <span className="text-[#8b949e] italic text-[11px]">No fields initialized</span>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          {Object.entries(obj.fields).map(([fk, fv]) => {
                            const isRefField = typeof fv === 'string' && (fv.startsWith('object-') || fv.startsWith('obj-') || fv.startsWith('@obj-'));
                            const cleanTarget = isRefField ? fv.replace(/^@/, '') : null;
                            return (
                              <div
                                key={fk}
                                onClick={(e) => {
                                  if (cleanTarget) {
                                    e.stopPropagation();
                                    setInspectedObjectId(cleanTarget);
                                    onSelectObject?.(cleanTarget);
                                  }
                                }}
                                className={`flex items-center justify-between p-1 bg-[#161b22] rounded border ${
                                  cleanTarget
                                    ? 'border-[#bc8cff]/40 hover:border-[#bc8cff] cursor-pointer'
                                    : 'border-[#30363d]/40'
                                }`}
                              >
                                <span className="text-[#8b949e] font-semibold">{fk}:</span>
                                <span className="text-[#f0f6fc] font-bold truncate max-w-[90px]">
                                  {cleanTarget ? (
                                    <span className="text-[#bc8cff] underline flex items-center gap-0.5">
                                      <span>➔</span>
                                      <span>{cleanTarget}</span>
                                    </span>
                                  ) : (
                                    JSON.stringify(fv)
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. STATIC AREA & CONCURRENCY (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Static Area / Metaspace */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-xs font-bold text-[#d29922]">
              <Database className="w-4 h-4" />
              <span>CLASS / STATIC AREA</span>
            </div>

            {Object.keys(staticFields).length === 0 ? (
              <span className="text-[11px] text-[#8b949e] italic text-center py-2">
                No static fields loaded
              </span>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(staticFields).map(([className, flds]) => (
                  <div key={className} className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 text-xs font-mono">
                    <div className="font-bold text-[#d29922] mb-1">{className}</div>
                    <div className="flex flex-col gap-1 text-[11px]">
                      {Object.entries(flds).map(([fName, fVal]) => (
                        <div key={fName} className="flex items-center justify-between">
                          <span className="text-[#8b949e]">{fName}:</span>
                          <span className="font-bold text-[#f0f6fc]">{JSON.stringify(fVal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Multithreading & Locks Overview (if present) */}
          {Object.keys(threads).length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-xs font-bold text-[#39c5cf]">
                <Cpu className="w-4 h-4" />
                <span>THREADS & LOCKS</span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-mono">
                {Object.values(threads).map((th) => (
                  <div key={th.id} className="flex items-center justify-between p-1.5 rounded bg-[#161b22] border border-[#30363d]">
                    <span className="font-bold text-[#f0f6fc]">{th.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        th.state === 'RUNNING'
                          ? 'bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/40'
                          : th.state === 'BLOCKED'
                          ? 'bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40'
                          : 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40'
                      }`}
                    >
                      {th.state}
                    </span>
                  </div>
                ))}

                {Object.keys(locks).length > 0 && (
                  <div className="pt-2 border-t border-[#30363d]/60 flex flex-col gap-1">
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold">Locks:</span>
                    {Object.values(locks).map((lk) => (
                      <div key={lk.id} className="text-[10px] bg-[#161b22] p-1.5 rounded border border-[#30363d] text-[#8b949e]">
                        <span className="text-[#39c5cf] font-bold">[{lk.name}]</span>{' '}
                        {lk.ownerThreadId ? (
                          <span>
                            Owned by <strong className="text-[#f0f6fc]">{lk.ownerThreadId}</strong>
                          </span>
                        ) : (
                          <span className="text-[#3fb950]">Free</span>
                        )}
                        {lk.waitingThreadIds.length > 0 && (
                          <div className="text-[#f85149]">
                            Waiting: {lk.waitingThreadIds.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* String Pool (Conceptual View) */}
          {stringPool.length > 0 && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-1.5 text-xs font-bold text-[#bc8cff]">
                <span>STRING POOL</span>
                <span className="text-[9px] text-[#8b949e] font-normal">Conceptual</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] font-mono">
                {stringPool.map((sp, idx) => (
                  <div key={idx} className="p-1.5 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between">
                    <span className="text-[#f0f6fc] font-bold">"{sp.value}"</span>
                    <span className="text-[10px] text-[#8b949e]">Refs: {sp.references.join(', ') || '1'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Object & Reference Inspector (Section 48, 49, 50, 51) */}
      {(inspectedObj || inspectedVar) && (
        <div className="bg-[#0d1117] border border-[#58a6ff]/40 rounded-xl p-3 flex flex-col gap-2.5 text-xs font-mono shadow-inner">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-1.5">
            <div className="flex items-center gap-2 text-[#58a6ff] font-bold">
              <Eye className="w-4 h-4" />
              <span>
                {inspectedObj
                  ? `OBJECT INSPECTOR — ${inspectedObj.className || inspectedObj.type} (${inspectedObj.id})`
                  : `VARIABLE & REFERENCE INSPECTOR — ${inspectedVar?.name}`}
              </span>
            </div>
            <button
              onClick={() => {
                setInspectedObjectId(null);
                setInspectedVarName(null);
              }}
              className="text-[#8b949e] hover:text-[#f0f6fc] text-xs font-bold px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d]"
            >
              ✕ Close
            </button>
          </div>

          {inspectedObj && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Object ID:</span>
                  <span className="text-[#58a6ff] font-bold">{inspectedObj.id}</span>
                </div>
                <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Class / Type:</span>
                  <span className="text-[#bc8cff] font-bold">{inspectedObj.className || inspectedObj.type}</span>
                </div>
                <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Lifecycle / GC:</span>
                  <span
                    className={`font-bold ${
                      inspectedObj.gcEligible ? 'text-[#d29922]' : 'text-[#3fb950]'
                    }`}
                  >
                    {inspectedObj.gcEligible ? 'Eligible for GC' : 'Reachable'}
                  </span>
                </div>
                <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Est. Memory:</span>
                  <span className="text-[#3fb950] font-bold">~{inspectedObj.estimatedBytes} B (Educational)</span>
                </div>
              </div>

              {/* Object Fields Table */}
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold mb-1 block">Object Fields:</span>
                {Object.keys(inspectedObj.fields).length === 0 ? (
                  <span className="text-[#8b949e] italic text-[10px]">No instance fields declared</span>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                    {Object.entries(inspectedObj.fields).map(([fk, fv]) => (
                      <div key={fk} className="flex items-center justify-between p-1.5 bg-[#0d1117] rounded border border-[#30363d]">
                        <span className="text-[#8b949e] font-semibold">{fk}:</span>
                        <span className="font-bold text-[#f0f6fc]">
                          {typeof fv === 'string' && fv.startsWith('object-') ? (
                            <span className="text-[#bc8cff]">➔ {fv}</span>
                          ) : (
                            JSON.stringify(fv)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {inspectedVar && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Variable Name:</span>
                  <span className="text-[#58a6ff] font-bold">{inspectedVar.name}</span>
                </div>
                <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Kind:</span>
                  <span className="text-[#e3b341] font-bold">
                    {inspectedVar.kind || (inspectedVar.isReference ? 'Reference' : 'Primitive')}
                  </span>
                </div>
                <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Declared Type:</span>
                  <span className="text-[#f0f6fc] font-bold">{inspectedVar.type}</span>
                </div>
                <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Scope:</span>
                  <span className="text-[#3fb950] font-bold">{inspectedVar.scope}()</span>
                </div>
              </div>

              <div className="p-2 bg-[#161b22] rounded border border-[#30363d] flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-[#8b949e]">Current Value / Target: </span>
                  <span className="text-[#bc8cff] font-bold">
                    {inspectedVar.isReference
                      ? (inspectedVar.refTargetId ? `➔ ${inspectedVar.refTargetId}` : 'null (Null Reference)')
                      : String(inspectedVar.value)}
                  </span>
                </div>
                <span className="text-[10px] text-[#8b949e]">
                  {inspectedVar.educationalSize || 'Typical Java representation'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
