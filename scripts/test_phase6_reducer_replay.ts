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
console.log('  PHASE 6: ADVANCED ALGORITHMS REDUCER & REPLAY VERIFICATION');
console.log('================================================================\n');

// ==============================================================
// TEST 1: Bellman-Ford Events & Step Replay
// ==============================================================
console.log('--- Test 1: Bellman-Ford Shortest Paths & Negative Cycle ---');
const bellmanEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'g', variable: 'g', directed: true, weighted: true },
  { type: 'GRAPH_EDGE_CREATE', line: 2, structureId: 'g', edgeId: 'e1', sourceNodeId: 'A', targetNodeId: 'B', weight: 4.0 },
  { type: 'GRAPH_EDGE_CREATE', line: 3, structureId: 'g', edgeId: 'e2', sourceNodeId: 'A', targetNodeId: 'C', weight: 5.0 },
  { type: 'GRAPH_EDGE_CREATE', line: 4, structureId: 'g', edgeId: 'e3', sourceNodeId: 'B', targetNodeId: 'C', weight: -2.0 },
  { type: 'BELLMAN_FORD_START', line: 5, structureId: 'g', startNodeId: 'A' },
  { type: 'BELLMAN_FORD_PASS_START', line: 6, structureId: 'g', pass: 1, totalPasses: 2 },
  { type: 'BELLMAN_FORD_EDGE_RELAX', line: 7, structureId: 'g', sourceNodeId: 'A', targetNodeId: 'B', weight: 4.0, oldDistance: Infinity },
  { type: 'BELLMAN_FORD_DISTANCE_UPDATE', line: 8, structureId: 'g', targetNodeId: 'B', oldDistance: Infinity, newDistance: 4.0 },
  { type: 'BELLMAN_FORD_EDGE_RELAX', line: 9, structureId: 'g', sourceNodeId: 'A', targetNodeId: 'C', weight: 5.0, oldDistance: Infinity },
  { type: 'BELLMAN_FORD_DISTANCE_UPDATE', line: 10, structureId: 'g', targetNodeId: 'C', oldDistance: Infinity, newDistance: 5.0 },
  { type: 'BELLMAN_FORD_PASS_END', line: 11, structureId: 'g', pass: 1 },
  { type: 'BELLMAN_FORD_PASS_START', line: 12, structureId: 'g', pass: 2, totalPasses: 2 },
  { type: 'BELLMAN_FORD_EDGE_RELAX', line: 13, structureId: 'g', sourceNodeId: 'B', targetNodeId: 'C', weight: -2.0, oldDistance: 5.0 },
  { type: 'BELLMAN_FORD_COMPARE', line: 14, structureId: 'g', sourceNodeId: 'B', targetNodeId: 'C', candidateDistance: 2.0, oldDistance: 5.0, conditionResult: true },
  { type: 'BELLMAN_FORD_DISTANCE_UPDATE', line: 15, structureId: 'g', targetNodeId: 'C', oldDistance: 5.0, newDistance: 2.0 },
  { type: 'BELLMAN_FORD_PASS_END', line: 16, structureId: 'g', pass: 2 },
  { type: 'BELLMAN_FORD_END', line: 17, structureId: 'g' },
];

const bfSteps = reconstructExecutionSteps(bellmanEvents, '// Bellman-Ford');
assert(bfSteps.length === 17, '17 execution steps for Bellman-Ford');
assert(bfSteps[4].algorithmState?.algorithmName === 'Bellman-Ford', 'Algorithm recognized as Bellman-Ford');
assert(bfSteps[5].algorithmState?.bellmanPass === 1, 'Step 6: pass is 1');
assert(bfSteps[7].algorithmState?.bellmanDistances?.['B'] === 4.0, 'Step 8: distance to B is 4.0');
assert(bfSteps[14].algorithmState?.bellmanDistances?.['C'] === 2.0, 'Step 15: distance to C updated to 2.0');
assert(bfSteps[16].algorithmState?.status === 'Completed', 'Step 17: completed');

// Backward step replay verification
console.log('Verifying Backward Replay for Bellman-Ford:');
assert(bfSteps[9].algorithmState?.bellmanDistances?.['C'] === 5.0, 'Replay Step 10: distance to C was 5.0 before pass 2');
assert(bfSteps[5].algorithmState?.bellmanDistances?.['B'] === 'Infinity' || bfSteps[5].algorithmState?.bellmanDistances?.['B'] === Infinity, 'Replay Step 6: distance to B was Infinity');

