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
console.log('  PHASE 7: ADVANCED DYNAMIC PROGRAMMING REDUCER & REPLAY TESTS');
console.log('================================================================\n');

// ==============================================================
// TEST 1: 0/1 Knapsack & Table Updates with Step Replay
// ==============================================================
console.log('--- Test 1: 0/1 Knapsack Events & Step Replay ---');
const knapsackEvents: ExecutionEvent[] = [
  { type: 'KNAPSACK_START', line: 1, structureId: 'dp_knapsack', items: [{ weight: 1, value: 15 }, { weight: 3, value: 20 }, { weight: 4, value: 30 }], capacity: 4 },
  { type: 'DP_TABLE_CREATE', line: 2, structureId: 'dp_knapsack', dimensions: [4, 5], rowLabels: ['item 0', 'item 1', 'item 2', 'item 3'], colLabels: ['0', '1', '2', '3', '4'] },
  { type: 'KNAPSACK_ITEM_SELECT', line: 3, structureId: 'dp_knapsack', itemIndex: 1, weight: 1, value: 15 },
  { type: 'KNAPSACK_CAPACITY_SELECT', line: 4, structureId: 'dp_knapsack', capacity: 1 },
  { type: 'KNAPSACK_FIT_CHECK', line: 5, structureId: 'dp_knapsack', fit: true, weight: 1, capacity: 1 },
  { type: 'KNAPSACK_EXCLUDE', line: 6, structureId: 'dp_knapsack', value: 0 },
  { type: 'KNAPSACK_INCLUDE', line: 7, structureId: 'dp_knapsack', value: 15 },
  { type: 'KNAPSACK_COMPARE', line: 8, structureId: 'dp_knapsack', candidateValue: 15, value: 0, status: 'INCLUDE' },
  { type: 'KNAPSACK_STATE_UPDATE', line: 9, structureId: 'dp_knapsack', itemIndex: 1, capacity: 1, newValue: 15 },
  { type: 'DP_TABLE_UPDATE', line: 10, structureId: 'dp_knapsack', indices: [1, 1], newValue: 15, formula: 'max(0, 15)' },
  { type: 'KNAPSACK_END', line: 11, structureId: 'dp_knapsack', value: 35 },
];

const ksSteps = reconstructExecutionSteps(knapsackEvents, '// 0/1 Knapsack');
assert(ksSteps.length === 11, '11 execution steps for Knapsack');
assert(ksSteps[0].algorithmState?.algorithmName === '0/1 Knapsack', 'Recognized as 0/1 Knapsack');
assert(ksSteps[0].algorithmState?.knapsackCapacity === 4, 'Knapsack capacity initialized to 4');
assert(ksSteps[2].algorithmState?.knapsackCurrentItem === 1, 'Item 1 selected');
assert(ksSteps[2].algorithmState?.knapsackItems?.[1]?.value === 15, 'Item 1 selected with value 15');
assert(ksSteps[4].algorithmState?.knapsackFit === true, 'Fit check evaluated true');
assert(ksSteps[7].algorithmState?.knapsackDecision === 'INCLUDE', 'Decision is INCLUDE');
assert(ksSteps[8].algorithmState?.dpCellStatus?.['1,1'] === 'UPDATED', 'Cell 1,1 marked UPDATED');
assert(ksSteps[9].algorithmState?.dpTable2D?.[1]?.[1] === 15, 'DP table 1,1 updated to 15');

// Backward step replay verification
console.log('Verifying Backward Replay for 0/1 Knapsack:');
assert(ksSteps[7].algorithmState?.dpCellStatus?.['1,1'] === undefined, 'Replay Step 8: cell 1,1 was not yet updated before Step 9');
assert(ksSteps[1].algorithmState?.knapsackCurrentItem === undefined, 'Replay Step 2: no item selected yet');

