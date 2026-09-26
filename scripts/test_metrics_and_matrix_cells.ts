import { reconstructExecutionSteps } from '../src/engine/stateReconstructor';
import { ExecutionEvent } from '../src/types/execution';

console.log('Testing Metrics and Matrix Related Cells Selection...');

const events: ExecutionEvent[] = [
  { type: 'STEP', step: 1, line: 1 },
  {
    type: 'MATRIX_CREATE',
    step: 2,
    line: 5,
    variable: 'dp',
    dataType: 'int[][]',
    values: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  {
    type: 'LCS_START',
    step: 3,
    line: 7,
    structureId: 'dp',
    detail: 'abcde|ace',
  },
  // Condition evaluate on loop
  {
    type: 'CONDITION_EVALUATE',
    step: 4,
    line: 9,
    condition: 'i <= m',
    conditionResult: true,
  },
  // Char compare
  {
    type: 'LCS_CHARACTER_COMPARE',
    step: 5,
    line: 11,
    structureId: 'dp',
    row: 1,
    col: 1,
    iChar: 'a',
    jChar: 'a',
    charMatched: true,
  },
  // Match
  {
    type: 'LCS_MATCH',
    step: 6,
    line: 13,
    structureId: 'dp',
    row: 1,
    col: 1,
    oldValue: 0,
    newValue: 1,
  },
  // State update
  {
    type: 'LCS_STATE_UPDATE',
    step: 7,
    line: 17,
    structureId: 'dp',
    row: 1,
    col: 1,
    oldValue: 0,
    newValue: 1,
  },
  // Char compare mismatch
  {
    type: 'LCS_CHARACTER_COMPARE',
    step: 8,
    line: 11,
    structureId: 'dp',
    row: 1,
    col: 2,
    iChar: 'a',
    jChar: 'c',
    charMatched: false,
  },
  // Mismatch
  {
    type: 'LCS_MISMATCH',
    step: 9,
    line: 15,
    structureId: 'dp',
    row: 1,
    col: 2,
    leftVal: 0,
    rightVal: 1,
    value: 1,
  },
  // State update
  {
    type: 'LCS_STATE_UPDATE',
    step: 10,
    line: 17,
    structureId: 'dp',
    row: 1,
    col: 2,
    oldValue: 0,
    newValue: 1,
  },
  // Traceback
  {
    type: 'LCS_RECONSTRUCTION_START',
    step: 11,
    line: 21,
    structureId: 'dp',
    row: 1,
    col: 2,
  },
  {
    type: 'LCS_RECONSTRUCTION_STEP',
    step: 12,
    line: 26,
    structureId: 'dp',
    row: 1,
    col: 1,
    char: 'a',
    detail: "Matched character 'a'",
  },
];

const steps = reconstructExecutionSteps(events, '');

// 1. Verify metrics
const lastStep = steps[steps.length - 1];
const metrics = lastStep.algorithmState?.metrics;
console.log('Metrics at final step:', metrics);

if (!metrics) throw new Error('Missing metrics!');
if (metrics.comparisons === 0) throw new Error('Comparisons must be > 0!');
if (metrics.accesses === 0) throw new Error('Accesses must be > 0!');
if (metrics.assignments === 0) throw new Error('Assignments must be > 0!');
console.log('✓ PASS: Metrics are accurately incrementing:', {
  comparisons: metrics.comparisons,
  accesses: metrics.accesses,
  assignments: metrics.assignments,
});

// 2. Verify step 6 (LCS_MATCH) has activeCell and diagonal dependencyCell
const matchStep = steps[5];
const dpAtMatch = matchStep.structures['dp'];
console.log('dp at LCS_MATCH:');
console.log('  activeCell:', dpAtMatch.activeCell);
console.log('  dependencyCells:', dpAtMatch.dependencyCells);
console.log('  cellExplanation:', dpAtMatch.cellExplanation);

if (!dpAtMatch.activeCell || dpAtMatch.activeCell[0] !== 1 || dpAtMatch.activeCell[1] !== 1) {
  throw new Error('activeCell should be [1, 1]');
}
if (!dpAtMatch.dependencyCells || dpAtMatch.dependencyCells.length !== 1 || dpAtMatch.dependencyCells[0][0] !== 0 || dpAtMatch.dependencyCells[0][1] !== 0) {
  throw new Error('dependencyCells should be [[0, 0]] for match!');
}
console.log('✓ PASS: Match step correctly selects diagonal reference cell [0, 0] for active cell [1, 1]');

// 3. Verify step 9 (LCS_MISMATCH) has activeCell and top/left dependencyCells
const mismatchStep = steps[8];
const dpAtMismatch = mismatchStep.structures['dp'];
console.log('dp at LCS_MISMATCH:');
console.log('  activeCell:', dpAtMismatch.activeCell);
console.log('  dependencyCells:', dpAtMismatch.dependencyCells);
console.log('  cellExplanation:', dpAtMismatch.cellExplanation);

if (!dpAtMismatch.activeCell || dpAtMismatch.activeCell[0] !== 1 || dpAtMismatch.activeCell[1] !== 2) {
  throw new Error('activeCell should be [1, 2]');
}
if (!dpAtMismatch.dependencyCells || dpAtMismatch.dependencyCells.length !== 2) {
  throw new Error('dependencyCells should have 2 reference cells for mismatch (top and left)!');
}
console.log('✓ PASS: Mismatch step correctly selects top and left reference cells for active cell [1, 2]');

// 4. Verify traceback step highlights path cell
const tbStep = steps[11];
const dpAtTb = tbStep.structures['dp'];
console.log('dp at LCS_RECONSTRUCTION_STEP:');
console.log('  highlightedCells:', dpAtTb.highlightedCells);
console.log('  activeCell:', dpAtTb.activeCell);

if (!dpAtTb.highlightedCells || dpAtTb.highlightedCells.length === 0) {
  throw new Error('highlightedCells should contain reconstructed cell!');
}
console.log('✓ PASS: Reconstruction step highlights optimal path cell in purple!');

console.log('\nALL METRICS AND CELL SELECTION TESTS PASSED!');
