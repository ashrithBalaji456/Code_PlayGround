import { executeJavaWorker } from '../src/server/javaExecutor.ts';
import { reconstructExecutionSteps } from '../src/engine/stateReconstructor.ts';

function assert(cond: boolean, msg: string, details?: any) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`, details ? details : '');
    process.exit(1);
  }
}

async function runRegressionSuite() {
  console.log('================================================================');
  console.log('  UNIVERSAL JAVA RUNTIME OBSERVATION: 16-TEST REGRESSION SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Primitive Variables
  // -------------------------------------------------------------
  console.log('--- Test 1: Primitive Variables ---');
  const t1Code = `public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int c = a + b;
    }
}`;
  const r1 = await executeJavaWorker(t1Code);
  assert(r1.success, 'Test 1 executes successfully');
  const s1 = reconstructExecutionSteps(r1.events!, t1Code);
  const last1 = s1[s1.length - 1];
  assert(last1.variables['a']?.value === 10, 'Variable a = 10', last1.variables['a']);
  assert(last1.variables['b']?.value === 20, 'Variable b = 20', last1.variables['b']);
  assert(last1.variables['c']?.value === 30, 'Variable c = 30', last1.variables['c']);

  // -------------------------------------------------------------
  // Test 2: Array & Mutation
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Array & Mutation ---');
  const t2Code = `public class Main {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        arr[1] = 99;
    }
}`;
  const r2 = await executeJavaWorker(t2Code);
  assert(r2.success, 'Test 2 executes successfully');
  const s2 = reconstructExecutionSteps(r2.events!, t2Code);
  const last2 = s2[s2.length - 1];
  const arrData = last2.structures['arr']?.arrayData;
  assert(Array.isArray(arrData) && arrData[0] === 1 && arrData[1] === 99 && arrData[2] === 3, 'Array mutated to [1, 99, 3]', arrData);

  // -------------------------------------------------------------
  // Test 3: ArrayList
  // -------------------------------------------------------------
  console.log('\n--- Test 3: ArrayList ---');
  const t3Code = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.remove(0);
    }
}`;
  const r3 = await executeJavaWorker(t3Code);
  assert(r3.success, 'Test 3 executes successfully');
  const s3 = reconstructExecutionSteps(r3.events!, t3Code);
  const last3 = s3[s3.length - 1];
  const listData = last3.structures['list']?.arrayData;
  assert(Array.isArray(listData) && listData.length === 1 && listData[0] === 20, 'ArrayList contains [20]', listData);

  // -------------------------------------------------------------
  // Test 4: Queue (LinkedList)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Queue ---');
  const t4Code = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(1);
        queue.offer(2);
        queue.poll();
    }
}`;
  const r4 = await executeJavaWorker(t4Code);
  assert(r4.success, 'Test 4 executes successfully');
  const s4 = reconstructExecutionSteps(r4.events!, t4Code);
  const last4 = s4[s4.length - 1];
  const qData = last4.structures['queue']?.queueData;
  assert(Array.isArray(qData) && qData.length === 1 && qData[0] === 2, 'Queue contains [2] after offer(1), offer(2), poll()', qData);

  // -------------------------------------------------------------
  // Test 5: Stack
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Stack ---');
  const t5Code = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();
        stack.push(1);
        stack.push(2);
        stack.pop();
    }
}`;
  const r5 = await executeJavaWorker(t5Code);
  assert(r5.success, 'Test 5 executes successfully');
  const s5 = reconstructExecutionSteps(r5.events!, t5Code);
  const last5 = s5[s5.length - 1];
  const stkData = last5.structures['stack']?.stackData;
  assert(Array.isArray(stkData) && stkData.length === 1 && stkData[0] === 1, 'Stack contains [1] after push(1), push(2), pop()', stkData);

  // -------------------------------------------------------------
  // Test 6: HashMap
  // -------------------------------------------------------------
  console.log('\n--- Test 6: HashMap ---');
  const t6Code = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put("A", 10);
        map.put("B", 20);
        map.put("A", 99);
    }
}`;
  const r6 = await executeJavaWorker(t6Code);
  assert(r6.success, 'Test 6 executes successfully');
  const s6 = reconstructExecutionSteps(r6.events!, t6Code);
  const last6 = s6[s6.length - 1];
  const mapEntries = last6.structures['map']?.mapData?.entries;
  assert(Array.isArray(mapEntries) && mapEntries.length === 2, 'HashMap has 2 unique keys', mapEntries);
  const entryA = mapEntries.find((e: any) => e.key === 'A');
  assert(entryA && entryA.value === 99, 'Key A updated to 99', entryA);

  // -------------------------------------------------------------
  // Test 7: HashSet
  // -------------------------------------------------------------
  console.log('\n--- Test 7: HashSet ---');
  const t7Code = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Set<Integer> set = new HashSet<>();
        set.add(10);
        set.add(20);
        set.remove(10);
    }
}`;
  const r7 = await executeJavaWorker(t7Code);
  assert(r7.success, 'Test 7 executes successfully');
  const s7 = reconstructExecutionSteps(r7.events!, t7Code);
  const last7 = s7[s7.length - 1];
  const setData = last7.structures['set']?.setData;
  assert(Array.isArray(setData) && setData.length === 1 && setData[0] === 20, 'HashSet contains [20]', setData);

  // -------------------------------------------------------------
  // Test 8: Nested List
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Nested List ---');
  const t8Code = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        List<List<Integer>> graph = new ArrayList<>();
        graph.add(new ArrayList<>());
        graph.get(0).add(10);
    }
}`;
  const r8 = await executeJavaWorker(t8Code);
  assert(r8.success, 'Test 8 executes successfully');
  const s8 = reconstructExecutionSteps(r8.events!, t8Code);
  const last8 = s8[s8.length - 1];
  const gData = last8.structures['graph']?.arrayData;
  assert(Array.isArray(gData) && gData.length === 1 && Array.isArray(gData[0]) && gData[0][0] === 10, 'Nested list contains [[10]]', gData);

  // -------------------------------------------------------------
  // Test 9: Mandatory Full BFS
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Mandatory Full BFS Regression ---');
  const t9Code = `import java.util.*;

