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

console.log('================================================================');
console.log('  PHASE 5: CORE DSA ALGORITHMS & PATTERNS REDUCER & REPLAY VERIFICATION');
console.log('================================================================\n');

// ==============================================================
// TEST 1: Linear Search Events & Backward Replay
// ==============================================================
console.log('--- Test 1: Linear Search Events & Step Replay ---');
const linearSearchEvents: ExecutionEvent[] = [
  { type: 'ARRAY_INIT', line: 1, structureId: 'arr-1', variable: 'arr', elements: [10, 20, 30, 40, 50] },
  { type: 'LINEAR_SEARCH_START', line: 2, structureId: 'arr-1', target: 40 },
  { type: 'LINEAR_SEARCH_ACCESS', line: 3, structureId: 'arr-1', index: 0, value: 10 },
  { type: 'LINEAR_SEARCH_COMPARE', line: 3, structureId: 'arr-1', index: 0, value: 10, target: 40, result: false },
  { type: 'LINEAR_SEARCH_ACCESS', line: 4, structureId: 'arr-1', index: 1, value: 20 },
  { type: 'LINEAR_SEARCH_COMPARE', line: 4, structureId: 'arr-1', index: 1, value: 20, target: 40, result: false },
  { type: 'LINEAR_SEARCH_ACCESS', line: 5, structureId: 'arr-1', index: 2, value: 30 },
  { type: 'LINEAR_SEARCH_COMPARE', line: 5, structureId: 'arr-1', index: 2, value: 30, target: 40, result: false },
  { type: 'LINEAR_SEARCH_ACCESS', line: 6, structureId: 'arr-1', index: 3, value: 40 },
  { type: 'LINEAR_SEARCH_COMPARE', line: 6, structureId: 'arr-1', index: 3, value: 40, target: 40, result: true },
  { type: 'LINEAR_SEARCH_MATCH', line: 7, structureId: 'arr-1', index: 3, value: 40 },
  { type: 'LINEAR_SEARCH_END', line: 8, structureId: 'arr-1', found: true, index: 3 },
];

const lsSteps = reconstructExecutionSteps(linearSearchEvents, '// Linear Search');
assert(lsSteps.length === 12, '12 execution steps generated for Linear Search');
assert(lsSteps[1].algorithmState?.algorithmName === 'Linear Search', 'Algorithm recognized as Linear Search');
assert(lsSteps[3].algorithmState?.metrics.comparisons === 1, 'Step 4: 1 comparison recorded');
assert(lsSteps[9].algorithmState?.metrics.comparisons === 4, 'Step 10: 4 comparisons recorded');
assert(lsSteps[10].algorithmState?.searchResult === 'FOUND', 'Step 11: searchResult matches FOUND');
assert(lsSteps[10].algorithmState?.foundIndex === 3, 'Step 11: foundIndex is 3');
assert(lsSteps[11].algorithmState?.status === 'Completed (Found)', 'Step 12: completed');

// Backward step replay verification
console.log('Verifying Backward Replay for Linear Search:');
assert(lsSteps[9].algorithmState?.searchResult === 'SEARCHING', 'Replay step 10: not yet marked found');
assert(lsSteps[7].algorithmState?.metrics.comparisons === 3, 'Replay step 8: exactly 3 comparisons preserved');
assert(lsSteps[1].algorithmState?.metrics.comparisons === 0, 'Replay step 2: 0 comparisons');

// ==============================================================
// TEST 2: Binary Search Events & Range Updates
// ==============================================================
console.log('\n--- Test 2: Binary Search Events & Range Updates ---');
const binarySearchEvents: ExecutionEvent[] = [
  { type: 'ARRAY_INIT', line: 1, structureId: 'arr-1', variable: 'arr', elements: [10, 20, 30, 40, 50, 60, 70] },
  { type: 'BINARY_SEARCH_START', line: 2, structureId: 'arr-1', target: 50 },
  { type: 'BINARY_SEARCH_RANGE', line: 3, structureId: 'arr-1', low: 0, high: 6 },
  { type: 'BINARY_SEARCH_MID', line: 4, structureId: 'arr-1', mid: 3, value: 40 },
  { type: 'BINARY_SEARCH_COMPARE', line: 5, structureId: 'arr-1', mid: 3, value: 40, target: 50, comparison: '<' },
  { type: 'BINARY_SEARCH_RANGE_UPDATE', line: 6, structureId: 'arr-1', low: 4, high: 6 },
  { type: 'BINARY_SEARCH_MID', line: 7, structureId: 'arr-1', mid: 5, value: 60 },
  { type: 'BINARY_SEARCH_COMPARE', line: 8, structureId: 'arr-1', mid: 5, value: 60, target: 50, comparison: '>' },
  { type: 'BINARY_SEARCH_RANGE_UPDATE', line: 9, structureId: 'arr-1', low: 4, high: 4 },
  { type: 'BINARY_SEARCH_MID', line: 10, structureId: 'arr-1', mid: 4, value: 50 },
  { type: 'BINARY_SEARCH_COMPARE', line: 11, structureId: 'arr-1', mid: 4, value: 50, target: 50, comparison: '==' },
  { type: 'BINARY_SEARCH_FOUND', line: 12, structureId: 'arr-1', index: 4, value: 50 },
  { type: 'BINARY_SEARCH_END', line: 13, structureId: 'arr-1', found: true, index: 4 },
];