// ==============================================================
// TEST 2: Unbounded Knapsack
// ==============================================================
console.log('\n--- Test 2: Unbounded Knapsack ---');
const unboundedEvents: ExecutionEvent[] = [
  { type: 'UNBOUNDED_KNAPSACK_START', line: 1, structureId: 'dp_unbounded', capacity: 8 },
  { type: 'UNBOUNDED_ITEM_SELECT', line: 2, structureId: 'dp_unbounded', itemIndex: 0, weight: 2, value: 10 },
  { type: 'UNBOUNDED_CAPACITY_SELECT', line: 3, structureId: 'dp_unbounded', capacity: 4 },
  { type: 'UNBOUNDED_FIT_CHECK', line: 4, structureId: 'dp_unbounded', fit: true, weight: 2, capacity: 4 },
  { type: 'UNBOUNDED_INCLUDE', line: 5, structureId: 'dp_unbounded', value: 20 },
  { type: 'UNBOUNDED_EXCLUDE', line: 6, structureId: 'dp_unbounded', value: 0 },
  { type: 'UNBOUNDED_COMPARE', line: 7, structureId: 'dp_unbounded', candidateValue: 20, value: 0 },
  { type: 'UNBOUNDED_STATE_UPDATE', line: 8, structureId: 'dp_unbounded', capacity: 4, newValue: 20 },
  { type: 'UNBOUNDED_END', line: 9, structureId: 'dp_unbounded', value: 40 },
];

const ubSteps = reconstructExecutionSteps(unboundedEvents, '// Unbounded Knapsack');
assert(ubSteps.length === 9, '9 steps for Unbounded Knapsack');
assert(ubSteps[0].algorithmState?.algorithmName === 'Unbounded Knapsack', 'Algorithm name is Unbounded Knapsack');
assert(ubSteps[6].algorithmState?.knapsackIncludeVal === 20, 'Include val evaluated to 20');
assert(ubSteps[7].algorithmState?.dpCellStatus?.['4'] === 'UPDATED', '1D DP index 4 marked UPDATED');

// ==============================================================
// TEST 3: Coin Change (Min Coins & Number of Ways)
// ==============================================================
console.log('\n--- Test 3: Coin Change ---');
const coinEvents: ExecutionEvent[] = [
  { type: 'COIN_CHANGE_START', line: 1, structureId: 'dp_coins', coins: [1, 2, 5], amount: 5, algorithmId: 'Coin Change — Minimum Coins' },
  { type: 'COIN_AMOUNT_SELECT', line: 2, structureId: 'dp_coins', amount: 3 },
  { type: 'COIN_SELECT', line: 3, structureId: 'dp_coins', coin: 2 },
  { type: 'COIN_FIT_CHECK', line: 4, structureId: 'dp_coins', fit: true, coin: 2, amount: 3 },
  { type: 'COIN_CANDIDATE', line: 5, structureId: 'dp_coins', candidateValue: 2, dependencies: ['dp[1]'] },
  { type: 'COIN_COMPARE', line: 6, structureId: 'dp_coins', candidateValue: 2, oldValue: 3 },
  { type: 'COIN_STATE_UPDATE', line: 7, structureId: 'dp_coins', amount: 3, newValue: 2 },
  { type: 'COIN_CHANGE_END', line: 8, structureId: 'dp_coins', result: 2 },
];

const coinSteps = reconstructExecutionSteps(coinEvents, '// Coin Change');
assert(coinSteps.length === 8, '8 steps for Coin Change');
assert(coinSteps[0].algorithmState?.algorithmName === 'Coin Change — Minimum Coins', 'Correct Coin Change variant recognized');
assert(coinSteps[2].algorithmState?.currentCoin === 2, 'Coin 2 selected');
assert(coinSteps[4].algorithmState?.coinCandidate === 2, 'Candidate evaluated to 2');
assert(coinSteps[6].algorithmState?.dpCellStatus?.['3'] === 'UPDATED', 'Amount 3 state updated');

