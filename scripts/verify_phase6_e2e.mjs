import http from 'http';

function executeCode(code) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ code, language: 'java' });
    const req = http.request(
      'http://127.0.0.1:5173/api/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  CodeFlow DSA Lab — Phase 6 E2E Verification Suite ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message, details = '') {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message} ${details ? JSON.stringify(details) : ''}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --- TEST 1: Bellman-Ford ---
  console.log('--- Test 1: Bellman-Ford Execution ---');
  const bfCode = `
public class Main {
    public static void main(String[] args) {
        Graph g = new Graph(true, true);
        g.addEdge("A", "B", 4.0);
        g.addEdge("B", "C", -2.0);
        g.addEdge("A", "C", 5.0);

        CodeFlowTracer.bellmanFordStart("g", "A", 8);
        CodeFlowTracer.bellmanFordPassStart("g", 1, 2, 9);
        CodeFlowTracer.bellmanFordCompare("g", "A", "B", 4.0, 5.0, true, 10);
        CodeFlowTracer.bellmanFordDistanceUpdate("g", "B", Double.POSITIVE_INFINITY, 4.0, 11);
        CodeFlowTracer.bellmanFordPassEnd("g", 1, 12);
        CodeFlowTracer.bellmanFordEnd("g", 13);
    }
}
`;
  const res1 = await executeCode(bfCode);
  assert(res1.success, 'Bellman-Ford Java compiles and runs successfully', res1.error);
  const bfEvents = res1.events.map((e) => e.type);
  assert(bfEvents.includes('BELLMAN_FORD_START'), 'Contains BELLMAN_FORD_START event');
  assert(bfEvents.includes('BELLMAN_FORD_PASS_START'), 'Contains BELLMAN_FORD_PASS_START event');
  assert(bfEvents.includes('BELLMAN_FORD_DISTANCE_UPDATE'), 'Contains BELLMAN_FORD_DISTANCE_UPDATE event');
  assert(bfEvents.includes('BELLMAN_FORD_END'), 'Contains BELLMAN_FORD_END event');

  // --- TEST 2: Floyd-Warshall ---
  console.log('\n--- Test 2: Floyd-Warshall Execution ---');
  const fwCode = `
public class Main {
    public static void main(String[] args) {
        Graph g = new Graph(true, true);
        g.addEdge("A", "B", 3.0);
        g.addEdge("B", "C", 1.0);
        g.addEdge("A", "C", 6.0);

        CodeFlowTracer.floydWarshallStart("g", "[\\"A\\", \\"B\\", \\"C\\"]", "[[0, 3, 6], [\\"∞\\", 0, 1], [\\"∞\\", \\"∞\\", 0]]", 9);
        CodeFlowTracer.floydKUpdate("g", "B", 10);
        CodeFlowTracer.floydDistanceCompare("g", "A", "C", "B", 6.0, 4.0, true, 11);
        CodeFlowTracer.floydDistanceUpdate("g", "A", "C", "B", 6.0, 4.0, 12);
        CodeFlowTracer.floydWarshallEnd("g", 13);
    }
}
`;
  const res2 = await executeCode(fwCode);
  assert(res2.success, 'Floyd-Warshall Java runs cleanly', res2.error);
  const fwEvents = res2.events.map((e) => e.type);
  assert(fwEvents.includes('FLOYD_WARSHALL_START'), 'Contains FLOYD_WARSHALL_START event');
  assert(fwEvents.includes('FLOYD_K_UPDATE'), 'Contains FLOYD_K_UPDATE event');
  assert(fwEvents.includes('FLOYD_DISTANCE_UPDATE'), 'Contains FLOYD_DISTANCE_UPDATE event');
  assert(fwEvents.includes('FLOYD_WARSHALL_END'), 'Contains FLOYD_WARSHALL_END event');

  // --- TEST 3: Prim MST ---
  console.log('\n--- Test 3: Prim MST Execution ---');
  const primCode = `
public class Main {
    public static void main(String[] args) {
        Graph g = new Graph(false, true);
        g.addEdge("A", "B", 4.0);
        g.addEdge("A", "C", 2.0);

        CodeFlowTracer.primStart("g", "A", 7);
        CodeFlowTracer.primQueueInsert("g", "A", "C", 2.0, 8);
        CodeFlowTracer.primQueueRemove("g", "A", "C", 2.0, 9);
        CodeFlowTracer.primEdgeAccept("g", "A", "C", 2.0, 2.0, 10);
        CodeFlowTracer.primEnd("g", 2.0, 11);
    }
}
`;
  const res3 = await executeCode(primCode);
  assert(res3.success, 'Prim MST Java executes', res3.error);
  const primEvents = res3.events.map((e) => e.type);
  assert(primEvents.includes('PRIM_START'), 'Contains PRIM_START');
  assert(primEvents.includes('PRIM_EDGE_ACCEPT'), 'Contains PRIM_EDGE_ACCEPT');
  assert(primEvents.includes('PRIM_END'), 'Contains PRIM_END');

  // --- TEST 4: Kruskal MST with DisjointSet ---
  console.log('\n--- Test 4: Kruskal MST with DisjointSet Execution ---');
  const kruskalCode = `
public class Main {
    public static void main(String[] args) {
        DisjointSet dsu = new DisjointSet(3);
        CodeFlowTracer.kruskalStart("dsu", 3, 5);
        CodeFlowTracer.kruskalEdgeSelect("dsu", "A", "B", 1.0, 6);
        dsu.union(0, 1);
        CodeFlowTracer.kruskalUnion("dsu", "A", "B", "A", 8);
        CodeFlowTracer.kruskalEdgeAccept("dsu", "A", "B", 1.0, 1.0, 9);
        CodeFlowTracer.kruskalEnd("dsu", 1.0, 10);
    }
}
`;
  const res4 = await executeCode(kruskalCode);
  assert(res4.success, 'Kruskal MST Java executes', res4.error);
  const kEvents = res4.events.map((e) => e.type);
  assert(kEvents.includes('KRUSKAL_START'), 'Contains KRUSKAL_START');
  assert(kEvents.includes('KRUSKAL_UNION'), 'Contains KRUSKAL_UNION');
  assert(kEvents.includes('KRUSKAL_EDGE_ACCEPT'), 'Contains KRUSKAL_EDGE_ACCEPT');

  // --- TEST 5: Topological Sort (Kahn\'s Algorithm) ---
  console.log('\n--- Test 5: Kahn Topological Sort Execution ---');
  const topoCode = `
public class Main {
    public static void main(String[] args) {
        Graph g = new Graph(true, false);
        g.addEdge("A", "B");
        CodeFlowTracer.topologicalSortStart("g", "Kahn", 5);
        CodeFlowTracer.indegreeInitialize("g", "{\\"A\\": 0, \\"B\\": 1}", 6);
        CodeFlowTracer.topologicalNodeEnqueue("g", "A", 0, 7);
        CodeFlowTracer.topologicalNodeDequeue("g", "A", 8);
        CodeFlowTracer.topologicalNodeOutput("g", "A", 0, 9);
        CodeFlowTracer.topologicalSortEnd("g", "[\\"A\\", \\"B\\"]", 10);
    }
}
`;
  const res5 = await executeCode(topoCode);
  assert(res5.success, 'Topological Sort Java runs cleanly', res5.error);
  const tEvents = res5.events.map((e) => e.type);
  assert(tEvents.includes('TOPOLOGICAL_SORT_START'), 'Contains TOPOLOGICAL_SORT_START');
  assert(tEvents.includes('TOPOLOGICAL_NODE_OUTPUT'), 'Contains TOPOLOGICAL_NODE_OUTPUT');

  // --- TEST 6: Tarjan SCC ---
  console.log('\n--- Test 6: Tarjan SCC Execution ---');
  const tarjanCode = `
public class Main {
    public static void main(String[] args) {
        CodeFlowTracer.tarjanStart("g", 3);
        CodeFlowTracer.tarjanDiscover("g", "A", 0, 0, 4);
        CodeFlowTracer.tarjanStackPush("g", "A", 5);
        CodeFlowTracer.tarjanSccStart("g", 1, "A", 6);
        CodeFlowTracer.tarjanStackPop("g", "A", 1, 7);
        CodeFlowTracer.tarjanSccEnd("g", 1, "[\\"A\\"]", 8);
        CodeFlowTracer.tarjanEnd("g", 1, 9);
    }
}
`;
  const res6 = await executeCode(tarjanCode);
  assert(res6.success, 'Tarjan SCC Java executes cleanly', res6.error);
  const tjEvents = res6.events.map((e) => e.type);
  assert(tjEvents.includes('TARJAN_START'), 'Contains TARJAN_START');
  assert(tjEvents.includes('TARJAN_DISCOVER'), 'Contains TARJAN_DISCOVER');
  assert(tjEvents.includes('TARJAN_SCC_END'), 'Contains TARJAN_SCC_END');

  // --- TEST 7: AVL Tree ---
  console.log('\n--- Test 7: AVL Tree Rotations Execution ---');
  const avlCode = `
public class Main {
    public static void main(String[] args) {
        AVLTree avl = new AVLTree();
        CodeFlowTracer.avlCreate("avl", "AVLTree", 4);
        avl.insert(30);
        CodeFlowTracer.avlInsert("avl", "node_30", 30, 6);
        avl.insert(20);
        CodeFlowTracer.avlInsert("avl", "node_20", 20, 8);
        CodeFlowTracer.avlBalanceCheck("avl", "node_30", 2, 0, 2, 9);
        CodeFlowTracer.avlRotateRight("avl", "node_30", "node_20", 10);
        CodeFlowTracer.avlRootUpdate("avl", "node_20", 11);
        CodeFlowTracer.avlEnd("avl", 12);
    }
}
`;
  const res7 = await executeCode(avlCode);
  assert(res7.success, 'AVL Tree Java executes with rotations', res7.error);
  const avlEv = res7.events.map((e) => e.type);
  assert(avlEv.includes('AVL_CREATE'), 'Contains AVL_CREATE');
  assert(avlEv.includes('AVL_BALANCE_CHECK'), 'Contains AVL_BALANCE_CHECK');
  assert(avlEv.includes('AVL_ROTATE_RIGHT'), 'Contains AVL_ROTATE_RIGHT');
  assert(avlEv.includes('AVL_ROOT_UPDATE'), 'Contains AVL_ROOT_UPDATE');

  // --- TEST 8: Binary Search on Answer ---
  console.log('\n--- Test 8: Binary Search on Answer Execution ---');
  const bsCode = `
public class Main {
    public static void main(String[] args) {
        CodeFlowTracer.answerSearchStart("ans", 1, 100, 3);
        CodeFlowTracer.answerSearchMid("ans", 50, 4);
        CodeFlowTracer.answerSearchFeasibilityCheck("ans", 50, true, "Feasible", 5);
        CodeFlowTracer.answerSearchRangeUpdate("ans", 1, 49, 50, 6);
        CodeFlowTracer.answerSearchEnd("ans", 42, 7);
    }
}
`;
  const res8 = await executeCode(bsCode);
  assert(res8.success, 'Binary Search on Answer executes', res8.error);
  const bsEv = res8.events.map((e) => e.type);
  assert(bsEv.includes('ANSWER_SEARCH_START'), 'Contains ANSWER_SEARCH_START');
  assert(bsEv.includes('ANSWER_SEARCH_FEASIBILITY_CHECK'), 'Contains ANSWER_SEARCH_FEASIBILITY_CHECK');
  assert(bsEv.includes('ANSWER_SEARCH_END'), 'Contains ANSWER_SEARCH_END');

  // --- TEST 9: Monotonic Stack ---
  console.log('\n--- Test 9: Monotonic Stack Execution ---');
  const monoCode = `
public class Main {
    public static void main(String[] args) {
        CodeFlowTracer.monoStackStart("stack", "DECREASING", 3);
        CodeFlowTracer.monoStackCompare("stack", 5, 2, true, 4);
        CodeFlowTracer.monoStackPop("stack", 2, 5);
        CodeFlowTracer.monoStackPush("stack", 5, 6);
        CodeFlowTracer.monoStackEnd("stack", 7);
    }
}
`;
  const res9 = await executeCode(monoCode);
  assert(res9.success, 'Monotonic Stack executes', res9.error);
  const mEv = res9.events.map((e) => e.type);
  assert(mEv.includes('MONO_STACK_START'), 'Contains MONO_STACK_START');
  assert(mEv.includes('MONO_STACK_COMPARE'), 'Contains MONO_STACK_COMPARE');
  assert(mEv.includes('MONO_STACK_POP'), 'Contains MONO_STACK_POP');
  assert(mEv.includes('MONO_STACK_PUSH'), 'Contains MONO_STACK_PUSH');

  // --- TEST 10: Final Comprehensive Demo ---
  console.log('\n--- Test 10: Section 63 Comprehensive Demo Execution ---');
  const compCode = `
public class Main {
    public static void main(String[] args) {
        Graph g = new Graph(true, true);
        g.addEdge("A", "B", 4.0);
        CodeFlowTracer.bellmanFordStart("g", "A", 5);
        CodeFlowTracer.bellmanFordEnd("g", 6);

        Graph mst = new Graph(false, true);
        mst.addEdge("A", "C", 2.0);
        CodeFlowTracer.primStart("mst", "A", 10);
        CodeFlowTracer.primEnd("mst", 2.0, 11);

        AVLTree avl = new AVLTree();
        CodeFlowTracer.avlCreate("avl", "AVLTree", 14);
        avl.insert(10);
        CodeFlowTracer.avlEnd("avl", 16);
    }
}
`;
  const res10 = await executeCode(compCode);
  assert(res10.success, 'Section 63 Comprehensive Multi-Algorithm Demo executes cleanly', res10.error);
  const compEv = res10.events.map((e) => e.type);
  assert(compEv.includes('BELLMAN_FORD_START'), 'Comprehensive: Contains Bellman-Ford');
  assert(compEv.includes('PRIM_START'), 'Comprehensive: Contains Prim MST');
  assert(compEv.includes('AVL_CREATE'), 'Comprehensive: Contains AVL');

  console.log('\n====================================================');
  console.log(`  ALL ${totalTests} E2E EXECUTION TESTS PASSED! (${passedTests}/${totalTests})`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\nE2E Suite Failed:', err);
  process.exit(1);
});