const bsSteps = reconstructExecutionSteps(binarySearchEvents, '// Binary Search');
assert(bsSteps.length === 13, '13 execution steps for Binary Search');
assert(bsSteps[2].algorithmState?.searchLow === 0 && bsSteps[2].algorithmState?.searchHigh === 6, 'Step 3: Low=0, High=6');
assert(bsSteps[3].algorithmState?.searchMid === 3, 'Step 4: Mid=3');
assert(bsSteps[5].algorithmState?.searchLow === 4 && bsSteps[5].algorithmState?.searchHigh === 6, 'Step 6: Range updated to 4..6');
assert(bsSteps[11].algorithmState?.searchResult === 'FOUND', 'Step 12: Target found');
assert(bsSteps[11].algorithmState?.foundIndex === 4, 'Step 12: Target found at index 4');

// Backward check
assert(bsSteps[5].algorithmState?.searchLow === 4, 'Replay step 6 has low=4');
assert(bsSteps[2].algorithmState?.searchLow === 0, 'Replay step 3 has low=0');
assert(bsSteps[1].algorithmState?.searchMid === undefined, 'Replay step 2 mid is undefined');

// ==============================================================
// TEST 3: Sorting (Bubble, Quick, Swaps, Comparisons)
// ==============================================================
console.log('\n--- Test 3: Sorting Events (Bubble & Quick Sort) ---');
const sortEvents: ExecutionEvent[] = [
  { type: 'ARRAY_INIT', line: 1, structureId: 'arr-1', variable: 'arr', elements: [5, 2, 8, 1] },
  { type: 'SORT_START', line: 2, structureId: 'arr-1', algorithmName: 'Bubble Sort' },
  { type: 'SORT_COMPARE', line: 3, structureId: 'arr-1', indices: [0, 1], values: [5, 2] },
  { type: 'SORT_SWAP', line: 4, structureId: 'arr-1', indices: [0, 1], values: [2, 5] },
  { type: 'SORT_COMPARE', line: 5, structureId: 'arr-1', indices: [1, 2], values: [5, 8] },
  { type: 'SORT_COMPARE', line: 6, structureId: 'arr-1', indices: [2, 3], values: [8, 1] },
  { type: 'SORT_SWAP', line: 7, structureId: 'arr-1', indices: [2, 3], values: [1, 8] },
  { type: 'SORT_COMPLETE', line: 8, structureId: 'arr-1' },
];

const sortSteps = reconstructExecutionSteps(sortEvents, '// Bubble Sort');
assert(sortSteps[1].algorithmState?.algorithmName === 'Bubble Sort', 'Algorithm name is Bubble Sort');
assert(sortSteps[2].algorithmState?.metrics.comparisons === 1, '1 comparison at step 3');
assert(sortSteps[3].algorithmState?.metrics.swaps === 1, '1 swap at step 4');
assert(sortSteps[6].algorithmState?.metrics.swaps === 2, '2 swaps at step 7');
assert(sortSteps[6].algorithmState?.metrics.comparisons === 3, '3 comparisons at step 7');
assert(sortSteps[7].algorithmState?.phase === 'Sorted' || sortSteps[7].algorithmState?.status === 'Completed', 'Sort marked complete');

// Backward step replay verification
assert(sortSteps[3].algorithmState?.metrics.swaps === 1, 'Replay step 4 has 1 swap');
assert(sortSteps[2].algorithmState?.metrics.swaps === 0, 'Replay step 3 has 0 swaps');

// ==============================================================
// TEST 4: Array Patterns (Two Pointers, Sliding Window, Kadane)
// ==============================================================
console.log('\n--- Test 4: Array Patterns (Sliding Window & Kadane) ---');
const patternEvents: ExecutionEvent[] = [
  { type: 'ARRAY_INIT', line: 1, structureId: 'arr-1', variable: 'arr', elements: [2, 1, 5, 1, 3, 2] },
  { type: 'WINDOW_START', line: 2, structureId: 'arr-1', start: 0, end: 2, currentSum: 8 },
  { type: 'WINDOW_EXPAND', line: 3, structureId: 'arr-1', newEnd: 3, addedValue: 1, currentSum: 9 },
  { type: 'WINDOW_SHRINK', line: 4, structureId: 'arr-1', newStart: 1, removedValue: 2, currentSum: 7 },
  { type: 'WINDOW_RESULT', line: 5, structureId: 'arr-1', bestValue: 9 },
  { type: 'WINDOW_END', line: 6, structureId: 'arr-1' },
];