public class Main {

    static void bfs(List<List<Integer>> graph, int start) {
        boolean[] visited = new boolean[graph.size()];
        Queue<Integer> queue = new LinkedList<>();

        queue.offer(start);
        visited[start] = true;

        while (!queue.isEmpty()) {
            int node = queue.poll();
            System.out.print(node + " ");

            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
    }

    public static void main(String[] args) {
        int n = 6;

        List<List<Integer>> graph = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            graph.add(new ArrayList<>());
        }

        graph.get(0).add(1);
        graph.get(0).add(2);

        graph.get(1).add(0);
        graph.get(1).add(3);
        graph.get(1).add(4);

        graph.get(2).add(0);
        graph.get(2).add(4);

        graph.get(3).add(1);
        graph.get(3).add(5);

        graph.get(4).add(1);
        graph.get(4).add(2);
        graph.get(4).add(5);

        graph.get(5).add(3);
        graph.get(5).add(4);

        bfs(graph, 0);
    }
}`;
  const r9 = await executeJavaWorker(t9Code);
  assert(r9.success, 'BFS program executes successfully');
  const consoleCombined = (r9.consoleOutput || []).join('').trim();
  assert(consoleCombined === '0 1 2 3 4 5', 'BFS printed 0 1 2 3 4 5', consoleCombined);
  const s9 = reconstructExecutionSteps(r9.events!, t9Code);
  const last9 = s9[s9.length - 1];
  assert(last9.structures['graph'] !== undefined, 'graph structure exists');
  assert(last9.structures['visited'] !== undefined, 'visited structure exists');
  assert(last9.structures['queue'] !== undefined, 'queue structure exists');
  assert(last9.structures['graph_graph'] !== undefined, 'graph_graph adjacency view exists');

  // -------------------------------------------------------------
  // Test 10: Custom Linked List
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Custom Linked List ---');
  const t10Code = `class Node {
    int value;
    Node next;
    Node(int value) {
        this.value = value;
    }
}

public class Main {
    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20);
        head.next.next = new Node(30);
    }
}`;
  const r10 = await executeJavaWorker(t10Code);
  assert(r10.success, 'Test 10 executes successfully');
  const s10 = reconstructExecutionSteps(r10.events!, t10Code);
  const last10 = s10[s10.length - 1];
  assert(last10.structures['head']?.type === 'linkedlist', 'head recognized as linkedlist', last10.structures['head']);
  const llNodes = last10.structures['head']?.linkedListData?.nodes;
  assert(llNodes && Object.keys(llNodes).length === 3, 'head linked list has 3 nodes', llNodes);

  // -------------------------------------------------------------
  // Test 11: Binary Tree
  // -------------------------------------------------------------
  console.log('\n--- Test 11: Binary Tree ---');
  const t11Code = `class Node {
    int value;
    Node left;
    Node right;
    Node(int value) {
        this.value = value;
    }
}

public class Main {
    public static void main(String[] args) {
        Node root = new Node(10);
        root.left = new Node(5);
        root.right = new Node(15);
    }
}`;
  const r11 = await executeJavaWorker(t11Code);
  assert(r11.success, 'Test 11 executes successfully');
  const s11 = reconstructExecutionSteps(r11.events!, t11Code);
  const last11 = s11[s11.length - 1];
  assert(last11.structures['root']?.type === 'tree', 'root recognized as tree', last11.structures['root']);
  const treeNodes = last11.structures['root']?.treeData?.nodes;
  assert(treeNodes && Object.keys(treeNodes).length === 3, 'binary tree has 3 nodes', treeNodes);

  // -------------------------------------------------------------
  // Test 12: Object References & Aliasing
  // -------------------------------------------------------------
  console.log('\n--- Test 12: Object References & Aliasing ---');
  const t12Code = `class Node {
    int value;
    Node(int value) {
        this.value = value;
    }
}

