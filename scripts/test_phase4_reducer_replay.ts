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
console.log('  PHASE 4: GRAPH & GRAPH ALGORITHMS REDUCER & REPLAY VERIFICATION');
console.log('================================================================\n');

// ==============================================================
// TEST 1: Section 51 & 53 Graph Operations & Backward Replay
// ==============================================================
console.log('--- Test 1: Graph Operations (Create, Vertices, Edges, Delete, Replay) ---');
const graphEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'graph-1', variable: 'graph', directed: false, weighted: false },
  { type: 'GRAPH_NODE_CREATE', line: 2, structureId: 'graph-1', nodeId: 'A', value: 'A' },
  { type: 'GRAPH_NODE_CREATE', line: 3, structureId: 'graph-1', nodeId: 'B', value: 'B' },
  { type: 'GRAPH_NODE_CREATE', line: 4, structureId: 'graph-1', nodeId: 'C', value: 'C' },
  { type: 'GRAPH_EDGE_CREATE', line: 5, structureId: 'graph-1', edgeId: 'A--B', sourceNodeId: 'A', targetNodeId: 'B', directed: false, weighted: false },
  { type: 'GRAPH_EDGE_CREATE', line: 6, structureId: 'graph-1', edgeId: 'B--C', sourceNodeId: 'B', targetNodeId: 'C', directed: false, weighted: false },
  { type: 'GRAPH_EDGE_CREATE', line: 7, structureId: 'graph-1', edgeId: 'A--C', sourceNodeId: 'A', targetNodeId: 'C', directed: false, weighted: false },
  { type: 'GRAPH_EDGE_DELETE', line: 8, structureId: 'graph-1', edgeId: 'B--C', sourceNodeId: 'B', targetNodeId: 'C' },
  { type: 'GRAPH_NODE_DELETE', line: 9, structureId: 'graph-1', nodeId: 'C' },
];

const graphSteps = reconstructExecutionSteps(graphEvents, '// graph code');
assert(graphSteps.length === 9, 'Generated 9 execution steps for graph creation and manipulation');

// Forward states check
assert(graphSteps[0].structures['graph-1'].size === 0, 'Step 1: empty graph created');
assert(graphSteps[1].structures['graph-1'].size === 1, 'Step 2: vertex A added (size 1)');
assert(graphSteps[2].structures['graph-1'].size === 2, 'Step 3: vertex B added (size 2)');
assert(graphSteps[3].structures['graph-1'].size === 3, 'Step 4: vertex C added (size 3)');
assert(graphSteps[4].structures['graph-1'].graphData?.edges['A--B'] !== undefined, 'Step 5: edge A--B created');
assert(graphSteps[6].structures['graph-1'].graphData?.edgeList.length === 3, 'Step 7: triangle formed (3 edges)');
assert(graphSteps[7].structures['graph-1'].graphData?.edges['B--C'] === undefined, 'Step 8: edge B--C deleted');
assert(graphSteps[8].structures['graph-1'].graphData?.nodes['C'] === undefined, 'Step 9: node C deleted');
assert(graphSteps[8].structures['graph-1'].size === 2, 'Step 9: only vertices A and B remain');

// Section 53 Backward Replay Verification
console.log('Verifying Backward Replay Snapshots for Graph:');
assert(graphSteps[6].structures['graph-1'].size === 3, 'Replay Step 7: 3 nodes present');
assert(graphSteps[6].structures['graph-1'].graphData?.edgeList.length === 3, 'Replay Step 7: edge B--C present');
assert(graphSteps[4].structures['graph-1'].graphData?.edges['B--C'] === undefined, 'Replay Step 5: edge B--C not created yet');
assert(graphSteps[4].structures['graph-1'].graphData?.edges['A--C'] === undefined, 'Replay Step 5: edge A--C not created yet');
assert(graphSteps[1].structures['graph-1'].size === 1 && graphSteps[1].structures['graph-1'].graphData?.nodes['B'] === undefined, 'Replay Step 2: only vertex A exists');
assert(graphSteps[0].structures['graph-1'].size === 0, 'Replay Step 1: graph has 0 vertices');


