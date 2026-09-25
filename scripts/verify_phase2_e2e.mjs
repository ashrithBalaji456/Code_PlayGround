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
  console.log('  CodeFlow DSA Lab — Phase 2 E2E Verification Suite ');
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

  // --- TEST 1: Section 32 Comprehensive Demo ---
  console.log('Test 1: Section 32 Comprehensive Multi-Structure Execution');
  const demoCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();
        Queue<Integer> queue = new LinkedList<>();
        LinkedList<Integer> list = new LinkedList<>();
        HashMap<String, Integer> map = new HashMap<>();
        HashSet<Integer> set = new HashSet<>();

        stack.push(10);
        stack.push(20);

        queue.add(30);
        queue.add(40);

        list.add(50);
        list.add(60);

        map.put("Java", 90);
        map.put("DSA", 95);

        set.add(100);
        set.add(200);

        stack.pop();
        queue.poll();
        list.removeFirst();
        map.put("Java", 100);
        set.remove(100);
    }
}
`;

  const res1 = await executeCode(demoCode);
  assert(res1.success === true, 'Execution completed successfully on Java backend');
  assert(Array.isArray(res1.events) && res1.events.length > 0, `Received trace with ${res1.events?.length} events`);

  const eventTypes = res1.events.map((e) => e.type);
  assert(eventTypes.includes('STACK_CREATE'), 'Includes STACK_CREATE event');
  assert(eventTypes.includes('STACK_PUSH'), 'Includes STACK_PUSH event');
  assert(eventTypes.includes('STACK_POP'), 'Includes STACK_POP event');
  assert(eventTypes.includes('QUEUE_CREATE'), 'Includes QUEUE_CREATE event');
  assert(eventTypes.includes('QUEUE_ENQUEUE'), 'Includes QUEUE_ENQUEUE event');
  assert(eventTypes.includes('QUEUE_DEQUEUE'), 'Includes QUEUE_DEQUEUE event');
  assert(eventTypes.includes('LINKEDLIST_CREATE'), 'Includes LINKEDLIST_CREATE event');
  assert(eventTypes.includes('LINKEDLIST_ADD'), 'Includes LINKEDLIST_ADD event');
  assert(eventTypes.includes('LINKEDLIST_REMOVE_FIRST'), 'Includes LINKEDLIST_REMOVE_FIRST event');
  assert(eventTypes.includes('MAP_CREATE'), 'Includes MAP_CREATE event');
  assert(eventTypes.includes('MAP_INSERT'), 'Includes MAP_INSERT event');
  assert(eventTypes.includes('SET_CREATE'), 'Includes SET_CREATE event');
  assert(eventTypes.includes('SET_ADD'), 'Includes SET_ADD event');
  assert(eventTypes.includes('SET_REMOVE'), 'Includes SET_REMOVE event');

  // Verify structure IDs are distinct
  const stackEvents = res1.events.filter((e) => e.type.startsWith('STACK_'));
  const queueEvents = res1.events.filter((e) => e.type.startsWith('QUEUE_'));
  const mapEvents = res1.events.filter((e) => e.type.startsWith('MAP_'));
  assert(stackEvents.every((e) => e.structureId === 'stack'), 'Stack events bound to structureId="stack"');
  assert(queueEvents.every((e) => e.structureId === 'queue'), 'Queue events bound to structureId="queue"');
  assert(mapEvents.every((e) => e.structureId === 'map'), 'Map events bound to structureId="map"');

  // --- TEST 2: Multiple Stacks Independence (Section 6) ---
  console.log('\nTest 2: Multiple Stacks Independence (a, b, c)');
  const multiStackCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Stack<Integer> a = new Stack<>();
        Stack<Integer> b = new Stack<>();
        Stack<Integer> c = new Stack<>();

        a.push(10);
        b.push(20);
        c.push(30);
    }
}
`;

  const res2 = await executeCode(multiStackCode);
  assert(res2.success === true, 'Multiple stacks executed successfully');
  const aPushes = res2.events.filter((e) => e.type === 'STACK_PUSH' && e.structureId === 'a');
  const bPushes = res2.events.filter((e) => e.type === 'STACK_PUSH' && e.structureId === 'b');
  const cPushes = res2.events.filter((e) => e.type === 'STACK_PUSH' && e.structureId === 'c');
  assert(aPushes.length === 1 && aPushes[0].value === 10, 'Stack a pushed 10 independently');
  assert(bPushes.length === 1 && bPushes[0].value === 20, 'Stack b pushed 20 independently');
  assert(cPushes.length === 1 && cPushes[0].value === 30, 'Stack c pushed 30 independently');

  // --- TEST 3: Deque & PriorityQueue ---
  console.log('\nTest 3: Deque & PriorityQueue Execution');
  const dequePqCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> dq = new ArrayDeque<>();
        dq.addFirst(10);
        dq.addLast(20);
        dq.removeFirst();
        dq.removeLast();

        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.add(30);
        pq.add(10);
        pq.poll();
    }
}
`;

  const res3 = await executeCode(dequePqCode);
  assert(res3.success === true, 'Deque & PriorityQueue executed successfully');
  const dqTypes = res3.events.map((e) => e.type);
  assert(dqTypes.includes('DEQUE_CREATE'), 'Includes DEQUE_CREATE event');
  assert(dqTypes.includes('DEQUE_ADD_FIRST'), 'Includes DEQUE_ADD_FIRST event');
  assert(dqTypes.includes('DEQUE_ADD_LAST'), 'Includes DEQUE_ADD_LAST event');
  assert(dqTypes.includes('DEQUE_REMOVE_FIRST'), 'Includes DEQUE_REMOVE_FIRST event');
  assert(dqTypes.includes('DEQUE_REMOVE_LAST'), 'Includes DEQUE_REMOVE_LAST event');
  assert(dqTypes.includes('PRIORITYQUEUE_CREATE'), 'Includes PRIORITYQUEUE_CREATE event');
  assert(dqTypes.includes('PRIORITYQUEUE_ADD'), 'Includes PRIORITYQUEUE_ADD event');
  assert(dqTypes.includes('PRIORITYQUEUE_POLL'), 'Includes PRIORITYQUEUE_POLL event');

  // --- TEST 4: HashSet Duplicate Rejection (Section 16) ---
  console.log('\nTest 4: HashSet Duplicate Rejection');
  const setCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        HashSet<Integer> set = new HashSet<>();
        set.add(10);
        set.add(20);
        set.add(10);
    }
}
`;

  const res4 = await executeCode(setCode);
  assert(res4.success === true, 'HashSet executed successfully');
  const setAddEvents = res4.events.filter((e) => e.type === 'SET_ADD');
  assert(setAddEvents.length === 3, 'Traced 3 set.add calls');
  assert(setAddEvents[0].conditionResult === true, 'First 10 added with result true');
  assert(setAddEvents[1].conditionResult === true, '20 added with result true');
  assert(setAddEvents[2].conditionResult === false, 'Duplicate 10 detected and flagged with result false');

  console.log(`\n====================================================`);
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED PERFECTLY!`);
  console.log(`====================================================`);
}

runTests().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