// ==============================================================
// TEST 2: Floyd-Warshall Matrix & Comparison
// ==============================================================
console.log('\n--- Test 2: Floyd-Warshall 2D Matrix & Updates ---');
const floydEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'g', variable: 'g', directed: true, weighted: true },
  { type: 'FLOYD_WARSHALL_START', line: 2, structureId: 'g', path: ['A', 'B', 'C'], values: [[0, 3, 6], ['Infinity', 0, 1], ['Infinity', 'Infinity', 0]] },
  { type: 'FLOYD_K_UPDATE', line: 3, structureId: 'g', k: 'B' },
  { type: 'FLOYD_DISTANCE_COMPARE', line: 4, structureId: 'g', iNode: 'A', jNode: 'C', k: 'B', oldDistance: 6, candidateDistance: 4, conditionResult: true },
  { type: 'FLOYD_DISTANCE_UPDATE', line: 5, structureId: 'g', iNode: 'A', jNode: 'C', k: 'B', oldDistance: 6, newDistance: 4 },
  { type: 'FLOYD_WARSHALL_END', line: 6, structureId: 'g' },
];

const fwSteps = reconstructExecutionSteps(floydEvents, '// Floyd-Warshall');
assert(fwSteps.length === 6, '6 execution steps for Floyd-Warshall');
assert(fwSteps[1].algorithmState?.algorithmName === 'Floyd-Warshall', 'Algorithm recognized as Floyd-Warshall');
assert(fwSteps[2].algorithmState?.floydK === 'B', 'Step 3: intermediate k is B');
assert(fwSteps[3].algorithmState?.floydCandidateDistance === 4, 'Step 4: candidate distance is 4');
assert(fwSteps[4].algorithmState?.floydMatrix?.[0]?.[2] === 4, 'Step 5: cell [A][C] updated to 4');

// Backward check
assert(fwSteps[2].algorithmState?.floydMatrix?.[0]?.[2] === 6, 'Replay Step 3: cell [A][C] was originally 6');

// ==============================================================
// TEST 3: Prim's Algorithm & Kruskal's MST
// ==============================================================
console.log('\n--- Test 3: Prim and Kruskal MST ---');
const mstEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'g', variable: 'g', directed: false, weighted: true },
  { type: 'PRIM_START', line: 2, structureId: 'g', startNodeId: 'A' },
  { type: 'PRIM_NODE_SELECT', line: 3, structureId: 'g', nodeId: 'A' },
  { type: 'PRIM_QUEUE_INSERT', line: 4, structureId: 'g', sourceNodeId: 'A', targetNodeId: 'C', weight: 2.0 },
  { type: 'PRIM_EDGE_ACCEPT', line: 5, structureId: 'g', sourceNodeId: 'A', targetNodeId: 'C', weight: 2.0, distance: 2.0 },
  { type: 'PRIM_END', line: 6, structureId: 'g', distance: 2.0 },
  // Kruskal
  { type: 'KRUSKAL_START', line: 7, structureId: 'g', size: 3 },
  { type: 'KRUSKAL_EDGE_SELECT', line: 8, structureId: 'g', sourceNodeId: 'B', targetNodeId: 'C', weight: 1.0 },
  { type: 'KRUSKAL_CYCLE_CHECK', line: 9, structureId: 'g', sourceNodeId: 'B', targetNodeId: 'C', cycle: false },
  { type: 'KRUSKAL_UNION', line: 10, structureId: 'g', sourceNodeId: 'B', targetNodeId: 'C', parentNodeId: 'B' },
  { type: 'KRUSKAL_EDGE_ACCEPT', line: 11, structureId: 'g', sourceNodeId: 'B', targetNodeId: 'C', weight: 1.0, distance: 1.0 },
  { type: 'KRUSKAL_EDGE_SELECT', line: 12, structureId: 'g', sourceNodeId: 'A', targetNodeId: 'B', weight: 4.0 },
  { type: 'KRUSKAL_CYCLE_CHECK', line: 13, structureId: 'g', sourceNodeId: 'A', targetNodeId: 'B', cycle: true },
  { type: 'KRUSKAL_EDGE_REJECT', line: 14, structureId: 'g', sourceNodeId: 'A', targetNodeId: 'B', weight: 4.0 },
  { type: 'KRUSKAL_END', line: 15, structureId: 'g', distance: 1.0 },
];

const mstSteps = reconstructExecutionSteps(mstEvents, '// MST');
assert(mstSteps.length === 15, '15 execution steps for MST');
assert(mstSteps[4].algorithmState?.mstTotalWeight === 2.0, 'Prim edge accepted: total weight 2.0');
assert(mstSteps[10].algorithmState?.disjointSetParents?.['C'] === 'B', 'Kruskal union: parent of C is B');
assert(mstSteps[13].algorithmState?.kruskalSortedEdges?.some(e => e.status === 'REJECTED'), 'Kruskal rejected cycle edge A-B');

