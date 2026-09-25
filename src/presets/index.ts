import { CodePreset } from '../types/execution';

export const CODE_PRESETS: CodePreset[] = [
  {
    id: 'p1-ex3-loop',
    title: 'Example 3 — Loop (Core Demo)',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'In-place iteration and array element mutation: [10, 20, 30] ➔ [20, 40, 60].',
    explanation: 'Iterates through the integer array, updating each element while the pointer `i` advances across indices.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30};

        for (int i = 0; i < arr.length; i++) {
            arr[i] = arr[i] * 2;
        }
    }
}
`,
  },
  {
    id: 'p1-ex1-variables',
    title: 'Example 1 — Variables',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Variable declaration, arithmetic evaluation, and System.out.println console output.',
    explanation: 'Allocates variables `x` and `y`, calculates `sum = x + y`, and logs to the console panel.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int sum = x + y;
        System.out.println(sum);
    }
}
`,
  },
  {
    id: 'p1-ex2-array',
    title: 'Example 2 — Array Update',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Array creation, indexed element assignment (20 ➔ 50), and console print.',
    explanation: 'Creates a 3-element integer array and updates index 1 from 20 to 50 with live cell animation.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30};

        arr[1] = 50;

        System.out.println(arr[1]);
    }
}
`,
  },
  {
    id: 'p1-ex4-method',
    title: 'Example 4 — Method & Call Stack',
    category: 'Recursion',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    description: 'Function call with parameters, method stack frame, and return value passing.',
    explanation: 'Calls `add(10, 20)`, executes inside the method frame, and returns 30 to `main`.',
    code: `public class Main {

    static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int result = add(10, 20);
        System.out.println(result);
    }
}
`,
  },
  {
    id: 'p1-multi-arrays',
    title: 'Multiple Independent Arrays',
    category: 'Arrays & Sorting',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(K)',
    description: 'Automatically provisions independent visual arrays for `a`, `b`, and `c`.',
    explanation: 'Demonstrates that the platform does NOT hard-code a fixed number of structures: creating three arrays renders three visual arrays.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2};
        int[] b = {3, 4, 5};
        int[] c = {6, 7, 8, 9};

        a[0] = 99;
        b[2] = b[2] * 10;
    }
}
`,
  },
  {
    id: 'p2-final-demo',
    title: 'Phase 2 Demo: All Core Structures',
    category: 'Stacks & Queues',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Simultaneously provisions and executes Stack, Queue, LinkedList, HashMap, and HashSet.',
    explanation: 'Comprehensive demonstration proving multi-structure visualization, independent life-cycles, and zero fake state.',
    code: `import java.util.*;

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
`,
  },
  {
    id: 'p2-stack',
    title: 'Stack (LIFO)',
    category: 'Stacks & Queues',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Stack creation, push(10, 20, 30), peek(), and pop() with TOP pointer tracking.',
    explanation: 'Demonstrates Last-In First-Out semantics with animated element transitions at the TOP.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();

        stack.push(10);
        stack.push(20);
        stack.push(30);

        stack.peek();
        stack.pop();
    }
}
`,
  },
  {
    id: 'p2-multi-stacks',
    title: 'Multiple Independent Stacks',
    category: 'Stacks & Queues',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Provisions three distinct visual stacks for a, b, and c without hardcoding.',
    explanation: 'Verifies that multiple structures of the same type never interfere with each other.',
    code: `import java.util.*;

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
`,
  },
  {
    id: 'p2-queue',
    title: 'Queue (FIFO)',
    category: 'Stacks & Queues',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'FIFO Queue with add(), peek(), and poll() animating FRONT to REAR.',
    explanation: 'Demonstrates First-In First-Out semantics where elements enter at REAR and leave at FRONT.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Queue<Integer> queue = new LinkedList<>();

        queue.add(10);
        queue.add(20);
        queue.add(30);

        queue.peek();
        queue.poll();
    }
}
`,
  },
  {
    id: 'p2-deque',
    title: 'Deque (Double-Ended Queue)',
    category: 'Stacks & Queues',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Double-ended queue with addFirst, addLast, removeFirst, removeLast.',
    explanation: 'Visualizes bidirectional insertion and extraction at both FRONT and REAR terminals.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> deque = new ArrayDeque<>();

        deque.addFirst(10);
        deque.addLast(20);

        deque.removeFirst();
        deque.removeLast();
    }
}
`,
  },
  {
    id: 'p2-linkedlist',
    title: 'LinkedList Operations',
    category: 'Linked Lists',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Node chaining (Node #101 -> Node #102), indexed insertion, and deletion.',
    explanation: 'Displays genuine node references and pointer link updates without replacing the whole view.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        LinkedList<Integer> list = new LinkedList<>();

        list.add(10);
        list.add(20);
        list.add(30);

        list.add(1, 15);
        list.remove(2);
    }
}
`,
  },
  {
    id: 'p2-hashmap',
    title: 'HashMap (Hashing & Buckets)',
    category: 'Hash Tables',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Key hashing, bucket mapping, put, get, update, and remove.',
    explanation: 'Illustrates key -> hashCode() -> bucket mapping and collision chain grouping.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        HashMap<String, Integer> map = new HashMap<>();

        map.put("Java", 90);
        map.put("DSA", 95);

        map.get("Java");

        map.put("Java", 100);

        map.remove("DSA");
    }
}
`,
  },
  {
    id: 'p2-hashset',
    title: 'HashSet (Uniqueness & Duplicates)',
    category: 'Hash Tables',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Set uniqueness check, duplicate element rejection animation, and contains().',
    explanation: 'Demonstrates duplicate rejection when adding existing elements and active membership testing.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        HashSet<Integer> set = new HashSet<>();

        set.add(10);
        set.add(20);
        set.add(10);

        set.contains(20);
        set.remove(10);
    }
}
`,
  },
  {
    id: 'p2-priorityqueue',
    title: 'PriorityQueue (Logical vs Heap)',
    category: 'Trees & Heaps',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    description: 'Min-priority queue distinguishing logical priority order from internal heap array.',
    explanation: 'Shows element with highest priority (min value) at head ready to be polled next.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();

        pq.add(30);
        pq.add(10);
        pq.add(20);

        pq.poll();
    }
}
`,
  },
  {
    id: 'p3-binary-tree',
    title: '1. Binary Tree (Nodes & References)',
    category: 'Trees & Heaps',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description: 'Dynamic binary tree creation distinguishing node values from left and right child references.',
    explanation: 'Creates a 5-node binary tree with left and right reference pointers.',
    code: `public class Main {
    public static void main(String[] args) {
        TreeNode root = new TreeNode(10);
        root.left = new TreeNode(20);
        root.right = new TreeNode(30);
        root.left.left = new TreeNode(40);
        root.left.right = new TreeNode(50);
    }
}
`,
  },
  {
    id: 'p3-tree-traversal',
    title: '2. Tree Traversals (Inorder / Pre / Post)',
    category: 'Trees & Heaps',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(H)',
    description: 'Step-by-step traversal highlighting nodes in real-time order with call stack synchronization.',
    explanation: 'Executes recursive traversals while highlighting active nodes on the canvas.',
    code: `public class Main {
    public static void main(String[] args) {
        TreeNode root = new TreeNode(10);
        root.left = new TreeNode(20);
        root.right = new TreeNode(30);
        root.left.left = new TreeNode(40);
        root.left.right = new TreeNode(50);

        inorder(root);
        preorder(root);
        postorder(root);
    }

    static void inorder(TreeNode node) {
        if (node == null) return;
        inorder(node.left);
        System.out.println(node.val);
        inorder(node.right);
    }

    static void preorder(TreeNode node) {
        if (node == null) return;
        System.out.println(node.val);
        preorder(node.left);
        preorder(node.right);
    }

    static void postorder(TreeNode node) {
        if (node == null) return;
        postorder(node.left);
        postorder(node.right);
        System.out.println(node.val);
    }
}
`,
  },
  {
    id: 'p3-bst-insert',
    title: '3. BST Insertion (Decision Path)',
    category: 'Trees & Heaps',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    description: 'Binary Search Tree insertion displaying comparison decision path: 40 < 50 ? TRUE ➔ Left.',
    explanation: 'Builds a balanced BST by comparing each inserted value against parent nodes.',
    code: `public class Main {
    public static void main(String[] args) {
        BST bst = new BST();
        bst.insert(50);
        bst.insert(30);
        bst.insert(70);
        bst.insert(20);
        bst.insert(40);
        bst.insert(60);
        bst.insert(80);
    }
}
`,
  },
  {
    id: 'p3-bst-search',
    title: '4. BST Search (Path Traversal)',
    category: 'Trees & Heaps',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    description: 'Search in BST illustrating comparison branch decisions down to found node.',
    explanation: 'Navigates left or right based on key comparison until target 60 is located.',
    code: `public class Main {
    public static void main(String[] args) {
        BST bst = new BST();
        bst.insert(50);
        bst.insert(30);
        bst.insert(70);
        bst.insert(60);

        bst.search(60);
        bst.search(25);
    }
}
`,
  },
  {
    id: 'p3-bst-delete',
    title: '5. BST Deletion (Leaf & 2-Child Cases)',
    category: 'Trees & Heaps',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    description: 'BST deletion demonstrating leaf removal (20) and two-child in-order successor replacement (70).',
    explanation: 'Removes nodes and automatically updates references according to BST invariant.',
    code: `public class Main {
    public static void main(String[] args) {
        BST bst = new BST();
        bst.insert(50);
        bst.insert(30);
        bst.insert(70);
        bst.insert(20);
        bst.insert(40);
        bst.insert(60);
        bst.insert(80);

        // Delete leaf node 20
        bst.delete(20);

        // Delete node 70 with two children (60 and 80)
        bst.delete(70);
    }
}
`,
  },
  {
    id: 'p3-min-heap',
    title: '6. Min Heap (Heapify Up & Down)',
    category: 'Trees & Heaps',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    description: 'Complete binary tree layout with synchronized linear array representation and heapify swaps.',
    explanation: 'Maintains min-heap property where parent <= children at all levels.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();

        minHeap.add(20);
        minHeap.add(40);
        minHeap.add(30);
        minHeap.add(10);
        minHeap.add(50);

        minHeap.poll();
    }
}
`,
  },
  {
    id: 'p3-max-heap',
    title: '7. Max Heap (Reverse Priority)',
    category: 'Trees & Heaps',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    description: 'Max Heap with root holding the maximum element, comparing and swapping upwards.',
    explanation: 'Uses Collections.reverseOrder() to extract maximum items first.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

        maxHeap.add(20);
        maxHeap.add(40);
        maxHeap.add(10);
        maxHeap.add(50);
        maxHeap.add(30);

        maxHeap.poll();
    }
}
`,
  },
  {
    id: 'p3-trie-insert',
    title: '8. Trie Insertion (Shared Prefixes)',
    category: 'Trees & Heaps',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(L)',
    spaceComplexity: 'O(ALPHABET * L)',
    description: 'Trie prefix tree inserting "cat", "car", "dog" with merged prefix branches.',
    explanation: 'Visualizes character path sharing between "cat" and "car" under prefix "ca".',
    code: `public class Main {
    public static void main(String[] args) {
        Trie trie = new Trie();

        trie.insert("cat");
        trie.insert("car");
        trie.insert("dog");
    }
}
`,
  },
  {
    id: 'p3-trie-search',
    title: '9. Trie Search & Prefix Check',
    category: 'Trees & Heaps',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(L)',
    spaceComplexity: 'O(1)',
    description: 'Searches for full words and prefixes with real-time green/red decision ribbons.',
    explanation: 'Traverses characters along branches: "car" ➔ FOUND, "can" ➔ NOT FOUND.',
    code: `public class Main {
    public static void main(String[] args) {
        Trie trie = new Trie();

        trie.insert("cat");
        trie.insert("car");
        trie.insert("dog");

        trie.search("car");
        trie.search("can");
        trie.startsWith("ca");
    }
}
`,
  },
  {
    id: 'p3-multi-structures',
    title: '10. Multiple Independent Trees & Heaps',
    category: 'Trees & Heaps',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Simultaneously provisions and updates treeA, treeB, and bstA without interference.',
    explanation: 'Verifies complete structure isolation across multiple hierarchical structures.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        TreeNode treeA = new TreeNode(10);
        treeA.left = new TreeNode(20);
        treeA.right = new TreeNode(30);

        TreeNode treeB = new TreeNode(50);
        treeB.left = new TreeNode(60);
        treeB.right = new TreeNode(70);

        BST bstA = new BST();
        bstA.insert(40);
        bstA.insert(20);
        bstA.insert(60);
    }
}
`,
  },
  {
    id: 'p3-final-demo',
    title: '★ Phase 3 Final Demo (All Hierarchies)',
    category: 'Trees & Heaps',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    description: 'Comprehensive demo running Binary Tree, BST, Min-Heap, and Trie simultaneously.',
    explanation: 'The UI automatically detects and displays all 4 hierarchical structures in parallel from actual execution.',
    code: `import java.util.*;

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
        bst.insert(20);
        bst.insert(40);

        // 3. PriorityQueue / Min Heap
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.add(20);
        minHeap.add(30);
        minHeap.add(10);

        // 4. Prefix Trie
        Trie trie = new Trie();
        trie.insert("cat");
        trie.insert("car");
        trie.insert("dog");
        trie.search("car");
    }
}
`,
  },
  // ==========================================
  // PHASE 4: GRAPHS & GRAPH ALGORITHMS
  // ==========================================
  {
    id: 'p4-undirected-graph',
    title: '1. Undirected Graph',
    category: 'Graphs & Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V + E)',
    description: 'Dynamic vertex addition and undirected edge creation (A — B — C — D — A).',
    explanation: 'Creates vertices and links them with bidirectional undirected edges, demonstrating degree tracking and adjacency view.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false); // undirected

        graph.addVertex("A");
        graph.addVertex("B");
        graph.addVertex("C");
        graph.addVertex("D");

        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("C", "D");
        graph.addEdge("D", "A");
        graph.addEdge("A", "C");
    }
}
`,
  },
  {
    id: 'p4-directed-graph',
    title: '2. Directed Graph',
    category: 'Graphs & Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V + E)',
    description: 'Directed graph with directional arrowheads: A ➔ B ➔ C ➔ D ➔ A.',
    explanation: 'Creates directed edges preserving orientation. Outgoing and incoming neighbors are independently tracked and inspected.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(true); // directed

        graph.addVertex("A");
        graph.addVertex("B");
        graph.addVertex("C");
        graph.addVertex("D");

        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("C", "D");
        graph.addEdge("D", "A");
    }
}
`,
  },
  {
    id: 'p4-weighted-graph',
    title: '3. Weighted Graph',
    category: 'Graphs & Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V + E)',
    description: 'Weighted edges with weights displayed directly on edge labels: A ──4── B.',
    explanation: 'Associates numeric edge weights with each connection, displaying weights on visual edges and in matrix view.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false, true); // undirected, weighted

        graph.addEdge("A", "B", 4.0);
        graph.addEdge("B", "C", 2.0);
        graph.addEdge("C", "D", 7.0);
        graph.addEdge("D", "A", 3.0);
        graph.addEdge("A", "C", 5.0);
    }
}
`,
  },
  {
    id: 'p4-bfs',
    title: '4. Breadth-First Search (BFS)',
    category: 'Graphs & Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'BFS level-order graph traversal with Queue and Visited Set synchronization.',
    explanation: 'Visualizes discovery, queue enqueue/dequeue operations, and edge traversals level-by-level from node A.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false);

        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("B", "D");
        graph.addEdge("B", "E");
        graph.addEdge("C", "F");

        graph.bfs("A");
    }
}
`,
  },
  {
    id: 'p4-dfs-iterative',
    title: '5. DFS Iterative Traversal',
    category: 'Graphs & Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Depth-First Search using explicit stack for deep path discovery.',
    explanation: 'Follows paths deeply into the graph, discovering vertices and tracking visited nodes step-by-step.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(true);

        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("B", "D");
        graph.addEdge("C", "E");

        graph.dfs("A");
    }
}
`,
  },
  {
    id: 'p4-dfs-recursive',
    title: '6. Recursive DFS + Call Stack',
    category: 'Graphs & Algorithms',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Recursive DFS connecting Graph traversal, method recursion, and Call Stack frames.',
    explanation: 'Demonstrates deep integration between the Graph visualizer and Call Stack frames during recursive descent and backtracking.',
    code: `import java.util.*;