public class Main {
    public static void main(String[] args) {
        Node a = new Node(10);
        Node b = a;
        b.value = 20;
    }
}`;
  const r12 = await executeJavaWorker(t12Code);
  assert(r12.success, 'Test 12 executes successfully');
  const s12 = reconstructExecutionSteps(r12.events!, t12Code);
  const last12 = s12[s12.length - 1];
  assert(last12.variables['a']?.refTargetId === last12.variables['b']?.refTargetId, 'a and b reference same object ID', {
    a: last12.variables['a']?.refTargetId,
    b: last12.variables['b']?.refTargetId,
  });

  // -------------------------------------------------------------
  // Test 13: Null First-Class State
  // -------------------------------------------------------------
  console.log('\n--- Test 13: Null First-Class State ---');
  const t13Code = `class Node {
    int value;
    Node(int value) {
        this.value = value;
    }
}

public class Main {
    public static void main(String[] args) {
        Node node = null;
    }
}`;
  const r13 = await executeJavaWorker(t13Code);
  assert(r13.success, 'Test 13 executes successfully');
  const s13 = reconstructExecutionSteps(r13.events!, t13Code);
  const last13 = s13[s13.length - 1];
  assert(last13.variables['node']?.value === 'null', 'node variable has null value', last13.variables['node']);

  // -------------------------------------------------------------
  // Test 14: NullPointerException with Source Sync
  // -------------------------------------------------------------
  console.log('\n--- Test 14: NullPointerException ---');
  const t14Code = `class Node {
    int value;
    Node(int value) {
        this.value = value;
    }
}

public class Main {
    public static void main(String[] args) {
        Node node = null;
        System.out.println(node.value);
    }
}`;
  const r14 = await executeJavaWorker(t14Code);
  assert(r14.events && r14.events.length > 0, 'Events captured despite exception');
  const s14 = reconstructExecutionSteps(r14.events!, t14Code);
  const last14 = s14[s14.length - 1];
  assert(last14.variables['node']?.value === 'null', 'node = null preserved before NPE');
  assert(last14.error?.type?.includes('NullPointer') || last14.error?.detail?.includes('NullPointer'), 'NullPointerException caught and synchronized', last14.error);

  // -------------------------------------------------------------
  // Test 15: Recursion & Call Stack
  // -------------------------------------------------------------
  console.log('\n--- Test 15: Recursion & Call Stack ---');
  const t15Code = `public class Main {
    static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        int res = factorial(4);
    }
}`;
  const r15 = await executeJavaWorker(t15Code);
  assert(r15.success, 'Test 15 executes successfully');
  const s15 = reconstructExecutionSteps(r15.events!, t15Code);
  const last15 = s15[s15.length - 1];
  assert(last15.variables['res']?.value === 24, 'factorial(4) = 24', last15.variables['res']);
  const funcCallEvents = r15.events!.filter((e: any) => e.type === 'FUNCTION_CALL');
  assert(funcCallEvents.length >= 4, 'Multiple recursive function calls recorded', funcCallEvents.length);

  // -------------------------------------------------------------
  // Test 16: Multiple Coexisting Structures
  // -------------------------------------------------------------
  console.log('\n--- Test 16: Multiple Coexisting Structures ---');
  const t16Code = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        List<Integer> list = new ArrayList<>();
        list.add(10);
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(20);
        Map<Integer, String> map = new HashMap<>();
        map.put(1, "one");
        Set<Integer> set = new HashSet<>();
        set.add(30);
    }
}`;
  const r16 = await executeJavaWorker(t16Code);
  assert(r16.success, 'Test 16 executes successfully');
  const s16 = reconstructExecutionSteps(r16.events!, t16Code);
  const last16 = s16[s16.length - 1];
  assert(last16.structures['arr'] !== undefined, 'arr coexists');
  assert(last16.structures['list'] !== undefined, 'list coexists');
  assert(last16.structures['queue'] !== undefined, 'queue coexists');
  assert(last16.structures['map'] !== undefined, 'map coexists');
  assert(last16.structures['set'] !== undefined, 'set coexists');

  console.log('\n================================================================');
  console.log('  🎉 ALL 16 REGRESSION TESTS PASSED PERFECTLY!');
  console.log('================================================================\n');
}

runRegressionSuite().catch((err) => {
  console.error('Regression suite failed:', err);
  process.exit(1);
});