// ==============================================================
// TEST 4: Subset Sum & Partition Equal Subset Sum
// ==============================================================
console.log('\n--- Test 4: Subset Sum & Partition ---');
const subsetEvents: ExecutionEvent[] = [
  { type: 'SUBSET_SUM_START', line: 1, structureId: 'dp_subset', values: [2, 3, 7, 8, 10], target: 11 },
  { type: 'SUBSET_ELEMENT_SELECT', line: 2, structureId: 'dp_subset', itemIndex: 1, itemValue: 3 },
  { type: 'SUBSET_TARGET_SELECT', line: 3, structureId: 'dp_subset', target: 5 },
  { type: 'SUBSET_EXCLUDE', line: 4, structureId: 'dp_subset', conditionResult: false },
  { type: 'SUBSET_INCLUDE', line: 5, structureId: 'dp_subset', conditionResult: true },
  { type: 'SUBSET_COMPARE', line: 6, structureId: 'dp_subset', conditionResult: true },
  { type: 'SUBSET_STATE_UPDATE', line: 7, structureId: 'dp_subset', itemIndex: 1, target: 5, conditionResult: true },
  { type: 'SUBSET_SUM_END', line: 8, structureId: 'dp_subset', conditionResult: true },
];

const ssSteps = reconstructExecutionSteps(subsetEvents, '// Subset Sum');
assert(ssSteps.length === 8, '8 steps for Subset Sum');
assert(ssSteps[0].algorithmState?.subsetTarget === 11, 'Target 11 recorded');
assert(ssSteps[1].algorithmState?.knapsackCurrentItem === 1, 'Element 1 selected');
assert(ssSteps[1].algorithmState?.knapsackItems?.[1]?.value === 3, 'Element 1 value is 3');
assert(ssSteps[6].algorithmState?.dpCellStatus?.['1,5'] === 'UPDATED', 'Cell 1,5 updated');

// ==============================================================
// TEST 5: LCS & LCS Reconstruction
// ==============================================================
console.log('\n--- Test 5: LCS & Reconstruction ---');
const lcsEvents: ExecutionEvent[] = [
  { type: 'LCS_START', line: 1, structureId: 'dp_lcs', a: 'abcde', b: 'ace' },
  { type: 'LCS_CHARACTER_COMPARE', line: 2, structureId: 'dp_lcs', i: 1, j: 1, iChar: 'a', jChar: 'a' },
  { type: 'LCS_MATCH', line: 3, structureId: 'dp_lcs', i: 1, j: 1, iChar: 'a' },
  { type: 'LCS_STATE_UPDATE', line: 4, structureId: 'dp_lcs', i: 1, j: 1, newValue: 1, dependencies: ['dp[0][0]'] },
  { type: 'LCS_RECONSTRUCTION_START', line: 5, structureId: 'dp_lcs' },
  { type: 'LCS_RECONSTRUCTION_STEP', line: 6, structureId: 'dp_lcs', i: 5, j: 3, selected: true, iChar: 'e' },
  { type: 'LCS_RECONSTRUCTION_STEP', line: 7, structureId: 'dp_lcs', i: 3, j: 2, selected: true, iChar: 'c' },
  { type: 'LCS_RECONSTRUCTION_STEP', line: 8, structureId: 'dp_lcs', i: 1, j: 1, selected: true, iChar: 'a' },
  { type: 'LCS_RECONSTRUCTION_END', line: 9, structureId: 'dp_lcs', result: 'ace' },
  { type: 'LCS_END', line: 10, structureId: 'dp_lcs', result: 'ace' },
];

const lcsSteps = reconstructExecutionSteps(lcsEvents, '// LCS');
assert(lcsSteps.length === 10, '10 steps for LCS');
assert(lcsSteps[0].algorithmState?.lcsStringA === 'abcde', 'String A is abcde');
assert(lcsSteps[2].algorithmState?.lcsMatched === true, 'Match flag true for a == a');
assert(lcsSteps[5].algorithmState?.lcsReconstructionPath?.length === 1, 'Reconstruction step 1 added');
assert(lcsSteps[7].algorithmState?.lcsReconstructionPath?.length === 3, 'Reconstruction steps 3 added');
assert(lcsSteps[8].algorithmState?.lcsResult === 'ace', 'Reconstruction result is ace');

