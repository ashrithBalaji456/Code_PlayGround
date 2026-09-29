import { reconstructExecutionSteps } from '../src/engine/stateReconstructor';
import { ExecutionEvent, ExecutionStep } from '../src/types/execution';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

console.log('================================================================');
console.log('  PHASE 13: JAVA MULTITHREADING & CONCURRENCY VALIDATION SUITE  ');
console.log('================================================================\n');

// ─── Test 1: Thread Creation (NEW) & Thread Start (RUNNABLE) ─────────────────
console.log('--- Test 1: Thread Creation (NEW) & Start (RUNNABLE) ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'THREAD_CREATE', step: 1, line: 3, threadId: '12', threadName: 'Worker-1', threadState: 'NEW', parentThreadName: 'main' },
    { type: 'THREAD_START', step: 2, line: 4, threadId: '12', threadName: 'Worker-1', threadState: 'RUNNABLE', parentThreadName: 'main' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  assert(steps.length === 3, 'Reconstructed 3 steps');
  
  const s1 = steps[1];
  assert(!!s1.threads?.['Worker-1'] || !!s1.threads?.['12'], 'Thread Worker-1 tracked in threads dictionary');
  const thCreated = s1.threads?.['Worker-1'] || s1.threads?.['12'];
  assert(thCreated?.state === 'NEW', 'Thread initial state is NEW');
  assert(s1.beginnerExplanation?.what.includes('NEW'), 'Beginner explanation explains NEW state');

  const s2 = steps[2];
  const thStarted = s2.threads?.['Worker-1'] || s2.threads?.['12'];
  assert(thStarted?.state === 'RUNNABLE', 'Thread state transitioned to RUNNABLE on start()');
  assert(s2.concurrencyInfo?.actionType === 'THREAD_START', 'Concurrency info records THREAD_START action');
}

// ─── Test 2: start() vs run() Distinction ────────────────────────────────────
console.log('\n--- Test 2: start() vs run() Distinction ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'THREAD_CREATE', step: 1, line: 2, threadId: '14', threadName: 'Worker-2', threadState: 'NEW' },
    { type: 'THREAD_RUN_DIRECT', step: 2, line: 3, targetThreadName: 'Worker-2', threadName: 'main', isStartVsRunWarning: true },
  ];

  const steps = reconstructExecutionSteps(events, '');
  const s2 = steps[2];
  assert(s2.concurrencyInfo?.isStartVsRunWarning === true, 'start() vs run() warning flag set');
  assert(s2.beginnerExplanation?.why?.includes('DIFFERENCE BETWEEN start() AND run()') === true, 'Beginner explanation teaches difference between start and run');
}

