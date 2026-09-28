import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';
import { ExecutionEvent } from '../src/types/execution.ts';
import { executeJavaWorker } from '../src/server/javaExecutor.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function runPhase8TestSuite() {
  console.log('================================================================');
  console.log('  PHASE 8: ADVANCED DSA & VISUALIZATION INTELLIGENCE TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Disjoint Set Union (DSU) & Path Compression Replay
  // -------------------------------------------------------------
  console.log('--- Test 1: DSU / Union-Find with Path Compression ---');
  const dsuEvents: ExecutionEvent[] = [
    { type: 'DSU_INIT', line: 1, structureId: 'dsu', variable: 'dsu', structureType: 'dsu', meta: { parents: { 0: '0', 1: '1', 2: '2', 3: '3' }, ranks: { 0: 0, 1: 0, 2: 0, 3: 0 } } },
    { type: 'DSU_UNION', line: 2, structureId: 'dsu', variable: 'dsu', meta: { u: 0, v: 1, rootU: 0, rootV: 1 } },
    { type: 'DSU_UNION', line: 3, structureId: 'dsu', variable: 'dsu', meta: { u: 1, v: 2, rootU: 0, rootV: 2 } },
    { type: 'DSU_FIND', line: 4, structureId: 'dsu', variable: 'dsu', meta: { node: 2, root: 0, path: [2, 1, 0] } },
  ];
  const dsuSteps = reconstructExecutionSteps(dsuEvents, '// DSU operations');
  assert(dsuSteps.length === 4, '4 steps generated for DSU');
  assert(dsuSteps[0].structures['dsu']?.dsuData !== undefined, 'DSU structure initialized');
  assert(dsuSteps[0].structures['dsu']?.dsuData?.parents[0] === '0', 'Parent of 0 is 0');
  assert(dsuSteps[1].structures['dsu']?.dsuData?.parents[1] === '0', 'Union(0,1): Parent of 1 updated to 0');
  assert(dsuSteps[2].structures['dsu']?.dsuData?.parents[2] === '0', 'Union(1,2): Parent of 2 updated to 0');
  assert(dsuSteps[3].structures['dsu']?.dsuData?.activeSet1 === '2', 'Active find node 2 marked');
  assert(dsuSteps[3].structures['dsu']?.dsuData?.pathCompressed?.length === 3, 'Path compression tracked 3 nodes [2, 1, 0]');

  // Backward Scrubbing verification
  assert(dsuSteps[0].structures['dsu']?.dsuData?.parents[1] === '1', 'Replay: Before step 2, parent of 1 is still 1');

  // -------------------------------------------------------------
  // TEST 2: Bit Manipulation Registers & Gates
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Bit Manipulation Registers & Operations ---');
  const bitEvents: ExecutionEvent[] = [
    { type: 'BIT_OP_EXECUTE', line: 5, variable: 'c', structureType: 'bits', meta: { operandA: 12, operandB: 10, operator: '&', result: 8 } },
    { type: 'BIT_SHIFT', line: 6, variable: 'c', structureType: 'bits', meta: { operandA: 8, shift: 1, operator: '<<', result: 16 } },
    { type: 'BIT_POWER_OF_TWO', line: 7, structureType: 'bits', meta: { val: 16, result: 1 } },
    { type: 'BIT_COUNT', line: 8, structureType: 'bits', meta: { val: 16, result: 1 } },
  ];
  const bitSteps = reconstructExecutionSteps(bitEvents, '// Bit operations');
  assert(bitSteps.length === 4, '4 steps generated for bit manipulation');
  const bitSt1 = bitSteps[0].structures['c']?.bitData;
  assert(bitSt1 !== undefined, 'Bit structure initialized');
  assert(bitSt1?.operandA === 12 && bitSt1?.operandB === 10 && bitSt1?.operator === '&' && bitSt1?.result === 8, 'Bitwise AND: 12 & 10 = 8');
  assert(bitSteps[0].algorithmState?.bitResult === 8, 'Algorithm state bitResult recorded');
  const bitSt2 = bitSteps[1].structures['c']?.bitData;
  assert(bitSt2?.operator === '<<' && bitSt2?.result === 16, 'Bit shift: 8 << 1 = 16');

  // -------------------------------------------------------------
  // TEST 3: String Visualization, KMP & Rabin-Karp
  // -------------------------------------------------------------
  console.log('\n--- Test 3: String Visualization, KMP & Rabin-Karp ---');
  const strEvents: ExecutionEvent[] = [
    { type: 'STRING_TRAVERSE', line: 10, variable: 'text', structureId: 'text', structureType: 'string', index: 0, char: 'A', meta: { text: 'ABABAC' } },
    { type: 'KMP_LPS_UPDATE', line: 11, structureId: 'pattern', values: [0, 0, 1, 2] },
    { type: 'KMP_STEP', line: 12, indices: [2, 1], conditionResult: true, meta: { text: 'ABABAC', pattern: 'ABAC' } },
    { type: 'KMP_FALLBACK', line: 13, fromIndex: 2, toIndex: 0 },
    { type: 'RABIN_KARP_HASH', line: 14, index: 0, conditionResult: false, meta: { text: 'ABABAC', pattern: 'ABAC', patternHash: 1234, windowHash: 5678 } },
    { type: 'CHAR_FREQUENCY_UPDATE', line: 15, meta: { frequencies: { 'A': 3, 'B': 2, 'C': 1 } } },
  ];
  const strSteps = reconstructExecutionSteps(strEvents, '// String KMP');
  assert(strSteps.length === 6, '6 steps generated for string algorithms');
  assert(strSteps[0].structures['text']?.stringData?.activeIndex === 0, 'String traverse activeIndex is 0');
  assert(strSteps[1].algorithmState?.kmpLps?.[2] === 1, 'KMP LPS array updated: lps[2]=1');
  assert(strSteps[2].algorithmState?.stringJ === 1, 'KMP stringJ is 1');
  assert(strSteps[3].algorithmState?.stringJ === 0, 'KMP fallback pointer j reset to 0');
  assert(strSteps[4].algorithmState?.rabinWindowHash === 5678, 'Rabin-Karp window hash recorded as 5678');
  assert(strSteps[5].algorithmState?.charFrequencies?.['A'] === 3, 'Character A frequency recorded as 3');

  // -------------------------------------------------------------
  // TEST 4: Number Algorithms (GCD, Sieve, Fast Exponentiation)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Number Algorithms ---');
  const numEvents: ExecutionEvent[] = [
    { type: 'GCD_STEP', line: 20, structureType: 'number', meta: { a: 48, b: 18, remainder: 12 } },
    { type: 'GCD_STEP', line: 21, structureType: 'number', meta: { a: 18, b: 12, remainder: 6 } },
    { type: 'GCD_STEP', line: 22, structureType: 'number', meta: { a: 12, b: 6, remainder: 0 } },
    { type: 'SIEVE_START', line: 23, structureType: 'number', meta: { maxN: 10 } },
    { type: 'SIEVE_COMPOSITE_CROSS', line: 24, structureType: 'number', index: 4, meta: { prime: 2, composite: 4 } },
    { type: 'FAST_POWER_STEP', line: 25, structureType: 'number', meta: { base: 2, exp: 5, result: 32 } },
  ];
  const numSteps = reconstructExecutionSteps(numEvents, '// Number algorithms');
  assert(numSteps.length === 6, '6 steps generated for number algorithms');
  assert(numSteps[0].structures['gcd']?.numberData?.a === 48, 'GCD step 1: a=48');
  assert(numSteps[2].algorithmState?.gcdRemainder === 0, 'GCD step 3: remainder=0');
  assert(numSteps[4].structures['sieve']?.numberData?.sieveGrid?.[4] === false, 'Sieve crossed composite 4');
  assert(numSteps[4].structures['sieve']?.numberData?.sieveGrid?.[2] === true, 'Sieve kept prime 2 as true');
  assert(numSteps[5].algorithmState?.fastPowerResult === 32, 'Fast power result accumulator 32');

  // -------------------------------------------------------------
  // TEST 5: Segment Tree & Fenwick Tree (BIT)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Segment Tree & Fenwick Tree ---');
  const treeEvents: ExecutionEvent[] = [
    { type: 'SEG_TREE_UPDATE', line: 30, structureId: 'segTree', structureType: 'segmenttree', index: 2, newValue: 10, rangeStart: 0, rangeEnd: 7, meta: { treeIdx: 1 } },
    { type: 'FENWICK_UPDATE', line: 31, structureId: 'bitTree', structureType: 'fenwick', index: 3, newValue: 5 },
    { type: 'FENWICK_QUERY', line: 32, structureId: 'bitTree', structureType: 'fenwick', index: 3, value: 15 },
  ];
  const treeSteps = reconstructExecutionSteps(treeEvents, '// Segment and Fenwick');
  assert(treeSteps.length === 3, '3 steps generated for advanced trees');
  assert(treeSteps[0].structures['segTree']?.segmentTreeData?.activeRange?.[0] === 0, 'Segment tree active range start is 0');
  assert(treeSteps[0].structures['segTree']?.segmentTreeData?.activeRange?.[1] === 7, 'Segment tree active range end is 7');
  assert(treeSteps[1].structures['bitTree']?.fenwickData?.treeArray?.[3] === 5, 'Fenwick tree index 3 value is 5');
  assert(treeSteps[2].algorithmState?.fenwickPrefixSum === 15, 'Fenwick prefix query sum is 15');

  // -------------------------------------------------------------
  // TEST 6: Object Aliasing & Synchronized State Replay
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Object Aliasing & Synchronized State Replay ---');
  const aliasEvents: ExecutionEvent[] = [
    { type: 'ARRAY_CREATE', line: 40, variable: 'a', structureId: 'arr_1', values: [1, 2, 3] },
    { type: 'VARIABLE_CREATE', line: 41, variable: 'b', dataType: 'int[]', value: 'int[3]@1', refTargetId: 'arr_1' },
    { type: 'ARRAY_UPDATE', line: 42, variable: 'b', structureId: 'arr_1', index: 0, newValue: 99 },
  ];
  const aliasSteps = reconstructExecutionSteps(aliasEvents, '// Aliasing');
  assert(aliasSteps.length === 3, '3 steps for aliasing');
  const lastAlias = aliasSteps[2];
  assert(lastAlias.structures['arr_1']?.arrayData?.[0] === 99, 'Heap array arr_1 mutated index 0 to 99');
  assert(lastAlias.variables['a']?.value === '[99, 2, 3]', 'Variable a reflected mutation: [99, 2, 3]');
  assert(lastAlias.variables['b']?.value === '[99, 2, 3]', 'Variable b reflected mutation: [99, 2, 3]');

  // Replay backward check
  assert(aliasSteps[1].variables['a']?.value === '[1, 2, 3]', 'Replay step 2: Variable a was still [1, 2, 3]');

  // -------------------------------------------------------------
  // TEST 7: Educational Intelligence Causality & Confidence
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Educational Intelligence Causality & Confidence ---');
  const eduEvents: ExecutionEvent[] = [
    { type: 'VARIABLE_CREATE', line: 50, variable: 'x', dataType: 'int', value: 5 },
    { type: 'VARIABLE_UPDATE', line: 51, variable: 'x', dataType: 'int', oldValue: 5, newValue: 10 },
  ];
  const eduSteps = reconstructExecutionSteps(eduEvents, 'x = 5;\nx = 10;');
  assert(eduSteps[1].algorithmState?.whyChanged !== undefined, 'Why-changed causality generated');
  assert(eduSteps[1].algorithmState?.whyChanged?.target === 'x', 'Why-changed points to x');
  assert(eduSteps[1].algorithmState?.whyChanged?.previousValue === 5 && eduSteps[1].algorithmState?.whyChanged?.newValue === 10, 'Why-changed captured 5 -> 10 transition');
  assert(eduSteps[1].algorithmState?.detectionConfidence === 'RUNTIME_STATE', 'Confidence is conservative RUNTIME_STATE');
  assert(eduSteps[1].algorithmState?.confidencePercent === 100, 'Confidence percent is 100%');

  // -------------------------------------------------------------
  // TEST 8: Actual JVM Execution of Phase 8 Arbitrary Java Program
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Actual JVM Execution of Arbitrary Java Program with Collections & Aliasing ---');
  const p8Code = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Bit manipulation
        int x = 5;
        int y = 3;
        int z = x & y;

        // GCD
        int a = 24, b = 9;
        while (b != 0) {
            int rem = a % b;
            a = b;
            b = rem;
        }

        // Aliasing
        int[] arr1 = {10, 20, 30};
        int[] arr2 = arr1;
        arr2[0] = 99;

        // Nested collections
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < 3; i++) graph.add(new ArrayList<>());
        graph.get(0).add(1);
        graph.get(0).add(2);
    }
}`;
  const res = await executeJavaWorker(p8Code);
  assert(res.success, 'JVM execution succeeded for Phase 8 arbitrary program');
  assert((res.events?.length ?? 0) > 15, `Emitted rich event trace: ${res.events?.length} events`);
  const steps = reconstructExecutionSteps(res.events!, p8Code);
  const finalStep = steps[steps.length - 1];
  assert(finalStep.variables['z']?.value === 1, 'z = 5 & 3 = 1 evaluated');
  assert(finalStep.variables['a']?.value === 3, 'GCD(24, 9) = 3 evaluated');
  assert(finalStep.structures['arr1']?.arrayData?.[0] === 99, 'arr1[0] mutated to 99');

  console.log('\n================================================================');
  console.log('  🎉 ALL PHASE 8 TESTS PASSED DETERMINISTICALLY WITH 0 REGRESSIONS!');
  console.log('================================================================\n');
}

runPhase8TestSuite().catch((err) => {
  console.error('Fatal error in Phase 8 tests:', err);
  process.exit(1);
});
