import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { PHASE_13_CONCURRENCY_PRESETS } from '../src/presets/phase13Presets.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function testPhase13GrandConcurrencyDemo() {
  console.log('================================================================');
  console.log('  PHASE 13: SECTION 52 GRAND CONCURRENCY INTEGRATION DEMO       ');
  console.log('================================================================\n');

  const preset = PHASE_13_CONCURRENCY_PRESETS.find((p) => p.id === 'p13-28-grand-concurrency-demo');
  assert(preset !== undefined, 'Found Preset 28 (Section 52 Grand Concurrency Demo)');

  const code = preset!.code;
  console.log('Executing Grand Concurrency Demo on real JVM worker...');
  const res = await executeJavaWorker(code);

  if (!res.success) {
    console.error('JVM Execution failed with error:', res.error);
    console.error('Compile error:', (res as any).compileError);
    console.error('Console output:', res.consoleOutput);
  }
  assert(res.success === true, 'Real JVM execution completed with success = true');
  assert(Array.isArray(res.events) && res.events.length >= 10, `Emitted ${res.events?.length} runtime execution events`);

  const steps = reconstructExecutionSteps(res.events!, code);
  assert(steps.length > 0, `Reconstructed ${steps.length} state steps`);

  // 1. Thread creation and custom names
  const hasCustomThreadNames = steps.some((st) => {
    return (
      (st.threads && Object.values(st.threads).some(t => t.name === 'Depositor-A' || t.name === 'Depositor-B')) ||
      st.concurrencyInfo?.targetThreadName === 'Depositor-A' ||
      st.concurrencyInfo?.targetThreadName === 'Depositor-B' ||
      res.events?.some(e => e.targetThreadName === 'Depositor-A' || e.targetThreadName === 'Depositor-B' || e.threadName === 'Depositor-A' || e.threadName === 'Depositor-B')
    );
  });
  assert(hasCustomThreadNames, 'Custom thread names (Depositor-A, Depositor-B) tracked');

  // 2. Shared BankAccount object allocation
  const hasSharedAccount = steps.some((st) => {
    return (
      st.variables['account'] !== undefined ||
      st.heap.some(h => h.className === 'BankAccount' || h.type === 'BankAccount')
    );
  });
  assert(hasSharedAccount, 'Shared BankAccount object allocated and tracked');

  // 3. Thread start & Runnable state transitions
  const hasThreadStart = steps.some((st) => {
    return (
      st.concurrencyInfo?.actionType === 'THREAD_START' ||
      res.events?.some(e => e.type === 'THREAD_START')
    );
  });
  assert(hasThreadStart, 'Worker thread start() executed and tracked');

  // 4. Thread.join() coordination
  const hasJoinCoordination = steps.some((st) => {
    return (
      st.concurrencyInfo?.actionType === 'JOIN_START' ||
      st.concurrencyInfo?.actionType === 'JOIN_END' ||
      res.events?.some(e => e.type === 'THREAD_JOIN_START' || e.type === 'THREAD_JOIN_END')
    );
  });
  assert(hasJoinCoordination, 'Thread.join() coordination tracked');

  // 5. AtomicInteger increment
  const hasAtomicOp = steps.some((st) => {
    return (
      st.concurrencyInfo?.actionType === 'ATOMIC_OP' ||
      res.events?.some(e => e.type === 'ATOMIC_OP' || e.atomicOp === 'incrementAndGet')
    );
  });
  assert(hasAtomicOp, 'AtomicInteger incrementAndGet() tracked');

  // 6. BlockingQueue coordination
  const hasQueueOp = steps.some((st) => {
    return (
      st.structures['logQueue'] !== undefined ||
      st.variables['logQueue'] !== undefined ||
      res.events?.some(e => e.variable === 'logQueue' || e.type === 'QUEUE_OFFER' || e.type === 'CONCURRENT_COLLECTION_OP')
    );
  });
  assert(hasQueueOp, 'BlockingQueue operations tracked');

  // 7. ExecutorService & Thread Pool
  const hasExecutorPool = steps.some((st) => {
    return (
      st.executorState !== undefined ||
      res.events?.some(e => e.type === 'EXECUTOR_INIT' || e.type === 'EXECUTOR_SUBMIT')
    );
  });
  assert(hasExecutorPool, 'ExecutorService thread pool initialization and tasks tracked');

  // 8. Console output verification
  const finalStep = steps[steps.length - 1];
  const consoleJoined = finalStep.consoleOutput.join('\n');
  assert(
    consoleJoined.includes('Worker-1 deposited $50') || consoleJoined.includes('Worker-2 deposited $50'),
    'Deposits executed by worker threads'
  );
  assert(
    consoleJoined.includes('Verified balance after joins: $200'),
    'Synchronized balance correctly reached $200'
  );
  assert(
    consoleJoined.includes('Total transactions (Atomic): 3'),
    'AtomicInteger updated to 3'
  );
  assert(
    consoleJoined.includes('Audit task completed: AUDIT_PASSED'),
    'Executor Future.get() returned expected value'
  );

  // 9. Time-Travel Step Replay & Exact State Restoration across steps
  const midIndex = Math.floor(steps.length / 2);
  const midStep = steps[midIndex];
  assert(midStep.stepIndex === midIndex, 'Step index preserved in middle step');
  assert(steps[0].threads?.['main'] !== undefined || steps[0].currentThreadName === 'main', 'Initial step main thread state preserved');

  console.log('\n================================================================');
  console.log('  SECTION 52 GRAND CONCURRENCY INTEGRATION DEMO PASSED 100%! ✓  ');
  console.log('================================================================\n');
}

testPhase13GrandConcurrencyDemo().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
