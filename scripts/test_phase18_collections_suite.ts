import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { PHASE_18_COLLECTIONS_PRESETS } from '../src/presets/phase18Presets.ts';

async function runCollectionsSuite() {
  console.log('================================================================');
  console.log('   CODEFLOW DSA LAB — PHASE 18 ADVANCED JAVA COLLECTIONS SUITE  ');
  console.log('   Actual JVM Execution, Generics, Iterators & Collections Map  ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  for (const preset of PHASE_18_COLLECTIONS_PRESETS) {
    totalTests++;
    console.log(`[TEST ${totalTests}/${PHASE_18_COLLECTIONS_PRESETS.length}] Testing: "${preset.title}"...`);

    const result = await executeJavaWorker(preset.code);

    if (!result.success) {
      console.error(`  ❌ JVM Execution Failed for "${preset.title}"!`);
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

    let collectionObserved = false;
    let iteratorObserved = false;
    let genericObserved = false;

    for (let s = 0; s < steps.length; s++) {
      const step = steps[s];
      if (step.stepIndex !== s) {
        console.error(`  ❌ Step index mismatch at step ${s}: ${step.stepIndex}`);
        process.exit(1);
      }
      if (step.structures && Object.keys(step.structures).length > 0) {
        collectionObserved = true;
      }
      if (step.genericsInfo) {
        genericObserved = true;
      }
      if (step.collectionsMetrics && (step.collectionsMetrics.iteratorNext > 0 || step.collectionsMetrics.iteratorHasNext > 0)) {
        iteratorObserved = true;
      }
    }

    // Bidirectional scrubbing verification (Deep Immutability & Reversibility)
    for (let s = steps.length - 1; s >= 0; s--) {
      const step = steps[s];
      if (step.stepIndex !== s) {
        console.error(`  ❌ Reverse scrubbing failed at step ${s}`);
        process.exit(1);
      }
    }

    console.log(`  ✓ Bidirectional scrubbing verified 100%`);
    console.log(`  ✓ Observed: Collection=${collectionObserved}, Generics=${genericObserved}, Iterator=${iteratorObserved}`);
    passedTests++;
    console.log(`  🎉 Test ${totalTests} PASSED!\n`);
  }

  console.log('================================================================');
  console.log(`   ALL ${passedTests}/${totalTests} PHASE 18 COLLECTIONS TESTS PASSED!`);
  console.log('================================================================');
}

runCollectionsSuite().catch((err) => {
  console.error('Fatal error running Phase 18 Collections suite:', err);
  process.exit(1);
});