public class Main {
    static void dfsHelper(Graph g, String curr, Set<String> visited) {
        visited.add(curr);
        for (String nbr : g.getNeighbors(curr)) {
            if (!visited.contains(nbr)) {
                dfsHelper(g, nbr, visited);
            }
        }
    }

    public static void main(String[] args) {
        Graph graph = new Graph(false);
        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("C", "D");
        graph.addEdge("A", "D");

        Set<String> visited = new HashSet<>();
        dfsHelper(graph, "A", visited);
    }
}
`,
  },
  {
    id: 'p4-cycle-graph',
    title: '7. Graph with Cycle & Detection',
    category: 'Graphs & Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Directed graph with cycle A ➔ B ➔ C ➔ A with live cycle detection alert.',
    explanation: 'When DFS encounters a back-edge to an already visited vertex, the CYCLE DETECTED banner activates and highlights the cycle edge.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(true);

        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("C", "A"); // back-edge cycle
        graph.addEdge("C", "D");

        graph.dfs("A");
    }
}
`,
  },
  {
    id: 'p4-dijkstra',
    title: '8. Dijkstra Shortest Path Algorithm',
    category: 'Graphs & Algorithms',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    description: 'Dijkstra shortest path with live distance table, edge relaxation, and PriorityQueue.',
    explanation: 'Visualizes distance updates (dist[u] + w < dist[v]), PriorityQueue polls, and finalizes shortest path costs from node A.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false, true);

        graph.addEdge("A", "B", 4.0);
        graph.addEdge("A", "C", 2.0);
        graph.addEdge("B", "C", 1.0);
        graph.addEdge("B", "D", 5.0);
        graph.addEdge("C", "D", 8.0);
        graph.addEdge("C", "E", 10.0);
        graph.addEdge("D", "E", 2.0);

        graph.dijkstra("A");
    }
}
`,
  },
  {
    id: 'p4-multiple-graphs',
    title: '9. Multiple Independent Graphs',
    category: 'Graphs & Algorithms',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V + E)',
    description: 'Simultaneously provisions graphA, graphB, and graphC with isolated state.',
    explanation: 'Verifies complete multi-structure isolation: operations on graphA never contaminate graphB or graphC.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // graphA: Undirected triangle
        Graph graphA = new Graph(false);
        graphA.addEdge("A", "B");
        graphA.addEdge("B", "C");
        graphA.addEdge("C", "A");

        // graphB: Directed path
        Graph graphB = new Graph(true);
        graphB.addEdge("X", "Y");
        graphB.addEdge("Y", "Z");

        // graphC: Weighted graph
        Graph graphC = new Graph(false, true);
        graphC.addEdge("1", "2", 10.0);
        graphC.addEdge("2", "3", 25.0);
    }
}
`,
  },
  {
    id: 'p4-supporting-structures',
    title: '10. Graph + Supporting Data Structures',
    category: 'Graphs & Algorithms',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Graph BFS working in harmony with Queue and HashSet data structures.',
    explanation: 'Demonstrates cross-structure coordination where user code simultaneously populates Graph, Queue, and Visited Set.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Graph graph = new Graph(false);
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("B", "D");

        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();

        queue.add("A");
        visited.add("A");

        while (!queue.isEmpty()) {
            String curr = queue.poll();
            for (String nbr : graph.getNeighbors(curr)) {
                if (!visited.contains(nbr)) {
                    visited.add(nbr);
                    queue.add(nbr);
                }
            }
        }
    }
}
`,
  },
  {
    id: 'p4-final-demo',
    title: '★ Phase 4 Final Demo (Full DSA Integration)',
    category: 'Graphs & Algorithms',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V + E)',
    description: 'Comprehensive demo: Graph + Queue + HashSet + PriorityQueue + HashMap + BFS + Dijkstra.',
    explanation: 'The ultimate Phase 4 demonstration: All data structures and algorithms execute on real JVM and visualize synchronously.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // 1. Comprehensive Graph with non-negative weights
        Graph graph = new Graph(false, true);
        graph.addEdge("A", "B", 4.0);
        graph.addEdge("A", "C", 2.0);
        graph.addEdge("B", "D", 5.0);
        graph.addEdge("C", "E", 6.0);
        graph.addEdge("D", "E", 3.0);

        // 2. Queue & Visited Set used by BFS
        Queue<String> bfsQueue = new LinkedList<>();
        Set<String> visitedSet = new HashSet<>();
        bfsQueue.add("A");
        visitedSet.add("A");

        // 3. Distance Map used by Dijkstra
        Map<String, Integer> distances = new HashMap<>();
        distances.put("A", 0);
        distances.put("B", 4);
        distances.put("C", 2);
        distances.put("D", 5);
        distances.put("E", 6);

        // 4. PriorityQueue used by Dijkstra
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.add(2); // dist to C
        pq.add(4); // dist to B
        pq.add(5); // dist to D

        // 5. Run live Dijkstra shortest-path execution
        graph.dijkstra("A");
    }
}
`,
  },
  // ==========================================
  // PHASE 5: SEARCHING
  // ==========================================
  {
    id: 'p5-linear-search',
    title: 'Linear Search',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Sequentially checks each element until target match or end of array.',
    explanation: 'Scans the array from left to right comparing arr[i] with target until target is found or all elements checked.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50};
        int target = 40;
        CodeFlowTracer.linearSearchStart("arr", target, 5);
        int foundIndex = -1;

        for (int i = 0; i < arr.length; i++) {
            CodeFlowTracer.linearSearchAccess("arr", i, arr[i], 8);
            boolean match = (arr[i] == target);
            CodeFlowTracer.linearSearchCompare("arr", i, arr[i], target, match, 10);
            if (match) {
                foundIndex = i;
                CodeFlowTracer.linearSearchMatch("arr", i, arr[i], 12);
                break;
            }
        }

        CodeFlowTracer.linearSearchEnd("arr", foundIndex != -1, foundIndex, 17);
    }
}
`,
  },
  {
    id: 'p5-binary-search',
    title: 'Binary Search',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    description: 'Divide-and-conquer search on sorted array halving search space per step.',
    explanation: 'Maintains Low, Mid, and High pointers, narrowing the active search scope based on element comparison with target.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50, 60, 70};
        int target = 50;

        CodeFlowTracer.binarySearchStart("arr", target, 6);
        int low = 0;
        int high = arr.length - 1;
        int foundIndex = -1;

        while (low <= high) {
            CodeFlowTracer.binarySearchRange("arr", low, high, 12);
            int mid = low + (high - low) / 2;
            CodeFlowTracer.binarySearchMid("arr", mid, arr[mid], 14);

            int cmp = Integer.compare(arr[mid], target);
            CodeFlowTracer.binarySearchCompare("arr", mid, arr[mid], target, cmp, 17);

            if (cmp == 0) {
                foundIndex = mid;
                CodeFlowTracer.binarySearchFound("arr", mid, arr[mid], 20);
                break;
            } else if (cmp < 0) {
                low = mid + 1;
                CodeFlowTracer.binarySearchRangeUpdate("arr", low, high, 24);
            } else {
                high = mid - 1;
                CodeFlowTracer.binarySearchRangeUpdate("arr", low, high, 27);
            }
        }

        if (foundIndex == -1) {
            CodeFlowTracer.binarySearchNotFound("arr", target, 32);
        }
        CodeFlowTracer.binarySearchEnd("arr", foundIndex != -1, foundIndex, 34);
    }
}
`,
  },

  // ==========================================
  // PHASE 5: SORTING
  // ==========================================
  {
    id: 'p5-bubble-sort',
    title: 'Bubble Sort',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    description: 'Repeatedly steps through the list, compares adjacent elements, and swaps them if in wrong order.',
    explanation: 'Demonstrates adjacent comparisons and in-place swaps, bubbling the largest unsorted element to the right on each pass.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {5, 2, 8, 1, 4};
        CodeFlowTracer.sortStart("Bubble Sort", "arr", 4);

        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                boolean needSwap = arr[j] > arr[j + 1];
                CodeFlowTracer.sortCompare("arr", j, j + 1, arr[j], arr[j + 1], needSwap, 10);
                if (needSwap) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    CodeFlowTracer.sortSwap("arr", j, j + 1, arr[j], arr[j + 1], 15);
                }
            }
        }
        CodeFlowTracer.sortComplete("arr", 20);
    }
}
`,
  },
  {
    id: 'p5-selection-sort',
    title: 'Selection Sort',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    description: 'Finds minimum element from unsorted part and puts it at beginning.',
    explanation: 'Scans the unsorted suffix for the minimum element, and executes at most one swap per outer loop iteration.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {29, 10, 14, 37, 13};
        CodeFlowTracer.sortStart("Selection Sort", "arr", 4);

        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                boolean isSmaller = arr[j] < arr[minIdx];
                CodeFlowTracer.sortCompare("arr", j, minIdx, arr[j], arr[minIdx], isSmaller, 11);
                if (isSmaller) {
                    minIdx = j;
                }
            }
            if (minIdx != i) {
                int temp = arr[i];
                arr[i] = arr[minIdx];
                arr[minIdx] = temp;
                CodeFlowTracer.sortSwap("arr", i, minIdx, arr[i], arr[minIdx], 20);
            }
        }
        CodeFlowTracer.sortComplete("arr", 24);
    }
}
`,
  },
  {
    id: 'p5-insertion-sort',
    title: 'Insertion Sort',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    description: 'Builds sorted array one item at a time by shifting larger elements right.',
    explanation: 'Visualizes the boundary between the sorted region on the left and unsorted region on the right as keys are inserted.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6};
        CodeFlowTracer.sortStart("Insertion Sort", "arr", 4);

        for (int i = 1; i < arr.length; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                CodeFlowTracer.sortCompare("arr", j, j + 1, arr[j], key, true, 11);
                arr[j + 1] = arr[j];
                CodeFlowTracer.sortAssign("arr", j + 1, arr[j], 13);
                j = j - 1;
            }
            arr[j + 1] = key;
            CodeFlowTracer.sortAssign("arr", j + 1, key, 17);
        }
        CodeFlowTracer.sortComplete("arr", 20);
    }
}
`,
  },
  {
    id: 'p5-merge-sort',
    title: 'Merge Sort',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    description: 'Classic divide-and-conquer sorting algorithm with recursive subproblems.',
    explanation: 'Recursively divides array into two halves, sorts them, and merges independent sub-arrays back in linear time.',
    code: `public class Main {
    static void merge(int[] arr, int l, int m, int r) {
        CodeFlowTracer.sortMerge("arr", l, m, r, 3);
        int n1 = m - l + 1;
        int n2 = r - m;

        int[] left = new int[n1];
        int[] right = new int[n2];

        for (int i = 0; i < n1; ++i) left[i] = arr[l + i];
        for (int j = 0; j < n2; ++j) right[j] = arr[m + 1 + j];

        int i = 0, j = 0, k = l;
        while (i < n1 && j < n2) {
            CodeFlowTracer.sortCompare("arr", l + i, m + 1 + j, left[i], right[j], left[i] <= right[j], 16);
            if (left[i] <= right[j]) {
                arr[k] = left[i];
                CodeFlowTracer.sortAssign("arr", k, left[i], 19);
                i++;
            } else {
                arr[k] = right[j];
                CodeFlowTracer.sortAssign("arr", k, right[j], 23);
                j++;
            }
            k++;
        }
        while (i < n1) {
            arr[k] = left[i];
            CodeFlowTracer.sortAssign("arr", k, left[i], 29);
            i++; k++;
        }
        while (j < n2) {
            arr[k] = right[j];
            CodeFlowTracer.sortAssign("arr", k, right[j], 34);
            j++; k++;
        }
    }

    static void mergeSort(int[] arr, int l, int r) {
        if (l < r) {
            int m = l + (r - l) / 2;
            CodeFlowTracer.sortRange("arr", l, r, 42);
            mergeSort(arr, l, m);
            mergeSort(arr, m + 1, r);
            merge(arr, l, m, r);
        }
    }

    public static void main(String[] args) {
        int[] arr = {38, 27, 43, 3, 9, 82, 10};
        CodeFlowTracer.sortStart("Merge Sort", "arr", 51);
        mergeSort(arr, 0, arr.length - 1);
        CodeFlowTracer.sortComplete("arr", 53);
    }
}
`,
  },
  {
    id: 'p5-quick-sort',
    title: 'Quick Sort',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(log N)',
    description: 'Picks pivot element and partitions array so elements smaller are left, greater are right.',
    explanation: 'Picks a pivot, rearranges smaller elements to the left and larger to the right, then recurses on both partitions.',
    code: `public class Main {
    static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        CodeFlowTracer.quickSortPivot("arr", high, pivot, 4);
        int i = (low - 1);

        for (int j = low; j < high; j++) {
            boolean less = arr[j] < pivot;
            CodeFlowTracer.quickSortCompare("arr", j, arr[j], pivot, less, 9);
            if (less) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
                CodeFlowTracer.quickSortSwap("arr", i, j, arr[i], arr[j], 15);
            }
        }
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        CodeFlowTracer.quickSortSwap("arr", i + 1, high, arr[i + 1], arr[high], 22);
        CodeFlowTracer.quickSortPartition("arr", i + 1, low, high, 23);
        return i + 1;
    }

    static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            CodeFlowTracer.quickSortRange("arr", low, high, 29);
            int pi = partition(arr, low, high);
            CodeFlowTracer.quickSortRecurse("arr", low, pi - 1, 31);
            quickSort(arr, low, pi - 1);
            CodeFlowTracer.quickSortRecurse("arr", pi + 1, high, 33);
            quickSort(arr, pi + 1, high);
        }
    }

    public static void main(String[] args) {
        int[] arr = {10, 80, 30, 90, 40, 50, 70};
        CodeFlowTracer.quickSortStart("arr", 0, arr.length - 1, 40);
        quickSort(arr, 0, arr.length - 1);
        CodeFlowTracer.quickSortEnd("arr", 42);
    }
}
`,
  },
  {
    id: 'p5-heap-sort',
    title: 'Heap Sort',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(1)',
    description: 'Comparison-based sorting technique based on Binary Heap data structure.',
    explanation: 'Builds a max heap from the array, swaps root with end element, and calls heapify down until sorted.',
    code: `public class Main {
    static void heapify(int[] arr, int n, int i) {
        int largest = i;
        int l = 2 * i + 1;
        int r = 2 * i + 2;

        if (l < n && arr[l] > arr[largest]) largest = l;
        if (r < n && arr[r] > arr[largest]) largest = r;

        if (largest != i) {
            int swap = arr[i];
            arr[i] = arr[largest];
            arr[largest] = swap;
            CodeFlowTracer.sortSwap("arr", i, largest, arr[i], arr[largest], 15);
            heapify(arr, n, largest);
        }
    }

    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6, 7};
        CodeFlowTracer.sortStart("Heap Sort", "arr", 22);
        int n = arr.length;

        for (int i = n / 2 - 1; i >= 0; i--) {
            heapify(arr, n, i);
        }

        for (int i = n - 1; i > 0; i--) {
            int temp = arr[0];
            arr[0] = arr[i];
            arr[i] = temp;
            CodeFlowTracer.sortSwap("arr", 0, i, arr[0], arr[i], 34);
            heapify(arr, i, 0);
        }
        CodeFlowTracer.sortComplete("arr", 38);
    }
}
`,
  },

  // ==========================================
  // PHASE 5: ARRAY PATTERNS
  // ==========================================
  {
    id: 'p5-two-pointers',
    title: 'Two Pointers (Target Sum)',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Opposite-direction two pointers searching for target sum in sorted array.',
    explanation: 'Moves left pointer right if sum < target, and right pointer left if sum > target.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {1, 2, 4, 7, 9, 12};
        int target = 13;

        int left = 0;
        int right = arr.length - 1;
        CodeFlowTracer.twoPointerStart("arr", left, right, 8);

        while (left < right) {
            int sum = arr[left] + arr[right];
            CodeFlowTracer.twoPointerCompare("arr", left, right, arr[left], arr[right], 12);
            CodeFlowTracer.twoPointerUpdate("arr", left, right, sum, 13);

            if (sum == target) {
                System.out.println("Pair found: " + arr[left] + " + " + arr[right]);
                break;
            } else if (sum < target) {
                left++;
                CodeFlowTracer.twoPointerMoveLeft("arr", left, 20);
            } else {
                right--;
                CodeFlowTracer.twoPointerMoveRight("arr", right, 23);
            }
        }
        CodeFlowTracer.twoPointerEnd("arr", 26);
    }
}
`,
  },
  {
    id: 'p5-sliding-window',
    title: 'Sliding Window (Max Sum Subarray K)',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Fixed-size window sliding across array adding new right and removing old left.',
    explanation: 'Tracks running sum in O(1) per step by subtracting outgoing element and adding incoming element.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {2, 1, 5, 1, 3, 2};
        int k = 3;

        int windowSum = 0;
        for (int i = 0; i < k; i++) {
            windowSum += arr[i];
        }

        CodeFlowTracer.windowStart("arr", 0, k - 1, windowSum, 10);
        int maxVal = windowSum;

        for (int i = k; i < arr.length; i++) {
            windowSum += arr[i];
            CodeFlowTracer.windowExpand("arr", i, arr[i], windowSum, 15);
            windowSum -= arr[i - k];
            CodeFlowTracer.windowShrink("arr", i - k + 1, arr[i - k], windowSum, 17);

            if (windowSum > maxVal) {
                maxVal = windowSum;
                CodeFlowTracer.windowResult("arr", maxVal, 21);
            }
            CodeFlowTracer.windowUpdate("arr", i - k + 1, i, k, windowSum, maxVal, 23);
        }
        CodeFlowTracer.windowEnd("arr", 25);
    }
}
`,
  },
  {
    id: 'p5-prefix-sum',
    title: 'Prefix Sum Array',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Precomputes cumulative sum array allowing O(1) range sum queries.',
    explanation: 'Demonstrates multiple independent arrays (original arr vs prefix), computing prefix[i] = prefix[i-1] + arr[i].',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {2, 4, 1, 5};
        int[] prefix = new int[arr.length];

        CodeFlowTracer.prefixSumStart("arr", "prefix", 6);
        prefix[0] = arr[0];
        CodeFlowTracer.prefixSumUpdate("prefix", 0, prefix[0], 0, arr[0], 8);

        for (int i = 1; i < arr.length; i++) {
            CodeFlowTracer.prefixSumAccess("arr", i, arr[i], 11);
            prefix[i] = prefix[i - 1] + arr[i];
            CodeFlowTracer.prefixSumUpdate("prefix", i, prefix[i], prefix[i - 1], arr[i], 13);
        }

        CodeFlowTracer.prefixSumEnd("prefix", 16);
    }
}
`,
  },
  {
    id: 'p5-difference-array',
    title: 'Difference Array',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(1) updates',
    spaceComplexity: 'O(N)',
    description: 'Performs O(1) range updates on arrays via differential pre-marking.',
    explanation: 'Updates diff[l] += delta and diff[r+1] -= delta, then reconstructs the final modified array via prefix running sums.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] original = {2, 5, 5, 7};
        int[] diff = new int[original.length];

        CodeFlowTracer.differenceArrayStart("original", "diff", 6);
        diff[0] = original[0];
        for (int i = 1; i < original.length; i++) {
            diff[i] = original[i] - original[i - 1];
        }

        // Apply range increment +3 to [1..2]
        CodeFlowTracer.differenceArrayUpdate("diff", 1, 2, 3, 14);
        diff[1] += 3;
        if (3 < diff.length) diff[3] -= 3;

        // Reconstruct array
        int[] result = new int[original.length];
        result[0] = diff[0];
        CodeFlowTracer.differenceArrayReconstruct("diff", "result", 0, result[0], 21);
        for (int i = 1; i < original.length; i++) {
            result[i] = result[i - 1] + diff[i];
            CodeFlowTracer.differenceArrayReconstruct("diff", "result", i, result[i], 24);
        }
        CodeFlowTracer.differenceArrayEnd("result", 26);
    }
}
`,
  },
  {
    id: 'p5-kadane',
    title: "Kadane's Algorithm",
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description: 'Finds maximum subarray sum in linear time with dynamic range tracking.',
    explanation: 'Computes max(arr[i], currentSum + arr[i]), tracking best subarray window boundaries dynamically.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        CodeFlowTracer.kadaneStart("arr", 4);

        int maxSoFar = arr[0];
        int currMax = arr[0];
        int start = 0, bestStart = 0, bestEnd = 0;

        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > currMax + arr[i]) {
                currMax = arr[i];
                start = i;
            } else {
                currMax += arr[i];
            }
            CodeFlowTracer.kadaneUpdate("arr", i, arr[i], currMax, maxSoFar, 16);
            CodeFlowTracer.kadaneRangeUpdate("arr", start, i, 17);

            if (currMax > maxSoFar) {
                maxSoFar = currMax;
                bestStart = start;
                bestEnd = i;
                CodeFlowTracer.kadaneBestUpdate("arr", maxSoFar, bestStart, bestEnd, 23);
            }
        }

        CodeFlowTracer.kadaneEnd("arr", maxSoFar, bestStart, bestEnd, 27);
    }
}
`,
  },

  // ==========================================
  // PHASE 5: RECURSION & BACKTRACKING
  // ==========================================
  {
    id: 'p5-factorial',
    title: 'Factorial (Recursion Stack)',
    category: 'Recursion',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Recursion tree building and call frame unwinding for N! calculation.',
    explanation: 'Calls factorial(5) ➔ 4 ➔ 3 ➔ 2 ➔ 1, hits base case, and bubbles return values back up the call stack.',
    code: `public class Main {
    static int factorial(int n) {
        String callId = "fact-" + n;
        String parentId = n < 5 ? "fact-" + (n + 1) : null;
        CodeFlowTracer.recursionCall(callId, parentId, "factorial", "{\\"n\\":" + n + "}", 6 - n, 5);

        if (n <= 1) {
            CodeFlowTracer.recursionBaseCase(callId, 1, 8);
            return 1;
        }

        int sub = factorial(n - 1);
        int res = n * sub;
        CodeFlowTracer.recursionReturn(callId, res, 14);
        return res;
    }

    public static void main(String[] args) {
        CodeFlowTracer.recursionStart("factorial", "{\\"n\\":5}", 19);
        int ans = factorial(5);
        CodeFlowTracer.recursionEnd("factorial", ans, 21);
    }
}
`,
  },
  {
    id: 'p5-fibonacci-recursion',
    title: 'Fibonacci Recursion Tree',
    category: 'Recursion',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(2^N)',
    spaceComplexity: 'O(N)',
    description: 'Binary recursion tree illustrating overlapping subproblems.',
    explanation: 'Constructs the full call tree dynamically, showing branching into left and right sub-evaluations.',
    code: `public class Main {
    static int fib(int n, String callId, String parentId, int depth) {
        CodeFlowTracer.recursionCall(callId, parentId, "fib", "{\\"n\\":" + n + "}", depth, 3);
        if (n <= 1) {
            CodeFlowTracer.recursionBaseCase(callId, n, 5);
            return n;
        }
        int left = fib(n - 1, callId + ".L", callId, depth + 1);
        int right = fib(n - 2, callId + ".R", callId, depth + 1);
        int res = left + right;
        CodeFlowTracer.recursionReturn(callId, res, 11);
        return res;
    }

    public static void main(String[] args) {
        CodeFlowTracer.recursionStart("fib", "{\\"n\\":4}", 16);
        int ans = fib(4, "root", null, 1);
        CodeFlowTracer.recursionEnd("fib", ans, 18);
    }
}
`,
  },
  {
    id: 'p5-recursive-traversal',
    title: 'Recursive Array Traversal',
    category: 'Recursion',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Traverses array indices recursively linking call frames to array cells.',
    explanation: 'Shows each recursive step accessing the corresponding array index and returning through call stack depth.',
    code: `public class Main {
    static void traverse(int[] arr, int idx, int depth) {
        String callId = "node-" + idx;
        String parentId = idx > 0 ? "node-" + (idx - 1) : null;
        CodeFlowTracer.recursionCall(callId, parentId, "traverse", "{\\"index\\":" + idx + "}", depth, 5);

        if (idx >= arr.length) {
            CodeFlowTracer.recursionBaseCase(callId, "end", 8);
            return;
        }

        CodeFlowTracer.arrayAccess("arr", idx, arr[idx], 12);
        traverse(arr, idx + 1, depth + 1);
        CodeFlowTracer.recursionReturn(callId, arr[idx], 14);
    }

    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40};
        CodeFlowTracer.recursionStart("traverse", "{\\"index\\":0}", 19);
        traverse(arr, 0, 1);
        CodeFlowTracer.recursionEnd("traverse", "complete", 21);
    }
}
`,
  },
  {
    id: 'p5-backtracking-subsets',
    title: 'Backtracking — Subsets',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(2^N)',
    spaceComplexity: 'O(N)',
    description: 'Generates all subsets via Choose ➔ Explore ➔ Undo.',
    explanation: 'Visualizes state transitions as elements are appended, explored down recursive paths, and popped during backtracking undo.',
    code: `public class Main {
    static void generateSubsets(int[] nums, int index, List<Integer> current) {
        CodeFlowTracer.backtrackSuccess(current.toString(), 4);
        for (int i = index; i < nums.length; i++) {
            current.add(nums[i]);
            CodeFlowTracer.backtrackChoice("+" + nums[i], current.toString(), 7);
            CodeFlowTracer.backtrackEnter("+" + nums[i], 8);

            generateSubsets(nums, i + 1, current);

            current.remove(current.size() - 1);
            CodeFlowTracer.backtrackUndo("-" + nums[i], current.toString(), 13);
        }
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        CodeFlowTracer.backtrackStart("Subsets", 19);
        generateSubsets(nums, 0, new ArrayList<>());
        CodeFlowTracer.backtrackEnd(21);
    }
}
`,
  },
  {
    id: 'p5-backtracking-permutations',
    title: 'Backtracking — Permutations',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N!)',
    spaceComplexity: 'O(N)',
    description: 'Generates all orderings of elements with boolean used flags.',
    explanation: 'Tracks decision tree branches, marking visited items, exploring permutations, and un-marking during undo.',
    code: `public class Main {
    static void permute(int[] nums, List<Integer> curr, boolean[] used) {
        if (curr.size() == nums.length) {
            CodeFlowTracer.backtrackSuccess(curr.toString(), 4);
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            curr.add(nums[i]);
            CodeFlowTracer.backtrackChoice("Pick " + nums[i], curr.toString(), 11);

            permute(nums, curr, used);

            curr.remove(curr.size() - 1);
            used[i] = false;
            CodeFlowTracer.backtrackUndo("Unpick " + nums[i], curr.toString(), 17);
        }
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        CodeFlowTracer.backtrackStart("Permutations", 23);
        permute(nums, new ArrayList<>(), new boolean[nums.length]);
        CodeFlowTracer.backtrackEnd(25);
    }
}
`,
  },

  // ==========================================
  // PHASE 5: DIVIDE & CONQUER
  // ==========================================
  {
    id: 'p5-dc-merge-sort',
    title: 'Divide & Conquer — Merge Sort',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    description: 'Exemplifies Divide (halve range), Solve (recurse), Combine (merge).',
    explanation: 'Highlights the three canonical steps of Divide & Conquer in sorted subarray ranges.',
    code: `public class Main {
    static void merge(int[] arr, int l, int m, int r) {
        CodeFlowTracer.sortMerge("arr", l, m, r, 3);
        int[] temp = new int[r - l + 1];
        int i = l, j = m + 1, k = 0;
        while (i <= m && j <= r) {
            if (arr[i] <= arr[j]) temp[k++] = arr[i++];
            else temp[k++] = arr[j++];
        }
        while (i <= m) temp[k++] = arr[i++];
        while (j <= r) temp[k++] = arr[j++];
        for (int p = 0; p < temp.length; p++) {
            arr[l + p] = temp[p];
            CodeFlowTracer.sortAssign("arr", l + p, temp[p], 15);
        }
    }

    static void divideAndSolve(int[] arr, int l, int r) {
        if (l < r) {
            int m = l + (r - l) / 2;
            CodeFlowTracer.sortRange("arr", l, r, 22);
            divideAndSolve(arr, l, m);
            divideAndSolve(arr, m + 1, r);
            merge(arr, l, m, r);
        }
    }

    public static void main(String[] args) {
        int[] arr = {9, 3, 7, 5, 6, 4, 8, 2};
        CodeFlowTracer.sortStart("Merge Sort (D&C)", "arr", 31);
        divideAndSolve(arr, 0, arr.length - 1);
        CodeFlowTracer.sortComplete("arr", 33);
    }
}
`,
  },
  {
    id: 'p5-dc-quick-sort',
    title: 'Divide & Conquer — Quick Sort',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(log N)',
    description: 'Divide & Conquer via in-place pivot partitioning.',
    explanation: 'Divides around pivot, recursively solves smaller sub-ranges, and combines in-place without auxiliary arrays.',
    code: `public class Main {
    static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        CodeFlowTracer.quickSortPivot("arr", high, pivot, 4);
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
                CodeFlowTracer.quickSortSwap("arr", i, j, arr[i], arr[j], 11);
            }
        }
        int temp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = temp;
        CodeFlowTracer.quickSortSwap("arr", i + 1, high, arr[i + 1], arr[high], 15);
        CodeFlowTracer.quickSortPartition("arr", i + 1, low, high, 16);
        return i + 1;
    }

    static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            CodeFlowTracer.quickSortRange("arr", low, high, 22);
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }

    public static void main(String[] args) {
        int[] arr = {24, 9, 29, 14, 19, 27};
        CodeFlowTracer.quickSortStart("arr", 0, arr.length - 1, 31);
        quickSort(arr, 0, arr.length - 1);
        CodeFlowTracer.quickSortEnd("arr", 33);
    }
}
`,
  },

  // ==========================================
  // PHASE 5: DYNAMIC PROGRAMMING
  // ==========================================
  {
    id: 'p5-dp-memoization',
    title: 'Fibonacci Memoization (Top-Down)',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Top-down recursion with memo table cache hits.',
    explanation: 'Avoids exponential tree explosion by caching computed answers: observe cache hits skipping redundant recursive subtrees.',
    code: `public class Main {
    static int[] memo = new int[10];

    static int fib(int n) {
        if (n <= 1) {
            CodeFlowTracer.dpBaseCase("memo", n, 0, n, 6);
            return n;
        }
        if (memo[n] != 0) {
            CodeFlowTracer.dpCacheHit("memo", n, memo[n], 10);
            return memo[n];
        }
        CodeFlowTracer.dpCacheMiss("memo", n, 13);
        memo[n] = fib(n - 1) + fib(n - 2);
        CodeFlowTracer.dpStateUpdate("memo", n, 0, memo[n], "fib(n-1) + fib(n-2)", "[[" + (n-1) + ",0],[" + (n-2) + ",0]]", 15);
        return memo[n];
    }

    public static void main(String[] args) {
        CodeFlowTracer.dpStart("memo", "MEMOIZATION", 7, 0, 20);
        int ans = fib(6);
        CodeFlowTracer.dpEnd("memo", ans, 22);
    }
}
`,
  },
  {
    id: 'p5-dp-tabulation',
    title: 'Fibonacci Tabulation (Bottom-Up)',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Bottom-up iterative DP state filling with live cell transitions.',
    explanation: 'Fills dp[i] = dp[i-1] + dp[i-2] sequentially, highlighting previous dependencies and live transition formulas.',
    code: `public class Main {
    public static void main(String[] args) {
        int n = 6;
        int[] dp = new int[n + 1];

        CodeFlowTracer.dpStateCreate("dp", "TABULATION_1D", n + 1, 0, 6);
        dp[0] = 0;
        CodeFlowTracer.dpBaseCase("dp", 0, 0, 0, 8);
        dp[1] = 1;
        CodeFlowTracer.dpBaseCase("dp", 1, 0, 1, 10);

        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
            CodeFlowTracer.dpStateUpdate("dp", i, 0, dp[i], "dp[" + (i - 1) + "] + dp[" + (i - 2) + "]", "[[" + (i - 1) + ",0],[" + (i - 2) + ",0]]", 14);
        }

        CodeFlowTracer.dpEnd("dp", dp[n], 17);
    }
}
`,
  },
  {
    id: 'p5-dp-1d',
    title: '1D DP — Climbing Stairs',
    category: 'Algorithms',
    difficulty: 'Easy',
    language: 'java',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description: 'Counts distinct ways to reach top using 1 or 2 steps.',
    explanation: 'Base cases ways[0]=1, ways[1]=1. Each subsequent step is ways[i] = ways[i-1] + ways[i-2].',
    code: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        int[] dp = new int[n + 1];

        CodeFlowTracer.dpStateCreate("dp", "TABULATION_1D", n + 1, 0, 6);
        dp[0] = 1;
        CodeFlowTracer.dpBaseCase("dp", 0, 0, 1, 8);
        dp[1] = 1;
        CodeFlowTracer.dpBaseCase("dp", 1, 0, 1, 10);

        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
            CodeFlowTracer.dpStateUpdate("dp", i, 0, dp[i], "ways[i-1] + ways[i-2]", "[[" + (i - 1) + ",0],[" + (i - 2) + ",0]]", 14);
        }

        CodeFlowTracer.dpEnd("dp", dp[n], 17);
    }
}
`,
  },
  {
    id: 'p5-dp-2d',
    title: '2D DP — Grid Unique Paths',
    category: 'Algorithms',
    difficulty: 'Medium',
    language: 'java',
    timeComplexity: 'O(M × N)',
    spaceComplexity: 'O(M × N)',
    description: 'Finds unique paths in M x N grid moving only right or down.',
    explanation: 'Visualizes 2D grid DP table: each cell dp[i][j] = dp[i-1][j] + dp[i][j-1], highlighting top and left predecessor cells.',
    code: `public class Main {
    public static void main(String[] args) {
        int m = 3, n = 3;
        int[][] dp = new int[m][n];

        CodeFlowTracer.dpStateCreate("dp", "TABULATION_2D", m, n, 6);

        for (int i = 0; i < m; i++) {
            dp[i][0] = 1;
            CodeFlowTracer.dpBaseCase("dp", i, 0, 1, 10);
        }
        for (int j = 0; j < n; j++) {
            dp[0][j] = 1;
            CodeFlowTracer.dpBaseCase("dp", 0, j, 1, 14);
        }

        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
                CodeFlowTracer.dpStateUpdate("dp", i, j, dp[i][j], "dp[i-1][j] + dp[i][j-1]", "[[" + (i - 1) + "," + j + "],[" + i + "," + (j - 1) + "]]", 20);
            }
        }

        CodeFlowTracer.dpEnd("dp", dp[m - 1][n - 1], 24);
    }
}
`,
  },

  // ==========================================
  // PHASE 5: SECTION 65 COMPREHENSIVE FINAL DEMO
  // ==========================================
  {
    id: 'p5-final-demo',
    title: 'Phase 5 Final Comprehensive Demo (Search + Sort)',
    category: 'Algorithms',
    difficulty: 'Hard',
    language: 'java',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    description: 'Combines linear search and bubble sort on raw array as specified in Section 65.',
    explanation: 'Executes actual Java code performing sequential search followed by nested loop sorting with comparisons and swaps.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] arr = {5, 2, 8, 1, 3};

        int target = 8;

        // search
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                break;
            }
        }

        // sort
        for (int i = 0; i < arr.length; i++) {
            for (int j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}
`,
  },
];


