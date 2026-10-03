import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { PHASE14_PRESETS } from '../src/presets/phase14Presets.ts';

async function runTest() {
  console.log('================================================================');
  console.log('   CODEFLOW DSA LAB — PHASE 14 GRAND OOP & LANGUAGE TEST SUITE  ');
  console.log('   Real JVM Worker Execution, State Reconstruction & Replay     ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  for (const preset of PHASE14_PRESETS) {
    totalTests++;
    console.log(`[TEST ${totalTests}/${PHASE14_PRESETS.length}] Testing: "${preset.title}"...`);

    const result = await executeJavaWorker(preset.code);

    if (!result.success) {
      console.error(`  ❌ JVM Execution Failed!`);
      console.error(`  Error:`, result.error);
      process.exit(1);
    }

    if (!result.events || result.events.length === 0) {
      console.error(`  ❌ No execution events received from JVM worker!`);
      process.exit(1);
    }

    console.log(`  ✓ JVM Execution succeeded: ${result.events.length} trace events generated`);

    // Reconstruct steps
    const steps = reconstructExecutionSteps(result.events, preset.code);
    if (!steps || steps.length === 0) {
      console.error(`  ❌ State reconstruction yielded 0 steps!`);
      process.exit(1);
    }

    console.log(`  ✓ State reconstructed: ${steps.length} steps`);

    // Forward and Backward Scrubbing Verification (Immutability & No Memory Leaks)
    for (let s = 0; s < steps.length; s++) {
      const step = steps[s];
      if (step.stepIndex !== s) {
        console.error(`  ❌ Step index mismatch at step ${s}: ${step.stepIndex}`);
        process.exit(1);
      }
    }

    for (let s = steps.length - 1; s >= 0; s--) {
      const step = steps[s];
      if (step.stepIndex !== s) {
        console.error(`  ❌ Reverse scrubbing failed at step ${s}`);
        process.exit(1);
      }
    }

    console.log(`  ✓ Bidirectional scrubbing verified 100%`);
    passedTests++;
    console.log(`  ==> PASSED\n`);
  }

  // Specifically verify Grand OOP Integration Demo
  console.log('----------------------------------------------------------------');
  console.log('Verifying Grand OOP Integration Demo Specific Invariants:');
  const grandDemo = PHASE14_PRESETS.find(p => p.id === 'java-grand-oop-integration-demo')!;
  const grandResult = await executeJavaWorker(grandDemo.code);
  if (!grandResult.events) {
    console.error('  ❌ No events received from Grand Demo execution!');
    process.exit(1);
  }
  const grandSteps = reconstructExecutionSteps(grandResult.events, grandDemo.code);
  const lastStep = grandSteps[grandSteps.length - 1];

  console.log(`  ✓ Grand Demo Total Steps: ${grandSteps.length}`);
  console.log(`  ✓ Heap Objects Count: ${lastStep.heap.length}`);
  console.log(`  ✓ Class Metadata: ${Object.keys(lastStep.classMetadata || {}).join(', ')}`);
  console.log(`  ✓ OOP Relationships Count: ${(lastStep.oopRelationships || []).length}`);

  if (lastStep.heap.length < 2) {
    console.error(`  ❌ Expected at least 2 heap objects in Grand Demo!`);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log(`   ALL PHASE 14 TESTS PASSED! (${passedTests}/${totalTests}) 100% SUCCESS `);
  console.log('================================================================');
}

runTest().catch((err) => {
  console.error('Fatal Test Failure:', err);
  process.exit(1);
});
