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

async function runPhase11TestSuite() {
  console.log('================================================================');
  console.log('  PHASE 11: JAVA OOP, REFERENCES, MEMORY & BEGINNER EXPLANATIONS');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Primitives, Variables & Educational Representation
  // -------------------------------------------------------------
  console.log('--- Test 1: Primitives & Educational Representation ---');
  const primEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'VARIABLE_CREATE', line: 1, variable: 'age', dataType: 'int', value: 20 },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'VARIABLE_CREATE', line: 2, variable: 'salary', dataType: 'double', value: 50000.5 },
    { type: 'LINE_EXECUTE', line: 3 },
    { type: 'VARIABLE_UPDATE', line: 3, variable: 'age', newValue: 25, previousValue: 20 },
  ];

  const primSteps = reconstructExecutionSteps(primEvents, '// Primitives test');
  assert(primSteps.length === 6, 'Reconstructed 6 steps');
  const step3 = primSteps[3]; // after age, salary
  assert(step3.variables['age'].kind === 'Primitive', 'age kind is Primitive');
  assert(step3.variables['age'].type === 'int', 'age type is int');
  assert(step3.variables['age'].value === 20, 'age value is 20');
  assert(typeof step3.variables['age'].educationalSize === 'string', 'age has educationalSize label');
  assert(step3.variables['salary'].kind === 'Primitive', 'salary kind is Primitive');

  const step5 = primSteps[5]; // after age update to 25
  assert(step5.variables['age'].value === 25, 'age updated to 25');
  assert(step5.beginnerExplanation !== undefined, 'Step 5 has beginnerExplanation');
  assert(step5.beginnerExplanation?.what.includes('age'), 'Beginner explanation mentions age');

  // -------------------------------------------------------------
  // TEST 2: Object Creation & Stable Object IDs (object-1, object-2)
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Object Creation & Stable Object IDs ---');
  const objEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'OBJECT_CREATE', line: 1, variable: 's1', dataType: 'Student', objectId: 'raw-hash-9988', fields: { age: 0, name: null } },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'OBJECT_FIELD_UPDATE', line: 2, objectId: 'raw-hash-9988', fieldName: 'age', newValue: 20 },
    { type: 'LINE_EXECUTE', line: 3 },
    { type: 'OBJECT_CREATE', line: 3, variable: 's2', dataType: 'Student', objectId: 'raw-hash-1122', fields: { age: 0, name: null } },
    { type: 'LINE_EXECUTE', line: 4 },
    { type: 'OBJECT_FIELD_UPDATE', line: 4, objectId: 'raw-hash-1122', fieldName: 'age', newValue: 22 },
  ];

  const objSteps = reconstructExecutionSteps(objEvents, '// Objects test');
  assert(objSteps[1].heap.length === 1, 'Step 1: One object on heap');
  assert(objSteps[1].heap[0].objectId === 'object-1', 'Stable objectId is "object-1" (not raw hash)');
  assert(objSteps[1].variables['s1'].kind === 'Reference', 's1 kind is Reference');
  assert(objSteps[1].variables['s1'].refTargetId === 'object-1', 's1 refTargetId is object-1');
  assert(objSteps[1].beginnerExplanation?.what.includes('Student'), 'Explanation describes Student object creation');

  // Step 5: Second object created
  assert(objSteps[5].heap.length === 2, 'Step 5: Two objects on heap');
  assert(objSteps[5].heap[1].objectId === 'object-2', 'Second object has stable ID "object-2"');
  assert(objSteps[7].heap[0].fields.age === 20, 'object-1 age is 20');
  assert(objSteps[7].heap[1].fields.age === 22, 'object-2 age is 22 (independent)');

  // -------------------------------------------------------------
  // TEST 3: Reference Assignment & Aliasing
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Reference Assignment & Shared Object ---');
  const aliasEvents: ExecutionEvent[] = [
    { type: 'OBJECT_CREATE', line: 1, variable: 'a', dataType: 'Student', objectId: 'raw-1', fields: { age: 20 } },
    { type: 'VARIABLE_CREATE', line: 2, variable: 'b', dataType: 'Student', value: '@raw-1', isReference: true, refTargetId: 'raw-1' },
    { type: 'OBJECT_FIELD_UPDATE', line: 3, objectId: 'raw-1', fieldName: 'age', newValue: 25 },
  ];

  const aliasSteps = reconstructExecutionSteps(aliasEvents, '// Alias test');
  const lastAlias = aliasSteps[aliasSteps.length - 1];
  assert(lastAlias.heap[0].referencesFrom?.includes('a'), 'Heap object referencesFrom includes "a"');
  assert(lastAlias.heap[0].referencesFrom?.includes('b'), 'Heap object referencesFrom includes "b"');
  assert(lastAlias.heap[0].fields.age === 25, 'Field updated to 25');
  assert(lastAlias.variables['a'].refTargetId === 'object-1', 'Variable a points to object-1');
  assert(lastAlias.variables['b'].refTargetId === 'object-1', 'Variable b points to same object-1');

  // -------------------------------------------------------------
  // TEST 4: Null Reference & Garbage Collection Eligibility
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Null Reference & GC Eligibility ---');
  const nullEvents: ExecutionEvent[] = [
    { type: 'OBJECT_CREATE', line: 1, variable: 's', dataType: 'Student', objectId: 'raw-gc', fields: { age: 18 } },
    { type: 'VARIABLE_UPDATE', line: 2, variable: 's', newValue: 'null', isReference: true },
  ];

  const nullSteps = reconstructExecutionSteps(nullEvents, '// Null test');
  assert(nullSteps[0].heap[0].gcEligible === false, 'Initially object is active (referenced by s)');
  assert(nullSteps[1].variables['s'].value === null || nullSteps[1].variables['s'].value === 'null', 'Variable s is now null');
  assert(nullSteps[1].heap[0].gcEligible === true, 'Object is now eligible for Garbage Collection');
  assert(nullSteps[1].heap[0].lifecycle === 'GC_ELIGIBLE', 'Object lifecycle is GC_ELIGIBLE');

  // -------------------------------------------------------------
  // TEST 5: Method Overriding & Polymorphism
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Method Overriding & Polymorphism ---');
  const polyEvents: ExecutionEvent[] = [
    { type: 'LINE_EXECUTE', line: 1 },
    { type: 'OBJECT_CREATE', line: 1, variable: 'a', dataType: 'Dog', objectId: 'poly-1', fields: { breed: 'Golden' } },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'METHOD_CALL', line: 2, methodName: 'sound', receiver: 'Dog', scope: 'Dog.sound()' },
    { type: 'LINE_EXECUTE', line: 3 },
    { type: 'PRINT', line: 3, value: 'Dog barks' },
    { type: 'METHOD_RETURN', line: 4, methodName: 'sound', scope: 'main()' },
  ];

  const polySteps = reconstructExecutionSteps(polyEvents, '// Poly test');
  assert(polySteps.length === 7, 'Reconstructed polymorphic call steps');
  assert(polySteps[3].callStack.length === 2, 'Call stack has 2 frames during Dog.sound()');
  assert(polySteps[3].callStack[1].functionName.includes('sound'), 'Active method frame is sound()');
  assert(polySteps[6].callStack.length === 1, 'Call stack unwound back to main()');

  // -------------------------------------------------------------
  // TEST 6: String Immutability & StringBuilder
  // -------------------------------------------------------------
  console.log('\n--- Test 6: String Immutability & StringBuilder ---');
  const strEvents: ExecutionEvent[] = [
    { type: 'VARIABLE_CREATE', line: 1, variable: 's', dataType: 'String', value: 'Hello' },
    { type: 'VARIABLE_UPDATE', line: 2, variable: 's', newValue: 'Hello World', previousValue: 'Hello' },
    { type: 'OBJECT_CREATE', line: 3, variable: 'sb', dataType: 'StringBuilder', objectId: 'sb-1', fields: { content: 'Hello' } },
    { type: 'OBJECT_FIELD_UPDATE', line: 4, objectId: 'sb-1', fieldName: 'content', newValue: 'Hello World' },
  ];

  const strSteps = reconstructExecutionSteps(strEvents, '// String test');
  assert(strSteps[0].variables['s'].value === 'Hello', 'Initial string is Hello');
  assert(strSteps[1].variables['s'].value === 'Hello World', 'Updated string is Hello World');
  assert(strSteps[2].heap[0].className === 'StringBuilder', 'StringBuilder created on heap');
  assert(strSteps[3].heap[0].fields.content === 'Hello World', 'StringBuilder content modified in-place');

  // -------------------------------------------------------------
  // TEST 7: Exceptions, Propagation & finally
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Exceptions, Propagation & finally ---');
  const exEvents: ExecutionEvent[] = [
    { type: 'TRY_ENTER', line: 1 },
    { type: 'LINE_EXECUTE', line: 2 },
    { type: 'EXCEPTION_THROW', line: 2, dataType: 'ArithmeticException', message: '/ by zero' },
    { type: 'CATCH_ENTER', line: 3, dataType: 'ArithmeticException' },
    { type: 'FINALLY_ENTER', line: 5 },
  ];

  const exSteps = reconstructExecutionSteps(exEvents, '// Exception test');
  assert(exSteps.length === 5, 'Reconstructed exception steps');
  assert(exSteps[2].error?.type === 'ArithmeticException', 'Exception thrown is ArithmeticException');
  assert(exSteps[3].activeJavaConcept?.badge === 'Catch Handler', 'Caught in catch block');
  assert(exSteps[4].beginnerExplanation?.what.includes('finally'), 'Finally block explanation rendered');

  // -------------------------------------------------------------
  // TEST 8: Backward Replay Immutability
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Backward Replay Immutability ---');
  // Replaying steps backwards preserves previous state
  assert(objSteps[1].heap.length === 1, 'Replay step 1: exactly 1 object');
  assert(objSteps[1].heap[0].fields.age === 0, 'Replay step 1: age is 0');
  assert(objSteps[5].heap.length === 2, 'Replay step 5: exactly 2 objects');
  assert(objSteps[7].heap[0].fields.age === 20, 'Replay step 7: age is 20');

  console.log('\n================================================================');
  console.log('  ALL 8 PHASE 11 VISUALIZATION & MEMORY TESTS PASSED!');
  console.log('================================================================\n');
}

runPhase11TestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
