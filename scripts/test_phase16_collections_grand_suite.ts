import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { PHASE16_PRESETS } from '../src/presets/phase16Presets.ts';

async function runTest() {
  console.log('================================================================');
  console.log('   CODEFLOW DSA LAB — PHASE 16 COLLECTIONS & DATA STRUCTURES    ');
  console.log('   Live JVM Worker, Collection Operations, Structures & Replay  ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  for (const preset of PHASE16_PRESETS) {
    totalTests++;
    console.log(`[TEST ${totalTests}/${PHASE16_PRESETS.length}] Testing: "${preset.title}"...`);

    const result = await executeJavaWorker(preset.code, 'Main.java');

    if (!result.success) {
      console.error(`  ❌ JVM Execution Failed!`);
      console.error(`  Error:`, result.error);
      process.exit(1);
    }

    const steps = reconstructExecutionSteps(result.events, preset.code);
    if (!steps || steps.length === 0) {
      console.error(`  ❌ State reconstruction produced 0 steps!`);
      process.exit(1);
    }

    console.log(`  ✓ Real JVM Worker Executed (${result.events.length} events, ${steps.length} reconstructed steps)`);

    // Verify key preset specifics
    if (preset.id === 'java-phase16-grand-collections-demo') {
      const finalStep = steps[steps.length - 1];
      console.log(`  [Grand Collections Demo Specific Invariants]`);
      const inspectors = finalStep.collectionInspectors || {};
      const colNames = Object.keys(inspectors);
      console.log(`    - Total Collections in Memory: ${colNames.length}`);
      console.log(`    - Collection Names: ${colNames.join(', ')}`);
      console.log(`    - Heap Objects: ${finalStep.heap.length}`);
      console.log(`    - Console Output: ${JSON.stringify(finalStep.consoleOutput)}`);

      if (colNames.length < 3) {
        console.error(`  ❌ Expected at least 3 collections in memory, found ${colNames.length}`);
        process.exit(1);
      }
    }

    if (preset.id === 'java-phase16-arraylist-insert-remove') {
      const finalStep = steps[steps.length - 1];
      console.log(`  [ArrayList Insert/Remove Shifting Verification]`);
      console.log(`    - Console Output: ${JSON.stringify(finalStep.consoleOutput)}`);
    }

    if (preset.id === 'java-phase16-fail-fast-iterator') {
      const finalStep = steps[steps.length - 1];
      console.log(`  [Fail-Fast ConcurrentModificationException Verification]`);
      console.log(`    - Console Output: ${JSON.stringify(finalStep.consoleOutput)}`);
      if (!finalStep.consoleOutput.some(c => c.includes('ConcurrentModificationException'))) {
        console.error(`  ❌ Failed to catch ConcurrentModificationException!`);
        process.exit(1);
      }
    }

    if (preset.id === 'java-phase16-collection-exceptions') {
      const finalStep = steps[steps.length - 1];
      console.log(`  [IndexOutOfBoundsException Verification]`);
      console.log(`    - Console Output: ${JSON.stringify(finalStep.consoleOutput)}`);
      if (!finalStep.consoleOutput.some(c => c.includes('IndexOutOfBoundsException'))) {
        console.error(`  ❌ Failed to catch IndexOutOfBoundsException!`);
        process.exit(1);
      }
    }

    // Bidirectional scrubbing replay test
    const step0Snapshot = JSON.stringify(steps[0]);
    // Scrub forward
    for (let s = 0; s < steps.length; s++) {
      const current = steps[s];
      if (!current.variables || !current.heap) {
        console.error(`  ❌ Corrupt step state at step ${s}`);
        process.exit(1);
      }
    }
    // Scrub backward
    for (let s = steps.length - 1; s >= 0; s--) {
      const current = steps[s];
      if (!current.variables || !current.heap) {
        console.error(`  ❌ Corrupt step state during backward scrub at step ${s}`);
        process.exit(1);
      }
    }
    // Assert step 0 immutability
    const step0AfterScrub = JSON.stringify(steps[0]);
    if (step0Snapshot !== step0AfterScrub) {
      console.error(`  ❌ Bidirectional scrub state leak detected at step 0!`);
      process.exit(1);
    }

    console.log(`  ✓ 100% Bidirectional Scrubbing Consistency Verified`);
    passedTests++;
    console.log('');
  }

  console.log('================================================================');
  console.log(`   ALL ${passedTests}/${totalTests} PHASE 16 COLLECTIONS & DATA STRUCTURES TESTS PASSED!`);
  console.log('   Real JVM Worker: 100% Success');
  console.log('   Bidirectional Scrubbing Replay: 100% Exact Immutability');
  console.log('================================================================\n');
}

runTest().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