// ==============================================================
// TEST 2: Section 54 BFS Traversal & Replay Verification
// ==============================================================
console.log('\n--- Test 2: BFS Traversal & Backward Step Replay ---');
const bfsEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'graph-bfs', variable: 'graph', directed: false },
  { type: 'GRAPH_EDGE_CREATE', line: 2, structureId: 'graph-bfs', edgeId: 'A--B', sourceNodeId: 'A', targetNodeId: 'B' },
  { type: 'GRAPH_EDGE_CREATE', line: 3, structureId: 'graph-bfs', edgeId: 'A--C', sourceNodeId: 'A', targetNodeId: 'C' },
  { type: 'BFS_START', line: 4, structureId: 'graph-bfs', nodeId: 'A', startNodeId: 'A' },
  { type: 'BFS_ENQUEUE', line: 5, structureId: 'graph-bfs', nodeId: 'A', value: 'A' },
  { type: 'BFS_DEQUEUE', line: 6, structureId: 'graph-bfs', nodeId: 'A', value: 'A' },
  { type: 'BFS_NODE_VISIT', line: 7, structureId: 'graph-bfs', nodeId: 'A' },
  { type: 'BFS_EDGE_TRAVERSE', line: 8, structureId: 'graph-bfs', sourceNodeId: 'A', targetNodeId: 'B' },
  { type: 'BFS_NODE_DISCOVER', line: 9, structureId: 'graph-bfs', nodeId: 'B' },
  { type: 'BFS_ENQUEUE', line: 10, structureId: 'graph-bfs', nodeId: 'B', value: 'B' },
  { type: 'BFS_EDGE_TRAVERSE', line: 11, structureId: 'graph-bfs', sourceNodeId: 'A', targetNodeId: 'C' },
  { type: 'BFS_NODE_DISCOVER', line: 12, structureId: 'graph-bfs', nodeId: 'C' },
  { type: 'BFS_ENQUEUE', line: 13, structureId: 'graph-bfs', nodeId: 'C', value: 'C' },
  { type: 'BFS_DEQUEUE', line: 14, structureId: 'graph-bfs', nodeId: 'B', value: 'B' },
  { type: 'BFS_NODE_VISIT', line: 15, structureId: 'graph-bfs', nodeId: 'B' },
  { type: 'BFS_DEQUEUE', line: 16, structureId: 'graph-bfs', nodeId: 'C', value: 'C' },
  { type: 'BFS_NODE_VISIT', line: 17, structureId: 'graph-bfs', nodeId: 'C' },
  { type: 'BFS_END', line: 18, structureId: 'graph-bfs' },
];

const bfsSteps = reconstructExecutionSteps(bfsEvents, '// bfs code');
assert(bfsSteps.length === 18, 'Generated 18 steps for BFS execution');

// Forward states check
assert(bfsSteps[3].structures['graph-bfs'].graphData?.algorithm === 'BFS', 'Step 4: BFS algorithm active');
assert(bfsSteps[6].structures['graph-bfs'].graphData?.visitedOrder?.includes('A'), 'Step 7: Node A added to visited order');
assert(bfsSteps[9].structures['graph-bfs'].graphData?.queueState?.includes('B'), 'Step 10: Node B in BFS queue');
assert(bfsSteps[12].structures['graph-bfs'].graphData?.queueState?.length === 2, 'Step 13: Queue has [B, C]');
assert(bfsSteps[16].structures['graph-bfs'].graphData?.visitedOrder?.length === 3, 'Step 17: All 3 nodes (A, B, C) visited');
assert(bfsSteps[17].structures['graph-bfs'].graphData?.algorithmPhase === 'COMPLETED', 'Step 18: BFS completed');

// Backward replay check
console.log('Verifying Backward Replay Snapshots for BFS:');
assert(bfsSteps[12].structures['graph-bfs'].graphData?.queueState?.length === 2, 'Replay Step 13: Queue contains [B, C]');
assert(bfsSteps[9].structures['graph-bfs'].graphData?.queueState?.length === 1, 'Replay Step 10: Queue contains only [B]');
assert(bfsSteps[5].structures['graph-bfs'].graphData?.visitedOrder?.length === 0, 'Replay Step 6: No nodes visited yet');
assert(bfsSteps[2].structures['graph-bfs'].graphData?.algorithm === undefined, 'Replay Step 3: BFS not started yet');


