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
console.log('  PHASE 3: REDUCER, STEP REPLAY & ISOLATION VERIFICATION       ');
console.log('================================================================\n');

// ==============================================================
// TEST 1: Section 39 Binary Tree Reducer & Step-by-Step Replay
// ==============================================================
console.log('--- Test 1: Binary Tree Reducer & Backward Step Replay ---');
const treeEvents: ExecutionEvent[] = [
  { type: 'TREE_CREATE', line: 1, structureId: 'tree-1', variable: 'root' },
  { type: 'TREE_NODE_CREATE', line: 2, structureId: 'tree-1', nodeId: 'node-50', value: 50 },
  { type: 'TREE_NODE_CREATE', line: 3, structureId: 'tree-1', nodeId: 'node-30', value: 30 },
  { type: 'TREE_LINK_LEFT', line: 4, structureId: 'tree-1', parentNodeId: 'node-50', childNodeId: 'node-30' },
  { type: 'TREE_NODE_CREATE', line: 5, structureId: 'tree-1', nodeId: 'node-70', value: 70 },
  { type: 'TREE_LINK_RIGHT', line: 6, structureId: 'tree-1', parentNodeId: 'node-50', childNodeId: 'node-70' },
];

const treeSteps = reconstructExecutionSteps(treeEvents, '// binary tree code');
assert(treeSteps.length === 6, 'Generated 6 execution steps for tree creation');

// Forward states check
assert(treeSteps[0].structures['tree-1'].size === 0, 'Step 1: empty tree');
assert(treeSteps[1].structures['tree-1'].size === 1, 'Step 2: 50 created (size 1)');
assert(treeSteps[2].structures['tree-1'].size === 2, 'Step 3: 30 created (size 2)');
assert(treeSteps[3].structures['tree-1'].treeData?.nodes['node-50']?.leftId === 'node-30', 'Step 4: 30 linked left of 50');
assert(treeSteps[4].structures['tree-1'].size === 3, 'Step 5: 70 created (size 3)');
assert(treeSteps[5].structures['tree-1'].treeData?.nodes['node-50']?.rightId === 'node-70', 'Step 6: 70 linked right of 50');

// Section 39 backward replay verification
console.log('Verifying Backward Replay Snapshots (Step 5 ➔ Step 4 ➔ Step 3 ➔ Step 2 ➔ Step 1):');
assert(treeSteps[5].structures['tree-1'].size === 3, 'Replay Step 5: nodes 50, 30, 70 present');
assert(treeSteps[3].structures['tree-1'].treeData?.nodes['node-70'] === undefined, 'Replay Step 4: node 70 does not exist yet');
assert(treeSteps[3].structures['tree-1'].treeData?.nodes['node-50']?.leftId === 'node-30', 'Replay Step 4: 50 -> left = 30');
assert(treeSteps[2].structures['tree-1'].treeData?.nodes['node-50']?.leftId === null, 'Replay Step 3: left link not made yet');
assert(treeSteps[1].structures['tree-1'].size === 1 && treeSteps[1].structures['tree-1'].treeData?.nodes['node-30'] === undefined, 'Replay Step 2: only node 50 exists');
assert(treeSteps[0].structures['tree-1'].size === 0, 'Replay Step 1: tree is empty');

// Traversal sequence test
const travEvents: ExecutionEvent[] = [
  ...treeEvents,
  { type: 'TREE_TRAVERSAL_START', line: 7, structureId: 'tree-1', traversal: 'INORDER' },
  { type: 'TREE_NODE_VISIT', line: 8, structureId: 'tree-1', nodeId: 'node-30', value: 30, traversal: 'INORDER' },
  { type: 'TREE_NODE_VISIT', line: 9, structureId: 'tree-1', nodeId: 'node-50', value: 50, traversal: 'INORDER' },
  { type: 'TREE_NODE_VISIT', line: 10, structureId: 'tree-1', nodeId: 'node-70', value: 70, traversal: 'INORDER' },
  { type: 'TREE_TRAVERSAL_END', line: 11, structureId: 'tree-1' },
];