const winSteps = reconstructExecutionSteps(patternEvents, '// Window');
assert(winSteps[1].algorithmState?.windowStart === 0 && winSteps[1].algorithmState?.windowEnd === 2, 'Window initialized 0..2');
assert(winSteps[2].algorithmState?.windowEnd === 3, 'Window expanded to end=3');
assert(winSteps[2].algorithmState?.windowSum === 9, 'Window sum is 9');
assert(winSteps[3].algorithmState?.windowStart === 1, 'Window shrunk to start=1');
assert(winSteps[4].algorithmState?.windowBest === 9, 'Best value recorded as 9');

// Kadane test
const kadaneEvents: ExecutionEvent[] = [
  { type: 'ARRAY_INIT', line: 1, structureId: 'arr-1', variable: 'arr', elements: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  { type: 'KADANE_START', line: 2, structureId: 'arr-1', initialSum: -2 },
  { type: 'KADANE_UPDATE', line: 3, structureId: 'arr-1', currentIndex: 1, currentSum: 1, element: 1 },
  { type: 'KADANE_BEST_UPDATE', line: 4, structureId: 'arr-1', bestSum: 1, bestStart: 1, bestEnd: 1 },
  { type: 'KADANE_UPDATE', line: 5, structureId: 'arr-1', currentIndex: 2, currentSum: -2, element: -3 },
  { type: 'KADANE_UPDATE', line: 6, structureId: 'arr-1', currentIndex: 3, currentSum: 4, element: 4 },
  { type: 'KADANE_BEST_UPDATE', line: 7, structureId: 'arr-1', bestSum: 4, bestStart: 3, bestEnd: 3 },
  { type: 'KADANE_END', line: 8, structureId: 'arr-1', maxSubarraySum: 6, bestStart: 3, bestEnd: 6 },
];

const kadaneSteps = reconstructExecutionSteps(kadaneEvents, '// Kadane');
assert(kadaneSteps[2].algorithmState?.kadaneCurrentSum === 1, 'Kadane currentSum is 1');
assert(kadaneSteps[3].algorithmState?.kadaneBestSum === 1, 'Kadane bestSum is 1');
assert(kadaneSteps[6].algorithmState?.kadaneBestSum === 4, 'Kadane bestSum updated to 4');
assert(kadaneSteps[7].algorithmState?.kadaneBestSum === 6, 'Kadane maxSubarraySum is 6');

// ==============================================================
// TEST 5: Recursion Tree & Call Stack
// ==============================================================
console.log('\n--- Test 5: Recursion Tree & Call Stack ---');
const recursionEvents: ExecutionEvent[] = [
  { type: 'RECURSION_START', line: 1, functionName: 'fib', args: { n: 4 } },
  { type: 'RECURSION_CALL', line: 2, callId: 'fib(4)', callerId: undefined, functionName: 'fib', args: { n: 4 }, depth: 0 },
  { type: 'RECURSION_CALL', line: 3, callId: 'fib(3)', callerId: 'fib(4)', functionName: 'fib', args: { n: 3 }, depth: 1 },
  { type: 'RECURSION_BASE_CASE', line: 4, callId: 'fib(1)', functionName: 'fib', args: { n: 1 }, returnValue: 1 },
  { type: 'RECURSION_RETURN', line: 5, callId: 'fib(3)', functionName: 'fib', returnValue: 2 },
  { type: 'RECURSION_RETURN', line: 6, callId: 'fib(4)', functionName: 'fib', returnValue: 3 },
  { type: 'RECURSION_END', line: 7, functionName: 'fib', finalResult: 3 },
];

const recSteps = reconstructExecutionSteps(recursionEvents, '// Recursion');
assert(Object.keys(recSteps[1].algorithmState?.recursionTree || {}).length === 1, 'Recursion root fib(4) present');
assert(Object.keys(recSteps[2].algorithmState?.recursionTree || {}).length === 2, 'Recursion node fib(3) added');
assert(recSteps[3].algorithmState?.phase === 'Base Case Reached', 'Base case recorded');
assert(recSteps[4].algorithmState?.recursionTree?.['fib(3)']?.returnValue === 2, 'fib(3) return value 2 recorded');
assert(recSteps[5].algorithmState?.recursionTree?.['fib(4)']?.returnValue === 3, 'fib(4) return value 3 recorded');

// Backward check
assert(recSteps[2].algorithmState?.recursionTree?.['fib(3)']?.returnValue === undefined, 'Replay step 3: fib(3) return value is undefined');
assert(Object.keys(recSteps[1].algorithmState?.recursionTree || {}).length === 1, 'Replay step 2: only root node exists');

// ==============================================================
// TEST 6: Backtracking (Choice, Explore, Success, Failure, Undo)
// ==============================================================
console.log('\n--- Test 6: Backtracking Events & Undo ---');
const backtrackEvents: ExecutionEvent[] = [
  { type: 'BACKTRACK_START', line: 1, problemName: 'Subsets' },
  { type: 'BACKTRACK_CHOICE', line: 2, choice: 'Include 1', depth: 0, currentState: [1] },
  { type: 'BACKTRACK_ENTER', line: 3, path: '[1]', depth: 1 },
  { type: 'BACKTRACK_SUCCESS', line: 4, solution: '[1]' },
  { type: 'BACKTRACK_UNDO', line: 5, choice: 'Include 1', restoredState: [] },
  { type: 'BACKTRACK_RETURN', line: 6, depth: 0 },
  { type: 'BACKTRACK_END', line: 7, totalSolutions: 1 },
];

const btSteps = reconstructExecutionSteps(backtrackEvents, '// Backtrack');
assert(btSteps[1].algorithmState?.currentChoice === 'Include 1', 'Step 2: currentChoice recorded');
assert(btSteps[3].algorithmState?.status === 'Found Solution: [1]', 'Step 4: 1 solution found');
assert(btSteps[4].algorithmState?.phase === 'Undo / Backtrack', 'Step 5: undo phase set');
assert(btSteps[6].algorithmState?.status === 'Completed. Total Solutions: 1', 'Step 7: totalSolutions preserved');

// ==============================================================
// TEST 7: Dynamic Programming (Tabulation & Memoization)
// ==============================================================
console.log('\n--- Test 7: Dynamic Programming (Tabulation & Memoization) ---');
const dpEvents: ExecutionEvent[] = [
  { type: 'DP_START', line: 1, dpType: 'tabulation', stateDimensions: '1D', dimensions: [6] },
  { type: 'DP_BASE_CASE', line: 2, stateKey: '0', value: 0 },
  { type: 'DP_BASE_CASE', line: 3, stateKey: '1', value: 1 },
  { type: 'DP_TRANSITION', line: 4, stateKey: '2', previousStates: ['0', '1'], transitionFormula: 'dp[2] = dp[1] + dp[0]' },
  { type: 'DP_STATE_UPDATE', line: 5, stateKey: '2', value: 1 },
  { type: 'DP_TRANSITION', line: 6, stateKey: '3', previousStates: ['1', '2'], transitionFormula: 'dp[3] = dp[2] + dp[1]' },
  { type: 'DP_STATE_UPDATE', line: 7, stateKey: '3', value: 2 },
  { type: 'DP_CACHE_HIT', line: 8, stateKey: '2', cachedValue: 1 },
  { type: 'DP_CACHE_MISS', line: 9, stateKey: '4' },
  { type: 'DP_END', line: 10, finalAnswer: 2 },
];

const dpSteps = reconstructExecutionSteps(dpEvents, '// DP');
assert(dpSteps[0].algorithmState?.dpType === 'TABULATION_1D', 'DP type recognized as tabulation 1D');
assert(dpSteps[1].algorithmState?.dpTable1D?.[0] === 0, 'Base case dp[0] = 0');
assert(dpSteps[2].algorithmState?.dpTable1D?.[1] === 1, 'Base case dp[1] = 1');
assert(dpSteps[3].algorithmState?.dpTransitionFormula === 'dp[2] = dp[1] + dp[0]', 'Transition formula recorded');
assert(dpSteps[4].algorithmState?.dpTable1D?.[2] === 1, 'dp[2] set to 1');
assert(dpSteps[6].algorithmState?.dpTable1D?.[3] === 2, 'dp[3] set to 2');
assert(dpSteps[7].algorithmState?.memoEntries?.some(m => m.status === 'HIT'), '1 cache hit recorded');
assert(dpSteps[8].algorithmState?.memoEntries?.some(m => m.status === 'MISS'), '1 cache miss recorded');
assert(dpSteps[9].algorithmState?.status === 'DP Solved. Final Answer: 2', 'Final answer is 2');

// Replay backward test for DP
assert(dpSteps[4].algorithmState?.dpTable1D?.[2] === 1, 'Replay step 5 has dp[2] = 1');
assert(dpSteps[3].algorithmState?.dpTable1D?.[2] === 0 || dpSteps[3].algorithmState?.dpTable1D?.[2] === null || dpSteps[3].algorithmState?.dpTable1D?.[2] === undefined, 'Replay step 4 has dp[2] unpopulated (value 0)');

console.log('\n================================================================');
console.log('  ALL PHASE 5 REDUCER & REPLAY TESTS PASSED PERFECTLY (100%)');
console.log('================================================================');
