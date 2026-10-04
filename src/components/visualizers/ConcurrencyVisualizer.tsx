import React, { useState } from 'react';
import { ExecutionStep, ThreadState, LockState } from '../../types/execution';
import {
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Layers,
  Activity,
  Cpu,
  RefreshCw,
  GitCommit,
} from 'lucide-react';

interface ConcurrencyVisualizerProps {
  currentStep: ExecutionStep;
  onSelectThread?: (threadId: string) => void;
  onSelectLock?: (lockName: string) => void;
}

export const ConcurrencyVisualizer: React.FC<ConcurrencyVisualizerProps> = ({
  currentStep,
  onSelectThread,
  onSelectLock,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedLockId, setSelectedLockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'threads' | 'monitors' | 'pool' | 'analysis'>('threads');

  const threadsMap = currentStep.threads || {};
  const threads: ThreadState[] = Object.values(threadsMap);
  const locksMap = currentStep.locks || {};
  const locks: LockState[] = Object.values(locksMap);
  const deadlock = currentStep.deadlockDetected;
  const deadlockInfo = currentStep.deadlockInfo;
  const raceInfo = currentStep.raceConditionInfo;
  const concurrencyInfo = currentStep.concurrencyInfo;
  const executor = currentStep.executorState;
  const activeConcept = currentStep.activeJavaConcept;

  // Active executing thread
  const activeThread =
    threads.find((t) => t.id === selectedThreadId || t.name === selectedThreadId) ||
    threads.find((t) => t.state === 'RUNNING') ||
    threads[0] ||
    null;

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'RUNNING':
        return { bg: 'bg-[#3fb950]/20', border: 'border-[#3fb950]/50', text: 'text-[#3fb950]', dot: 'bg-[#3fb950]' };
      case 'RUNNABLE':
        return { bg: 'bg-[#58a6ff]/20', border: 'border-[#58a6ff]/50', text: 'text-[#58a6ff]', dot: 'bg-[#58a6ff]' };
      case 'BLOCKED':
        return { bg: 'bg-[#f85149]/20', border: 'border-[#f85149]/50', text: 'text-[#f85149]', dot: 'bg-[#f85149]' };
      case 'WAITING':
        return { bg: 'bg-[#d29922]/20', border: 'border-[#d29922]/50', text: 'text-[#d29922]', dot: 'bg-[#d29922]' };
      case 'TIMED_WAITING':
        return { bg: 'bg-[#bc8cff]/20', border: 'border-[#bc8cff]/50', text: 'text-[#bc8cff]', dot: 'bg-[#bc8cff]' };
      case 'TERMINATED':
        return { bg: 'bg-[#8b949e]/20', border: 'border-[#8b949e]/50', text: 'text-[#8b949e]', dot: 'bg-[#8b949e]' };
      default:
        return { bg: 'bg-[#8b949e]/20', border: 'border-[#30363d]', text: 'text-[#8b949e]', dot: 'bg-[#8b949e]' };
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-xl flex flex-col gap-4 text-[#f0f6fc]">
      {/* ─── HEADER & TAB CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#30363d] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#58a6ff]/15 border border-[#58a6ff]/30 text-[#58a6ff]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#f0f6fc]">Java Concurrency & Threads Engine</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30">
                Phase 17 Runtime
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">
              Visualizing Real JVM Threads, Monitors, Synchronized Locks, Wait Sets & Contention
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'threads' ? 'bg-[#58a6ff]/20 text-[#58a6ff] font-semibold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Threads ({threads.length})
          </button>
          <button
            onClick={() => setActiveTab('monitors')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'monitors' ? 'bg-[#58a6ff]/20 text-[#58a6ff] font-semibold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Monitors & Locks ({locks.length})
          </button>
          {executor && (
            <button
              onClick={() => setActiveTab('pool')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'pool' ? 'bg-[#58a6ff]/20 text-[#58a6ff] font-semibold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              Thread Pool
            </button>
          )}
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'analysis' ? 'bg-[#58a6ff]/20 text-[#58a6ff] font-semibold' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Safety Analysis {(deadlock || raceInfo?.isObserved) && '⚠️'}
          </button>
        </div>
      </div>

      {/* ─── DEADLOCK ALERT BANNER ─── */}
      {deadlock && (
        <div className="bg-[#f85149]/15 border border-[#f85149]/60 rounded-xl p-3 flex flex-col gap-2 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-[#f85149]">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">DEADLOCK DETECTED: CIRCULAR LOCK DEPENDENCY</span>
          </div>
          <p className="text-xs text-[#f0f6fc]">
            Two or more threads are permanently blocked waiting for locks held by each other. Circular wait condition exists.
          </p>
          {deadlockInfo?.threads && (
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono bg-[#0d1117]/80 p-2 rounded border border-[#f85149]/40">
              {deadlockInfo.threads.map((dt, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span className="text-[#f85149] font-bold">[{dt.threadName}]</span>
                  <span className="text-[#8b949e]">holds</span>
                  <span className="text-[#d29922] font-semibold">{dt.holdingLock}</span>
                  <ArrowRight className="w-3 h-3 text-[#f85149]" />
                  <span className="text-[#8b949e]">waiting for</span>
                  <span className="text-[#58a6ff] font-semibold">{dt.waitingForLock}</span>
                  {idx < deadlockInfo.threads.length - 1 && <span className="text-[#8b949e] mx-1">|</span>}
                </span>
              ))}
            </div>
          )}
          {deadlockInfo?.preventionExplanation && (
            <p className="text-[11px] text-[#3fb950] italic">
              💡 {deadlockInfo.preventionExplanation}
            </p>
          )}
        </div>
      )}

      {/* ─── RACE CONDITION ALERT BANNER ─── */}
      {raceInfo?.isObserved && (
        <div className="bg-[#d29922]/15 border border-[#d29922]/60 rounded-xl p-3 flex flex-col gap-1.5 shadow-lg">
          <div className="flex items-center gap-2 text-[#d29922]">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              RACE CONDITION OBSERVED ON [{raceInfo.variableName}]
            </span>
          </div>
          <p className="text-xs text-[#f0f6fc]">{raceInfo.explanation}</p>
          <div className="flex items-center gap-3 text-xs font-mono text-[#8b949e]">
            <span>Threads: {raceInfo.threadsInvolved.join(', ')}</span>
            {raceInfo.expectedValue !== undefined && <span>Expected: {raceInfo.expectedValue}</span>}
            {raceInfo.actualValue !== undefined && <span className="text-[#f85149] font-bold">Actual: {raceInfo.actualValue}</span>}
          </div>
        </div>
      )}

      {/* ─── TAB 1: THREADS VIEW ─── */}
      {activeTab === 'threads' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Thread Cards List (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center justify-between">
              <span>Managed JVM Threads ({threads.length})</span>
              <span className="text-[11px] font-mono lowercase">Click thread to inspect</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {threads.length === 0 ? (
                <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl text-center text-xs text-[#8b949e]">
                  No concurrent threads registered. Executing on main thread.
                </div>
              ) : (
                threads.map((t) => {
                  const style = getStatusColor(t.state);
                  const isSelected = activeThread?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedThreadId(t.id);
                        if (onSelectThread) onSelectThread(t.id);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 bg-[#0d1117] flex flex-col gap-2 shadow hover:border-[#58a6ff]/50 ${
                        isSelected ? 'border-[#58a6ff] ring-1 ring-[#58a6ff]' : 'border-[#30363d]'
                      }`}
                    >
                      {/* Top Bar: Name & State Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
                          <span className="font-mono font-bold text-xs text-[#f0f6fc]">{t.name}</span>
                          {t.daemon && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#30363d] text-[#8b949e]">
                              daemon
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}
                        >
                          {t.state}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
                        <span>Priority: {t.priority ?? 5}</span>
                        <span>Line: {t.currentLine ?? currentStep.line}</span>
                        <span>Method: {t.currentMethod || 'run()'}</span>
                      </div>

                      {/* Blocking/Waiting Indicator */}
                      {t.state === 'BLOCKED' && t.waitingFor && (
                        <div className="text-[11px] text-[#f85149] bg-[#f85149]/10 px-2 py-1 rounded border border-[#f85149]/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>BLOCKED on monitor: <strong>{t.waitingFor}</strong></span>
                        </div>
                      )}
                      {t.state === 'WAITING' && t.waitingFor && (
                        <div className="text-[11px] text-[#d29922] bg-[#d29922]/10 px-2 py-1 rounded border border-[#d29922]/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>WAITING for: <strong>{t.waitingFor}</strong></span>
                        </div>
                      )}

                      {/* Owned Locks */}
                      {t.ownedLocks && t.ownedLocks.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#3fb950]">
                          <Unlock className="w-3 h-3" />
                          <span>Holds: {t.ownedLocks.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Thread Inspector (4 cols) */}
          <div className="lg:col-span-4 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#58a6ff] border-b border-[#30363d] pb-2">
              <Activity className="w-4 h-4" />
              <span>Thread Inspector</span>
            </div>

            {activeThread ? (
              <div className="flex flex-col gap-3 text-xs font-mono">
                <div className="flex justify-between border-b border-[#30363d]/50 pb-1">
                  <span className="text-[#8b949e]">Thread ID / Name:</span>
                  <span className="text-[#f0f6fc] font-bold">{activeThread.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#30363d]/50 pb-1">
                  <span className="text-[#8b949e]">OS / JVM State:</span>
                  <span className={`font-bold ${getStatusColor(activeThread.state).text}`}>
                    {activeThread.state}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#30363d]/50 pb-1">
                  <span className="text-[#8b949e]">Current Program Line:</span>
                  <span className="text-[#58a6ff]">Line {activeThread.currentLine || currentStep.line}</span>
                </div>
                <div className="flex justify-between border-b border-[#30363d]/50 pb-1">
                  <span className="text-[#8b949e]">Daemon Thread:</span>
                  <span className="text-[#f0f6fc]">{activeThread.daemon ? 'Yes' : 'No'}</span>
                </div>

                {/* Call Stack for Thread */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[11px] text-[#8b949e] uppercase font-bold">Call Stack Frames:</span>
                  {activeThread.callStack && activeThread.callStack.length > 0 ? (
                    activeThread.callStack.map((frame, idx) => (
                      <div
                        key={idx}
                        className="bg-[#161b22] border border-[#30363d] p-2 rounded text-[11px] flex justify-between items-center"
                      >
                        <span className="text-[#58a6ff] font-bold">{frame.functionName}()</span>
                        <span className="text-[#8b949e]">line {frame.line}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#161b22] border border-[#30363d] p-2 rounded text-[11px] text-[#8b949e] italic">
                      [main/run execution frame]
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#8b949e] italic text-center py-4">
                Select a thread to view its inspector details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: MONITORS & LOCKS ─── */}
      {activeTab === 'monitors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locks.length === 0 ? (
            <div className="col-span-full p-6 bg-[#0d1117] border border-[#30363d] rounded-xl text-center text-xs text-[#8b949e]">
              No active monitor locks detected in current execution step.
            </div>
          ) : (
            locks.map((lk) => {
              const hasOwner = !!lk.ownerThreadId;
              const entryQueue = lk.entryQueue || lk.waitingThreadIds || [];
              const waitSet = lk.waitSet || [];
              return (
                <div
                  key={lk.id || lk.name}
                  className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 flex flex-col gap-3 shadow"
                >
                  <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                    <div className="flex items-center gap-2">
                      <Lock className={`w-4 h-4 ${hasOwner ? 'text-[#f85149]' : 'text-[#3fb950]'}`} />
                      <span className="font-mono font-bold text-xs text-[#f0f6fc]">{lk.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        hasOwner
                          ? 'bg-[#f85149]/20 border-[#f85149]/40 text-[#f85149]'
                          : 'bg-[#3fb950]/20 border-[#3fb950]/40 text-[#3fb950]'
                      }`}
                    >
                      {hasOwner ? 'LOCKED' : 'AVAILABLE'}
                    </span>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8b949e]">Owner Thread:</span>
                    <span className={hasOwner ? 'text-[#f85149] font-bold' : 'text-[#8b949e] italic'}>
                      {lk.ownerThreadId || 'None (Unlocked)'}
                    </span>
                  </div>

                  {/* Entry Set (Blocked Threads) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-[#8b949e] flex justify-between">
                      <span>Entry Set (BLOCKED)</span>
                      <span>{entryQueue.length}</span>
                    </span>
                    <div className="min-h-[28px] bg-[#161b22] border border-[#30363d] rounded p-1.5 flex flex-wrap gap-1">
                      {entryQueue.length === 0 ? (
                        <span className="text-[10px] text-[#8b949e] italic">Empty</span>
                      ) : (
                        entryQueue.map((w, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40 px-1.5 py-0.5 rounded"
                          >
                            {w}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Wait Set (wait() Threads) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-[#8b949e] flex justify-between">
                      <span>Wait Set (WAITING on wait())</span>
                      <span>{waitSet.length}</span>
                    </span>
                    <div className="min-h-[28px] bg-[#161b22] border border-[#30363d] rounded p-1.5 flex flex-wrap gap-1">
                      {waitSet.length === 0 ? (
                        <span className="text-[10px] text-[#8b949e] italic">Empty</span>
                      ) : (
                        waitSet.map((w, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40 px-1.5 py-0.5 rounded"
                          >
                            {w}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 3: THREAD POOL & EXECUTORS ─── */}
      {activeTab === 'pool' && executor && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#bc8cff]" />
              <span className="font-bold text-sm text-[#f0f6fc]">
                ExecutorService: {executor.poolName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#8b949e]">
              <span>Workers: <strong className="text-[#bc8cff]">{executor.poolSize}</strong></span>
              <span>Completed: <strong className="text-[#3fb950]">{executor.tasksCompleted}</strong></span>
            </div>
          </div>

          {/* Workers and Queue Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Workers */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#8b949e] uppercase">Active Worker Threads</span>
              <div className="flex flex-col gap-2">
                {executor.activeWorkerThreads.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
                      <span className="font-bold text-[#f0f6fc]">{w}</span>
                    </div>
                    <span className="text-[#3fb950] text-[10px] bg-[#3fb950]/10 px-2 py-0.5 rounded">
                      READY / RUNNING
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Queue */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#8b949e] uppercase">
                Task Queue ({executor.taskQueue.length})
              </span>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                {executor.taskQueue.length === 0 ? (
                  <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-center text-xs text-[#8b949e] italic">
                    Task queue empty
                  </div>
                ) : (
                  executor.taskQueue.map((tsk: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-[#58a6ff]">{tsk.name || tsk.id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          tsk.status === 'COMPLETED'
                            ? 'bg-[#3fb950]/20 text-[#3fb950]'
                            : tsk.status === 'RUNNING'
                            ? 'bg-[#d29922]/20 text-[#d29922]'
                            : 'bg-[#8b949e]/20 text-[#8b949e]'
                        }`}
                      >
                        {tsk.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SAFETY ANALYSIS ─── */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Concurrency Concept Card */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-xs font-bold text-[#58a6ff] uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit className="w-4 h-4" />
              <span>Current Concurrency Concept</span>
            </span>
            {activeConcept ? (
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-xs text-[#f0f6fc]">{activeConcept.name}</span>
                <p className="text-xs text-[#8b949e] leading-relaxed">{activeConcept.explanation}</p>
                {activeConcept.badge && (
                  <span className="self-start text-[10px] font-mono px-2 py-0.5 rounded bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40">
                    {activeConcept.badge}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#8b949e] italic">No active concept flagged on this step.</p>
            )}
          </div>

          {/* Action Summary */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-xs font-bold text-[#3fb950] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>Last Concurrency Action</span>
            </span>
            {concurrencyInfo ? (
              <div className="flex flex-col gap-1 text-xs font-mono">
                <div className="flex justify-between border-b border-[#30363d]/50 pb-1">
                  <span className="text-[#8b949e]">Action:</span>
                  <span className="text-[#3fb950] font-bold">{concurrencyInfo.actionType}</span>
                </div>
                <div className="flex justify-between border-b border-[#30363d]/50 pb-1">
                  <span className="text-[#8b949e]">Thread:</span>
                  <span className="text-[#f0f6fc]">{concurrencyInfo.threadName}</span>
                </div>
                <p className="text-[11px] text-[#8b949e] mt-1">{concurrencyInfo.description}</p>
              </div>
            ) : (
              <p className="text-xs text-[#8b949e] italic">Normal execution flow.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