const travSteps = reconstructExecutionSteps(travEvents, '// trav code');
const finalTravStep = travSteps[travSteps.length - 1];
assert(
  JSON.stringify(finalTravStep.structures['tree-1'].treeData?.traversalOrder) === JSON.stringify([30, 50, 70]),
  'Inorder traversal sequence recorded: [30, 50, 70]'
);

// ==============================================================
// TEST 2: BST Insertion, Comparison Decision Path, Search & Delete
// ==============================================================
console.log('\n--- Test 2: Binary Search Tree (BST) Reducer ---');
const bstEvents: ExecutionEvent[] = [
  { type: 'BST_CREATE', line: 1, structureId: 'bst-1', variable: 'bst' },
  { type: 'BST_INSERT', line: 2, structureId: 'bst-1', value: 50, nodeId: 'node_50' },
  { type: 'BST_INSERT', line: 3, structureId: 'bst-1', value: 30, nodeId: 'node_30' },
  { type: 'BST_INSERT', line: 4, structureId: 'bst-1', value: 70, nodeId: 'node_70' },
  {
    type: 'BST_COMPARE',
    line: 5,
    structureId: 'bst-1',
    leftVal: 40,
    rightVal: 50,
    operator: '<',
    conditionResult: true,
  },
  {
    type: 'BST_COMPARE',
    line: 6,
    structureId: 'bst-1',
    leftVal: 40,
    rightVal: 30,
    operator: '>',
    conditionResult: true,
  },
  { type: 'BST_INSERT', line: 7, structureId: 'bst-1', value: 40, nodeId: 'node_40' },
  { type: 'BST_SEARCH_START', line: 8, structureId: 'bst-1', value: 40 },
  { type: 'BST_NODE_FOUND', line: 9, structureId: 'bst-1', value: 40, nodeId: 'node_40' },
  { type: 'BST_SEARCH_END', line: 10, structureId: 'bst-1', value: 40, conditionResult: true },
  { type: 'BST_DELETE', line: 11, structureId: 'bst-1', value: 40, nodeId: 'node_40' },
];

const bstSteps = reconstructExecutionSteps(bstEvents, '// bst code');
const compareStep1 = bstSteps[4];
assert(
  compareStep1.comparison !== null && compareStep1.comparison.result === true,
  'BST comparison decision path evaluated: 40 < 50 ? TRUE'
);

const searchFoundStep = bstSteps[8];
assert(
  searchFoundStep.structures['bst-1'].treeData?.selectedNodeId === 'node_40',
  'BST search successfully identified and highlighted node 40'
);

const deleteStep = bstSteps[10];
assert(
  deleteStep.structures['bst-1'].treeData?.nodes['node_40'] === undefined,
  'BST node 40 deleted successfully'
);
assert(deleteStep.structures['bst-1'].size === 3, 'BST size decreased to 3 after deletion');