// ==============================================================
// TEST 3: Section 55 DFS Traversal & Cycle Detection Replay
// ==============================================================
console.log('\n--- Test 3: DFS Traversal, Cycle Handling & Call Stack Integration ---');
const dfsEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'graph-dfs', variable: 'graph', directed: true },
  { type: 'GRAPH_EDGE_CREATE', line: 2, structureId: 'graph-dfs', edgeId: 'A->B', sourceNodeId: 'A', targetNodeId: 'B', directed: true },
  { type: 'GRAPH_EDGE_CREATE', line: 3, structureId: 'graph-dfs', edgeId: 'B->C', sourceNodeId: 'B', targetNodeId: 'C', directed: true },
  { type: 'GRAPH_EDGE_CREATE', line: 4, structureId: 'graph-dfs', edgeId: 'C->A', sourceNodeId: 'C', targetNodeId: 'A', directed: true }, // cycle back to A
  { type: 'DFS_START', line: 5, structureId: 'graph-dfs', nodeId: 'A', startNodeId: 'A' },
  { type: 'DFS_CALL', line: 6, structureId: 'graph-dfs', nodeId: 'A' },
  { type: 'DFS_NODE_VISIT', line: 7, structureId: 'graph-dfs', nodeId: 'A' },
  { type: 'DFS_EDGE_TRAVERSE', line: 8, structureId: 'graph-dfs', sourceNodeId: 'A', targetNodeId: 'B' },
  { type: 'DFS_CALL', line: 9, structureId: 'graph-dfs', nodeId: 'B' },
  { type: 'DFS_NODE_VISIT', line: 10, structureId: 'graph-dfs', nodeId: 'B' },
  { type: 'DFS_EDGE_TRAVERSE', line: 11, structureId: 'graph-dfs', sourceNodeId: 'B', targetNodeId: 'C' },
  { type: 'DFS_CALL', line: 12, structureId: 'graph-dfs', nodeId: 'C' },
  { type: 'DFS_NODE_VISIT', line: 13, structureId: 'graph-dfs', nodeId: 'C' },
  { type: 'DFS_EDGE_TRAVERSE', line: 14, structureId: 'graph-dfs', sourceNodeId: 'C', targetNodeId: 'A' },
  { type: 'DFS_ALREADY_VISITED', line: 15, structureId: 'graph-dfs', sourceNodeId: 'C', targetNodeId: 'A', nodeId: 'A' }, // cycle detected
  { type: 'DFS_RETURN', line: 16, structureId: 'graph-dfs', nodeId: 'C' },
  { type: 'DFS_RETURN', line: 17, structureId: 'graph-dfs', nodeId: 'B' },
  { type: 'DFS_RETURN', line: 18, structureId: 'graph-dfs', nodeId: 'A' },
  { type: 'DFS_END', line: 19, structureId: 'graph-dfs' },
];

const dfsSteps = reconstructExecutionSteps(dfsEvents, '// dfs code');
assert(dfsSteps.length === 19, 'Generated 19 steps for DFS execution');

// Forward check
assert(dfsSteps[4].structures['graph-dfs'].graphData?.algorithm === 'DFS', 'Step 5: DFS started');
assert(dfsSteps[12].structures['graph-dfs'].graphData?.visitedOrder?.length === 3, 'Step 13: A, B, C visited');
assert(dfsSteps[14].structures['graph-dfs'].graphData?.cycleDetected === true, 'Step 15: Cycle detected (A already visited)');
assert(dfsSteps[14].structures['graph-dfs'].graphData?.cycleEdges?.includes('C->A') || dfsSteps[14].structures['graph-dfs'].graphData?.cycleEdges?.length! > 0, 'Step 15: Cycle edge marked');
assert(dfsSteps[18].structures['graph-dfs'].graphData?.algorithmPhase === 'COMPLETED', 'Step 19: DFS completed');

// Backward replay check
console.log('Verifying Backward Replay Snapshots for DFS:');
assert(dfsSteps[13].structures['graph-dfs'].graphData?.cycleDetected === false, 'Replay Step 14: Cycle was not yet detected');
assert(dfsSteps[6].structures['graph-dfs'].graphData?.visitedOrder?.length === 1, 'Replay Step 7: Only node A was visited');
assert(dfsSteps[4].structures['graph-dfs'].graphData?.visitedOrder?.length === 0, 'Replay Step 5: Visited order is empty');