// ─── Test 3: Thread Names, Priority & Independent Stacks ─────────────────────
console.log('\n--- Test 3: Thread Names, Priority & Independent Stacks ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'THREAD_CREATE', step: 1, line: 2, threadId: '15', threadName: 'Worker-A', priority: 7 },
    { type: 'THREAD_START', step: 2, line: 3, threadId: '15', threadName: 'Worker-A' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  const th = steps[1].threads?.['Worker-A'] || steps[1].threads?.['15'];
  assert(th?.name === 'Worker-A', 'Custom thread name preserved');
  assert(th?.priority === 7, 'Priority 7 preserved');
  assert(Array.isArray(steps[2].threads?.['15']?.callStack || steps[2].threads?.['Worker-A']?.callStack), 'Independent call stack initialized for worker thread');
}

// ─── Test 4: Thread.sleep() & TIMED_WAITING ──────────────────────────────────
console.log('\n--- Test 4: Thread.sleep() & TIMED_WAITING ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'THREAD_SLEEP_START', step: 1, line: 3, threadName: 'main', value: 500 },
    { type: 'THREAD_SLEEP_END', step: 2, line: 4, threadName: 'main' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  assert(steps[1].threads?.['main']?.state === 'TIMED_WAITING', 'Thread entered TIMED_WAITING');
  assert(steps[1].concurrencyInfo?.actionType === 'SLEEP_START', 'Concurrency info recorded SLEEP_START');
  assert(steps[2].threads?.['main']?.state === 'RUNNABLE', 'Thread resumed to RUNNABLE after sleep');
}

// ─── Test 5: Thread.join() Coordination ──────────────────────────────────────
console.log('\n--- Test 5: Thread.join() Coordination ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'THREAD_CREATE', step: 1, line: 2, threadId: '20', threadName: 'Worker-T' },
    { type: 'THREAD_START', step: 2, line: 3, threadId: '20', threadName: 'Worker-T' },
    { type: 'THREAD_JOIN_START', step: 3, line: 4, threadName: 'main', targetThreadName: 'Worker-T' },
    { type: 'THREAD_JOIN_END', step: 4, line: 5, threadName: 'main', targetThreadName: 'Worker-T' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  assert(steps[3].threads?.['main']?.state === 'WAITING', 'main thread entered WAITING on join()');
  assert(steps[3].threads?.['main']?.waitingFor === 'Worker-T', 'main thread waitingFor recorded as Worker-T');
  
  const workerTerminated = steps[4].threads?.['Worker-T'] || steps[4].threads?.['20'];
  assert(workerTerminated?.state === 'TERMINATED', 'Worker thread state reached TERMINATED');
  assert(steps[4].threads?.['main']?.state === 'RUNNABLE', 'main thread resumed RUNNABLE after join completes');
}

// ─── Test 6: Intrinsic Locks & BLOCKED Contention ────────────────────────────
console.log('\n--- Test 6: Intrinsic Locks & BLOCKED Contention ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'THREAD_CREATE', step: 1, line: 2, threadId: '31', threadName: 'Worker-1' },
    { type: 'THREAD_CREATE', step: 2, line: 3, threadId: '32', threadName: 'Worker-2' },
    { type: 'LOCK_ACQUIRE', step: 3, line: 5, lockName: 'bankLock', ownerThread: 'Worker-1' },
    { type: 'LOCK_WAIT', step: 4, line: 6, lockName: 'bankLock', threadName: 'Worker-2' },
    { type: 'LOCK_RELEASE', step: 5, line: 7, lockName: 'bankLock', ownerThread: 'Worker-1' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  const s3 = steps[3];
  assert(s3.locks?.['bankLock']?.ownerThreadId === 'Worker-1', 'Lock owner is Worker-1');
  const w1 = s3.threads?.['Worker-1'] || s3.threads?.['31'];
  assert(w1?.ownedLocks?.includes('bankLock') === true, 'Worker-1 owns lock bankLock');

  const s4 = steps[4];
  const w2 = s4.threads?.['Worker-2'] || s4.threads?.['32'];
  assert(w2?.state === 'BLOCKED', 'Worker-2 is BLOCKED due to lock contention');
  assert(s4.locks?.['bankLock']?.entryQueue?.includes('Worker-2') === true, 'Worker-2 queued in lock Entry Queue');

  const s5 = steps[5];
  assert(s5.locks?.['bankLock']?.ownerThreadId === null, 'Lock bankLock released');
}

// ─── Test 7: Monitor wait() & notify() Coordination ─────────────────────────
console.log('\n--- Test 7: Monitor wait() & notify() Coordination ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'THREAD_CREATE', step: 1, line: 2, threadId: '41', threadName: 'Consumer' },
    { type: 'THREAD_CREATE', step: 2, line: 3, threadId: '42', threadName: 'Producer' },
    { type: 'LOCK_ACQUIRE', step: 3, line: 4, lockName: 'queueMonitor', ownerThread: 'Consumer' },
    { type: 'MONITOR_WAIT', step: 4, line: 5, lockName: 'queueMonitor', threadName: 'Consumer' },
    { type: 'MONITOR_NOTIFY', step: 5, line: 6, lockName: 'queueMonitor', threadName: 'Producer' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  const s4 = steps[4];
  const consumerTh = s4.threads?.['Consumer'] || s4.threads?.['41'];
  assert(consumerTh?.state === 'WAITING', 'Consumer entered WAITING state on wait()');
  assert(s4.locks?.['queueMonitor']?.waitSet?.includes('Consumer') === true, 'Consumer in monitor Wait Set');

  const s5 = steps[5];
  const consumerAwakened = s5.threads?.['Consumer'] || s5.threads?.['41'];
  assert(consumerAwakened?.state === 'BLOCKED', 'Consumer awakened by notify() and moved to BLOCKED awaiting lock');
}

// ─── Test 8: Deadlock Detection & Circular Dependency ────────────────────────
console.log('\n--- Test 8: Deadlock Detection & Circular Dependency ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'DEADLOCK_DETECTED', step: 1, line: 10, detail: 'Thread-A holds Lock1 waiting for Lock2 | Thread-B holds Lock2 waiting for Lock1' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  assert(steps[1].deadlockDetected === true, 'Deadlock flag detected');
  assert(steps[1].deadlockInfo?.threads.length === 2, 'Deadlock graph contains circular threads');
  assert(steps[1].deadlockInfo?.preventionExplanation.includes('consistent') === true, 'Educational prevention explanation provided');
}

// ─── Test 9: Atomic Operations (AtomicInteger) ───────────────────────────────
console.log('\n--- Test 9: Atomic Operations (AtomicInteger) ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'ATOMIC_OP', step: 1, line: 5, variable: 'counter', atomicOp: 'incrementAndGet', oldValue: 0, newValue: 1, threadName: 'main' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  assert(steps[1].concurrencyInfo?.actionType === 'ATOMIC_OP', 'Atomic operation tracked');
  assert(steps[1].concurrencyInfo?.operationBreakdown?.write.includes('1') === true, 'Operation breakdown shows CAS commit');
}

// ─── Test 10: ExecutorService & Thread Pool Lifecycle ────────────────────────
console.log('\n--- Test 10: ExecutorService & Thread Pool Lifecycle ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'EXECUTOR_INIT', step: 1, line: 2, poolType: 'FixedThreadPool', poolSize: 2 },
    { type: 'EXECUTOR_SUBMIT', step: 2, line: 3, taskId: 'task-101', taskName: 'ComputeFactorial' },
    { type: 'EXECUTOR_TASK_START', step: 3, line: 4, taskId: 'task-101', threadName: 'pool-1-thread-1' },
    { type: 'EXECUTOR_TASK_COMPLETE', step: 4, line: 5, taskId: 'task-101', threadName: 'pool-1-thread-1', value: 120 },
  ];

  const steps = reconstructExecutionSteps(events, '');
  assert(steps[1].executorState?.poolSize === 2, 'Executor pool initialized with size 2');
  assert(steps[2].executorState?.taskQueue.length === 1, 'Task queued in executor queue');
  assert(steps[3].executorState?.taskQueue[0].status === 'RUNNING', 'Task status transitioned to RUNNING');
  assert(steps[4].executorState?.taskQueue[0].status === 'COMPLETED', 'Task status transitioned to COMPLETED');
  assert(steps[4].executorState?.tasksCompleted === 1, 'Tasks completed counter incremented');
}

// ─── Test 11: Race Condition Observed ────────────────────────────────────────
console.log('\n--- Test 11: Race Condition Observed ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'RACE_CONDITION_OBSERVED', step: 1, line: 15, variable: 'counter', value: 10, newValue: 6, threadName: 'Worker-1, Worker-2' },
  ];

  const steps = reconstructExecutionSteps(events, '');
  assert(steps[1].raceConditionInfo?.isObserved === true, 'Race condition marked as observed');
  assert(steps[1].raceConditionInfo?.expectedValue === 10, 'Expected value 10');
  assert(steps[1].raceConditionInfo?.actualValue === 6, 'Actual value 6 (Lost updates)');
}

// ─── Test 12: Backward Time-Travel Replay & Immutability ─────────────────────
console.log('\n--- Test 12: Backward Time-Travel Replay & Immutability ---');
{
  const events: ExecutionEvent[] = [
    { type: 'PROGRAM_START', step: 0, line: 1, threadName: 'main' },
    { type: 'THREAD_CREATE', step: 1, line: 2, threadId: '51', threadName: 'Worker-X', threadState: 'NEW' },
    { type: 'THREAD_START', step: 2, line: 3, threadId: '51', threadName: 'Worker-X', threadState: 'RUNNABLE' },
    { type: 'LOCK_ACQUIRE', step: 3, line: 4, lockName: 'myLock', ownerThread: 'Worker-X' },
    { type: 'LOCK_RELEASE', step: 4, line: 5, lockName: 'myLock', ownerThread: 'Worker-X' },
  ];

  const steps = reconstructExecutionSteps(events, '');

  // Verify Step 3: Worker-X holds myLock
  assert(steps[3].locks?.['myLock']?.ownerThreadId === 'Worker-X', 'Step 3: Worker-X owns myLock');

  // Verify Step 4: myLock released
  assert(steps[4].locks?.['myLock']?.ownerThreadId === null, 'Step 4: myLock released');

  // Time-travel backward check: Step 3 state remained completely immutable
  assert(steps[3].locks?.['myLock']?.ownerThreadId === 'Worker-X', 'Replay integrity: Step 3 lock state remains Worker-X');
  assert((steps[1].threads?.['Worker-X'] || steps[1].threads?.['51'])?.state === 'NEW', 'Replay integrity: Step 1 thread state remains NEW');
}

console.log('\n================================================================');
console.log('  ALL 12 PHASE 13 CONCURRENCY TESTS PASSED 100%! ✓✓✓          ');
console.log('================================================================\n');