// ==============================================================
// TEST 3: Heap (Min Heap & Max Heap) & Heapify Swaps
// ==============================================================
console.log('\n--- Test 3: Heap Reducer & Heapify Operations ---');
const heapEvents: ExecutionEvent[] = [
  { type: 'HEAP_CREATE', line: 1, structureId: 'heap-1', variable: 'minHeap', heapType: 'MIN' },
  { type: 'HEAP_INSERT', line: 2, structureId: 'heap-1', value: 20, values: [20] },
  { type: 'HEAP_INSERT', line: 3, structureId: 'heap-1', value: 40, values: [20, 40] },
  { type: 'HEAP_INSERT', line: 4, structureId: 'heap-1', value: 30, values: [20, 40, 30] },
  { type: 'HEAP_INSERT', line: 5, structureId: 'heap-1', value: 10, values: [20, 40, 30, 10] },
  {
    type: 'HEAP_COMPARE',
    line: 6,
    structureId: 'heap-1',
    fromIndex: 3,
    toIndex: 1,
    leftVal: 10,
    rightVal: 40,
    operator: '<',
    conditionResult: true,
  },
  {
    type: 'HEAP_SWAP',
    line: 7,
    structureId: 'heap-1',
    fromIndex: 3,
    toIndex: 1,
    values: [20, 10, 30, 40],
  },
  {
    type: 'HEAP_COMPARE',
    line: 8,
    structureId: 'heap-1',
    fromIndex: 1,
    toIndex: 0,
    leftVal: 10,
    rightVal: 20,
    operator: '<',
    conditionResult: true,
  },
  {
    type: 'HEAP_SWAP',
    line: 9,
    structureId: 'heap-1',
    fromIndex: 1,
    toIndex: 0,
    values: [10, 20, 30, 40],
  },
  { type: 'HEAPIFY_UP', line: 10, structureId: 'heap-1', index: 0, value: 10 },
  { type: 'HEAP_PEEK', line: 11, structureId: 'heap-1', value: 10 },
  { type: 'HEAP_REMOVE', line: 12, structureId: 'heap-1', value: 10, values: [20, 40, 30] },
  { type: 'HEAPIFY_DOWN', line: 13, structureId: 'heap-1', index: 0, value: 20 },
];

const heapSteps = reconstructExecutionSteps(heapEvents, '// heap code');
assert(heapSteps[0].structures['heap-1'].heapData?.isMinHeap === true, 'Min-Heap created with isMinHeap = true');

const heapSwapStep = heapSteps[8];
assert(
  JSON.stringify(heapSwapStep.structures['heap-1'].heapData?.array) === JSON.stringify([10, 20, 30, 40]),
  'Heap array after heapifyUp swaps: [10, 20, 30, 40]'
);

const heapRemoveStep = heapSteps[11];
assert(
  JSON.stringify(heapRemoveStep.structures['heap-1'].heapData?.array) === JSON.stringify([20, 40, 30]),
  'Heap array after extract root (10): [20, 40, 30]'
);

// ==============================================================
// TEST 4: Trie Insertion, Shared Prefix & Search
// ==============================================================
console.log('\n--- Test 4: Trie Reducer & Shared Prefix Branching ---');
const trieEvents: ExecutionEvent[] = [
  { type: 'TRIE_CREATE', line: 1, structureId: 'trie-1', variable: 'trie' },
  // Insert "cat"
  { type: 'TRIE_NODE_CREATE', line: 2, structureId: 'trie-1', char: 'c', parentNodeId: 'root', nodeId: 'node_c' },
  { type: 'TRIE_NODE_CREATE', line: 2, structureId: 'trie-1', char: 'a', parentNodeId: 'node_c', nodeId: 'node_ca' },
  { type: 'TRIE_NODE_CREATE', line: 2, structureId: 'trie-1', char: 't', parentNodeId: 'node_ca', nodeId: 'node_cat' },
  { type: 'TRIE_WORD_COMPLETE', line: 2, structureId: 'trie-1', word: 'cat', nodeId: 'node_cat' },
  // Insert "car" (shares 'c' and 'a')
  { type: 'TRIE_NODE_CREATE', line: 3, structureId: 'trie-1', char: 'r', parentNodeId: 'node_ca', nodeId: 'node_car' },
  { type: 'TRIE_WORD_COMPLETE', line: 3, structureId: 'trie-1', word: 'car', nodeId: 'node_car' },
  // Search "car" -> FOUND
  { type: 'TRIE_SEARCH_START', line: 4, structureId: 'trie-1', word: 'car' },
  { type: 'TRIE_SEARCH_STEP', line: 4, structureId: 'trie-1', char: 'c', nodeId: 'node_c' },
  { type: 'TRIE_SEARCH_STEP', line: 4, structureId: 'trie-1', char: 'a', nodeId: 'node_ca' },
  { type: 'TRIE_SEARCH_STEP', line: 4, structureId: 'trie-1', char: 'r', nodeId: 'node_car' },
  { type: 'TRIE_WORD_FOUND', line: 4, structureId: 'trie-1', word: 'car' },
  // Search "can" -> NOT FOUND
  { type: 'TRIE_SEARCH_START', line: 5, structureId: 'trie-1', word: 'can' },
  { type: 'TRIE_SEARCH_STEP', line: 5, structureId: 'trie-1', char: 'c', nodeId: 'node_c' },
  { type: 'TRIE_SEARCH_STEP', line: 5, structureId: 'trie-1', char: 'a', nodeId: 'node_ca' },
  { type: 'TRIE_WORD_NOT_FOUND', line: 5, structureId: 'trie-1', word: 'can' },
];