// ==============================================================
// TEST 4: Section 56 Dijkstra Shortest Path Replay Verification
// ==============================================================
console.log('\n--- Test 4: Dijkstra Shortest Path, Relaxation & Replay ---');
const dijkstraEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'graph-sp', variable: 'graph', directed: false, weighted: true },
  { type: 'GRAPH_EDGE_CREATE', line: 2, structureId: 'graph-sp', edgeId: 'A--B', sourceNodeId: 'A', targetNodeId: 'B', weight: 4.0, weighted: true },
  { type: 'GRAPH_EDGE_CREATE', line: 3, structureId: 'graph-sp', edgeId: 'A--C', sourceNodeId: 'A', targetNodeId: 'C', weight: 2.0, weighted: true },
  { type: 'GRAPH_EDGE_CREATE', line: 4, structureId: 'graph-sp', edgeId: 'C--B', sourceNodeId: 'C', targetNodeId: 'B', weight: 1.0, weighted: true },
  { type: 'GRAPH_EDGE_CREATE', line: 5, structureId: 'graph-sp', edgeId: 'B--D', sourceNodeId: 'B', targetNodeId: 'D', weight: 5.0, weighted: true },
  { type: 'DIJKSTRA_START', line: 6, structureId: 'graph-sp', startNodeId: 'A' },
  { type: 'DISTANCE_INITIALIZE', line: 7, structureId: 'graph-sp', nodeId: 'A', distance: 0 },
  { type: 'DISTANCE_INITIALIZE', line: 8, structureId: 'graph-sp', nodeId: 'B', distance: 'Infinity' },
  { type: 'DISTANCE_INITIALIZE', line: 9, structureId: 'graph-sp', nodeId: 'C', distance: 'Infinity' },
  { type: 'DISTANCE_INITIALIZE', line: 10, structureId: 'graph-sp', nodeId: 'D', distance: 'Infinity' },
  { type: 'DIJKSTRA_QUEUE_INSERT', line: 11, structureId: 'graph-sp', nodeId: 'A', distance: 0 },
  { type: 'DIJKSTRA_QUEUE_REMOVE', line: 12, structureId: 'graph-sp', nodeId: 'A' },
  { type: 'DIJKSTRA_NODE_SELECT', line: 13, structureId: 'graph-sp', nodeId: 'A' },
  { type: 'DIJKSTRA_NODE_FINALIZE', line: 14, structureId: 'graph-sp', nodeId: 'A' },
  { type: 'DIJKSTRA_EDGE_RELAX', line: 15, structureId: 'graph-sp', sourceNodeId: 'A', targetNodeId: 'B', weight: 4.0, oldDistance: 'Infinity', newDistance: 4.0 },
  { type: 'DISTANCE_UPDATE', line: 16, structureId: 'graph-sp', nodeId: 'B', oldDistance: 'Infinity', newDistance: 4.0 },
  { type: 'DIJKSTRA_QUEUE_INSERT', line: 17, structureId: 'graph-sp', nodeId: 'B', distance: 4.0 },
  { type: 'DIJKSTRA_EDGE_RELAX', line: 18, structureId: 'graph-sp', sourceNodeId: 'A', targetNodeId: 'C', weight: 2.0, oldDistance: 'Infinity', newDistance: 2.0 },
  { type: 'DISTANCE_UPDATE', line: 19, structureId: 'graph-sp', nodeId: 'C', oldDistance: 'Infinity', newDistance: 2.0 },
  { type: 'DIJKSTRA_QUEUE_INSERT', line: 20, structureId: 'graph-sp', nodeId: 'C', distance: 2.0 },
  { type: 'DIJKSTRA_QUEUE_REMOVE', line: 21, structureId: 'graph-sp', nodeId: 'C' },
  { type: 'DIJKSTRA_NODE_SELECT', line: 22, structureId: 'graph-sp', nodeId: 'C' },
  { type: 'DIJKSTRA_NODE_FINALIZE', line: 23, structureId: 'graph-sp', nodeId: 'C' },
  // Edge relaxation C ➔ B updates dist[B] from 4.0 to 3.0!
  { type: 'DIJKSTRA_EDGE_RELAX', line: 24, structureId: 'graph-sp', sourceNodeId: 'C', targetNodeId: 'B', weight: 1.0, oldDistance: 4.0, newDistance: 3.0 },
  { type: 'DISTANCE_UPDATE', line: 25, structureId: 'graph-sp', nodeId: 'B', oldDistance: 4.0, newDistance: 3.0 },
  { type: 'DIJKSTRA_END', line: 26, structureId: 'graph-sp', path: ['A', 'C', 'B'], distance: 3.0 },
];

const dSteps = reconstructExecutionSteps(dijkstraEvents, '// dijkstra code');
assert(dSteps.length === 26, 'Generated 26 steps for Dijkstra execution');

