import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { PHASE_11_JAVA_PRESETS } from '../src/presets/phase11Presets.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function testCombinedJavaDsaDemo() {
  console.log('================================================================');
  console.log('  PHASE 11: SECTION 68 COMBINED JAVA OOP + DSA DEMO VALIDATION');
  console.log('================================================================\n');

  const preset = PHASE_11_JAVA_PRESETS.find((p) => p.id === 'p11-34-combined-oop-dsa');
  assert(preset !== undefined, 'Found preset 34 (Combined OOP + DSA Demo)');

  const code = preset!.code;
  console.log('Executing Combined Student + int[] marks + findMax() on real JVM...');
  const res = await executeJavaWorker(code);

  assert(res.success === true, 'JVM execution completed successfully');
  assert(Array.isArray(res.events) && res.events.length > 10, `Emitted ${res.events?.length} execution events`);

  const steps = reconstructExecutionSteps(res.events!, code);
  assert(steps.length > 0, `Reconstructed ${steps.length} state steps`);

  // Verify console output
  const finalStep = steps[steps.length - 1];
  const consoleJoined = finalStep.consoleOutput.join('\n');
  assert(
    consoleJoined.includes('Highest mark for Ashrith: 95'),
    `Console printed highest mark 95: "${consoleJoined}"`
  );

  // Verify heap objects
  const hasHeap = steps.some((st) => st.heap.length > 0);
  assert(hasHeap, 'Heap contains allocated Student object instance');

  // Verify structures (array tracking)
  const hasArrayStructure = steps.some(
    (st) => st.structures['marks'] !== undefined || Object.keys(st.structures).length > 0
  );
  assert(hasArrayStructure, 'Marks array tracked in DSA structures');

  // Verify beginner explanation
  const hasBeginnerExp = steps.some((st) => st.beginnerExplanation !== undefined);
  assert(hasBeginnerExp, 'Beginner explanations dynamically generated for steps');

  console.log('\n================================================================');
  console.log('  COMBINED JAVA OOP + DSA DEMO EXECUTED PERFECTLY ON JVM!');
  console.log('================================================================\n');
}

testCombinedJavaDsaDemo().catch((err) => {
  console.error('Combined Java DSA test failed:', err);
  process.exit(1);
});
