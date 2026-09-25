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
  console.log('  CodeFlow DSA Lab — Phase 4 E2E Verification Suite ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --- TEST 1: Undirected & Directed Graph ---
  console.log('Test 1: Undirected & Directed Graph Creation');
  const graphCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false);
        graph.addVertex("A");
        graph.addVertex("B");
        graph.addVertex("C");
        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("A", "C");
    }
}
`;
  const graphRes = await executeCode(graphCode);
  if (!graphRes.success) {
    console.error('graphRes error details:', JSON.stringify(graphRes, null, 2));
  }
  assert(graphRes.success, 'Graph code executed on JVM successfully');
  const graphEvents = graphRes.events || [];
  assert(graphEvents.some((e) => e.type === 'GRAPH_CREATE'), 'GRAPH_CREATE event captured');
  assert(graphEvents.filter((e) => e.type === 'GRAPH_NODE_CREATE').length >= 3, 'At least 3 GRAPH_NODE_CREATE events');
  assert(graphEvents.filter((e) => e.type === 'GRAPH_EDGE_CREATE').length >= 3, 'At least 3 GRAPH_EDGE_CREATE events');


  // --- TEST 2: Weighted Graph ---
  console.log('\nTest 2: Weighted Graph with Edge Weights');
  const weightedCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false, true);
        graph.addEdge("A", "B", 4.0);
        graph.addEdge("B", "C", 2.0);
        graph.addEdge("A", "C", 7.0);
    }
}
`;
  const wRes = await executeCode(weightedCode);
  assert(wRes.success, 'Weighted Graph executed successfully');
  const wEvents = wRes.events || [];
  assert(wEvents.some((e) => e.type === 'GRAPH_EDGE_CREATE' && e.weighted === true && e.weight === 4.0), 'Edge A-B has weight 4.0');
  assert(wEvents.some((e) => e.type === 'GRAPH_EDGE_CREATE' && e.weighted === true && e.weight === 2.0), 'Edge B-C has weight 2.0');


  // --- TEST 3: BFS Traversal ---
  console.log('\nTest 3: Breadth-First Search (BFS)');
  const bfsCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false);
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("B", "D");
        graph.bfs("A");
    }
}
`;
  const bfsRes = await executeCode(bfsCode);
  assert(bfsRes.success, 'BFS executed successfully');
  const bfsEvents = bfsRes.events || [];
  assert(bfsEvents.some((e) => e.type === 'BFS_START' && (e.nodeId === 'A' || e.startNodeId === 'A')), 'BFS_START from node A');
  assert(bfsEvents.some((e) => e.type === 'BFS_ENQUEUE'), 'BFS_ENQUEUE events generated');
  assert(bfsEvents.some((e) => e.type === 'BFS_DEQUEUE'), 'BFS_DEQUEUE events generated');
  assert(bfsEvents.some((e) => e.type === 'BFS_NODE_VISIT'), 'BFS_NODE_VISIT events generated');
  assert(bfsEvents.some((e) => e.type === 'BFS_END'), 'BFS_END event generated');


  // --- TEST 4: DFS Traversal with Cycle Detection ---
  console.log('\nTest 4: Depth-First Search (DFS) & Cycle Detection');
  const dfsCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(true);
        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("C", "A"); // cycle
        graph.dfs("A");
    }
}
`;
  const dfsRes = await executeCode(dfsCode);
  assert(dfsRes.success, 'DFS code executed successfully');
  const dfsEvents = dfsRes.events || [];
  assert(dfsEvents.some((e) => e.type === 'DFS_START'), 'DFS_START event captured');
  assert(dfsEvents.some((e) => e.type === 'DFS_NODE_VISIT'), 'DFS_NODE_VISIT event captured');
  assert(dfsEvents.some((e) => e.type === 'DFS_ALREADY_VISITED'), 'DFS_ALREADY_VISITED cycle event captured');
  assert(dfsEvents.some((e) => e.type === 'DFS_END'), 'DFS_END event captured');


  // --- TEST 5: Dijkstra's Shortest Path ---
  console.log('\nTest 5: Dijkstra Shortest Path Algorithm');
  const dijkstraCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false, true);
        graph.addEdge("A", "B", 4.0);
        graph.addEdge("A", "C", 2.0);
        graph.addEdge("B", "C", 1.0);
        graph.dijkstra("A");
    }
}
`;
  const dRes = await executeCode(dijkstraCode);
  assert(dRes.success, 'Dijkstra executed successfully');
  const dEvents = dRes.events || [];
  assert(dEvents.some((e) => e.type === 'DIJKSTRA_START'), 'DIJKSTRA_START event captured');
  assert(dEvents.some((e) => e.type === 'DISTANCE_INITIALIZE'), 'DISTANCE_INITIALIZE captured');
  assert(dEvents.some((e) => e.type === 'DIJKSTRA_EDGE_RELAX'), 'DIJKSTRA_EDGE_RELAX captured');
  assert(dEvents.some((e) => e.type === 'DISTANCE_UPDATE'), 'DISTANCE_UPDATE captured');
  assert(dEvents.some((e) => e.type === 'DIJKSTRA_END'), 'DIJKSTRA_END captured');


  // --- TEST 6: Multiple Graphs Isolation ---
  console.log('\nTest 6: Multiple Independent Graphs');
  const multiCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graphA = new Graph(false);
        graphA.addEdge("A", "B");

        Graph graphB = new Graph(true);
        graphB.addEdge("X", "Y");
    }
}
`;
  const mRes = await executeCode(multiCode);
  assert(mRes.success, 'Multiple graphs executed successfully');
  const mEvents = mRes.events || [];
  assert(mEvents.some((e) => e.structureId === 'graphA'), 'Events for graphA exist');
  assert(mEvents.some((e) => e.structureId === 'graphB'), 'Events for graphB exist');


  // --- TEST 7: Section 60 Final Demo (Full DSA Integration) ---
  console.log('\nTest 7: Section 60 Final Demo (Full DSA Integration)');
  const finalDemoCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false, true);
        graph.addEdge("A", "B", 4.0);
        graph.addEdge("A", "C", 2.0);
        graph.addEdge("B", "D", 5.0);
        graph.addEdge("C", "E", 6.0);
        graph.addEdge("D", "E", 3.0);

        Queue<String> bfsQueue = new LinkedList<>();
        Set<String> visitedSet = new HashSet<>();
        bfsQueue.add("A");
        visitedSet.add("A");

        Map<String, Integer> distances = new HashMap<>();
        distances.put("A", 0);
        distances.put("B", 4);
        distances.put("C", 2);
        distances.put("D", 5);
        distances.put("E", 6);

        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.add(2);
        pq.add(4);
        pq.add(5);

        graph.dijkstra("A");
    }
}
`;
  const finalRes = await executeCode(finalDemoCode);
  assert(finalRes.success, 'Final Demo executed successfully on JVM');
  const finalEvents = finalRes.events || [];
  assert(finalEvents.some((e) => e.type === 'QUEUE_ENQUEUE'), 'Queue operations captured in final demo');
  assert(finalEvents.some((e) => e.type === 'SET_ADD'), 'HashSet operations captured in final demo');
  assert(finalEvents.some((e) => e.type === 'MAP_INSERT'), 'HashMap operations captured in final demo');
  assert(finalEvents.some((e) => e.type === 'PRIORITYQUEUE_ADD'), 'PriorityQueue operations captured in final demo');
  assert(finalEvents.some((e) => e.type === 'DIJKSTRA_START'), 'Dijkstra execution captured in final demo');
  assert(finalEvents.some((e) => e.type === 'DIJKSTRA_END'), 'Dijkstra completed in final demo');

  console.log('\n====================================================');
  console.log(`  ALL ${passedTests}/${totalTests} PHASE 4 E2E TESTS PASSED (100%)!`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