const trieSteps = reconstructExecutionSteps(trieEvents, '// trie code');
const trieAfterInserts = trieSteps[6];
assert(trieAfterInserts.structures['trie-1'].trieData?.wordsCount === 2, 'Trie has 2 words: ["cat", "car"]');
assert(
  trieAfterInserts.structures['trie-1'].trieData?.nodes['node_ca']?.children['t'] === 'node_cat' &&
    trieAfterInserts.structures['trie-1'].trieData?.nodes['node_ca']?.children['r'] === 'node_car',
  'Node "ca" successfully branches into both "t" and "r" (Shared Prefix preserved!)'
);

const trieFoundStep = trieSteps[11];
assert(trieFoundStep.structures['trie-1'].trieData?.searchResult === 'FOUND', 'Search for "car" returns FOUND');

const trieNotFoundStep = trieSteps[15];
assert(trieNotFoundStep.structures['trie-1'].trieData?.searchResult === 'NOT_FOUND', 'Search for "can" returns NOT_FOUND');

// ==============================================================
// TEST 5: Section 40 Multiple Structure Isolation
// ==============================================================
console.log('\n--- Test 5: Section 40 Multiple Structure Isolation ---');
const multiEvents: ExecutionEvent[] = [
  { type: 'TREE_CREATE', line: 1, structureId: 'treeA', variable: 'treeA' },
  { type: 'TREE_CREATE', line: 2, structureId: 'treeB', variable: 'treeB' },
  { type: 'BST_CREATE', line: 3, structureId: 'bstA', variable: 'bstA' },
  { type: 'HEAP_CREATE', line: 4, structureId: 'heapA', variable: 'heapA' },
  { type: 'HEAP_CREATE', line: 5, structureId: 'heapB', variable: 'heapB' },
  { type: 'TRIE_CREATE', line: 6, structureId: 'trieA', variable: 'trieA' },

  // Mutate treeA only
  { type: 'TREE_NODE_CREATE', line: 7, structureId: 'treeA', nodeId: 'nodeA_1', value: 10 },
  // Mutate heapA only
  { type: 'HEAP_INSERT', line: 8, structureId: 'heapA', value: 99, values: [99] },
  // Mutate trieA only
  { type: 'TRIE_NODE_CREATE', line: 9, structureId: 'trieA', char: 'z', parentNodeId: 'root', nodeId: 'node_z' },
  { type: 'TRIE_WORD_COMPLETE', line: 10, structureId: 'trieA', word: 'z', nodeId: 'node_z' },
];

const multiSteps = reconstructExecutionSteps(multiEvents, '// multi code');
const lastStep = multiSteps[multiSteps.length - 1];

assert(Object.keys(lastStep.structures).length === 6, 'All 6 independent structures exist simultaneously in state');
assert(lastStep.structures['treeA'].size === 1, 'treeA size is 1');
assert(lastStep.structures['treeB'].size === 0, 'treeB is unaffected (size 0)');
assert(lastStep.structures['heapA'].size === 1, 'heapA has 1 element (99)');
assert(lastStep.structures['heapB'].size === 0, 'heapB is unaffected (size 0)');
assert(lastStep.structures['trieA'].trieData?.wordsCount === 1, 'trieA contains word "z"');
assert(lastStep.structures['bstA'].size === 0, 'bstA is unaffected (size 0)');

console.log('\n================================================================');
console.log('  ALL PHASE 3 REDUCER & ISOLATION TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================');
