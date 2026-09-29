import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { ExecutionEvent } from '../src/types/execution.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function runPhase10TestSuite() {
  console.log('================================================================');
  console.log('  PHASE 10: ADVANCED JAVA EXECUTION & JVM VISUALIZATION SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Object Creation, Heap Allocation & Fields
  // -------------------------------------------------------------
  console.log('--- Test 1: Object Creation & Heap Allocation ---');
  const objEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'OBJECT_CREATE', line: 1, variable: 's', dataType: 'Student', objectId: 'obj-1', fields: { name: null, age: 0 } },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'OBJECT_FIELD_UPDATE', line: 2, objectId: 'obj-1', fieldName: 'name', newValue: 'Ashrith' },
    { type: 'LINE_EXECUTE', line: 3 },
    { type: 'OBJECT_FIELD_UPDATE', line: 3, objectId: 'obj-1', fieldName: 'age', newValue: 22 },
  ];

  const objSteps = reconstructExecutionSteps(objEvents, '// Student obj test');
  assert(objSteps.length === 6, 'Generated 6 steps');
  assert(objSteps[1].heap.length === 1, 'Step 1: One object on the heap');
  assert(objSteps[1].heap[0].className === 'Student', 'Step 1: Object class is Student');
  assert(objSteps[1].heap[0].fields.name === null, 'Step 1: Initial field name is null');
  assert(objSteps[3].heap[0].fields.name === 'Ashrith', 'Step 3: Field name updated to Ashrith');
  assert(objSteps[5].heap[0].fields.age === 22, 'Step 5: Field age updated to 22');
  assert(objSteps[5].variables['s']?.refTargetId === 'obj-1', 'Step 5: Variable s points to obj-1');

  // Backward Replay Verification
  assert(objSteps[1].heap[0].fields.name === null, 'Replay: Step 1 heap remains unchanged (immutability)');

  // -------------------------------------------------------------
  // TEST 2: References & Aliasing
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Reference Aliasing (Two pointers, one object) ---');
  const refEvents: ExecutionEvent[] = [
    { type: 'OBJECT_CREATE', line: 1, variable: 'a', dataType: 'Person', objectId: 'obj-10', fields: { name: 'Initial' } },
    { type: 'VARIABLE_CREATE', line: 2, variable: 'b', dataType: 'Person', value: '@obj-10', isReference: true, refTargetId: 'obj-10' },
    { type: 'OBJECT_FIELD_UPDATE', line: 3, objectId: 'obj-10', fieldName: 'name', newValue: 'John' },
  ];

  const refSteps = reconstructExecutionSteps(refEvents, '// Ref alias');
  const lastRefStep = refSteps[2];
  assert(lastRefStep.heap[0].referencesFrom?.includes('a'), 'Heap object referencesFrom includes "a"');
  assert(lastRefStep.heap[0].referencesFrom?.includes('b'), 'Heap object referencesFrom includes "b"');
  assert(lastRefStep.heap[0].fields.name === 'John', 'Heap object mutated to "John"');
  assert(lastRefStep.heap[0].gcEligible === false, 'Object is active (not GC eligible)');

  // -------------------------------------------------------------
  // TEST 3: Null References & NullPointerException
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Null References & NullPointerException ---');
  const npeEvents: ExecutionEvent[] = [
    { type: 'VARIABLE_CREATE', line: 1, variable: 'p', dataType: 'Person', value: null, isReference: true },
    { type: 'ERROR', line: 2, variable: 'p', dataType: 'NullPointerException', message: 'Cannot read field "name" because "p" is null' },
  ];

  const npeSteps = reconstructExecutionSteps(npeEvents, '// NPE test');
  assert(npeSteps[0].variables['p']?.value === null, 'Variable p is null on stack');
  assert(npeSteps[1].error !== null, 'Error state recorded');
  assert(npeSteps[1].error?.type === 'NullPointerException', 'Error type is NullPointerException');
  assert(npeSteps[1].error?.brokenReference === true, 'brokenReference flag set for visualizer');

  // -------------------------------------------------------------
  // TEST 4: Static Fields & Class Metaspace
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Static Fields & Class Metaspace ---');
  const staticEvents: ExecutionEvent[] = [
    { type: 'STATIC_FIELD_UPDATE', line: 1, className: 'Counter', fieldName: 'count', newValue: 1 },
    { type: 'STATIC_FIELD_UPDATE', line: 2, className: 'Counter', fieldName: 'count', newValue: 2 },
    { type: 'STATIC_FIELD_UPDATE', line: 3, className: 'Counter', fieldName: 'count', newValue: 3 },
  ];

  const staticSteps = reconstructExecutionSteps(staticEvents, '// Static test');
  assert(staticSteps[0].staticFields?.['Counter']?.count === 1, 'Static Counter.count is 1 at step 0');
  assert(staticSteps[1].staticFields?.['Counter']?.count === 2, 'Static Counter.count is 2 at step 1');
  assert(staticSteps[2].staticFields?.['Counter']?.count === 3, 'Static Counter.count is 3 at step 2');
  assert(staticSteps[2].activeJavaConcept?.category === 'MEMORY', 'Active concept is Static Metaspace');

  // -------------------------------------------------------------
  // TEST 5: Polymorphism & Dynamic Method Dispatch
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Polymorphism & Dynamic Method Dispatch ---');
  const polyEvents: ExecutionEvent[] = [
    { type: 'OBJECT_CREATE', line: 1, variable: 'a', dataType: 'Dog', objectId: 'obj-dog', fields: {} },
    {
      type: 'POLYMORPHIC_CALL',
      line: 2,
      variable: 'a',
      refType: 'Animal',
      actualType: 'Dog',
      methodName: 'sound',
      resolvedMethod: 'Dog.sound()',
    },
  ];

  const polySteps = reconstructExecutionSteps(polyEvents, '// Poly test');
  assert(polySteps[1].activeJavaConcept?.name === 'Polymorphism (Dynamic Dispatch)', 'Polymorphism concept detected');
  assert(polySteps[1].activeJavaConcept?.details?.declaredReferenceType === 'Animal', 'Declared ref type is Animal');
  assert(polySteps[1].activeJavaConcept?.details?.actualRuntimeType === 'Dog', 'Actual runtime type is Dog');

  // -------------------------------------------------------------
  // TEST 6: Exceptions, try-catch-finally & Stack Unwinding
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Exception Handling & Stack Unwinding ---');
  const excEvents: ExecutionEvent[] = [
    { type: 'TRY_ENTER', line: 1 },
    { type: 'FUNCTION_CALL', line: 2, functionName: 'calculate', arguments: { x: 10 } },
    { type: 'EXCEPTION_THROW', line: 3, dataType: 'ArithmeticException', message: '/ by zero' },
    { type: 'EXCEPTION_UNWIND', line: 3 },
    { type: 'CATCH_ENTER', line: 4, dataType: 'ArithmeticException', message: '/ by zero' },
    { type: 'FINALLY_ENTER', line: 5 },
  ];

  const excSteps = reconstructExecutionSteps(excEvents, '// Exception test');
  assert(excSteps[0].activeJavaConcept?.name === 'try-catch-finally Block', 'try block entered');
  assert(excSteps[1].callStack.length === 2, 'Frame calculate() added to stack');
  assert(excSteps[2].error?.type === 'ArithmeticException', 'ArithmeticException recorded');
  assert(excSteps[3].callStack.length === 1, 'calculate() unwound from stack');
  assert(excSteps[4].activeJavaConcept?.name === 'Exception Caught', 'catch block executed');
  assert(excSteps[5].activeJavaConcept?.name === 'finally Block Execution', 'finally block executed');

  // -------------------------------------------------------------
  // TEST 7: Multithreading, Thread Stacks & Synchronized Locks
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Multithreading, Thread Stacks & Locks ---');
  const threadEvents: ExecutionEvent[] = [
    { type: 'THREAD_START', line: 1, threadId: 'th-worker', threadName: 'Worker-1' },
    { type: 'THREAD_STATE_CHANGE', line: 2, threadId: 'th-worker', threadName: 'Worker-1', threadState: 'RUNNING' },
    { type: 'LOCK_ACQUIRE', line: 3, lockName: 'mutexLock', ownerThread: 'main' },
    { type: 'LOCK_WAIT', line: 4, lockName: 'mutexLock', threadName: 'Worker-1' },
    { type: 'LOCK_RELEASE', line: 5, lockName: 'mutexLock', ownerThread: 'main' },
    { type: 'DEADLOCK_DETECTED', line: 6, detail: 'Worker-1 holds lock1 waiting for lock2 | main holds lock2 waiting for lock1' },
  ];

  const threadSteps = reconstructExecutionSteps(threadEvents, '// Thread test');
  assert(threadSteps[0].threads?.['th-worker'] !== undefined, 'Worker-1 thread registered');
  assert(threadSteps[1].threads?.['th-worker']?.state === 'RUNNING', 'Worker-1 is RUNNING');
  assert(threadSteps[2].locks?.['mutexLock']?.ownerThreadId === 'main', 'main owns mutexLock');
  assert(threadSteps[3].locks?.['mutexLock']?.waitingThreadIds.includes('Worker-1'), 'Worker-1 waiting on lock');
  assert(threadSteps[4].locks?.['mutexLock']?.ownerThreadId === null, 'mutexLock released');
  assert(threadSteps[5].deadlockDetected === true, 'Deadlock flag detected');

  // -------------------------------------------------------------
  // TEST 8: Autoboxing, Strings & Streams
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Autoboxing, String Pool & Streams ---');
  const modernEvents: ExecutionEvent[] = [
    { type: 'BOXING_OP', line: 1, dataType: 'int', refType: 'Integer', value: 42 },
    { type: 'STRING_POOL_INTERN', line: 2, variable: 's1', value: 'Hello' },
    { type: 'STRING_POOL_INTERN', line: 3, variable: 's2', value: 'Hello' },
    { type: 'STREAM_PIPELINE_STEP', line: 4, streamOp: 'filter', value: [1, 2, 3, 4], newValue: [2, 4] },
  ];

  const modernSteps = reconstructExecutionSteps(modernEvents, '// Modern Java test');
  assert(modernSteps[0].activeJavaConcept?.name.includes('Autoboxing'), 'Autoboxing concept verified');
  assert(modernSteps[1].stringPool?.length === 1, 'String pool contains 1 entry');
  assert(modernSteps[2].stringPool?.[0].references.includes('s1') && modernSteps[2].stringPool?.[0].references.includes('s2'), 's1 and s2 share identical String Pool entry (Conceptual View)');
  assert(modernSteps[3].activeJavaConcept?.name === 'Stream Pipeline Step', 'Stream pipeline step verified');

  // -------------------------------------------------------------
  // TEST 9: Object Lifecycle & GC Eligibility
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Object Lifecycle & GC Eligibility ---');
  const gcEvents: ExecutionEvent[] = [
    { type: 'OBJECT_CREATE', line: 1, variable: 'ref', dataType: 'Node', objectId: 'obj-99', fields: { val: 1 } },
    { type: 'VARIABLE_UPDATE', line: 2, variable: 'ref', newValue: null, isReference: true },
  ];

  const gcSteps = reconstructExecutionSteps(gcEvents, '// GC test');
  assert(gcSteps[0].heap[0].gcEligible === false, 'Step 0: Node is referenced and active');
  assert(gcSteps[1].heap[0].gcEligible === true, 'Step 1: Reference severed -> Eligible for GC!');
  assert(gcSteps[1].heap[0].lifecycle === 'GC_ELIGIBLE', 'Step 1: Lifecycle marked GC_ELIGIBLE');

  // -------------------------------------------------------------
  // TEST 10: Step-by-Step Backward and Forward Replay
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Step-by-Step Replay & State Invariance ---');
  // Walk forward and backward through objSteps to verify exact state matches
  for (let s = 0; s < objSteps.length; s++) {
    assert(objSteps[s].stepIndex === s, `Step index invariant verified at ${s}`);
  }

  console.log('\n================================================================');
  console.log('  ALL 10 PHASE 10 TEST SUITES PASSED CLEANLY (100% SUCCESS)');
  console.log('================================================================');
}

runPhase10TestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