// Backward check
assert(mstSteps[7].algorithmState?.disjointSetParents?.['C'] === undefined, 'Replay step 8: before union, parent of C not yet B');

// ==============================================================
// TEST 4: Topological Sort (Kahn & DFS)
// ==============================================================
console.log('\n--- Test 4: Topological Sort & In-Degree Queue ---');
const topoEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'g', variable: 'g', directed: true, weighted: false },
  { type: 'TOPOLOGICAL_SORT_START', line: 2, structureId: 'g', algorithmName: "Kahn's Algorithm" },
  { type: 'INDEGREE_INITIALIZE', line: 3, structureId: 'g', arguments: { A: 0, B: 1, C: 1 } },
  { type: 'TOPOLOGICAL_NODE_ENQUEUE', line: 4, structureId: 'g', nodeId: 'A', value: 0 },
  { type: 'TOPOLOGICAL_NODE_DEQUEUE', line: 5, structureId: 'g', nodeId: 'A' },
  { type: 'TOPOLOGICAL_NODE_OUTPUT', line: 6, structureId: 'g', nodeId: 'A', index: 0 },
  { type: 'TOPOLOGICAL_EDGE_PROCESS', line: 7, structureId: 'g', sourceNodeId: 'A', targetNodeId: 'B', value: 0 },
  { type: 'TOPOLOGICAL_NODE_ENQUEUE', line: 8, structureId: 'g', nodeId: 'B', value: 0 },
  { type: 'TOPOLOGICAL_SORT_END', line: 9, structureId: 'g', path: ['A', 'B', 'C'] },
];

const topoSteps = reconstructExecutionSteps(topoEvents, '// TopoSort');
assert(topoSteps.length === 9, '9 execution steps for TopoSort');
assert(topoSteps[2].algorithmState?.indegrees?.['A'] === 0, 'Step 3: in-degree of A is 0');
assert(topoSteps[3].algorithmState?.topologicalQueue?.includes('A'), 'Step 4: node A is in topological queue');
assert(topoSteps[5].algorithmState?.topologicalOrder?.[0] === 'A', 'Step 6: first output is A');
assert(topoSteps[6].algorithmState?.indegrees?.['B'] === 0, 'Step 7: in-degree of B decremented to 0');

// Backward check
assert(topoSteps[2].algorithmState?.indegrees?.['B'] === 1, 'Replay step 3: initial in-degree of B was 1');

// ==============================================================
// TEST 5: Strongly Connected Components (Tarjan & Kosaraju)
// ==============================================================
console.log('\n--- Test 5: Strongly Connected Components (Tarjan & Kosaraju) ---');
const sccEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'g', variable: 'g', directed: true, weighted: false },
  { type: 'TARJAN_START', line: 2, structureId: 'g' },
  { type: 'TARJAN_DISCOVER', line: 3, structureId: 'g', nodeId: 'A', fromIndex: 0, toIndex: 0 },
  { type: 'TARJAN_STACK_PUSH', line: 4, structureId: 'g', nodeId: 'A' },
  { type: 'TARJAN_DISCOVER', line: 5, structureId: 'g', nodeId: 'B', fromIndex: 1, toIndex: 1 },
  { type: 'TARJAN_STACK_PUSH', line: 6, structureId: 'g', nodeId: 'B' },
  { type: 'TARJAN_LOWLINK_UPDATE', line: 7, structureId: 'g', nodeId: 'B', oldValue: 1, newValue: 0 },
  { type: 'TARJAN_SCC_START', line: 8, structureId: 'g', componentId: 1, nodeId: 'A' },
  { type: 'TARJAN_STACK_POP', line: 9, structureId: 'g', nodeId: 'B', componentId: 1 },
  { type: 'TARJAN_STACK_POP', line: 10, structureId: 'g', nodeId: 'A', componentId: 1 },
  { type: 'TARJAN_SCC_END', line: 11, structureId: 'g', componentId: 1, path: ['B', 'A'] },
  { type: 'TARJAN_END', line: 12, structureId: 'g', size: 1 },
];

const sccSteps = reconstructExecutionSteps(sccEvents, '// Tarjan');
assert(sccSteps.length === 12, '12 execution steps for Tarjan SCC');
assert(sccSteps[2].algorithmState?.tarjanDiscoveryIndex?.['A'] === 0, 'Step 3: dfn[A] = 0');
assert(sccSteps[6].algorithmState?.tarjanLowLink?.['B'] === 0, 'Step 7: low[B] updated to 0');
assert(sccSteps[10].algorithmState?.sccComponents?.length === 1, 'Step 11: 1 SCC component finalized');

// Backward check
assert(sccSteps[5].algorithmState?.tarjanLowLink?.['B'] === 1, 'Replay step 6: low[B] was originally 1');

