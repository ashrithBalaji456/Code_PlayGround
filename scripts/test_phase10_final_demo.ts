import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { PHASE_10_JAVA_PRESETS } from '../src/presets/phase10Presets.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function testFinalDemo() {
  console.log('================================================================');
  console.log('  PHASE 10: SECTION 88 FINAL COMPREHENSIVE DEMO VALIDATION');
  console.log('================================================================\n');

  const demoPreset = PHASE_10_JAVA_PRESETS.find((p) => p.id === 'p10-88-final-demo');
  assert(demoPreset !== undefined, 'Found preset 88 (Final Comprehensive Demo)');

  const code = demoPreset!.code;
  console.log('Executing grand unified Java program through JVM worker...');
  const res = await executeJavaWorker(code);

  assert(res.success === true, 'JVM execution completed without crash');
  assert(Array.isArray(res.events) && res.events.length > 20, `Emitted ${res.events?.length} execution events`);

  const steps = reconstructExecutionSteps(res.events!, code);
  assert(steps.length > 0, `Reconstructed ${steps.length} state steps`);

  // Verify console output
  const finalStep = steps[steps.length - 1];
  const consoleJoined = finalStep.consoleOutput.join('\n');
  assert(consoleJoined.includes('User Ashrith processed, new score: 105'), 'Polymorphic dispatch & mutation succeeded: score 105');
  assert(consoleJoined.includes('Factorial 5 = 120'), 'Recursion evaluated factorial(5) = 120');
  assert(consoleJoined.includes('Handled division exception safely'), 'Exception caught safely in try-catch');
  assert(consoleJoined.includes('Demo completed successfully!'), 'finally block executed guaranteed');

  // Verify state tracking
  assert(Object.keys(finalStep.variables).length > 5, 'Tracked multiple stack variables (u1, u2, e, log, map, fact5)');
  assert(finalStep.heap.length > 0, 'Heap contains active objects');
  assert(finalStep.structures['log'] !== undefined || Object.keys(finalStep.structures).length > 0, 'Collections tracked in structures');

  console.log('\n================================================================');
  console.log('  GRAND UNIFIED PHASE 10 DEMO EXECUTED PERFECTLY ON JVM!');
  console.log('================================================================\n');
}

testFinalDemo().catch((err) => {
  console.error('Final demo test failed:', err);
  process.exit(1);
});
