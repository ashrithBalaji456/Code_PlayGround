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
  console.log('  CodeFlow DSA Lab — Phase 3 E2E Verification Suite ');
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

  // --- TEST 1: Binary Tree Execution ---
  console.log('Test 1: Binary Tree (Nodes & References)');
  const treeCode = `
public class Main {
    public static void main(String[] args) {
        TreeNode root = new TreeNode(10);
        root.left = new TreeNode(20);
        root.right = new TreeNode(30);
        root.left.left = new TreeNode(40);
        root.left.right = new TreeNode(50);
    }
}
`;
  const treeRes = await executeCode(treeCode);
  if (!treeRes.success) {
    console.error('treeRes error details:', JSON.stringify(treeRes, null, 2));
  }
  assert(treeRes.success, 'Binary Tree executed successfully');
  const treeEvents = treeRes.events || [];
  assert(treeEvents.some((e) => e.type === 'TREE_CREATE'), 'Emitted TREE_CREATE event');
  assert(treeEvents.filter((e) => e.type === 'TREE_NODE_CREATE').length >= 5, 'Emitted at least 5 TREE_NODE_CREATE events');
  assert(treeEvents.some((e) => e.type === 'TREE_LINK_LEFT'), 'Emitted TREE_LINK_LEFT event');
  assert(treeEvents.some((e) => e.type === 'TREE_LINK_RIGHT'), 'Emitted TREE_LINK_RIGHT event');

  // --- TEST 2: Binary Search Tree (BST) ---
  console.log('\nTest 2: Binary Search Tree (Insert, Search, Delete)');
  const bstCode = `
public class Main {
    public static void main(String[] args) {
        BST bst = new BST();
        bst.insert(50);
        bst.insert(30);
        bst.insert(70);
        bst.insert(20);
        bst.insert(40);

        bst.search(30);
        bst.delete(20);
    }
}
`;
  const bstRes = await executeCode(bstCode);
  if (!bstRes.success) {
    console.error('bstRes error details:', JSON.stringify(bstRes, null, 2));
  }
  assert(bstRes.success, 'BST program executed successfully');
  const bstEvents = bstRes.events || [];
  assert(bstEvents.some((e) => e.type === 'BST_CREATE'), 'Emitted BST_CREATE event');
  assert(bstEvents.filter((e) => e.type === 'BST_INSERT').length >= 5, 'Emitted 5 BST_INSERT events');
  assert(bstEvents.some((e) => e.type === 'BST_SEARCH_START'), 'Emitted BST_SEARCH_START event');
  assert(bstEvents.some((e) => e.type === 'BST_DELETE'), 'Emitted BST_DELETE event');

  // --- TEST 3: Heap / PriorityQueue Integration ---
  console.log('\nTest 3: Heap / PriorityQueue Dual Integration');
  const heapCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.add(30);
        pq.add(10);
        pq.add(20);
        pq.poll();
    }
}
`;
  const heapRes = await executeCode(heapCode);
  assert(heapRes.success, 'PriorityQueue / Heap executed successfully');
  const heapEvents = heapRes.events || [];
  assert(heapEvents.some((e) => e.type === 'HEAP_CREATE' || e.type === 'PRIORITYQUEUE_CREATE'), 'Emitted HEAP/PQ create event');
  assert(heapEvents.some((e) => e.type === 'HEAP_INSERT' || e.type === 'PRIORITYQUEUE_ADD'), 'Emitted HEAP/PQ insert event');
  assert(heapEvents.some((e) => e.type === 'HEAP_REMOVE' || e.type === 'PRIORITYQUEUE_POLL'), 'Emitted HEAP/PQ remove event');

  // --- TEST 4: Trie Insertion & Search ---
  console.log('\nTest 4: Trie (Insert & Search)');
  const trieCode = `
public class Main {
    public static void main(String[] args) {
        Trie trie = new Trie();
        trie.insert("cat");
        trie.insert("car");
        trie.search("cat");
        trie.startsWith("ca");
    }
}
`;
  const trieRes = await executeCode(trieCode);
  assert(trieRes.success, 'Trie executed successfully');
  const trieEvents = trieRes.events || [];
  assert(trieEvents.some((e) => e.type === 'TRIE_CREATE'), 'Emitted TRIE_CREATE event');
  assert(trieEvents.some((e) => e.type === 'TRIE_NODE_CREATE'), 'Emitted TRIE_NODE_CREATE events');
  assert(trieEvents.some((e) => e.type === 'TRIE_WORD_COMPLETE'), 'Emitted TRIE_WORD_COMPLETE events');
  assert(trieEvents.some((e) => e.type === 'TRIE_SEARCH_START'), 'Emitted TRIE_SEARCH_START events');

  // --- TEST 5: Section 45 Phase 3 Final Demo ---
  console.log('\nTest 5: Section 45 Comprehensive Final Demo (Tree + BST + Heap + Trie)');
  const finalDemoCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // 1. Binary Tree
        TreeNode root = new TreeNode(10);
        root.left = new TreeNode(20);
        root.right = new TreeNode(30);

        // 2. Binary Search Tree
        BST bst = new BST();
        bst.insert(50);
        bst.insert(30);
        bst.insert(70);

        // 3. PriorityQueue / Min Heap
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.add(20);
        minHeap.add(10);

        // 4. Prefix Trie
        Trie trie = new Trie();
        trie.insert("cat");
        trie.insert("dog");
    }
}
`;
  const finalRes = await executeCode(finalDemoCode);
  assert(finalRes.success, 'Final Demo executed successfully on JVM sandbox');
  const finalEvents = finalRes.events || [];
  assert(finalEvents.some((e) => e.type === 'TREE_CREATE'), 'Final Demo contains Binary Tree events');
  assert(finalEvents.some((e) => e.type === 'BST_CREATE'), 'Final Demo contains BST events');
  assert(finalEvents.some((e) => e.type === 'HEAP_CREATE' || e.type === 'PRIORITYQUEUE_CREATE'), 'Final Demo contains Heap events');
  assert(finalEvents.some((e) => e.type === 'TRIE_CREATE'), 'Final Demo contains Trie events');

  console.log('\n====================================================');
  console.log(`  ALL ${passedTests}/${totalTests} PHASE 3 E2E TESTS PASSED PERFECTLY!`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\nE2E Suite Encountered Error:', err);
  process.exit(1);
});