// Replay backward check
assert(lcsSteps[4].algorithmState?.lcsReconstructionPath?.length === 0, 'Replay step 5: reconstruction path was empty before tracing');

// ==============================================================
// TEST 6: Longest Common Substring
// ==============================================================
console.log('\n--- Test 6: Longest Common Substring ---');
const lcstrEvents: ExecutionEvent[] = [
  { type: 'LCSTR_START', line: 1, structureId: 'dp_lcstr', a: 'ABCDGH', b: 'ACDGHR' },
  { type: 'LCSTR_CHARACTER_COMPARE', line: 2, structureId: 'dp_lcstr', i: 1, j: 1, iChar: 'A', jChar: 'A' },
  { type: 'LCSTR_MATCH', line: 3, structureId: 'dp_lcstr', i: 1, j: 1, iChar: 'A' },
  { type: 'LCSTR_STATE_UPDATE', line: 4, structureId: 'dp_lcstr', i: 1, j: 1, newValue: 1 },
  { type: 'LCSTR_MAX_UPDATE', line: 5, structureId: 'dp_lcstr', newValue: 1 },
  { type: 'LCSTR_CHARACTER_COMPARE', line: 6, structureId: 'dp_lcstr', i: 2, j: 1, iChar: 'B', jChar: 'A' },
  { type: 'LCSTR_RESET', line: 7, structureId: 'dp_lcstr', i: 2, j: 1 },
  { type: 'LCSTR_END', line: 8, structureId: 'dp_lcstr', value: 4 },
];

const lcstrSteps = reconstructExecutionSteps(lcstrEvents, '// LCSTR');
assert(lcstrSteps.length === 8, '8 steps for LCSTR');
assert(lcstrSteps[4].algorithmState?.lcstrMaxLen === 1, 'Max substring length updated to 1');
assert(lcstrSteps[6].algorithmState?.dpCellStatus?.['2,1'] === 'UPDATED', 'Cell 2,1 reset marked');

// ==============================================================
// TEST 7: LIS & Parent Replay
// ==============================================================
console.log('\n--- Test 7: LIS with Parent Reconstruction ---');
const lisEvents: ExecutionEvent[] = [
  { type: 'LIS_START', line: 1, structureId: 'dp_lis', values: [10, 9, 2, 5, 3, 7, 101, 18] },
  { type: 'LIS_INDEX_SELECT', line: 2, structureId: 'dp_lis', i: 3, j: 2 },
  { type: 'LIS_COMPARE', line: 3, structureId: 'dp_lis', i: 3, j: 2, conditionResult: true },
  { type: 'LIS_CANDIDATE', line: 4, structureId: 'dp_lis', candidateValue: 2 },
  { type: 'LIS_STATE_UPDATE', line: 5, structureId: 'dp_lis', i: 3, newValue: 2 },
  { type: 'LIS_PARENT_UPDATE', line: 6, structureId: 'dp_lis', i: 3, parentIndex: 2 },
  { type: 'LIS_RECONSTRUCTION_START', line: 7, structureId: 'dp_lis' },
  { type: 'LIS_RECONSTRUCTION_STEP', line: 8, structureId: 'dp_lis', i: 3 },
  { type: 'LIS_RECONSTRUCTION_STEP', line: 9, structureId: 'dp_lis', i: 2 },
  { type: 'LIS_END', line: 10, structureId: 'dp_lis', value: 4 },
];

const lisSteps = reconstructExecutionSteps(lisEvents, '// LIS');
assert(lisSteps.length === 10, '10 steps for LIS');
assert(lisSteps[0].algorithmState?.lisArray?.length === 8, 'LIS array has 8 values');
assert(lisSteps[4].algorithmState?.dpCellStatus?.['3'] === 'UPDATED', 'DP[3] updated');
assert(lisSteps[5].algorithmState?.lisParents?.[3] === 2, 'Parent of 3 is 2');
assert(lisSteps[8].algorithmState?.lisReconstructedIndices?.length === 2, '2 reconstructed indices');

