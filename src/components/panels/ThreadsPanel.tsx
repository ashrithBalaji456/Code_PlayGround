import React, { useState } from 'react';
import { ThreadState, LockState, ExecutionStep, CallFrame } from '../../types/execution';
import {
  Cpu,
  ShieldAlert,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  Clock,
  Layers,
  Activity,
  Workflow,
  Sparkles,
  GitBranch,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

interface ThreadsPanelProps {
  currentStep: ExecutionStep | null;
}

export const ThreadsPanel: React.FC<ThreadsPanelProps> = ({ currentStep }) => {
  const [activeTab, setActiveTab] = useState<'threads' | 'locks' | 'races' | 'executor' | 'lifecycle'>('threads');
  const [selectedThreadId, setSelectedThreadId] = useState<string>('main');
  const [viewMode, setViewMode] = useState<'beginner' | 'technical'>('beginner');

  const threads = currentStep?.threads || {};
  const locks = currentStep?.locks || {};
  const executor = currentStep?.executorState;
  const raceInfo = currentStep?.raceConditionInfo;
  const deadlockInfo = currentStep?.deadlockInfo;
  const deadlockDetected = !!currentStep?.deadlockDetected;
  const concurrencyInfo = currentStep?.concurrencyInfo;
  const activeThreadName = currentStep?.currentThreadName || 'main';

  const threadList = Object.values(threads);
  const selectedThread =
    threads[selectedThreadId] ||
    threadList.find((t) => t.id === selectedThreadId || t.name === selectedThreadId) ||
    threadList[0] ||
    null;

  const getStateBadgeStyle = (state: string) => {
    switch (state) {
      case 'RUNNING':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40 shadow-sm animate-pulse';
      case 'RUNNABLE':
        return 'bg-blue-900/60 text-blue-300 border-blue-500/40';
      case 'BLOCKED':
        return 'bg-rose-900/60 text-rose-300 border-rose-500/50 font-bold';
      case 'WAITING':
        return 'bg-amber-900/60 text-amber-300 border-amber-500/50';
      case 'TIMED_WAITING':
        return 'bg-orange-900/60 text-orange-300 border-orange-500/50';
      case 'NEW':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'TERMINATED':
        return 'bg-zinc-800/80 text-zinc-500 border-zinc-700';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] font-sans text-xs">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#161b22] gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#58a6ff]/10 text-[#58a6ff]">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-[#f0f6fc]">
            Java Multithreading & Concurrency
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
            {threadList.length} Thread{threadList.length !== 1 ? 's' : ''}
          </span>
          {deadlockDetected && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600 flex items-center gap-1 font-bold animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              DEADLOCK DETECTED
            </span>
          )}
          {raceInfo && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3 h-3" />
              RACE CONDITION
            </span>
          )}
        </div>

        {/* View Mode Toggle: Beginner vs Technical (Section 50) */}
        <div className="flex items-center gap-1 bg-[#21262d] p-0.5 rounded-md border border-[#30363d]">
          <button
            onClick={() => setViewMode('beginner')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
              viewMode === 'beginner'
                ? 'bg-[#58a6ff] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            Beginner View
          </button>
          <button
            onClick={() => setViewMode('technical')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
              viewMode === 'technical'
                ? 'bg-[#58a6ff] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            Technical View
          </button>
        </div>
      </div>

      {/* Action / Concurrency Notification Banner */}
      {concurrencyInfo && (
        <div
          className={`px-3 py-1.5 border-b text-[11px] flex items-center gap-2 ${
            concurrencyInfo.isStartVsRunWarning
              ? 'bg-amber-950/40 border-amber-600/50 text-amber-300'
              : concurrencyInfo.actionType === 'DEADLOCK'
              ? 'bg-rose-950/40 border-rose-600/50 text-rose-300'
              : 'bg-[#1f242c] border-[#30363d] text-[#58a6ff]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold">{concurrencyInfo.threadName}:</span>
          <span className="truncate">{concurrencyInfo.description}</span>
          {concurrencyInfo.isStartVsRunWarning && (
            <span className="ml-auto font-bold uppercase tracking-wider text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
              Start vs Run Warning
            </span>
          )}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#30363d] bg-[#0d1117] overflow-x-auto">
        <button
          onClick={() => setActiveTab('threads')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'threads'
              ? 'bg-[#21262d] text-[#58a6ff] border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Threads & Stacks</span>
        </button>

        <button
          onClick={() => setActiveTab('locks')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'locks'
              ? 'bg-[#21262d] text-[#58a6ff] border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Monitors & Locks ({Object.keys(locks).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('races')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'races'
              ? 'bg-[#21262d] text-[#58a6ff] border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Races & Deadlocks</span>
          {(deadlockDetected || raceInfo) && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('executor')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'executor'
              ? 'bg-[#21262d] text-[#58a6ff] border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Executor Pool</span>
          {executor && (
            <span className="text-[10px] bg-[#388bfd]/20 text-[#58a6ff] px-1.5 rounded-full font-bold">
              {executor.taskQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lifecycle')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'lifecycle'
              ? 'bg-[#21262d] text-[#58a6ff] border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Lifecycle & Tree</span>
        </button>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ==================================================== */}
        {/* TAB 1: THREADS & INDEPENDENT STACKS (Section 4, 8) */}
        {/* ==================================================== */}
        {activeTab === 'threads' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Thread Cards Column (Left) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center justify-between">
                <span>Active JVM Threads</span>
                <span className="text-[10px] lowercase text-[#58a6ff]">
                  {viewMode === 'beginner' ? 'Click thread to inspect' : 'ThreadState Model'}
                </span>
              </span>

              {threadList.length === 0 ? (
                <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg text-center text-[#8b949e] italic">
                  No active JVM threads observed.
                </div>
              ) : (
                threadList.map((th) => {
                  const isSelected = selectedThread?.id === th.id || selectedThread?.name === th.name;
                  const isExecuting = activeThreadName === th.name;

                  return (
                    <div
                      key={th.id || th.name}
                      onClick={() => setSelectedThreadId(th.id || th.name)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#161b22] border-[#58a6ff] shadow-md ring-1 ring-[#58a6ff]/40'
                          : 'bg-[#161b22]/70 border-[#30363d] hover:border-[#8b949e]/60 hover:bg-[#161b22]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[#f0f6fc]">{th.name}</span>
                          {isExecuting && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              Executing
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStateBadgeStyle(
                            th.state
                          )}`}
                        >
                          {th.state}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-[#8b949e] mt-1 border-t border-[#30363d]/40 pt-1.5">
                        <div>
                          <span>ID: </span>
                          <span className="font-mono text-[#c9d1d9]">{th.id || 'N/A'}</span>
                        </div>
                        <div>
                          <span>Priority: </span>
                          <span className="font-mono text-[#c9d1d9]">{th.priority ?? 5}</span>
                        </div>
                        <div>
                          <span>Line: </span>
                          <span className="font-mono text-[#c9d1d9]">{th.currentLine || 'N/A'}</span>
                        </div>
                        <div>
                          <span>Frames: </span>
                          <span className="font-mono text-[#c9d1d9]">
                            {th.callStack?.length ?? th.stackFrames?.length ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Owned Locks or Waiting Badges */}
                      {th.ownedLocks && th.ownedLocks.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-[#8b949e]">Holds:</span>
                          {th.ownedLocks.map((lk) => (
                            <span
                              key={lk}
                              className="text-[10px] bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30 px-1.5 rounded flex items-center gap-0.5 font-mono"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              {lk}
                            </span>
                          ))}
                        </div>
                      )}

                      {th.waitingFor && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
                          <span>Waiting For: </span>
                          <span className="font-mono font-bold">{th.waitingFor}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Thread Inspector & Isolated Call Stack (Right 2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {selectedThread ? (
                <>
                  {/* Thread Summary Card */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-2 mb-2">
                      <div>
                        <span className="font-bold text-base text-[#f0f6fc] mr-2">
                          Thread: {selectedThread.name}
                        </span>
                        <span className="text-xs text-[#8b949e] font-mono">
                          (JVM Thread ID: {selectedThread.id})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${getStateBadgeStyle(
                            selectedThread.state
                          )}`}
                        >
                          {selectedThread.state}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                          Priority: {selectedThread.priority ?? 5}
                        </span>
                      </div>
                    </div>

                    {/* Educational View: Explanation of Current State */}
                    {viewMode === 'beginner' ? (
                      <div className="bg-[#0d1117] p-2.5 rounded-md border border-[#30363d] text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-[#58a6ff] font-semibold">
                          <Info className="w-3.5 h-3.5" />
                          <span>Why is {selectedThread.name} in state [{selectedThread.state}]?</span>
                        </div>
                        <p className="text-[#8b949e] leading-relaxed">
                          {selectedThread.state === 'RUNNING' &&
                            `The thread is currently executing instructions on its call stack. Active line: ${selectedThread.currentLine}.`}
                          {selectedThread.state === 'RUNNABLE' &&
                            `The thread is ready to execute and registered with the OS/JVM scheduler, waiting for CPU timeslice.`}
                          {selectedThread.state === 'BLOCKED' &&
                            `The thread is BLOCKED waiting to acquire an intrinsic monitor lock held by another thread. It will enter the critical section once the lock is released.`}
                          {selectedThread.state === 'WAITING' &&
                            `The thread called Object.wait() or Thread.join() and is paused indefinitely until another thread signals or completes.`}
                          {selectedThread.state === 'TIMED_WAITING' &&
                            `The thread called Thread.sleep() or timed wait. It will sleep for the specified duration without relinquishing its acquired locks.`}
                          {selectedThread.state === 'NEW' &&
                            `The Thread object has been created in memory via 'new Thread()', but start() has not yet been invoked.`}
                          {selectedThread.state === 'TERMINATED' &&
                            `The thread completed execution of its run() method and has terminated.`}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                        <div>
                          <span className="text-[#8b949e]">Parent: </span>
                          <span className="text-[#c9d1d9]">{selectedThread.parentThreadName || 'main'}</span>
                        </div>
                        <div>
                          <span className="text-[#8b949e]">Created Step: </span>
                          <span className="text-[#c9d1d9]">{selectedThread.createdAt ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-[#8b949e]">Started Step: </span>
                          <span className="text-[#c9d1d9]">{selectedThread.startedAt ?? 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[#8b949e]">Terminated Step: </span>
                          <span className="text-[#c9d1d9]">{selectedThread.finishedAt ?? 'Active'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thread-Isolated Call Stack (Section 8) */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#58a6ff] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Independent Stack Frames: {selectedThread.name}</span>
                      </span>
                      <span className="text-[10px] text-[#8b949e]">
                        Thread-Local Memory (Isolated from other threads)
                      </span>
                    </div>

                    {(!selectedThread.callStack || selectedThread.callStack.length === 0) ? (
                      <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-4 text-center text-[#8b949e] italic">
                        {selectedThread.state === 'NEW'
                          ? 'Thread is NEW. No stack frames allocated yet.'
                          : 'Stack frame empty or terminated.'}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selectedThread.callStack.map((frame, fIdx) => (
                          <div
                            key={frame.id || fIdx}
                            className="bg-[#0d1117] border border-[#30363d] rounded-md p-2.5 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[#f0f6fc] text-xs">
                                {frame.functionName}()
                              </span>
                              <span className="text-[10px] text-[#8b949e] font-mono">
                                line {frame.line} | Depth {frame.depth}
                              </span>
                            </div>

                            {/* Frame Local Variables */}
                            {frame.localVariables && Object.keys(frame.localVariables).length > 0 && (
                              <div className="mt-1 pt-1 border-t border-[#30363d]/60">
                                <span className="text-[10px] text-[#8b949e] font-semibold">
                                  Local Variables:
                                </span>
                                <div className="grid grid-cols-2 gap-1.5 mt-1 font-mono text-[11px]">
                                  {Object.entries(frame.localVariables).map(([varName, val]) => (
                                    <div
                                      key={varName}
                                      className="p-1 rounded bg-[#161b22] border border-[#30363d] flex items-center justify-between"
                                    >
                                      <span className="text-[#58a6ff]">{varName}</span>
                                      <span className="text-[#7ee787] truncate max-w-[120px]">
                                        {String(val)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center text-[#8b949e] italic">
                  Select a thread on the left to inspect its independent stack frames and status.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: MONITORS & INTRINSIC LOCKS (Section 15, 17, 18)*/}
        {/* ==================================================== */}
        {activeTab === 'locks' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#e3b341] flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Monitor Locks & Mutual Exclusion</span>
                </span>
                <p className="text-[11px] text-[#8b949e]">
                  Every Java object has an intrinsic monitor lock used by synchronized blocks.
                </p>
              </div>
            </div>

            {Object.keys(locks).length === 0 ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center text-[#8b949e] italic">
                No active synchronized blocks or monitor locks held at this execution step.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(locks).map((lk) => {
                  const isLocked = !!lk.ownerThreadId;
                  const entryQueue = lk.entryQueue || lk.waitingThreadIds || [];
                  const waitSet = lk.waitSet || [];

                  return (
                    <div
                      key={lk.id}
                      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                        <div className="flex items-center gap-1.5">
                          {isLocked ? (
                            <Lock className="w-4 h-4 text-[#e3b341]" />
                          ) : (
                            <Unlock className="w-4 h-4 text-[#3fb950]" />
                          )}
                          <span className="font-bold text-sm text-[#f0f6fc]">
                            Monitor: {lk.name}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isLocked
                              ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                          }`}
                        >
                          {isLocked ? 'LOCKED' : 'AVAILABLE'}
                        </span>
                      </div>

                      {/* Current Owner */}
                      <div className="bg-[#0d1117] p-2 rounded border border-[#30363d] flex items-center justify-between">
                        <span className="text-[#8b949e] text-xs">Current Lock Owner:</span>
                        {lk.ownerThreadId ? (
                          <span className="font-bold text-xs text-[#e3b341] font-mono px-2 py-0.5 rounded bg-[#e3b341]/10 border border-[#e3b341]/30">
                            {lk.ownerThreadId}
                          </span>
                        ) : (
                          <span className="text-[#3fb950] font-mono text-xs">None (Unlocked)</span>
                        )}
                      </div>

                      {/* Monitor Structure: Entry Queue (BLOCKED) vs Wait Set (WAITING) */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Entry Queue */}
                        <div className="bg-[#0d1117] p-2 rounded border border-[#30363d] flex flex-col gap-1">
                          <span className="font-bold text-[11px] text-rose-400">
                            Entry Queue (BLOCKED):
                          </span>
                          {entryQueue.length === 0 ? (
                            <span className="text-[#8b949e] text-[10px] italic">Empty</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {entryQueue.map((wId) => (
                                <span
                                  key={wId}
                                  className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded"
                                >
                                  {wId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Wait Set */}
                        <div className="bg-[#0d1117] p-2 rounded border border-[#30363d] flex flex-col gap-1">
                          <span className="font-bold text-[11px] text-amber-400">
                            Wait Set (WAITING):
                          </span>
                          {waitSet.length === 0 ? (
                            <span className="text-[#8b949e] text-[10px] italic">Empty</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {waitSet.map((wId) => (
                                <span
                                  key={wId}
                                  className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded"
                                >
                                  {wId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: RACES & DEADLOCKS (Section 13, 14, 23, 24, 25)*/}
        {/* ==================================================== */}
        {activeTab === 'races' && (
          <div className="flex flex-col gap-3">
            {/* Race Condition Section */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2">
                <span className="font-bold text-sm text-[#f0f6fc] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Race Conditions & Lost Updates</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    raceInfo
                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                      : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  {raceInfo ? 'Observed in Trace' : 'Potential Race Analysis'}
                </span>
              </div>

              {raceInfo ? (
                <div className="bg-[#0d1117] p-3 rounded-md border border-amber-700/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">
                      Conflicting Variable: {raceInfo.variableName}
                    </span>
                    <span className="text-[11px] font-mono text-[#8b949e]">
                      Expected: <strong className="text-[#3fb950]">{String(raceInfo.expectedValue)}</strong> | Actual:{' '}
                      <strong className="text-rose-400">{String(raceInfo.actualValue)}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    {raceInfo.explanation}
                  </p>

                  <div className="mt-1 border-t border-[#30363d] pt-2">
                    <span className="text-[11px] font-bold text-[#8b949e]">
                      Conflicting Operation Breakdown (READ ➔ COMPUTE ➔ WRITE):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-1">
                      {raceInfo.conflictingAccesses.map((acc, idx) => (
                        <div
                          key={idx}
                          className="bg-[#161b22] p-1.5 rounded border border-[#30363d] text-[11px] font-mono text-[#c9d1d9]"
                        >
                          {acc}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#0d1117] rounded-md border border-[#30363d] text-xs text-[#8b949e]">
                  <p>
                    When multiple threads access and mutate shared variables without synchronization,
                    compound statements like <code className="text-[#58a6ff]">counter++</code> expand
                    into three distinct instructions:
                  </p>
                  <div className="flex items-center justify-center gap-3 my-2 font-mono font-bold text-xs text-[#f0f6fc]">
                    <span className="p-1 rounded bg-[#161b22] border border-[#30363d]">1. READ</span>
                    <span>➔</span>
                    <span className="p-1 rounded bg-[#161b22] border border-[#30363d]">2. ADD</span>
                    <span>➔</span>
                    <span className="p-1 rounded bg-[#161b22] border border-[#30363d]">3. WRITE</span>
                  </div>
                  <p>
                    Use <strong className="text-[#e3b341]">synchronized</strong> methods/blocks or{' '}
                    <strong className="text-[#7ee787]">AtomicInteger</strong> to eliminate race conditions.
                  </p>
                </div>
              )}
            </div>

            {/* Deadlock Section */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2">
                <span className="font-bold text-sm text-[#f0f6fc] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Deadlock Analysis & Circular Wait</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    deadlockDetected
                      ? 'bg-rose-950 text-rose-300 border-rose-600'
                      : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  {deadlockDetected ? 'DEADLOCK CONFIRMED' : 'No Deadlock Detected'}
                </span>
              </div>

              {deadlockDetected ? (
                <div className="bg-[#0d1117] p-3 rounded-md border border-rose-700/60 flex flex-col gap-2">
                  <span className="font-bold text-rose-300">
                    Circular Dependency between Threads:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-1">
                    {deadlockInfo?.threads.map((dt, idx) => (
                      <div
                        key={idx}
                        className="bg-[#161b22] p-2 rounded border border-rose-900/60 text-xs flex flex-col gap-1 font-mono"
                      >
                        <span className="font-bold text-[#f0f6fc]">{dt.threadName}</span>
                        <span className="text-[#3fb950]">Holding: {dt.holdingLock}</span>
                        <span className="text-rose-400">Waiting for: {dt.waitingForLock}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 rounded bg-amber-950/20 border border-amber-700/40 text-xs text-amber-200 mt-1">
                    <span className="font-bold">Educational Prevention Rule: </span>
                    {deadlockInfo?.preventionExplanation ||
                      'Always acquire locks in a globally consistent order across all threads.'}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#0d1117] rounded-md border border-[#30363d] text-xs text-[#8b949e]">
                  A deadlock occurs when two or more threads are permanently blocked because each is
                  holding a lock and waiting for another lock held by another thread.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: EXECUTOR SERVICE & THREAD POOL (Section 28) */}
        {/* ==================================================== */}
        {activeTab === 'executor' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#58a6ff] flex items-center gap-1.5">
                  <Workflow className="w-4 h-4" />
                  <span>ExecutorService & Managed Thread Pool</span>
                </span>
                <p className="text-[11px] text-[#8b949e]">
                  Thread pools decouple task submission from task execution and reuse worker threads.
                </p>
              </div>
            </div>

            {executor ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Pool Status */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
                  <span className="font-bold text-xs text-[#f0f6fc]">
                    Thread Pool: {executor.poolName || 'FixedThreadPool'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                    <div>
                      <span className="text-[#8b949e]">Pool Size: </span>
                      <span className="text-[#c9d1d9]">{executor.poolSize}</span>
                    </div>
                    <div>
                      <span className="text-[#8b949e]">Completed: </span>
                      <span className="text-[#3fb950] font-bold">{executor.tasksCompleted}</span>
                    </div>
                  </div>

                  {/* Worker Threads */}
                  <span className="text-[11px] font-bold text-[#8b949e] mt-1">
                    Managed Worker Threads:
                  </span>
                  <div className="flex flex-col gap-1">
                    {executor.activeWorkerThreads.map((w) => (
                      <div
                        key={w}
                        className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-[#f0f6fc]">{w}</span>
                        <span className="text-[10px] text-[#3fb950] bg-[#3fb950]/10 px-1.5 py-0.5 rounded border border-[#3fb950]/30">
                          Active Worker
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Queue */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
                  <span className="font-bold text-xs text-[#f0f6fc]">
                    Task BlockingQueue ({executor.taskQueue.length} Tasks)
                  </span>

                  {executor.taskQueue.length === 0 ? (
                    <div className="bg-[#0d1117] border border-[#30363d] rounded p-4 text-center text-[#8b949e] italic text-xs">
                      Task queue is currently empty.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {executor.taskQueue.map((tsk) => (
                        <div
                          key={tsk.id}
                          className="p-2 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-between text-xs font-mono"
                        >
                          <div>
                            <span className="font-bold text-[#f0f6fc]">{tsk.name}</span>
                            <span className="text-[#8b949e] ml-2 text-[10px]">({tsk.id})</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {tsk.result !== undefined && (
                              <span className="text-[#7ee787] text-[10px]">
                                Result: {String(tsk.result)}
                              </span>
                            )}
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                tsk.status === 'COMPLETED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                  : tsk.status === 'RUNNING'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-600 animate-pulse'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}
                            >
                              {tsk.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center text-[#8b949e] italic">
                No active ExecutorService instance initialized in this program step.
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: LIFECYCLE & RELATIONSHIP TREE (Section 36, 37) */}
        {/* ==================================================== */}
        {activeTab === 'lifecycle' && (
          <div className="flex flex-col gap-3">
            {/* Thread Lifecycle Diagram */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <span className="font-bold text-xs text-[#f0f6fc] mb-2 block">
                JVM Thread Lifecycle State Machine (Section 36)
              </span>

              <div className="flex items-center justify-center flex-wrap gap-2 text-xs font-mono py-2">
                <span
                  className={`px-2.5 py-1 rounded border ${
                    selectedThread?.state === 'NEW'
                      ? 'bg-slate-700 text-white border-white font-bold'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  NEW
                </span>
                <span>➔</span>
                <span
                  className={`px-2.5 py-1 rounded border ${
                    selectedThread?.state === 'RUNNABLE'
                      ? 'bg-blue-700 text-white border-white font-bold'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  RUNNABLE
                </span>
                <span>➔</span>
                <span
                  className={`px-2.5 py-1 rounded border ${
                    selectedThread?.state === 'RUNNING'
                      ? 'bg-emerald-700 text-white border-white font-bold animate-pulse'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  RUNNING
                </span>
                <span>➔</span>
                <span
                  className={`px-2.5 py-1 rounded border ${
                    ['BLOCKED', 'WAITING', 'TIMED_WAITING'].includes(selectedThread?.state || '')
                      ? 'bg-amber-700 text-white border-white font-bold'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  BLOCKED / WAITING
                </span>
                <span>➔</span>
                <span
                  className={`px-2.5 py-1 rounded border ${
                    selectedThread?.state === 'TERMINATED'
                      ? 'bg-zinc-700 text-white border-white font-bold'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  TERMINATED
                </span>
              </div>
            </div>

            {/* Thread Relationship Hierarchy Tree (Section 37) */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-[#f0f6fc] flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span>Thread Relationship Tree (Derived View)</span>
                </span>
                <span className="text-[10px] text-[#8b949e]">
                  Educational Parent ➔ Child Thread Model
                </span>
              </div>

              <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono text-xs">
                <div className="text-[#58a6ff] font-bold">main (Root Thread)</div>
                {threadList
                  .filter((t) => t.name !== 'main')
                  .map((t, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    return (
                      <div key={t.id || t.name} className="ml-4 flex items-center gap-1.5 text-xs mt-1">
                        <span className="text-[#8b949e]">{isLast ? '└── ' : '├── '}</span>
                        <span className="text-[#f0f6fc]">{t.name}</span>
                        <span className="text-[10px] text-[#8b949e]">({t.state})</span>
                        {t.waitingFor && (
                          <span className="text-[10px] text-amber-400">waiting for {t.waitingFor}</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <div className="px-3 py-1.5 bg-[#161b22] border-t border-[#30363d] text-[10px] text-[#8b949e] flex items-center justify-between">
        <span>
          Visualizing actual JVM thread scheduling and state transitions without fake predetermined orders.
        </span>
        <span className="text-[#58a6ff] font-mono font-bold">
          Active Thread: {activeThreadName}
        </span>
      </div>
    </div>
  );
};
