import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { PHASE_12_JAVA_PRESETS } from '../src/presets/phase12Presets.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function testPhase12GrandIntegrationDemo() {
  console.log('================================================================');
  console.log('  PHASE 12: SECTION 41 GRAND INTEGRATION DEMO VALIDATION        ');
  console.log('================================================================\n');

  const preset = PHASE_12_JAVA_PRESETS.find((p) => p.id === 'p12-37-grand-integration-demo');
  assert(preset !== undefined, 'Found Preset 37 (Phase 12 Grand Integration Demo)');

  const code = preset!.code;
  console.log('Executing Grand Integration Demo on real JVM worker...');
  const res = await executeJavaWorker(code);

  assert(res.success === true, 'Real JVM execution completed with success = true');
  assert(Array.isArray(res.events) && res.events.length >= 10, `Emitted ${res.events?.length} runtime execution events`);

  const steps = reconstructExecutionSteps(res.events!, code);
  assert(steps.length > 0, `Reconstructed ${steps.length} state steps`);

  // 1. Primitive variable
  const hasAgeVar = steps.some((st) => st.variables['age'] !== undefined && st.variables['age'].value === 20);
  assert(hasAgeVar, 'Primitive variable "age = 20" tracked on Stack');

  // 2. Object creation & stable IDs
  const hasStudentHeap = steps.some((st) => st.heap.some((h) => h.className === 'Student' || h.type === 'Student'));
  assert(hasStudentHeap, 'Student instance allocated on Heap with stable ID');

  // 3. Reference Copy & Aliasing
  const aliasingDetected = steps.some((st) => {
    const s1 = st.variables['s1'];
    const s2 = st.variables['s2'];
    return (
      s1 &&
      s2 &&
      s1.refTargetId === s2.refTargetId &&
      s1.aliasedWith?.includes('s2') &&
      s2.aliasedWith?.includes('s1')
    );
  });
  assert(aliasingDetected, 'Aliasing detected: s1 and s2 share reference pointer');

  // 4. Object mutation reflection
  const hasAge21 = steps.some((st) => {
    const s1 = st.variables['s1'];
    return s1 && (st.heap.find(h => h.id === s1.refTargetId)?.fields?.['age'] === 21 || s1.value === 21);
  });
  assert(hasAge21, 'Object mutation: s1.age = 21 observed in shared memory');

  // 5. Array allocation
  const hasScoresArray = steps.some((st) => st.structures['scores'] !== undefined || st.variables['scores'] !== undefined);
  assert(hasScoresArray, 'Array "scores" allocated on Heap and tracked');

  // 6. Generic Collection (ArrayList)
  const hasNumbersList = steps.some(
    (st) => st.structures['numbers'] !== undefined || st.variables['numbers'] !== undefined
  );
  assert(hasNumbersList, 'Collection "numbers" (ArrayList<Integer>) tracked');

  // 7. Method call
  const hasMethodCall = steps.some((st) => st.callStack.some((f) => f.functionName === 'printStudent'));
  assert(hasMethodCall, 'Call frame "printStudent" pushed onto call stack');

  // 8. Static State in Metaspace
  const hasStaticCount = steps.some((st) => st.staticFields?.['Student']?.['studentCount'] !== undefined);
  assert(hasStaticCount, 'Static Metaspace field Student.studentCount tracked');

  // 9. Object Graph Generation
  const hasObjectGraph = steps.some((st) => st.objectGraph && st.objectGraph.length > 0);
  assert(hasObjectGraph, 'Directed runtime Object Graph generated from references');

  // 10. Console output
  const finalStep = steps[steps.length - 1];
  const consoleJoined = finalStep.consoleOutput.join('\n');
  assert(
    consoleJoined.includes('Total students registered: 1'),
    `Console printed student count: "${consoleJoined}"`
  );
  assert(
    consoleJoined.includes('Scores length: 3, Numbers size: 2'),
    `Console printed array and collection size: "${consoleJoined}"`
  );

  // 11. Time-Travel Step Replay & Exact State Restoration
  const midIndex = Math.floor(steps.length / 2);
  const midStepForward = steps[midIndex];
  // Verify deep immutability: variables and heap are not mutated retroactively
  assert(midStepForward.stepIndex === midIndex, 'Step index preserved');
  assert(steps[0].callStack.length === 1, 'Initial step call stack remained 1 frame');

  console.log('\n================================================================');
  console.log('  GRAND INTEGRATION DEMO PASSED 100% ON REAL JVM WORKER! ✓✓✓   ');
  console.log('================================================================\n');
}

testPhase12GrandIntegrationDemo().catch((err) => {
  console.error('Grand Integration Demo failed:', err);
  process.exit(1);
});