// Backward step replay verification
assert(lisSteps[4].algorithmState?.lisParents?.[3] === null, 'Replay step 5: parent[3] was null before update');

// ==============================================================
// TEST 8: Grid DP (Unique Paths, Obstacles, Min Path Sum)
// ==============================================================
console.log('\n--- Test 8: Grid DP ---');
const gridEvents: ExecutionEvent[] = [
  { type: 'GRID_DP_START', line: 1, structureId: 'dp_grid', rows: 3, cols: 3, obstacles: ['1,1'] },
  { type: 'GRID_CELL_SELECT', line: 2, structureId: 'dp_grid', r: 1, c: 1 },
  { type: 'GRID_OBSTACLE_CHECK', line: 3, structureId: 'dp_grid', r: 1, c: 1, obstacle: true },
  { type: 'GRID_STATE_UPDATE', line: 4, structureId: 'dp_grid', r: 1, c: 1, newValue: 0 },
  { type: 'GRID_CELL_SELECT', line: 5, structureId: 'dp_grid', r: 1, c: 2 },
  { type: 'GRID_DEPENDENCY_ACCESS', line: 6, structureId: 'dp_grid', dependencies: ['0,2', '1,1'] },
  { type: 'GRID_CANDIDATE', line: 7, structureId: 'dp_grid', candidateValue: 1 },
  { type: 'GRID_COMPARE', line: 8, structureId: 'dp_grid', candidateValue: 1, oldValue: 0 },
  { type: 'GRID_STATE_UPDATE', line: 9, structureId: 'dp_grid', r: 1, c: 2, newValue: 1 },
  { type: 'GRID_DP_END', line: 10, structureId: 'dp_grid', result: 2 },
];

const gridSteps = reconstructExecutionSteps(gridEvents, '// Grid DP');
assert(gridSteps.length === 10, '10 steps for Grid DP');
assert(gridSteps[0].algorithmState?.gridRows === 3 && gridSteps[0].algorithmState?.gridCols === 3, 'Grid size 3x3');
assert(gridSteps[0].algorithmState?.gridObstacles?.some(([r, c]) => r === 1 && c === 1) === true, 'Obstacle at 1,1 recorded');
assert(gridSteps[2].algorithmState?.dpCellStatus?.['1,1'] === 'CURRENT', 'Obstacle cell marked');
assert(gridSteps[8].algorithmState?.dpCellStatus?.['1,2'] === 'UPDATED', 'Cell 1,2 updated');

// ==============================================================
// TEST 9: Interval DP
// ==============================================================
console.log('\n--- Test 9: Interval DP ---');
const intervalEvents: ExecutionEvent[] = [
  { type: 'INTERVAL_DP_START', line: 1, structureId: 'dp_interval', length: 4 },
  { type: 'INTERVAL_LENGTH_UPDATE', line: 2, structureId: 'dp_interval', length: 2 },
  { type: 'INTERVAL_SELECT', line: 3, structureId: 'dp_interval', leftIndex: 0, rightIndex: 2 },
  { type: 'INTERVAL_SPLIT_SELECT', line: 4, structureId: 'dp_interval', splitIndex: 1 },
  { type: 'INTERVAL_LEFT_DEPENDENCY', line: 5, structureId: 'dp_interval', leftIndex: 0, rightIndex: 1, value: 10 },
  { type: 'INTERVAL_RIGHT_DEPENDENCY', line: 6, structureId: 'dp_interval', leftIndex: 1, rightIndex: 2, value: 20 },
  { type: 'INTERVAL_COMBINE', line: 7, structureId: 'dp_interval', candidateValue: 45 },
  { type: 'INTERVAL_STATE_UPDATE', line: 8, structureId: 'dp_interval', leftIndex: 0, rightIndex: 2, newValue: 45 },
  { type: 'INTERVAL_DP_END', line: 9, structureId: 'dp_interval', value: 45 },
];