// Forward states check
assert(dSteps[5].structures['graph-sp'].graphData?.algorithm === 'DIJKSTRA', 'Step 6: Dijkstra started');
assert(dSteps[13].structures['graph-sp'].graphData?.nodes['A']?.state === 'FINALIZED', 'Step 14: Node A finalized');
assert(dSteps[15].structures['graph-sp'].graphData?.distances?.['B'] === 4.0, 'Step 16: dist[B] is 4.0');
assert(dSteps[24].structures['graph-sp'].graphData?.distances?.['B'] === 3.0, 'Step 25: dist[B] relaxed to 3.0');
assert(dSteps[25].structures['graph-sp'].graphData?.shortestPath?.join('➔') === 'A➔C➔B', 'Step 26: Shortest path reconstructed A➔C➔B');

// Backward replay check
console.log('Verifying Backward Replay Snapshots for Dijkstra:');
assert(dSteps[25].structures['graph-sp'].graphData?.distances?.['B'] === 3.0, 'Replay Step 26: dist[B] = 3.0');
assert(dSteps[22].structures['graph-sp'].graphData?.distances?.['B'] === 4.0, 'Replay Step 23: dist[B] = 4.0 (before C➔B relaxation)');
assert(dSteps[13].structures['graph-sp'].graphData?.distances?.['B'] === 'Infinity' || dSteps[13].structures['graph-sp'].graphData?.distances?.['B'] === Infinity, 'Replay Step 14: dist[B] = Infinity (before initial relaxation)');
assert(dSteps[10].structures['graph-sp'].graphData?.nodes['A']?.state === 'UNVISITED', 'Replay Step 11: Node A not yet finalized');


// ==============================================================
// TEST 5: Section 57 Multiple Independent Graphs Isolation
// ==============================================================
console.log('\n--- Test 5: Multiple Independent Graphs Isolation ---');
const multiGraphEvents: ExecutionEvent[] = [
  { type: 'GRAPH_CREATE', line: 1, structureId: 'graphA', variable: 'graphA', directed: false },
  { type: 'GRAPH_CREATE', line: 2, structureId: 'graphB', variable: 'graphB', directed: true },
  { type: 'GRAPH_CREATE', line: 3, structureId: 'graphC', variable: 'graphC', directed: false, weighted: true },
  { type: 'GRAPH_NODE_CREATE', line: 4, structureId: 'graphA', nodeId: 'node-A1' },
  { type: 'GRAPH_NODE_CREATE', line: 5, structureId: 'graphA', nodeId: 'node-A2' },
  { type: 'GRAPH_EDGE_CREATE', line: 6, structureId: 'graphA', edgeId: 'eA', sourceNodeId: 'node-A1', targetNodeId: 'node-A2' },
  { type: 'GRAPH_NODE_CREATE', line: 7, structureId: 'graphB', nodeId: 'node-B1' },
  { type: 'GRAPH_EDGE_CREATE', line: 8, structureId: 'graphC', edgeId: 'eC', sourceNodeId: 'C1', targetNodeId: 'C2', weight: 10.0, weighted: true },
];

const mgSteps = reconstructExecutionSteps(multiGraphEvents, '// multi graphs');
assert(mgSteps.length === 8, 'Generated 8 steps for multi-graphs');

const finalStep = mgSteps[7];
assert(finalStep.structures['graphA'] !== undefined, 'graphA exists');
assert(finalStep.structures['graphB'] !== undefined, 'graphB exists');
assert(finalStep.structures['graphC'] !== undefined, 'graphC exists');

// Verify strict isolation
assert(finalStep.structures['graphA'].size === 2, 'graphA has 2 vertices');
assert(finalStep.structures['graphA'].graphData?.edgeList.length === 1, 'graphA has 1 edge');
assert(finalStep.structures['graphB'].size === 1, 'graphB has 1 vertex');
assert(finalStep.structures['graphB'].graphData?.edgeList.length === 0, 'graphB has 0 edges');
assert(finalStep.structures['graphC'].size === 2, 'graphC has 2 vertices (auto-created on edge)');
assert(finalStep.structures['graphC'].graphData?.edgeList.length === 1, 'graphC has 1 edge');
assert(finalStep.structures['graphC'].graphData?.weighted === true, 'graphC is weighted');
assert(finalStep.structures['graphA'].graphData?.weighted === false, 'graphA is unweighted');
assert(finalStep.structures['graphB'].graphData?.directed === true, 'graphB is directed');
assert(finalStep.structures['graphA'].graphData?.directed === false, 'graphA is undirected');

console.log('\n================================================================');
console.log('  ALL PHASE 4 REDUCER & REPLAY UNIT TESTS PASSED (100%)       ');
console.log('================================================================');