// ==============================================================
// TEST 6: AVL Tree Balancing & Rotations
// ==============================================================
console.log('\n--- Test 6: AVL Tree Balancing & Rotations ---');
const avlEvents: ExecutionEvent[] = [
  { type: 'AVL_CREATE', line: 1, structureId: 'avl', structureType: 'tree', dataType: 'AVLTree' },
  { type: 'AVL_INSERT', line: 2, structureId: 'avl', nodeId: 'node_30', value: 30 },
  { type: 'AVL_INSERT', line: 3, structureId: 'avl', nodeId: 'node_20', value: 20 },
  { type: 'AVL_INSERT', line: 4, structureId: 'avl', nodeId: 'node_10', value: 10 },
  { type: 'AVL_BALANCE_CHECK', line: 5, structureId: 'avl', nodeId: 'node_30', fromIndex: 2, toIndex: 0, balanceFactor: 2 },
  { type: 'AVL_ROTATE_RIGHT', line: 6, structureId: 'avl', nodeId: 'node_30', childNodeId: 'node_20', rotationType: 'LL' },
  { type: 'AVL_ROOT_UPDATE', line: 7, structureId: 'avl', nodeId: 'node_20' },
  { type: 'AVL_END', line: 8, structureId: 'avl' },
];

const avlSteps = reconstructExecutionSteps(avlEvents, '// AVL Tree');
assert(avlSteps.length === 8, '8 execution steps for AVL Tree');
assert(avlSteps[0].algorithmState?.algorithmName === 'AVL Tree', 'Algorithm recognized as AVL Tree');
assert(avlSteps[4].algorithmState?.balanceFactors?.['node_30'] === 2, 'Step 5: node_30 balance factor is +2 (unbalanced)');
assert(avlSteps[5].algorithmState?.lastRotationType === 'LL', 'Step 6: LL Right Rotation applied');
assert(avlSteps[5].algorithmState?.avlRotationsCount === 1, 'Step 6: rotation counter incremented to 1');
assert(avlSteps[6].structures['avl']?.treeData?.rootId === 'node_20', 'Step 7: root updated to node_20');

// Backward check
assert(avlSteps[3].algorithmState?.avlRotationsCount === 0, 'Replay step 4: 0 rotations before balance check');

// ==============================================================
// TEST 7: Monotonic Stack & Binary Search on Answer
// ==============================================================
console.log('\n--- Test 7: Monotonic Stack & Binary Search on Answer ---');
const monoEvents: ExecutionEvent[] = [
  { type: 'MONO_STACK_START', line: 1, structureId: 'stack', monoType: 'DECREASING' },
  { type: 'MONO_STACK_PUSH', line: 2, structureId: 'stack', value: 2 },
  { type: 'MONO_STACK_COMPARE', line: 3, structureId: 'stack', leftVal: 5, rightVal: 2, conditionResult: true },
  { type: 'MONO_STACK_POP', line: 4, structureId: 'stack', value: 2 },
  { type: 'MONO_STACK_PUSH', line: 5, structureId: 'stack', value: 5 },
  { type: 'MONO_STACK_END', line: 6, structureId: 'stack' },
  // BS on Answer
  { type: 'ANSWER_SEARCH_START', line: 7, variable: 'ans', low: 1, high: 100 },
  { type: 'ANSWER_SEARCH_MID', line: 8, variable: 'ans', mid: 50 },
  { type: 'ANSWER_SEARCH_FEASIBILITY_CHECK', line: 9, variable: 'ans', mid: 50, feasible: true, message: 'Feasible' },
  { type: 'ANSWER_SEARCH_RANGE_UPDATE', line: 10, variable: 'ans', low: 1, high: 49, value: 50 },
  { type: 'ANSWER_SEARCH_END', line: 11, variable: 'ans', value: 42 },
];

const patSteps = reconstructExecutionSteps(monoEvents, '// Advanced Patterns');
assert(patSteps.length === 11, '11 execution steps for Advanced Patterns');
assert(patSteps[0].algorithmState?.monoStackType === 'DECREASING', 'Step 1: Monotonic Decreasing Stack');
assert(patSteps[3].algorithmState?.monoStackElements?.length === 0, 'Step 4: stack element popped');
assert(patSteps[4].algorithmState?.monoStackElements?.[0] === 5, 'Step 5: element 5 pushed');
assert(patSteps[8].algorithmState?.answerFeasibility === true, 'Step 9: answer 50 is feasible');
assert(patSteps[9].algorithmState?.searchHigh === 49, 'Step 10: high range updated to 49');

console.log('\n================================================================');
console.log('  ALL PHASE 6 REDUCER & REPLAY UNIT TESTS PASSED (100%)');
console.log('================================================================');