const intSteps = reconstructExecutionSteps(intervalEvents, '// Interval DP');
assert(intSteps.length === 9, '9 steps for Interval DP');
assert(intSteps[2].algorithmState?.intervalLeft === 0 && intSteps[2].algorithmState?.intervalRight === 2, 'Interval [0, 2] selected');
assert(intSteps[3].algorithmState?.intervalSplit === 1, 'Split at 1');
assert(intSteps[7].algorithmState?.dpCellStatus?.['0,2'] === 'UPDATED', 'Interval DP cell 0,2 updated');

// ==============================================================
// TEST 10: Tree DP
// ==============================================================
console.log('\n--- Test 10: Tree DP ---');
const treeDpEvents: ExecutionEvent[] = [
  { type: 'TREE_DP_START', line: 1, structureId: 'dp_tree', rootNodeId: '1' },
  { type: 'TREE_DP_NODE_ENTER', line: 2, structureId: 'dp_tree', nodeId: '1' },
  { type: 'TREE_DP_CHILD_PROCESS', line: 3, structureId: 'dp_tree', nodeId: '1', childNodeId: '2' },
  { type: 'TREE_DP_STATE_ACCESS', line: 4, structureId: 'dp_tree', nodeId: '2', value: 10 },
  { type: 'TREE_DP_TRANSITION', line: 5, structureId: 'dp_tree', nodeId: '1', formula: 'val + max(child_0, child_1)' },
  { type: 'TREE_DP_STATE_UPDATE', line: 6, structureId: 'dp_tree', nodeId: '1', newValue: 25 },
  { type: 'TREE_DP_NODE_COMPLETE', line: 7, structureId: 'dp_tree', nodeId: '1', value: 25 },
  { type: 'TREE_DP_END', line: 8, structureId: 'dp_tree', result: 25 },
];

const treeDpSteps = reconstructExecutionSteps(treeDpEvents, '// Tree DP');
assert(treeDpSteps.length === 8, '8 steps for Tree DP');
assert(treeDpSteps[1].algorithmState?.treeDpCurrentNode === '1', 'Current node is 1');
assert(treeDpSteps[5].algorithmState?.treeDpNodeStates?.['1'] === 25, 'Node 1 DP value updated to 25');

// ==============================================================
// TEST 11: Bitmask DP
// ==============================================================
console.log('\n--- Test 11: Bitmask DP ---');
const bitmaskEvents: ExecutionEvent[] = [
  { type: 'BITMASK_DP_START', line: 1, structureId: 'dp_mask', length: 4 },
  { type: 'BITMASK_CREATE', line: 2, structureId: 'dp_mask', mask: 5, binaryString: '0101', selectedBits: [0, 2] },
  { type: 'BITMASK_BIT_CHECK', line: 3, structureId: 'dp_mask', mask: 5, bitIndex: 1, bitSet: false },
  { type: 'BITMASK_BIT_SET', line: 4, structureId: 'dp_mask', mask: 7, bitIndex: 1, newMask: 7 },
  { type: 'BITMASK_TRANSITION', line: 5, structureId: 'dp_mask', mask: 7, bitIndex: 1, candidateValue: 42 },
  { type: 'BITMASK_STATE_UPDATE', line: 6, structureId: 'dp_mask', mask: 7, bitIndex: 1, newValue: 42 },
  { type: 'BITMASK_DP_END', line: 7, structureId: 'dp_mask', value: 42 },
];

const bmSteps = reconstructExecutionSteps(bitmaskEvents, '// Bitmask DP');
assert(bmSteps.length === 7, '7 steps for Bitmask DP');
assert(bmSteps[1].algorithmState?.bitmask === 5, 'Mask is 5 (0101)');
assert(bmSteps[1].algorithmState?.bitmaskSelectedBits?.length === 2, '2 selected bits');
assert(bmSteps[2].algorithmState?.bitmaskBitVal === false, 'Bit 1 is not set');
assert(bmSteps[3].algorithmState?.bitmask === 7, 'New mask is 7 (0111)');
assert(bmSteps[5].algorithmState?.dpCellStatus?.['7,1'] === 'UPDATED', 'Mask state 7,1 marked UPDATED');

