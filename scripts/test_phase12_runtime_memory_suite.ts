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

async function runPhase12RuntimeMemorySuite() {
  console.log('================================================================');
  console.log('  PHASE 12: COMPLETE JAVA RUNTIME & MEMORY VISUALIZATION SUITE  ');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Primitives & Location ('Stack')
  // -------------------------------------------------------------
  console.log('--- Test 1: Primitives & Location (\'Stack\') ---');
  const primEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'VARIABLE_CREATE', line: 1, variable: 'age', dataType: 'int', value: 20 },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'VARIABLE_CREATE', line: 2, variable: 'salary', dataType: 'double', value: 50000.5 },
    { type: 'LINE_EXECUTE', line: 3 },
    { type: 'VARIABLE_UPDATE', line: 3, variable: 'age', newValue: 21, oldValue: 20 },
  ];

  const primSteps = reconstructExecutionSteps(primEvents, '// Primitives test');
  assert(primSteps.length === 6, 'Reconstructed 6 steps');
  const stepAgeInit = primSteps[1];
  assert(stepAgeInit.variables['age'].location === 'Stack', 'age location is Stack');
  assert(stepAgeInit.variables['age'].kind === 'Primitive', 'age kind is Primitive');
  assert(stepAgeInit.variables['age'].value === 20, 'age value is 20');

  const stepAgeUpdate = primSteps[5];
  assert(stepAgeUpdate.variables['age'].value === 21, 'age value updated to 21');
  assert(
    stepAgeUpdate.beginnerExplanation?.why.includes('WHY DID THIS CHANGE?'),
    'Beginner explanation explains why age changed'
  );

  // -------------------------------------------------------------
  // TEST 2: Object Creation & Stable Object IDs
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Object Creation & Stable Object IDs ---');
  const objEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'OBJECT_CREATE', line: 1, variable: 's1', dataType: 'Student', objectId: 'raw-hash-11', fields: { age: 0, name: 'Alex' } },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'OBJECT_CREATE', line: 2, variable: 's2', dataType: 'Student', objectId: 'raw-hash-22', fields: { age: 0, name: 'Bob' } },
  ];

  const objSteps = reconstructExecutionSteps(objEvents, '// Object creation test');
  assert(objSteps.length === 4, 'Reconstructed 4 steps');
  const stepS2 = objSteps[3];
  assert(stepS2.variables['s1'].refTargetId === 'object-1', 's1 points to stable object-1');
  assert(stepS2.variables['s2'].refTargetId === 'object-2', 's2 points to stable object-2');
  assert(stepS2.heap.length === 2, 'Heap contains exactly 2 independent objects');
  assert(stepS2.heap[0].objectId === 'object-1', 'Heap object 0 has stable object-1 ID');
  assert(stepS2.heap[1].objectId === 'object-2', 'Heap object 1 has stable object-2 ID');

  // -------------------------------------------------------------
  // TEST 3: Reference Copy & Aliasing Detection
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Reference Copy & Aliasing Detection ---');
  const aliasEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'OBJECT_CREATE', line: 1, variable: 'a', dataType: 'Student', objectId: 'raw-hash-99', fields: { age: 0, name: 'Alex' } },
    { type: 'LINE_EXECUTE', line: 2 },
    // b = a (Reference copy)
    { type: 'VARIABLE_CREATE', line: 2, variable: 'b', dataType: 'Student', isReference: true, refTargetId: 'raw-hash-99', value: 'raw-hash-99' },
    { type: 'LINE_EXECUTE', line: 3 },
    // b.age = 20
    { type: 'OBJECT_FIELD_UPDATE', line: 3, objectId: 'raw-hash-99', variable: 'b', fieldName: 'age', newValue: 20 },
  ];

  const aliasSteps = reconstructExecutionSteps(aliasEvents, '// Aliasing test');
  assert(aliasSteps.length === 6, 'Reconstructed 6 steps');
  const stepAfterCopy = aliasSteps[3];
  assert(stepAfterCopy.variables['a'].aliasedWith?.includes('b') === true, 'Variable a marked as aliased with b');
  assert(stepAfterCopy.variables['b'].aliasedWith?.includes('a') === true, 'Variable b marked as aliased with a');

  const heapObj = stepAfterCopy.heap.find(h => h.id === 'object-1');
  assert(heapObj?.aliased === true, 'Heap object marked as aliased');
  assert(heapObj?.referencesFrom?.includes('a') && heapObj?.referencesFrom?.includes('b'), 'Heap object referenced by both a and b');

  const stepAfterMutation = aliasSteps[5];
  assert(
    stepAfterMutation.beginnerExplanation?.why.includes('WHY DID BOTH VARIABLES CHANGE?'),
    'Beginner explanation explains aliasing on field update'
  );

  // -------------------------------------------------------------
  // TEST 4: Reference Reassignment & GC Eligibility
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Reference Reassignment & GC Eligibility ---');
  const reassignEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'OBJECT_CREATE', line: 1, variable: 'a', dataType: 'Student', objectId: 'raw-1', fields: { name: 'A' } },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'OBJECT_CREATE', line: 2, variable: 'b', dataType: 'Student', objectId: 'raw-2', fields: { name: 'B' } },
    { type: 'LINE_EXECUTE', line: 3 },
    // a = b;
    { type: 'REFERENCE_REASSIGN', line: 3, variable: 'a', oldValue: 'object-1', newValue: 'object-2' },
  ];

  const reassignSteps = reconstructExecutionSteps(reassignEvents, '// Reassign test');
  const lastReassignStep = reassignSteps[5];
  assert(lastReassignStep.variables['a'].refTargetId === 'object-2', 'a now points to object-2');
  assert(lastReassignStep.variables['b'].refTargetId === 'object-2', 'b points to object-2');
  const objA = lastReassignStep.heap.find(h => h.id === 'object-1');
  assert(objA?.gcEligible === true, 'Object 1 has no active references and is GC eligible');

  // -------------------------------------------------------------
  // TEST 5: Null & NullPointerException
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Null & NullPointerException ---');
  const npeEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'VARIABLE_CREATE', line: 1, variable: 's', dataType: 'Student', value: null, isReference: true },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'EXCEPTION', line: 2, dataType: 'NullPointerException', variable: 's', message: 'Cannot read field "age" because "s" is null' },
  ];

  const npeSteps = reconstructExecutionSteps(npeEvents, '// NPE test');
  const stepNpe = npeSteps[3];
  assert(stepNpe.error?.type === 'NullPointerException', 'Error type is NullPointerException');
  assert(
    stepNpe.beginnerExplanation?.why.includes('WHY DID THE PROGRAM CRASH?'),
    'Beginner explanation answers WHY DID THE PROGRAM CRASH?'
  );

  // -------------------------------------------------------------
  // TEST 6: Array & Array Aliasing
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Array & Array Aliasing ---');
  const arrEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'ARRAY_CREATE', line: 1, structureId: 'arr', variable: 'a', values: [1, 2, 3] },
    { type: 'LINE_EXECUTE', line: 2 },
    // int[] b = a;
    { type: 'VARIABLE_CREATE', line: 2, variable: 'b', dataType: 'int[]', isReference: true, refTargetId: 'arr', value: '@arr' },
    { type: 'LINE_EXECUTE', line: 3 },
    // b[0] = 99
    { type: 'ARRAY_UPDATE', line: 3, structureId: 'arr', index: 0, oldValue: 1, newValue: 99 },
  ];

  const arrSteps = reconstructExecutionSteps(arrEvents, '// Array aliasing test');
  const lastArrStep = arrSteps[5];
  assert(lastArrStep.variables['a'].aliasedWith?.includes('b') === true, 'Array variable a aliased with b');
  assert(lastArrStep.variables['b'].aliasedWith?.includes('a') === true, 'Array variable b aliased with a');
  assert(lastArrStep.structures['arr'].arrayData?.[0] === 99, 'Shared array data reflects 99 at index 0');

  // -------------------------------------------------------------
  // TEST 7: Strings & String Operations
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Strings & String Operations ---');
  const strEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'VARIABLE_CREATE', line: 1, variable: 'name', dataType: 'String', value: 'Ashrith' },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'STRING_OP', line: 2, variable: 'name', meta: { op: 'length' }, value: 7 },
  ];

  const strSteps = reconstructExecutionSteps(strEvents, '// String test');
  const lastStrStep = strSteps[3];
  assert(lastStrStep.variables['name'].value === 'Ashrith', 'String variable stores Ashrith');
  assert(lastStrStep.beginnerExplanation?.actionType === 'STRING_OP', 'String op action type recorded');

  // -------------------------------------------------------------
  // TEST 8: Method Calls & Call Stack ("WHY DID A NEW BOX APPEAR?")
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Method Calls & Call Stack ---');
  const methodEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'METHOD_CALL', line: 1, methodName: 'add', arguments: { a: 10, b: 20 } },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'METHOD_RETURN', line: 2, methodName: 'add', returnValue: 30 },
  ];

  const methodSteps = reconstructExecutionSteps(methodEvents, '// Method call test');
  const stepCall = methodSteps[1];
  assert(stepCall.callStack.length === 2, 'Call stack has 2 frames during method call');
  assert(
    stepCall.beginnerExplanation?.why.includes('WHY DID A NEW BOX APPEAR?'),
    'Method call explains WHY DID A NEW BOX APPEAR?'
  );

  const stepRet = methodSteps[3];
  assert(stepRet.callStack.length === 1, 'Call stack popped back to 1 frame after return');

  // -------------------------------------------------------------
  // TEST 9: Local Block Scope
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Local Block Scope ---');
  const scopeEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'VARIABLE_CREATE', line: 1, variable: 'x', dataType: 'int', value: 10 },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'SCOPE_ENTER', line: 2, detail: 'if block' },
    { type: 'LINE_EXECUTE', line: 3 },
    { type: 'VARIABLE_CREATE', line: 3, variable: 'y', dataType: 'int', value: 20 },
    { type: 'LINE_EXECUTE', line: 4 },
    { type: 'SCOPE_EXIT', line: 4, detail: 'if block', variable: 'y' },
  ];

  const scopeSteps = reconstructExecutionSteps(scopeEvents, '// Scope test');
  const lastScopeStep = scopeSteps[7];
  assert(lastScopeStep.variables['x'].inActiveScope === true, 'x is in active scope');
  assert(lastScopeStep.variables['y'].inActiveScope === false, 'y is marked OUT OF ACTIVE SCOPE');

  // -------------------------------------------------------------
  // TEST 10: Conditions & Short-Circuit Evaluation
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Conditions & Short-Circuiting ---');
  const condEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'CONDITION_EVAL', line: 1, condition: 'age >= 18', conditionResult: true },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'CONDITION_EVAL', line: 2, condition: 'false && check()', conditionResult: false, meta: { shortCircuited: true } },
  ];

  const condSteps = reconstructExecutionSteps(condEvents, '// Condition test');
  const stepCond1 = condSteps[1];
  assert(stepCond1.conditionEvaluation?.result === true, 'Condition 1 evaluated to true');
  const stepCond2 = condSteps[3];
  assert(stepCond2.conditionEvaluation?.shortCircuited === true, 'Condition 2 marked shortCircuited');
  assert(stepCond2.beginnerExplanation?.why.includes('Short-circuit'), 'Explanation details short-circuit evaluation');

  // -------------------------------------------------------------
  // TEST 11: Static Metaspace State vs Instance State
  // -------------------------------------------------------------
  console.log('\n--- Test 11: Static State vs Instance State ---');
  const staticEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'STATIC_FIELD_UPDATE', line: 1, className: 'Counter', fieldName: 'count', newValue: 3 },
  ];

  const staticSteps = reconstructExecutionSteps(staticEvents, '// Static test');
  const lastStaticStep = staticSteps[1];
  assert(lastStaticStep.staticFields?.['Counter']?.['count'] === 3, 'Static Metaspace contains Counter.count = 3');

  // -------------------------------------------------------------
  // TEST 12: Object Graph Generation
  // -------------------------------------------------------------
  console.log('\n--- Test 12: Object Graph Generation ---');
  const graphEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'OBJECT_CREATE', line: 1, variable: 'addr', dataType: 'Address', objectId: 'raw-addr-1', fields: { city: 'Bengaluru' } },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'OBJECT_CREATE', line: 2, variable: 's', dataType: 'Student', objectId: 'raw-stud-1', fields: { name: 'Alex', address: 'raw-addr-1' } },
  ];

  const graphSteps = reconstructExecutionSteps(graphEvents, '// Graph test');
  const lastGraphStep = graphSteps[3];
  assert(lastGraphStep.objectGraph !== undefined, 'Step has objectGraph generated');
  assert(lastGraphStep.objectGraph!.length >= 2, 'Graph contains edges for variables and nested references');
  const nestedEdge = lastGraphStep.objectGraph!.find(e => e.label === '.address');
  assert(nestedEdge !== undefined, 'Graph contains nested edge .address pointing to Address instance');

  // -------------------------------------------------------------
  // TEST 13: Time-Travel Step Replay & Immutability
  // -------------------------------------------------------------
  console.log('\n--- Test 13: Time-Travel Step Replay & Exact State Restoration ---');
  // Replay backward and forward on array aliasing
  const s0 = arrSteps[0];
  const s1 = arrSteps[1];
  const s3 = arrSteps[3];
  const s5 = arrSteps[5];

  // Forward check
  assert(s1.structures['arr'].arrayData?.[0] === 1, 'Initial state: arr[0] == 1');
  assert(s5.structures['arr'].arrayData?.[0] === 99, 'Mutated state: arr[0] == 99');

  // Step backward check: s1 was not modified by later steps
  assert(s1.structures['arr'].arrayData?.[0] === 1, 'Backward integrity: s1 still has arr[0] == 1');
  assert(s3.structures['arr'].arrayData?.[0] === 1, 'Backward integrity: s3 still has arr[0] == 1');

  console.log('\n================================================================');
  console.log('  ALL 13 PHASE 12 RUNTIME & MEMORY TESTS PASSED 100%! ✓✓✓      ');
  console.log('================================================================\n');
}

runPhase12RuntimeMemorySuite();
