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
];

