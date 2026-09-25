import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { ExecutionEvent } from '../src/types/execution.ts';

function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('  Testing State Reducer & Step Replay Fidelity      ');
console.log('====================================================\n');

// 1. Reducer Test
console.log('Test 1: Reducer State Transition (CREATE -> PUSH 10 -> PUSH 20 -> POP)');
const events: ExecutionEvent[] = [
  { type: 'STACK_CREATE', line: 1, structureId: 'stack' },
  { type: 'STACK_PUSH', line: 2, structureId: 'stack', value: 10 },
  { type: 'STACK_PUSH', line: 3, structureId: 'stack', value: 20 },
  { type: 'STACK_POP', line: 4, structureId: 'stack', value: 20 },
];

const steps = reconstructExecutionSteps(events, '// dummy code');
assert(steps.length === 4, 'Reconstructed 4 execution steps');

const finalStep = steps[3];
const finalStack = finalStep.structures['stack'];
assert(finalStack !== undefined, 'Stack structure exists in final step');
assert(finalStack.size === 1, 'Final stack size is 1');
assert(
  Array.isArray(finalStack.stackData) &&
    finalStack.stackData.length === 1 &&
    finalStack.stackData[0] === 10,
  'Final stack element is exactly [10]'
);

// 2. Step Replay Fidelity
console.log('\nTest 2: Replay (Step 1 -> Step 2 -> Step 3 -> Step 2)');
const step0 = steps[0]; // CREATE
const step1 = steps[1]; // PUSH 10
const step2 = steps[2]; // PUSH 20
const step3 = steps[3]; // POP

assert(step0.structures['stack'].stackData?.length === 0, 'Step 1 (CREATE): elements = []');
assert(
  step1.structures['stack'].stackData?.length === 1 &&
    step1.structures['stack'].stackData?.[0] === 10,
  'Step 2 (PUSH 10): elements = [10]'
);
assert(
  step2.structures['stack'].stackData?.length === 2 &&
    step2.structures['stack'].stackData?.[0] === 10 &&
    step2.structures['stack'].stackData?.[1] === 20,
  'Step 3 (PUSH 20): elements = [10, 20]'
);
assert(
  step3.structures['stack'].stackData?.length === 1 &&
    step3.structures['stack'].stackData?.[0] === 10,
  'Step 4 (POP): elements = [10]'
);

// Verify that inspecting earlier snapshot steps[1] still has exactly [10] and has not been mutated
assert(
  steps[1].structures['stack'].stackData?.length === 1 &&
    steps[1].structures['stack'].stackData?.[0] === 10,
  'Replay to Step 2 returns exact preserved snapshot [10]'
);
assert(
  steps[2].structures['stack'].stackData?.length === 2 &&
    steps[2].structures['stack'].stackData?.[1] === 20,
  'Replay to Step 3 returns exact preserved snapshot [10, 20]'
);

// 3. Multiple Structures Independence
console.log('\nTest 3: Multiple Structures Independence (stackA, stackB, queueA, queueB)');
const multiEvents: ExecutionEvent[] = [
  { type: 'STACK_CREATE', line: 1, structureId: 'stackA' },
  { type: 'STACK_CREATE', line: 2, structureId: 'stackB' },
  { type: 'QUEUE_CREATE', line: 3, structureId: 'queueA' },
  { type: 'QUEUE_CREATE', line: 4, structureId: 'queueB' },
  { type: 'STACK_PUSH', line: 5, structureId: 'stackA', value: 100 },
  { type: 'QUEUE_ENQUEUE', line: 6, structureId: 'queueA', value: 500 },
];

const multiSteps = reconstructExecutionSteps(multiEvents, '// dummy code');
const lastMulti = multiSteps[multiSteps.length - 1];

assert(lastMulti.structures['stackA'].size === 1, 'stackA size is 1');
assert(lastMulti.structures['stackA'].stackData?.[0] === 100, 'stackA contains 100');
assert(lastMulti.structures['stackB'].size === 0, 'stackB remains empty (size 0)');
assert(lastMulti.structures['queueA'].size === 1, 'queueA size is 1');
assert(lastMulti.structures['queueA'].queueData?.[0] === 500, 'queueA contains 500');
assert(lastMulti.structures['queueB'].size === 0, 'queueB remains empty (size 0)');

console.log('\n====================================================');
console.log('  ALL REDUCER & REPLAY TESTS PASSED PERFECTLY!');
console.log('====================================================');