// ==============================================================
// TEST 12: Digit DP
// ==============================================================
console.log('\n--- Test 12: Digit DP ---');
const digitEvents: ExecutionEvent[] = [
  { type: 'DIGIT_DP_START', line: 1, structureId: 'dp_digit', target: '324' },
  { type: 'DIGIT_POSITION', line: 2, structureId: 'dp_digit', position: 0, tight: true, started: false, sum: 0, remainder: 0 },
  { type: 'DIGIT_OPTION_SELECT', line: 3, structureId: 'dp_digit', digit: 3, options: [0, 1, 2, 3] },
  { type: 'DIGIT_TIGHT_UPDATE', line: 4, structureId: 'dp_digit', tight: true },
  { type: 'DIGIT_STARTED_UPDATE', line: 5, structureId: 'dp_digit', started: true },
  { type: 'DIGIT_STATE_TRANSITION', line: 6, structureId: 'dp_digit', position: 1, digit: 3, sum: 3, remainder: 3 },
  { type: 'DIGIT_CACHE_LOOKUP', line: 7, structureId: 'dp_digit', position: 1, tight: true, hit: false },
  { type: 'DIGIT_CACHE_MISS', line: 8, structureId: 'dp_digit', position: 1 },
  { type: 'DIGIT_STATE_UPDATE', line: 9, structureId: 'dp_digit', position: 0, newValue: 142 },
  { type: 'DIGIT_DP_END', line: 10, structureId: 'dp_digit', result: 142 },
];

const digSteps = reconstructExecutionSteps(digitEvents, '// Digit DP');
assert(digSteps.length === 10, '10 steps for Digit DP');
assert(digSteps[1].algorithmState?.digitPosition === 0, 'Position is 0');
assert(digSteps[1].algorithmState?.digitTight === true, 'Tight is true');
assert(digSteps[2].algorithmState?.digitSelected === 3, 'Selected digit is 3');
assert(digSteps[2].algorithmState?.digitOptions?.length === 4, '4 digit options');
assert(digSteps[8].algorithmState?.dpCellStatus?.['0'] === 'UPDATED', 'Digit DP pos 0 updated');

// ==============================================================
// TEST 13: Memoization Cache Lookup & Store
// ==============================================================
console.log('\n--- Test 13: Memoization Cache ---');
const memoEvents: ExecutionEvent[] = [
  { type: 'MEMO_LOOKUP', line: 1, structureId: 'memo', key: '5', hit: false },
  { type: 'MEMO_MISS', line: 2, structureId: 'memo', key: '5' },
  { type: 'MEMO_COMPUTE', line: 3, structureId: 'memo', key: '5', formula: 'fib(4) + fib(3)' },
  { type: 'MEMO_STORE', line: 4, structureId: 'memo', key: '5', value: 8 },
  { type: 'MEMO_LOOKUP', line: 5, structureId: 'memo', key: '5', hit: true, value: 8 },
  { type: 'MEMO_HIT', line: 6, structureId: 'memo', key: '5', value: 8 },
  { type: 'MEMO_RETURN', line: 7, structureId: 'memo', key: '5', value: 8 },
];

const memoSteps = reconstructExecutionSteps(memoEvents, '// Memoization');
assert(memoSteps.length === 7, '7 steps for Memoization');
assert(memoSteps[0].algorithmState?.dpCellStatus?.['5'] === 'CACHE_MISS', 'Step 1: Cache miss flagged');
assert(memoSteps[3].algorithmState?.dpSparseMap?.['5'] === 8, 'Step 4: Value 8 stored in sparse map');
assert(memoSteps[4].algorithmState?.dpCellStatus?.['5'] === 'CACHE_HIT', 'Step 5: Cache hit flagged');

// Replay backward check: step 2 must not have key '5' stored
assert(memoSteps[1].algorithmState?.dpSparseMap?.['5'] === undefined, 'Replay step 2: sparse map did not have key 5 yet');

console.log('\n================================================================');
console.log('  ALL PHASE 7 REDUCER & STEP REPLAY TESTS PASSED DETERMINISTICALLY!');
console.log('================================================================\n');
